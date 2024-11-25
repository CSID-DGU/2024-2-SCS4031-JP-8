<template>
  <div class="bus-info">
    <h1>
      {{ selectedBusRoute }}번 버스 도착 정보 ({{
        selectedDirection === 'up' ? '상행' : '하행'
      }})
    </h1>
    <div
      style="margin-bottom: 20px"
      v-for="station in stationData"
      :key="station.stationID"
      class="station-info"
      @click="goToNextPage(station)"
    >
      <p>정류장명: {{ station.stationName }}</p>
      <p>정류장 ID: {{ station.stationID }}</p>
      <p>정류장 순번: {{ station.idx }}</p>
      <p v-if="station.realtimeData">
        <strong>실시간 도착 정보:</strong>
        <span>도착 예정: {{ station.realtimeData.predictTime1 }}분 후</span>
        <span>빈자리 수: {{ station.realtimeData.remainSeatCnt1 }}</span>
      </p>
      <p v-else>
        <strong>예측 재차 인원:</strong> {{ station.predictedSeats }}
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Papa from 'papaparse' // papaparse를 import
import { processStationData } from './externalLogic.js' // 외부 로직 파일 import

// 버스 노선 정보 사전 데이터
const busRouteData = {
  '5000A': {
    busID: 11151,
    localBusID: 228000388,
    busLocalBlID: 228000388,
    routeId: 228000388,
    region: '용인'
  },
  '5000B': {
    busID: 11011,
    localBusID: 228000174,
    busLocalBlID: 228000174,
    routeId: 228000174,
    region: '용인',
    folderPath: '../public/csv/5000B/'
  },
  1112: {
    busID: 10052,
    localBusID: 234000016,
    busLocalBlID: 234000016,
    routeId: 234000016,
    region: '수원'
  },
  6001: {
    busID: 16017,
    localBusID: 233000131,
    busLocalBlID: 233000131,
    routeId: 233000131,
    region: '화성'
  }
}

// 정류장명에서 문장 부호와 공백을 제거하는 함수
function sanitizeStationName(stationName) {
  return stationName.replace(/[.,\s]/g, '')
}

// 요일 구하는 함수
function getDayOfWeek(year, month, day) {
  const date = new Date(year, month - 1, day)
  const days = [
    '일요일',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일'
  ]
  return days[date.getDay()]
}

export default {
  data() {
    return {
      stationData: [], // 정류장 정보를 저장할 배열
      selectedBusRoute: '5000B', // 예시로 설정된 버스 노선
      selectedHour: 17, // 임의로 설정된 시간
      selectedMinute: 25, // 임의로 설정된 분
      selectedMonth: 11, // 임의로 설정된 월
      selectedDay: 19, // 임의로 설정된 일
      selectedDirection: 'up', // 상행(up) 또는 하행(down) 선택
      csvData: [] // CSV 데이터를 저장할 배열
    }
  },
  methods: {
    async loadCsvData() {
      const year = new Date().getFullYear()
      const dayOfWeek = getDayOfWeek(year, this.selectedMonth, this.selectedDay)

      const fileName =
        dayOfWeek === '토요일'
          ? '5000B_토요일.csv'
          : dayOfWeek === '일요일'
          ? '5000B_일요일.csv'
          : '5000B_평일.csv'

      const filePath = `${
        busRouteData[this.selectedBusRoute].folderPath
      }${fileName}`
      console.log(`[INFO] Loading CSV data from file: ${fileName}`)

      return new Promise((resolve, reject) => {
        Papa.parse(filePath, {
          download: true,
          header: true,
          complete: (result) => {
            this.csvData = result.data
            console.log('[INFO] CSV 데이터가 로드되었습니다:', this.csvData)
            resolve()
          },
          error: (error) => {
            console.error('[ERROR] CSV 파일을 로드하는 중 오류 발생:', error)
            reject(error)
          }
        })
      })
    },

    getCsvSeatPrediction(stationName, hour) {
      const hourKey = `${hour}시` // 시간에 해당하는 컬럼명 생성
      const stationRows = this.csvData.filter(
        (row) =>
          row['정류장명'].replace(/\s+/g, '').replace(/[.()]/g, '') ===
          stationName.replace(/\s+/g, '').replace(/[.()]/g, '')
      )

      if (stationRows.length === 0) {
        console.warn(`[WARN] No data found for station: ${stationName}`)
        return '데이터 없음'
      }

      const seatPrediction = stationRows[0][hourKey] || '데이터 없음'
      return seatPrediction
    },

    async fetchBusRouteDetails() {
      const busID = busRouteData[this.selectedBusRoute].busID

      try {
        const response = await axios.get(
          `https://api.odsay.com/v1/api/busLaneDetail`,
          {
            params: {
              apiKey: process.env.VUE_APP_ODSAY_API_KEY,
              busID: busID,
              lang: 0,
              output: 'json'
            }
          }
        )

        this.stationData = response.data.result.station
          .filter((station) => station.nonstopStation === 0)
          .map((station) => {
            const predictedSeats = this.getCsvSeatPrediction(
              station.stationName,
              this.selectedHour
            )

            return {
              stationID: station.stationID,
              idx: station.idx,
              stationName: station.stationName,
              realtimeData: null,
              predictedSeats,
              x: station.x, // 정류장 x 좌표
              y: station.y // 정류장 y 좌표
            }
          })

        await this.fetchRealTimeData()
      } catch (error) {
        console.error('[ERROR] Failed to fetch bus route details:', error)
      }
    },

    async fetchRealTimeData() {
      const routeId = busRouteData[this.selectedBusRoute].routeId

      for (let station of this.stationData) {
        try {
          const response = await axios.get(
            'http://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalItem',
            {
              params: {
                serviceKey:
                  'EVTsGjdsoUlBtJTpdh/itgFJXzeeNK/BP4lN8my+i9AaoLGNln1kqRcyVP7CVRY8GsiXkX+OMl2HviEvq6hlfQ==',
                stationId: station.stationID,
                routeId: routeId
              }
            }
          )

          const realTimeData = response.data.response.body.items.item[0]
          station.realtimeData = {
            predictTime1: realTimeData.predictTime1,
            remainSeatCnt1: realTimeData.remainSeatCnt1
          }
        } catch (error) {
          console.error(
            `[ERROR] Failed to fetch real-time data for station ID: ${station.stationID}`,
            error
          )
        }
      }
    },

    goToNextPage(station) {
      this.$router.push({
        name: 'PathfindingPage', // PathfindingPage 라우터 이름
        query: {
          stationName: station.stationName,
          x: station.x,
          y: station.y,
          stationID: station.stationID
        }
      })
    }
  },
  async mounted() {
    await this.loadCsvData()
    await this.fetchBusRouteDetails()
  }
}
</script>

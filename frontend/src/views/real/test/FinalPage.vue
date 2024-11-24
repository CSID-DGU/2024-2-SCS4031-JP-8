<template>
  <div class="bus-info">
    <h1>{{ busNo }}번 버스 노선 상세 정보</h1>

    <!-- 필터링된 최대 5개의 정류장 표시 -->
    <div
      v-for="station in filteredStations"
      :key="station.stationID"
      class="station"
    >
      <h3>정류장 기본 정보</h3>
      <p>정류장명: {{ station.stationName }}</p>
      <p>정류장 ID: {{ station.stationID }}</p>
      <p>Local 정류장 ID: {{ station.localStationID }}</p>
      <p>정류장 순번: {{ station.idx }}</p>
    </div>

    <!-- 포아송 확률 계산 결과 표시 -->
    <div v-if="selectedStations.length" class="results">
      <h3>탑승 확률이 높은 정류장</h3>
      <div v-for="result in selectedStations" :key="result.seq" class="result">
        <p>정류장 순번: {{ result.seq }}</p>
        <p>정류장명: {{ result.stationName }}</p>
        <p>탑승 확률: {{ result.probability.toFixed(2) }}%</p>
      </div>
    </div>

    <!-- 모든 정류장의 확률 표시 -->
    <div v-if="filteredStations.length" class="all-stations">
      <h3>모든 정류장의 탑승 확률</h3>
      <div
        v-for="station in filteredStations"
        :key="station.idx"
        class="station-probability"
      >
        <h4>{{ station.stationName }}</h4>
        <p>정류장 순번: {{ station.idx }}</p>
        <p>
          탑승 확률:
          {{ calculateProbabilityForStation(station.idx).toFixed(2) }}%
        </p>
      </div>
    </div>

    <!-- 확률 계산 실패 시 -->
    <div v-else>
      <h3>탑승 확률을 계산할 수 없습니다.</h3>
      <p>CSV 파일 로드 또는 데이터 처리 중 오류가 발생했습니다.</p>
    </div>
  </div>
</template>

<script>
import { fetchBusRouteDetails } from './busApi'
import { fetchBusArrivalInfo } from './busArrivalAPI'
import { busRouteData } from './busData'
import { calculateBoardingProbability } from './poisson'

export default {
  data() {
    return {
      busNo: null,
      direction: null,
      stationName: null,
      filteredStations: [],
      selectedStations: [],
      arrivalInfo: null,
      routeId: null,
      filePath: '',
      timeSlot: ''
    }
  },
  computed: {
    timeInfo() {
      return this.$store.getters['time/getTime']
    }
  },
  async mounted() {
    const query = this.$route.query
    this.busNo = query.busNo
    this.direction = query.direction
    this.stationName = query.stationName

    console.log('[INFO] 초기화된 데이터:', {
      busNo: this.busNo,
      direction: this.direction,
      stationName: this.stationName
    })

    if (!this.timeInfo || !this.timeInfo.hour) {
      console.error('[ERROR] Vuex에서 시간 정보가 비어 있습니다.')
      return
    }

    try {
      console.log('[INFO] 버스 노선 상세 API 호출 중...')
      const busData = await fetchBusRouteDetails(this.busNo)
      console.log('[INFO] 버스 노선 상세 API 응답:', busData)

      this.routeId = busRouteData[this.busNo]?.routeId
      if (!this.routeId) {
        console.error(
          `[ERROR] routeId를 찾을 수 없습니다. 노선 번호: ${this.busNo}`
        )
        return
      }

      const directionCode = this.direction === '상행' ? 2 : 1
      console.log('[DEBUG] directionCode:', directionCode)

      const stations = busData.station
        .map((station, index, fullList) => {
          const nonStopCount = fullList
            .slice(0, index)
            .filter((prevStation) => prevStation.nonstopStation === 1).length

          return {
            ...station,
            idx: station.idx - nonStopCount
          }
        })
        .filter(
          (station) =>
            station.stationDirection === directionCode &&
            station.nonstopStation === 0
        )

      console.log('[INFO] 필터링된 정류장 데이터:', stations)

      this.filteredStations = stations.slice(0, 5)

      const firstStation = this.filteredStations[0]
      if (firstStation) {
        console.log('[INFO] 첫 정류장:', firstStation)

        const arrivalData = await fetchBusArrivalInfo(
          firstStation.localStationID,
          this.busNo,
          this.timeInfo
        )
        this.arrivalInfo = arrivalData

        console.log('[INFO] 실시간 도착 정보:', this.arrivalInfo)

        await this.setFilePath() // CSV 파일 경로 설정
        this.timeSlot = `${this.timeInfo.hour}시`

        console.log('[INFO] CSV 파일 경로:', this.filePath)
        console.log('[INFO] 시간대 정보:', this.timeSlot)

        const endSeq =
          this.filteredStations[this.filteredStations.length - 1]?.idx
        if (!endSeq) {
          console.error(
            '[ERROR] endSeq를 찾을 수 없습니다. filteredStations가 비어있습니다.'
          )
          return
        }

        console.log('[INFO] 마지막 정류장 순번:', endSeq)

        this.selectedStations = await calculateBoardingProbability({
          arrivalInfo: this.arrivalInfo.firstBus?.remainSeats || 0,
          startSeq: this.filteredStations[0]?.idx,
          endSeq, // filteredStations의 마지막 정류장 순번 사용
          filePath: this.filePath,
          timeSlot: this.timeSlot,
          stations
        })

        console.log('[INFO] 계산된 탑승 확률:', this.selectedStations)
      }
    } catch (error) {
      console.error('[ERROR] 데이터 처리 실패:', error)
    }
  },
  methods: {
    getDayType() {
      const now = new Date()
      const day = now.getDay()
      // 한국어 요일 반환
      if (day === 0) {
        return '일요일'
      } else if (day === 6) {
        return '토요일'
      } else {
        return '평일'
      }
    },
    async setFilePath() {
      const dayType = this.getDayType() // 올바른 요일명 가져오기
      const csvFolderPath = `/csv/${this.busNo}/passengers/` // 기본 경로
      this.filePath = `${csvFolderPath}${this.busNo}_${dayType}.csv` // 올바른 파일 경로 설정
      console.log('[INFO] CSV 파일 경로:', this.filePath)
    },
    calculateProbabilityForStation(idx) {
      const station = this.filteredStations.find((s) => s.idx === idx)
      if (!station) return 0

      const probability = this.selectedStations.find((s) => s.seq === idx)
      return probability ? probability.probability : 0
    }
  }
}
</script>

<style scoped>
.bus-info {
  font-family: Arial, sans-serif;
  padding: 20px;
}
.station {
  margin-bottom: 10px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 10px;
}
.results {
  margin-top: 20px;
}
.result {
  margin-bottom: 15px;
}
.all-stations {
  margin-top: 30px;
  border-top: 2px solid #eee;
  padding-top: 20px;
}
.station-probability {
  margin-bottom: 10px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 10px;
}
.station-probability.high-probability {
  background-color: #f0f8ff;
}
</style>

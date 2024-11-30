<template>
  <div class="bus-info">
    <div class="header">
      {{ busNo }}번 노선<br />
      정류장 추천 결과
    </div>
    <!-- 네이버 지도 -->
    <div id="map" style="width: 100%; height: 400px; margin-bottom: 20px"></div>

    <!-- 버스 기본 정보 -->
    <!-- <div class="bus-basic-info">
      <h1>{{ busNo }}번 버스 기본 정보</h1>
      <p>
        <strong>출발지:</strong>
        {{ busBasicInfo?.busStartPoint || '정보 없음' }}
      </p>
      <p>
        <strong>도착지:</strong> {{ busBasicInfo?.busEndPoint || '정보 없음' }}
      </p>
      <p>
        <strong>첫차 시간:</strong>
        {{ busBasicInfo?.busFirstTime || '정보 없음' }}
      </p>
      <p>
        <strong>막차 시간:</strong>
        {{ busBasicInfo?.busLastTime || '정보 없음' }}
      </p>
      <p>
        <strong>운행 간격:</strong>
        평일 {{ busBasicInfo?.bus_Interval_Week || '정보 없음' }}분 / 토요일
        {{ busBasicInfo?.bus_Interval_Sat || '정보 없음' }}분 / 일요일
        {{ busBasicInfo?.bus_Interval_Sun || '정보 없음' }}분
      </p>
    </div> -->

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

      <!-- 이동 버튼 추가 -->
      <button class="navigate-button" @click="goToNextPage(station)">
        {{ station.stationName }}로 이동
      </button>
    </div>

    <!-- 포아송 확률 계산 결과 표시 -->
    <!-- <div v-if="selectedStations.length" class="results">
      <h3>탑승 확률이 높은 정류장</h3>
      <div v-for="result in selectedStations" :key="result.seq" class="result">
        <p>정류장 순번: {{ result.seq }}</p>
        <p>정류장명: {{ result.stationName }}</p>
      </div>
    </div> -->

    <!-- 모든 정류장의 확률 표시 -->
    <!-- <div v-if="filteredStations.length" class="all-stations">
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
    </div> -->

    <!-- 확률 계산 실패 시 -->
    <!-- <div v-if="selectedStations.length" class="results">
      <h3>탑승 확률을 계산할 수 없습니다.</h3>
      <p>CSV 파일 로드 또는 데이터 처리 중 오류가 발생했습니다.</p>
    </div> -->
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
      timeSlot: '',
      busBasicInfo: {}, // 버스 기본 정보 저장
      map: null, // 네이버 지도 객체
      polyline: null // 경로 표시를 위한 Polyline 객체
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

      // 버스 기본 정보 저장
      this.busBasicInfo = {
        busStartPoint: busData?.busStartPoint,
        busEndPoint: busData?.busEndPoint,
        busFirstTime: busData?.busFirstTime,
        busLastTime: busData?.busLastTime,
        bus_Interval_Week: busData?.bus_Interval_Week,
        bus_Interval_Sat: busData?.bus_Interval_Sat,
        bus_Interval_Sun: busData?.bus_Interval_Sun
      }

      // 지도 초기화
      this.initializeMap(busData)

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
    initializeMap(busData) {
      // 첫 번째 정류장과 마지막 정류장의 중심 계산
      const firstStation = busData.station[0]
      const lastStation = busData.station[busData.station.length - 1]

      // 지도 초기화 옵션 설정
      const mapOptions = {
        center: new naver.maps.LatLng(
          (firstStation.y + lastStation.y) / 2,
          (firstStation.x + lastStation.x) / 2
        ),
        zoom: 10, // 기본 줌 레벨 (전체 보기)
        zoomControl: true,
        zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT }
      }

      // 지도 생성
      this.map = new naver.maps.Map('map', mapOptions)

      // 경로와 마커 표시
      this.drawBusRoute(busData.station)
      this.addMarkers(busData.station)
    },
    drawBusRoute(stations) {
      const path = stations.map(
        (station) => new naver.maps.LatLng(station.y, station.x)
      )

      // Polyline을 통해 경로 표시
      this.polyline = new naver.maps.Polyline({
        map: this.map,
        path,
        strokeWeight: 5,
        strokeColor: '#007aff',
        strokeOpacity: 0.8
      })

      // 지도 범위를 경로에 맞게 조정
      const bounds = new naver.maps.LatLngBounds()
      stations.forEach((station) =>
        bounds.extend(new naver.maps.LatLng(station.y, station.x))
      )
      this.map.fitBounds(bounds)
    },
    addMarkers(stations) {
      // 첫 번째 정류장 마커
      new naver.maps.Marker({
        position: new naver.maps.LatLng(stations[0].y, stations[0].x),
        map: this.map,
        icon: {
          content:
            '<div style="background: #007aff; color: #fff; padding: 5px; border-radius: 5px;">출발</div>',
          anchor: new naver.maps.Point(10, 10)
        }
      })

      // 마지막 정류장 마커
      new naver.maps.Marker({
        position: new naver.maps.LatLng(
          stations[stations.length - 1].y,
          stations[stations.length - 1].x
        ),
        map: this.map,
        icon: {
          content:
            '<div style="background: #ff0000; color: #fff; padding: 5px; border-radius: 5px;">도착</div>',
          anchor: new naver.maps.Point(10, 10)
        }
      })
    },
    getDayType() {
      const now = new Date()
      const day = now.getDay()
      if (day === 0) {
        return '일요일'
      } else if (day === 6) {
        return '토요일'
      } else {
        return '평일'
      }
    },
    async setFilePath() {
      const dayType = this.getDayType()
      const csvFolderPath = `/csv/${this.busNo}/passengers/`
      this.filePath = `${csvFolderPath}${this.busNo}_${dayType}.csv`
      console.log('[INFO] CSV 파일 경로:', this.filePath)
    },
    calculateProbabilityForStation(idx) {
      const station = this.filteredStations.find((s) => s.idx === idx)
      if (!station) return 0

      const probability = this.selectedStations.find((s) => s.seq === idx)
      return probability ? probability.probability : 0
    },
    goToNextPage(station) {
      this.$router.push({
        name: 'PathfindingPage',
        query: {
          stationName: station.stationName,
          x: station.x,
          y: station.y,
          stationID: station.stationID
        }
      })
    }
  }
}
</script>

<style scoped>
.header {
  background: linear-gradient(90deg, #ff4d15 0%, #ff6b3f 100%);
  color: white;
  padding: 1rem;
  text-align: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.bus-info {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui,
    Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR',
    'Malgun Gothic', sans-serif;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding-top: 0;
}

h1 {
  color: #333;
  font-size: 24px;
  margin-bottom: 20px;
  border-bottom: 2px solid #007aff;
  padding-bottom: 10px;
}

h3 {
  color: #007aff;
  font-size: 18px;
  margin-top: 20px;
  margin-bottom: 10px;
}

.bus-basic-info {
  background-color: #f5f5f5;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.bus-basic-info p {
  margin: 10px 0;
  line-height: 1.6;
}

.bus-basic-info strong {
  color: #007aff;
  font-weight: 600;
}

.station {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.station:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.navigate-button {
  margin-top: 15px;
  padding: 10px 15px;
  background-color: #ff4d15;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-weight: 600;
}

.navigate-button:hover {
  background-color: #ff6b3f;
}

.results,
.all-stations {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 20px;
  margin-top: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.result,
.station-probability {
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

.result:last-child,
.station-probability:last-child {
  border-bottom: none;
}

@media (max-width: 600px) {
  .bus-info {
    padding: 10px;
  }

  h1 {
    font-size: 20px;
  }

  .bus-basic-info,
  .station,
  .results,
  .all-stations {
    padding: 15px;
  }
}
</style>

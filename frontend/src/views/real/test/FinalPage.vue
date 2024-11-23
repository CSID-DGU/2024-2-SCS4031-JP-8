<template>
  <div class="bus-info">
    <h1>{{ busNo }}번 버스 노선 상세 정보</h1>
    <div
      v-for="station in filteredStations"
      :key="station.stationID"
      class="station"
    >
      <p>정류장명: {{ station.stationName }}</p>
      <p>정류장 ID: {{ station.stationID }}</p>
      <p>Local 정류장 ID: {{ station.localStationID }}</p>
      <p>정류장 순번: {{ station.idx }}</p>
    </div>
  </div>
</template>

<script>
import { fetchBusRouteDetails } from './busApi'
import { fetchBusArrivalInfo } from './busArrivalAPI'
import { busRouteData } from './busData'
import { calculateAvailableSeats } from './seatCalculation' // 여석 합산 로직 가져오기

export default {
  data() {
    return {
      busNo: null,
      direction: null,
      stationName: null,
      firstStationLocalID: null,
      filteredStations: [],
      arrivalInfo: null,
      routeId: null, // routeId를 저장
      availableSeats: null // 계산된 여석 수
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

    try {
      // 1. 노선 상세 데이터 가져오기
      console.log('[INFO] 버스 노선 상세 API 호출 중...')
      const busData = await fetchBusRouteDetails(this.busNo)
      console.log('[INFO] 버스 노선 상세 API 응답:', busData)

      // 2. 노선의 routeId 가져오기
      this.routeId = busRouteData[this.busNo]?.routeId
      if (!this.routeId) {
        console.error(
          `[ERROR] routeId를 찾을 수 없습니다. 노선 번호: ${this.busNo}`
        )
        return
      }
      console.log(`[INFO] routeId 확인: ${this.routeId}`)

      // 3. 상행/하행 필터링 및 정류장 데이터 정제
      const directionCode = this.direction === '상행' ? 2 : 1
      console.log(`[INFO] 상행/하행 방향 코드: ${directionCode}`)

      const stations = busData.station
        .filter(
          (station) =>
            station.stationDirection === directionCode && // 상행/하행 필터링
            station.nonstopStation === 0 // 미정차 정류장 제외
        )
        .map((station, index) => ({
          ...station,
          idx: index + 1,
          localStationID: station.localStationID
        }))
      console.log('[INFO] 필터링된 정류장 목록:', stations)

      this.filteredStations = stations.slice(0, 5)

      // 4. 첫 번째 정류장의 localStationID 가져오기
      const firstStation = this.filteredStations[0]
      if (firstStation) {
        this.firstStationLocalID = firstStation.localStationID
        console.log(
          '[INFO] 첫 번째 정류장 LocalStationID:',
          this.firstStationLocalID
        )

        // 5. 도착 정보 API 호출
        console.log('[INFO] 도착 정보 API 호출 시작...')
        const arrivalData = await fetchBusArrivalInfo(
          this.firstStationLocalID,
          this.busNo // busNo와 routeId를 전달
        )
        console.log('[INFO] 도착 정보 API 응답:', arrivalData)

        this.arrivalInfo = arrivalData

        // 6. 10분 내 여석 합산 로직 호출
        this.availableSeats = calculateAvailableSeats(this.arrivalInfo)
        console.log('[INFO] 최종 계산된 여석 수:', this.availableSeats)
      } else {
        console.warn('[WARN] 첫 번째 정류장 정보가 없습니다.')
      }
    } catch (error) {
      console.error('[ERROR] 데이터 처리 실패:', error)
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
</style>

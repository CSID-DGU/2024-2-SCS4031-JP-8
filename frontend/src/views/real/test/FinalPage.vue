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
      <p>정류장 순번: {{ station.idx }}</p>
    </div>
  </div>
</template>

<script>
import { fetchBusRouteDetails } from './busApi'
import { sanitizeStationName } from './stringsUtils'

export default {
  data() {
    return {
      busNo: null,
      direction: null,
      firstStationName: null, // ******** 첫 번째 정류장 이름
      firstStationID: null, // ******** 첫 번째 정류장 ID
      firstStationDirection: null, // ******** 첫 번째 정류장 방향
      filteredStations: []
    }
  },
  async mounted() {
    const query = this.$route.query
    this.busNo = query.busNo
    this.direction = query.direction // 전달받은 상행/하행 정보
    this.stationName = query.stationName

    try {
      // API 호출
      const busData = await fetchBusRouteDetails(this.busNo)

      // direction 정보를 기반으로 상행/하행 코드 설정
      const directionCode = this.direction === '상행' ? 2 : 1 // ******** 수정 부분
      console.log(`[INFO] 상행/하행 방향 코드: ${directionCode}`)

      const stations = busData.station
        .filter(
          (station) =>
            station.stationDirection === directionCode && // 상행/하행 필터링
            station.nonstopStation === 0 // 미정차 정류장 제외
        )
        .map((station, index) => ({
          ...station,
          idx: index + 1 // 순번 추가
        }))

      // stationName 기반으로 현재 정류장 찾기
      const currentIndex = stations.findIndex(
        (station) => station.stationName === this.stationName
      )

      if (currentIndex === -1) {
        console.warn(
          '[WARN] 현재 정류장을 찾을 수 없습니다. 기본값으로 설정합니다.'
        )
      }

      this.filteredStations = stations.slice(
        Math.max(0, currentIndex - 5),
        currentIndex + 1
      )

      console.log('[INFO] 필터링된 정류장 데이터:', this.filteredStations)
    } catch (error) {
      console.error('[ERROR] 버스 노선 상세 조회 실패:', error)
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

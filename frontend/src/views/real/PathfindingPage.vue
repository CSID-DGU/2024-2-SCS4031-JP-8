<template>
  <div class="pathfinding-page">
    <h2>길찾기 결과</h2>

    <div v-if="loading" class="loading-spinner">경로를 계산 중입니다...</div>
    <div v-else-if="routeData" class="route-result">
      <h3>출발지 → {{ stationName }}</h3>
      <div class="route-details">
        <p>총 소요 시간: {{ routeData.info.totalTime }}분</p>
        <p>총 요금: {{ routeData.info.payment }}원</p>
        <p>도보 거리: {{ routeData.info.totalWalk }}미터</p>
        <p>
          환승 횟수: 버스 {{ routeData.info.busTransitCount }}회, 지하철
          {{ routeData.info.subwayTransitCount }}회
        </p>
        <RouteBar :route="routeData" />
      </div>
    </div>
    <div v-else>
      <p>경로를 찾을 수 없습니다. 다시 시도해주세요.</p>
    </div>
  </div>
</template>

<script>
import RouteBar from './RouteBar.vue'
import axios from 'axios'
import apiConfig from '@/utils/API/apiConfig'

export default {
  data() {
    return {
      loading: false,
      routeData: null,
      stationName: null,
      station: null,
      departure: null // 출발지 정보
    }
  },
  async mounted() {
    // Query에서 데이터 받기
    const query = this.$route.query
    this.stationName = query.stationName
    this.station = {
      x: parseFloat(query.x),
      y: parseFloat(query.y),
      name: query.stationName,
      stationID: query.stationID
    }
    // 출발지 (Vuex 대신 임시 값)
    this.departure = {
      x: 127.026,
      y: 37.501
    }

    // 출발지 또는 정류장 정보 확인
    if (!this.departure || !this.station) {
      console.error('[ERROR] 출발지 또는 정류장 정보가 비어 있습니다.')
      return
    }

    console.log('[INFO] 출발지:', this.departure)
    console.log('[INFO] 정류장:', this.station)

    // API 호출 시작
    this.loading = true
    try {
      console.log('[INFO] 경로 계산 API 호출 중...')
      const response = await axios.get(
        'https://api.odsay.com/v1/api/searchPubTransPathT',
        {
          params: {
            SX: this.departure.x,
            SY: this.departure.y,
            EX: this.station.x,
            EY: this.station.y,
            apiKey: apiConfig.odsayApiKey
          }
        }
      )

      const result = response.data.result?.path[0]
      if (result) {
        this.routeData = result
        console.log('[INFO] 경로 계산 결과:', result)
      } else {
        console.error('[ERROR] 유효한 경로 데이터를 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('[ERROR] 경로 계산 중 오류 발생:', error)
    } finally {
      this.loading = false
    }
  }
}
</script>

<style scoped>
.pathfinding-page {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.loading-spinner {
  text-align: center;
  font-size: 18px;
  color: #888;
}

.route-result {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 10px;
  background-color: #f9f9f9;
}

.route-details {
  margin-top: 15px;
}

.route-details p {
  font-size: 14px;
  margin: 5px 0;
}
</style>

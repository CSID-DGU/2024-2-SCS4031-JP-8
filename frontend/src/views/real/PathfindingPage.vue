<template>
  <div class="result-page" v-if="departure && station">
    <!-- 상단에 출발지와 선택한 정류장 정보 표시 -->
    <div class="route-summary">
      <h2>길찾기 요약</h2>
      <p>
        출발지: {{ departureName || '정보 없음' }} ({{ departure.x }},
        {{ departure.y }})
      </p>
      <p>
        도착지(정류장): {{ stationName || '정보 없음' }} ({{ station.x }},
        {{ station.y }})
      </p>
      <p>길찾기 요청 시각: {{ formattedRequestTime }}</p>
    </div>

    <!-- 필터 버튼 -->
    <div class="filter-buttons">
      <button @click="filterByType('bus')">버스</button>
      <button @click="filterByType('subway')">지하철</button>
      <button @click="filterByType('busSubway')">버스+지하철</button>
      <button @click="resetFilter()">모든 경로</button>
    </div>

    <!-- 정렬 드롭다운 메뉴 -->
    <div class="sort-dropdown">
      <label for="sortCriteria">정렬 기준:</label>
      <select id="sortCriteria" v-model="sortCriteria" @change="sortRoutes">
        <option value="totalTime">최소 시간순</option>
        <option value="transitCount">최소 환승순</option>
        <option value="totalWalk">최소 도보순</option>
      </select>
    </div>

    <!-- 로딩 표시 -->
    <div v-if="loading" class="loading-spinner">로딩 중...</div>

    <!-- 경로 리스트 -->
    <div v-else class="route-list">
      <div
        v-for="(route, index) in filteredRoutes"
        :key="index"
        class="route-item"
      >
        <div class="route-header">
          <h3>총 소요 시간: {{ route.info.totalTime }}분</h3>
          <p>총 요금: {{ route.info.payment }}원</p>
          <p>도보 거리: {{ route.info.totalWalk }}미터</p>
          <p>
            환승 횟수: 버스 {{ route.info.busTransitCount }}회, 지하철
            {{ route.info.subwayTransitCount }}회
          </p>
          <p>출발~도착 시간: {{ calculateTimeRange(route.info.totalTime) }}</p>
        </div>

        <!-- RouteBar 컴포넌트로 경로 표시 -->
        <RouteBar :route="route" />

        <div class="route-details">
          <div
            v-for="(segment, idx) in route.subPath"
            :key="idx"
            class="segment"
          >
            <!-- 도보 정보 -->
            <div v-if="segment.trafficType === 3" class="segment-info">
              <p>도보: {{ segment.distance }}미터</p>
            </div>

            <!-- 버스 정보 -->
            <div v-else-if="segment.trafficType === 2" class="segment-info">
              <p>버스 번호: {{ segment.lane[0].busNo }}</p>
              <p>
                출발지: {{ segment.startName }} → 도착지: {{ segment.endName }}
              </p>
              <p>정류장 수: {{ segment.stationCount }}</p>
            </div>

            <!-- 지하철 정보 -->
            <div v-else-if="segment.trafficType === 1" class="segment-info">
              <p>지하철 노선: {{ segment.lane[0].name }}</p>
              <p>
                출발지: {{ segment.startName }} → 도착지: {{ segment.endName }}
              </p>
              <p>역 개수: {{ segment.stationCount }}</p>
            </div>
          </div>
        </div>

        <div class="arrival-info">
          <p>최종 도착지: {{ route.info.lastEndStation }}</p>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <h3>경로 정보를 불러올 수 없습니다.</h3>
    <p>출발지 또는 도착지가 올바르게 설정되지 않았습니다.</p>
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
      routes: [],
      filteredRoutes: [],
      sortCriteria: 'totalTime',
      departure: null,
      station: null,
      departureName: '현재 출발지',
      stationName: null,
      requestTime: null,
      RouteBar
    }
  },
  computed: {
    formattedRequestTime() {
      if (!this.requestTime) return '정보 없음'
      const hours = this.requestTime.getHours().toString().padStart(2, '0')
      const minutes = this.requestTime.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
  },
  methods: {
    formatTime(date) {
      return `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`
    },
    calculateTimeRange(totalTime) {
      const startTime = new Date()
      const endTime = new Date(startTime.getTime() + totalTime * 60000)
      return `${this.formatTime(startTime)} ~ ${this.formatTime(endTime)}`
    },
    async searchTransitRoutes() {
      this.loading = true
      try {
        console.log(
          `[INFO] 출발지 좌표: (${this.departure.x}, ${this.departure.y})`
        )
        console.log(
          `[INFO] 정류장 좌표: (${this.station.x}, ${this.station.y})`
        )

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

        this.routes = response.data.result?.path || []
        this.filteredRoutes = [...this.routes]
        this.sortRoutes()
        console.log('[INFO] 경로 데이터:', this.routes)
      } catch (error) {
        console.error('[ERROR] 경로 검색 중 오류 발생:', error)
      } finally {
        this.loading = false
      }
    },
    filterByType(type) {
      if (type === 'bus') {
        this.filteredRoutes = this.routes.filter(
          (route) =>
            route.info.busTransitCount > 0 &&
            route.info.subwayTransitCount === 0
        )
      } else if (type === 'subway') {
        this.filteredRoutes = this.routes.filter(
          (route) =>
            route.info.busTransitCount === 0 &&
            route.info.subwayTransitCount > 0
        )
      } else if (type === 'busSubway') {
        this.filteredRoutes = this.routes.filter(
          (route) =>
            route.info.busTransitCount > 0 && route.info.subwayTransitCount > 0
        )
      } else {
        this.filteredRoutes = [...this.routes]
      }
      this.sortRoutes()
    },
    sortRoutes() {
      if (this.sortCriteria === 'totalTime') {
        this.filteredRoutes.sort((a, b) => a.info.totalTime - b.info.totalTime)
      } else if (this.sortCriteria === 'transitCount') {
        this.filteredRoutes.sort(
          (a, b) =>
            a.info.busTransitCount +
            a.info.subwayTransitCount -
            (b.info.busTransitCount + b.info.subwayTransitCount)
        )
      } else if (this.sortCriteria === 'totalWalk') {
        this.filteredRoutes.sort((a, b) => a.info.totalWalk - b.info.totalWalk)
      }
    },
    resetFilter() {
      this.filteredRoutes = [...this.routes]
      this.sortRoutes()
    }
  },
  async mounted() {
    const query = this.$route.query
    if (!query || !query.x || !query.y || !query.stationName) {
      console.error('[ERROR] Query parameters가 누락되었습니다.')
      return
    }

    this.stationName = query.stationName
    this.station = {
      x: parseFloat(query.x),
      y: parseFloat(query.y)
    }
    this.departure = {
      x: 127.026, // 예시 좌표
      y: 37.501
    }
    this.requestTime = new Date()

    if (!this.departure || !this.station) {
      console.error('[ERROR] 출발지 또는 도착지 정보가 비어 있습니다.')
      return
    }

    await this.searchTransitRoutes()
  }
}
</script>

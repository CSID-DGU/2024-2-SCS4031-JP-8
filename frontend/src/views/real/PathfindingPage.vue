<template>
  <div class="result-page">
    <div class="location-info">
      <div class="location from">
        <div class="location-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
          </svg>
        </div>
        <div>
          <span class="location-label">출발</span>
          <span class="location-name">{{ departureName }}</span>
        </div>
      </div>
      <div class="location to">
        <div class="location-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
          </svg>
        </div>
        <div>
          <span class="location-label">도착</span>
          <span class="location-name">{{ stationName }}</span>
        </div>
      </div>
      <div class="request-time">
        <span class="time-label">길찾기 요청 시각:</span>
        <span class="time-value">{{ formattedRequestTime }}</span>
      </div>
    </div>

    <div class="sort-dropdown">
      <select id="sortCriteria" v-model="sortCriteria" @change="sortRoutes">
        <option value="totalTime">최소 시간순</option>
        <option value="transitCount">최소 환승순</option>
        <option value="totalWalk">최소 도보순</option>
      </select>
    </div>

    <div class="filter-buttons">
      <button @click="filterByType('bus')">버스</button>
      <button @click="filterByType('subway')">지하철</button>
      <button @click="filterByType('busSubway')">버스+지하철</button>
    </div>

    <div v-if="loading" class="loading-spinner">로딩 중...</div>

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
          <RouteBar :route="route" />
          <button class="detail-button" @click="goToPathDetail(route)">
            세부 정보 보기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RouteBar from './RouteBar.vue'
import axios from 'axios'
import apiConfig from '@/utils/API/apiConfig'

export default {
  components: {
    RouteBar
  },
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
      requestTime: null
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
    goToPathDetail(route) {
      console.log('[DEBUG] Navigating to PathDetail with route:', route)
      sessionStorage.setItem('departure', JSON.stringify(this.departure))
      sessionStorage.setItem('station', JSON.stringify(this.station))
      sessionStorage.setItem('route', JSON.stringify(route))

      this.$router.push({
        name: 'PathDetail',
        query: {
          departureX: this.departure.x,
          departureY: this.departure.y,
          stationX: this.station.x,
          stationY: this.station.y
        }
      })
    },
    filterByType(type) {
      console.log('[DEBUG] Filtering by type:', type)
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
      console.log('[DEBUG] Sorting routes by:', this.sortCriteria)
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
      console.log('[DEBUG] Sorted Routes:', this.filteredRoutes)
    },
    resetFilter() {
      console.log('[DEBUG] Resetting filters')
      this.filteredRoutes = [...this.routes]
      this.sortRoutes()
    },
    async searchTransitRoutes() {
      this.loading = true
      try {
        const params = {
          SX: this.departure.coordinates.x,
          SY: this.departure.coordinates.y,
          EX: this.station.x,
          EY: this.station.y,
          apiKey: apiConfig.odsayApiKey
        }

        console.log('[DEBUG] API 호출 파라미터:', params)

        const response = await axios.get(
          'https://api.odsay.com/v1/api/searchPubTransPathT',
          { params }
        )

        console.log('[DEBUG] ODsay API Response:', response.data)

        this.routes = response.data.result?.path || []

        if (this.routes.length > 0) {
          const firstRoute = this.routes[0].info
          if (!this.station.x || !this.station.y) {
            this.station = {
              x: firstRoute.startX,
              y: firstRoute.startY
            }
          }
        }

        this.filteredRoutes = [...this.routes]
        this.sortRoutes()
      } catch (error) {
        console.error(
          '[ERROR] ODsay API 호출 오류:',
          error.response?.data || error.message
        )
      } finally {
        this.loading = false
      }
    }
  },
  async mounted() {
    const query = this.$route.query

    console.log('[DEBUG] Received Query:', query)

    if (!query.x || !query.y || query.x === '' || query.y === '') {
      console.error('[ERROR] Query 파라미터가 누락되었습니다:', query)
      return
    }

    this.station = {
      x: parseFloat(query.x),
      y: parseFloat(query.y),
      name: query.name || '알 수 없음'
    }

    this.departure = this.$store.getters['departure/getDeparture']
    console.log('[DEBUG] Vuex Departure Data:', this.departure)
    if (!this.departure || !this.departure.coordinates) {
      console.error('[ERROR] Vuex에서 출발지 정보가 없습니다.')
      return
    }

    this.departureName = this.departure.name || '현재 출발지'
    this.stationName = this.station.name
    this.requestTime = new Date()

    console.log('[DEBUG] Starting search with:', this.departure, this.station)

    await this.searchTransitRoutes()
  }
}
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.result-page {
  width: 425px;
  max-width: 100%;
  margin: 0 auto;
  font-family: 'Pretendard', sans-serif;
  background-color: #ffffff;
  padding: 24px 20px;
}

.location-info {
  margin-bottom: 32px;
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 16px;
}

.location {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.location:last-child {
  margin-bottom: 0;
}

.location-icon {
  width: 40px;
  height: 40px;
  background-color: #3b82f6;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
}

.location-icon svg {
  width: 24px;
  height: 24px;
  fill: white;
}

.location-name {
  font-size: 1.125rem;
  color: #1e293b;
  font-weight: 600;
}

.location-label {
  font-size: 0.875rem;
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}

.request-time {
  margin-top: 16px;
  font-size: 0.875rem;
  color: #64748b;
}

.time-label {
  margin-right: 8px;
}

.time-value {
  font-weight: 600;
  color: #1e293b;
}

.sort-dropdown {
  margin-bottom: 24px;
  position: relative;
}

.sort-dropdown select {
  appearance: none;
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
  color: #1e293b;
  cursor: pointer;
}

.sort-dropdown::after {
  content: '\25BC';
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  pointer-events: none;
  color: #64748b;
}

.sort-dropdown select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.filter-buttons button {
  flex: 1;
  padding: 12px;
  font-size: 0.875rem;
  background-color: #f1f5f9;
  border: none;
  border-radius: 8px;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-buttons button:hover {
  background-color: #e2e8f0;
  transform: translateY(-2px);
}

.loading-spinner {
  text-align: center;
  font-size: 1rem;
  color: #64748b;
  padding: 20px;
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.route-item {
  border: 1px solid #e2e8f0;
  padding: 16px;
  border-radius: 12px;
  background-color: #f8fafc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.route-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.route-header {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
}

.route-header h3 {
  font-size: 1.125rem;
  margin-bottom: 8px;
}

.route-header p {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 4px;
}

.detail-button {
  margin-top: 12px;
  padding: 8px 16px;
  font-size: 0.875rem;
  background-color: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.detail-button:hover {
  background-color: #2563eb;
}

@media (max-width: 390px) {
  .result-page {
    padding: 16px;
  }

  .filter-buttons button {
    font-size: 0.75rem;
    padding: 10px;
  }

  .route-header h3 {
    font-size: 1rem;
  }

  .route-header p {
    font-size: 0.8125rem;
  }
}
</style>

<template>
  <div class="result-page" v-if="departure && station">
    <!-- 상단에 출발지와 선택한 정류장 정보 표시 -->
    <div class="route-summary">
      <h2>길찾기 요약</h2>
      <p>
        <strong>출발지:</strong> {{ departureName || '정보 없음' }} ({{
          departure.x
        }}, {{ departure.y }})
      </p>
      <p>
        <strong>도착지 (정류장):</strong> {{ stationName || '정보 없음' }} ({{
          station.x
        }}, {{ station.y }})
      </p>
      <p><strong>길찾기 요청 시각:</strong> {{ formattedRequestTime }}</p>
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
          <!-- RouteBar 추가 -->
          <RouteBar :route="route" />
          <button class="detail-button" @click="goToPathDetail(route)">
            세부 정보 보기
          </button>
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
      // 세션 스토리지에 출발지, 정류장, 경로 데이터를 저장
      sessionStorage.setItem('departure', JSON.stringify(this.departure))
      sessionStorage.setItem('station', JSON.stringify(this.station))
      sessionStorage.setItem('route', JSON.stringify(route))

      // PathDetail 페이지로 이동
      this.$router.push({ name: 'PathDetail' })
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
    },
    async searchTransitRoutes() {
      this.loading = true
      try {
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
      } catch (error) {
        console.error('[ERROR] 경로 검색 중 오류 발생:', error)
      } finally {
        this.loading = false
      }
    }
  },
  async mounted() {
    const query = this.$route.query
    if (!query.x || !query.y) {
      console.error('[ERROR] Query 파라미터가 누락되었습니다.')
      return
    }
    this.station = {
      x: parseFloat(query.x),
      y: parseFloat(query.y)
    }
    this.departure = {
      x: 127.026, // 예시 좌표
      y: 37.501
    }
    this.requestTime = new Date()

    await this.searchTransitRoutes()
  }
}
</script>

<style scoped>
.result-page {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.route-summary {
  margin-bottom: 20px;
  border-bottom: 2px solid #ddd;
  padding-bottom: 15px;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.filter-buttons button {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.filter-buttons button:hover {
  background-color: #ddd;
}

.sort-dropdown {
  margin-bottom: 20px;
}

.loading-spinner {
  text-align: center;
  font-size: 18px;
  color: #888;
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.route-item {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 10px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.route-header {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.segment-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 5px;
}

.arrival-info {
  margin-top: 10px;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
}
</style>

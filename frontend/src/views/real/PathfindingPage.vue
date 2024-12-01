<template>
  <div class="result-page">
    <header class="app-header">
      <button class="back-button" @click="goBack">
        <ArrowLeftIcon size="24" class="back-icon" />
      </button>
      <h1>경로 및 정류장 추천</h1>
    </header>

    <div class="location-info">
      <div class="location from">
        <div class="location-icon">
          <MapPinIcon size="24" class="icon" />
        </div>
        <div>
          <span class="location-label">출발</span>
          <span class="location-name">{{ departureName }}</span>
        </div>
      </div>
      <div class="location to">
        <div class="location-icon">
          <FlagIcon size="24" class="icon" />
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

    <div v-else-if="filteredRoutes.length === 0" class="no-routes">
      <p>검색 결과가 없습니다.</p>
    </div>

    <div v-else class="route-list">
      <div
        v-for="(route, index) in filteredRoutes"
        :key="index"
        class="route-item"
      >
        <div class="route-header">
          <div class="route-summary">
            <h3 class="total-time">{{ route.info.totalTime }}분</h3>
            <p class="arrival-time">
              {{ formatDepartureArrivalTime(route.info.totalTime) }}
            </p>
          </div>
          <div class="route-details">
            <div class="detail-item">
              <WalkIcon class="icon" />
              <span class="value">{{
                formatDistance(route.info.totalWalk)
              }}</span>
            </div>
            <div class="detail-item">
              <WalletIcon class="icon" />
              <span class="value">{{ route.info.payment }}원</span>
            </div>
            <div class="detail-item">
              <ArrowLeftRightIcon class="icon" />
              <span class="value"
                >{{
                  route.info.busTransitCount + route.info.subwayTransitCount
                }}회</span
              >
            </div>
          </div>
        </div>
        <RouteBar :route="route" />
        <button class="detail-button" @click="goToPathDetail(route)">
          세부 경로 안내
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import axios from 'axios'
import RouteBar from './RouteBar.vue'
import apiConfig from '@/utils/API/apiConfig'
import {
  WalkIcon,
  WalletIcon,
  ArrowLeftRightIcon,
  MapPinIcon,
  FlagIcon,
  ArrowLeftIcon
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const store = useStore()

const loading = ref(false)
const routes = ref([])
const filteredRoutes = ref([])
const sortCriteria = ref('totalTime')
const departure = ref(null)
const station = ref(null)
const departureName = ref('현재 출발지')
const stationName = ref(null)
const requestTime = ref(null)

const formattedRequestTime = computed(() => {
  if (!requestTime.value) return '정보 없음'
  const hours = requestTime.value.getHours().toString().padStart(2, '0')
  const minutes = requestTime.value.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

const goBack = () => {
  router.go(-1)
}

const goToPathDetail = (route) => {
  console.log('[DEBUG] Navigating to PathDetail with route:', route)
  sessionStorage.setItem('departure', JSON.stringify(departure.value))
  sessionStorage.setItem('station', JSON.stringify(station.value))
  sessionStorage.setItem('route', JSON.stringify(route))

  router.push({
    name: 'PathDetail',
    query: {
      departureX: departure.value.x,
      departureY: departure.value.y,
      stationX: station.value.x,
      stationY: station.value.y
    }
  })
}

const filterByType = (type) => {
  console.log('[DEBUG] Filtering by type:', type)
  if (type === 'bus') {
    filteredRoutes.value = routes.value.filter(
      (route) =>
        route.info.busTransitCount > 0 && route.info.subwayTransitCount === 0
    )
  } else if (type === 'subway') {
    filteredRoutes.value = routes.value.filter(
      (route) =>
        route.info.busTransitCount === 0 && route.info.subwayTransitCount > 0
    )
  } else if (type === 'busSubway') {
    filteredRoutes.value = routes.value.filter(
      (route) =>
        route.info.busTransitCount > 0 && route.info.subwayTransitCount > 0
    )
  } else {
    filteredRoutes.value = [...routes.value]
  }
  sortRoutes()
}

const sortRoutes = () => {
  console.log('[DEBUG] Sorting routes by:', sortCriteria.value)
  if (sortCriteria.value === 'totalTime') {
    filteredRoutes.value.sort((a, b) => a.info.totalTime - b.info.totalTime)
  } else if (sortCriteria.value === 'transitCount') {
    filteredRoutes.value.sort(
      (a, b) =>
        a.info.busTransitCount +
        a.info.subwayTransitCount -
        (b.info.busTransitCount + b.info.subwayTransitCount)
    )
  } else if (sortCriteria.value === 'totalWalk') {
    filteredRoutes.value.sort((a, b) => a.info.totalWalk - b.info.totalWalk)
  }
  console.log('[DEBUG] Sorted Routes:', filteredRoutes.value)
}

const searchTransitRoutes = async () => {
  loading.value = true
  try {
    const params = {
      SX: departure.value.coordinates.x,
      SY: departure.value.coordinates.y,
      EX: station.value.x,
      EY: station.value.y,
      apiKey: apiConfig.odsayApiKey
    }

    console.log('[DEBUG] API 호출 파라미터:', params)

    const response = await axios.get(
      'https://api.odsay.com/v1/api/searchPubTransPathT',
      { params }
    )

    console.log('[DEBUG] ODsay API Response:', response.data)

    routes.value = response.data.result?.path || []

    if (routes.value.length > 0) {
      const firstRoute = routes.value[0].info
      if (!station.value.x || !station.value.y) {
        station.value = {
          x: firstRoute.startX,
          y: firstRoute.startY
        }
      }
    }

    filteredRoutes.value = [...routes.value]
    sortRoutes()
  } catch (error) {
    console.error(
      '[ERROR] ODsay API 호출 오류:',
      error.response?.data || error.message
    )
  } finally {
    loading.value = false
  }
}

const formatDepartureArrivalTime = (totalMinutes) => {
  const departureTime = new Date(requestTime.value)
  const arrivalTime = new Date(departureTime.getTime() + totalMinutes * 60000)

  const formatTime = (date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return `${formatTime(departureTime)} ~ ${formatTime(arrivalTime)}`
}

const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters}m`
  } else {
    return `${(meters / 1000).toFixed(1)}km`
  }
}

onMounted(async () => {
  const query = route.query

  console.log('[DEBUG] Received Query:', query)

  if (!query.x || !query.y || query.x === '' || query.y === '') {
    console.error('[ERROR] Query 파라미터가 누락되었습니다:', query)
    return
  }

  station.value = {
    x: parseFloat(query.x),
    y: parseFloat(query.y),
    name: query.name || '알 수 없음'
  }

  departure.value = store.getters['departure/getDeparture']
  console.log('[DEBUG] Vuex Departure Data:', departure.value)
  if (!departure.value || !departure.value.coordinates) {
    console.error('[ERROR] Vuex에서 출발지 정보가 없습니다.')
    return
  }

  departureName.value = departure.value.name || '현재 출발지'
  stationName.value = station.value.name
  requestTime.value = new Date()

  console.log('[DEBUG] Starting search with:', departure.value, station.value)

  await searchTransitRoutes()
})
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

.app-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.back-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  margin-right: 16px;
}

.back-icon {
  color: #1e293b;
}

.app-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
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

.location-icon .icon {
  color: white;
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
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.route-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.route-summary {
  flex: 1;
}

.total-time {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.arrival-time {
  font-size: 0.875rem;
  color: #4a5568;
  margin: 4px 0 0;
}

.route-details {
  display: flex;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon {
  width: 24px;
  height: 24px;
  color: #4a5568;
}

.value {
  font-size: 0.75rem;
  color: #4a5568;
  white-space: nowrap;
}

.detail-button {
  width: 100%;
  margin-top: 12px;
  padding: 8px 16px;
  font-size: 0.9375rem;
  font-weight: 600;
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

  .route-item {
    padding: 12px;
  }

  .total-time {
    font-size: 1.25rem;
  }

  .arrival-time {
    font-size: 0.75rem;
  }

  .icon {
    width: 20px;
    height: 20px;
  }

  .value {
    font-size: 0.6875rem;
  }

  .detail-button {
    font-size: 0.875rem;
    padding: 6px 12px;
  }
}
</style>

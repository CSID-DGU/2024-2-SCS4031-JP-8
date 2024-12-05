<template>
  <div class="result-page">
    <header
      class="p-4 bg-white border-b border-gray-200 shadow-s"
      style="margin-bottom: 10px"
    >
      <div class="container flex flex-col items-start mx-auto">
        <button
          @click="goBack"
          class="p-2 mb-4 transition-shadow duration-200 bg-white rounded-full shadow-sm hover:shadow-md"
          aria-label="Go back to home page"
        >
          <ArrowLeftIcon size="24" class="text-gray-600" />
        </button>
        <div class="text-left">
          <h2
            class="mb-2 text-sm font-medium tracking-wide text-red-600 uppercase"
          >
            제공하는 버스 노선이 없어 일반 길찾기를 제공합니다.
          </h2>
          <h1 class="text-2xl font-bold tracking-tight text-gray-800">
            경로 및 정류장 추천
          </h1>
        </div>
      </div>
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
              <Footprints class="icon" />
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

        <!-- 경로 세부 사항 (타임라인 스타일) -->
        <div class="route-details">
          <h3 class="section-title">경로 <br />세부 단계</h3>
          <div class="timeline">
            <div
              v-for="(segment, index) in route.subPath.filter(
                (s) => s.trafficType !== 3
              )"
              :key="index"
              class="timeline-segment"
            >
              <div class="timeline-point">
                <div class="timeline-marker" :class="getMarkerClass(segment)">
                  <component
                    :is="getSegmentIcon(segment)"
                    size="16"
                    class="marker-icon"
                  />
                </div>
                <div class="timeline-content">
                  <div class="station-info">
                    <h4>{{ getStationName(segment) }}</h4>
                    <span class="arrival-time">{{
                      formatTime(segment.sectionTime)
                    }}</span>
                  </div>
                  <div class="segment-details">
                    {{ getSegmentDetails(segment) }}
                  </div>
                </div>
              </div>
              <div
                v-if="
                  index <
                  route.subPath.filter((s) => s.trafficType !== 3).length - 1
                "
                class="timeline-line"
                :class="getLineClass(segment)"
              ></div>
            </div>
          </div>
        </div>
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
import apiConfig from '@/utils/apiConfig'
import {
  Footprints,
  WalletIcon,
  ArrowLeftRightIcon,
  MapPinIcon,
  FlagIcon,
  ArrowLeftIcon,
  TramFront,
  BusIcon
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const store = useStore()

const loading = ref(false)
const routes = ref([])
const filteredRoutes = ref([])
const sortCriteria = ref('totalTime')
const departureName = ref('현재 출발지')
const stationName = ref(null)
const requestTime = ref(null)

// Vuex에서 출발지와 도착지 정보를 가져오는 computed 속성
const departure = computed(() => store.state.departure.departure)
const destination = computed(() => store.state.destination.destination)

const formattedRequestTime = computed(() => {
  if (!requestTime.value) return '정보 없음'
  const hours = requestTime.value.getHours().toString().padStart(2, '0')
  const minutes = requestTime.value.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

const goBack = () => {
  router.push('/')
}

const goToPathDetail = (route) => {
  console.log('[DEBUG] Navigating to PathDetail with route:', route)
  sessionStorage.setItem('departure', JSON.stringify(departure.value))
  sessionStorage.setItem('destination', JSON.stringify(destination.value))
  sessionStorage.setItem('route', JSON.stringify(route))

  router.push({
    name: 'NoBusPathDetailPage',
    query: {
      departureX: departure.value.coordinates.x,
      departureY: departure.value.coordinates.y,
      destinationX: destination.value.coordinates.x,
      destinationY: destination.value.coordinates.y
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
      EX: destination.value.coordinates.x,
      EY: destination.value.coordinates.y,
      apiKey: apiConfig.odsayApiKey
    }

    console.log('[DEBUG] API 호출 파라미터:', params)

    const response = await axios.get(
      'https://api.odsay.com/v1/api/searchPubTransPathT',
      { params }
    )

    console.log('[DEBUG] ODsay API Response:', response.data)

    routes.value = response.data.result?.path || []

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

const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours > 0 ? hours + '시간 ' : ''}${mins}분`
}

const getMarkerClass = (segment) => {
  if (segment.trafficType === 1) return 'marker-subway'
  if (segment.trafficType === 2) return 'marker-bus'
  return ''
}

const getSegmentIcon = (segment) => {
  if (segment.trafficType === 1) return TramFront
  if (segment.trafficType === 2) return BusIcon
  return null
}

const getStationName = (segment) => {
  return segment.startName || ''
}

const getSegmentDetails = (segment) => {
  if (segment.trafficType === 1)
    return `${segment.lane[0].name} (${segment.startName} → ${segment.endName})`
  if (segment.trafficType === 2)
    return `${segment.lane[0].busNo} (${segment.startName} → ${segment.endName})`
  return ''
}

const getLineClass = (segment) => {
  if (segment.trafficType === 1) return 'line-subway'
  if (segment.trafficType === 2) return 'line-bus'
  return ''
}

onMounted(async () => {
  if (
    !departure.value ||
    !departure.value.coordinates ||
    !destination.value ||
    !destination.value.coordinates
  ) {
    console.error('[ERROR] Vuex에서 출발지 또는 도착지 정보가 없습니다.')
    return
  }

  departureName.value = departure.value.name || '현재 출발지'
  stationName.value = destination.value.name || '도착지'
  requestTime.value = new Date()

  console.log(
    '[DEBUG] Starting search with:',
    departure.value,
    destination.value
  )

  await searchTransitRoutes()
})
</script>

<style scoped src="./NoBusPathFinding.css"></style>

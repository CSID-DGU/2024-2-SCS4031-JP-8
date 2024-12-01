<template>
  <div class="path-detail-page">
    <header class="app-header">
      <button class="back-button" @click="goBack">
        <ArrowLeftIcon size="24" class="back-icon" />
      </button>
      <h1>경로 세부 정보</h1>
    </header>

    <div v-if="departure && station && route">
      <!-- 지도 표시 -->
      <div id="map" class="map-container"></div>

      <!-- 상단에 출발지와 선택한 정류장 정보 표시 -->
      <div class="route-summary">
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
        </div>
        <div class="route-info">
          <div class="info-item">
            <span class="info-label">총 소요 시간</span>
            <span class="info-value">{{ route.info.totalTime }}분</span>
          </div>
          <div class="info-item">
            <span class="info-label">총 요금</span>
            <span class="info-value">{{ route.info.payment }}원</span>
          </div>
        </div>
      </div>

      <!-- 경로 세부 사항 (타임라인 스타일) -->
      <div class="route-details">
        <h3 class="section-title">경로 세부 단계</h3>
        <div class="timeline">
          <div
            v-for="(segment, index) in route.subPath"
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
                <div v-if="segment.trafficType === 3" class="walking-info">
                  <WalkIcon size="16" class="walk-icon" />
                  <span>도보 {{ formatDistance(segment.distance) }}</span>
                </div>
              </div>
            </div>
            <div
              v-if="index < route.subPath.length - 1"
              class="timeline-line"
              :class="getLineClass(segment)"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="error-message">
      <h3>세부 경로 정보를 불러올 수 없습니다.</h3>
      <p>출발지, 정류장 또는 경로 데이터가 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  MapPinIcon,
  FlagIcon,
  WalkIcon,
  TrainIcon,
  BusIcon
} from 'lucide-vue-next'

const router = useRouter()
const departure = ref(null)
const station = ref(null)
const route = ref(null)

const departureName = computed(() => departure.value?.name || '정보 없음')
const stationName = computed(() => station.value?.name || '정보 없음')

const goBack = () => {
  router.go(-1)
}

const initializeMap = () => {
  const sx = departure.value.x
  const sy = departure.value.y
  const ex = station.value.x
  const ey = station.value.y

  // 지도 초기화
  const centerPoint = new naver.maps.LatLng((sy + ey) / 2, (sx + ex) / 2)
  const mapOptions = {
    center: centerPoint,
    zoom: 10,
    zoomControl: true,
    zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT }
  }
  const map = new naver.maps.Map('map', mapOptions)

  // ODsay API로 경로 데이터 가져오기
  searchPubTransPath(map, sx, sy, ex, ey)
}

const searchPubTransPath = (map, sx, sy, ex, ey) => {
  const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=dWY4QsIARSUXfD8U1ZdSig`
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.result?.path?.[0]?.info?.mapObj) {
        loadLane(map, data.result.path[0].info.mapObj, sx, sy, ex, ey)
      }
    })
    .catch((error) => console.error('경로 검색 중 오류:', error))
}

const loadLane = (map, mapObj, sx, sy, ex, ey) => {
  const url = `https://api.odsay.com/v1/api/loadLane?mapObject=0:0@${mapObj}&apiKey=dWY4QsIARSUXfD8U1ZdSig`
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      drawMarkers(map, sx, sy, ex, ey)
      drawPolyLines(map, data)
    })
    .catch((error) => console.error('경로 데이터 로드 중 오류:', error))
}

const drawMarkers = (map, sx, sy, ex, ey) => {
  // 출발지 마커
  new naver.maps.Marker({
    position: new naver.maps.LatLng(sy, sx),
    map: map
  })

  // 도착지 마커
  new naver.maps.Marker({
    position: new naver.maps.LatLng(ey, ex),
    map: map
  })
}

const drawPolyLines = (map, data) => {
  data.result.lane.forEach((lane) => {
    lane.section.forEach((section) => {
      const lineArray = section.graphPos.map(
        (pos) => new naver.maps.LatLng(pos.y, pos.x)
      )
      const color =
        lane.type === 1 ? '#3a54fc' : lane.type === 2 ? '#42c700' : '#000000'
      new naver.maps.Polyline({
        map: map,
        path: lineArray,
        strokeWeight: 7,
        strokeColor: color
      })
    })
  })
}

const formatTime = (minutes) => {
  if (!minutes) return ''
  const now = new Date()
  const time = new Date(now.getTime() + minutes * 60000)
  return time.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const formatDistance = (meters) => {
  if (!meters) return ''
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`
}

const getMarkerClass = (segment) => {
  switch (segment.trafficType) {
    case 1:
      return 'marker-subway'
    case 2:
      return 'marker-bus'
    case 3:
      return 'marker-walk'
    default:
      return ''
  }
}

const getLineClass = (segment) => {
  switch (segment.trafficType) {
    case 1:
      return 'line-subway'
    case 2:
      return 'line-bus'
    case 3:
      return 'line-walk'
    default:
      return ''
  }
}

const getSegmentIcon = (segment) => {
  switch (segment.trafficType) {
    case 1:
      return TrainIcon
    case 2:
      return BusIcon
    case 3:
      return WalkIcon
    default:
      return MapPinIcon
  }
}

const getStationName = (segment) => {
  if (segment.trafficType === 3) {
    return '도보 이동'
  }
  return segment.startName
}

const getSegmentDetails = (segment) => {
  switch (segment.trafficType) {
    case 1:
      return `${segment.lane[0].name} (${segment.stationCount}개 정거장)`
    case 2:
      return `${segment.lane[0].busNo}번 버스 (${segment.stationCount}개 정류장)`
    case 3:
      return ''
    default:
      return ''
  }
}

onMounted(() => {
  // 세션 스토리지에서 데이터 가져오기
  departure.value = JSON.parse(sessionStorage.getItem('departure'))
  station.value = JSON.parse(sessionStorage.getItem('station'))
  route.value = JSON.parse(sessionStorage.getItem('route'))

  if (departure.value && station.value && route.value) {
    nextTick(() => {
      initializeMap()
    })
  } else {
    console.error('필수 데이터가 없습니다.')
  }
})
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.path-detail-page {
  width: 425px;
  max-width: 100%;
  margin: 0 auto;
  font-family: 'Pretendard', sans-serif;
  background-color: #ffffff;
}

.app-header {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
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

.map-container {
  width: 100%;
  height: 300px;
  margin-bottom: 24px;
}

.route-summary {
  padding: 0 20px;
}

.location-info {
  margin-bottom: 24px;
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

.route-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 4px;
}

.info-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.route-details {
  padding: 0 20px;
}

.section-title {
  font-size: 1.25rem;
  color: #334155;
  margin-bottom: 16px;
  font-weight: 600;
}

.timeline {
  position: relative;
}

.timeline-segment {
  position: relative;
  padding-bottom: 24px;
}

.timeline-point {
  display: flex;
  align-items: flex-start;
}

.timeline-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.marker-icon {
  color: white;
}

.marker-subway {
  background-color: #3b82f6;
}

.marker-bus {
  background-color: #10b981;
}

.marker-walk {
  background-color: #6b7280;
}

.timeline-content {
  flex: 1;
}

.station-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.station-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.arrival-time {
  font-size: 0.875rem;
  color: #64748b;
}

.segment-details {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 4px;
}

.walking-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 4px;
}

.walk-icon {
  color: #6b7280;
}

.timeline-line {
  position: absolute;
  left: 16px;
  top: 32px;
  bottom: 0;
  width: 2px;
}

.line-subway {
  background-color: #3b82f6;
}

.line-bus {
  background-color: #10b981;
}

.line-walk {
  background-color: #6b7280;
  border-left: 2px dashed #6b7280;
}

.error-message {
  padding: 20px;
  text-align: center;
  color: #ef4444;
}

@media (max-width: 390px) {
  .path-detail-page {
    padding: 16px;
  }

  .map-container {
    height: 250px;
  }

  .location-name {
    font-size: 1rem;
  }

  .info-value {
    font-size: 1.125rem;
  }

  .timeline-marker {
    width: 28px;
    height: 28px;
  }

  .station-info h4 {
    font-size: 0.9375rem;
  }

  .arrival-time,
  .segment-details,
  .walking-info {
    font-size: 0.8125rem;
  }
}
</style>

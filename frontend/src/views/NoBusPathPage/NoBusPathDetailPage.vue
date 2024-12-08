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
                  <Footprints size="16" class="walk-icon" />
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
      <!-- 미니 지도 -->
      <div class="mini-map-container">
        <h4 class="mini-map-title">도착지 지도</h4>
        <div id="mini-map" class="mini-map"></div>
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
import { useStore } from 'vuex'
import {
  ArrowLeftIcon,
  MapPinIcon,
  FlagIcon,
  Footprints,
  TrainIcon,
  BusIcon
} from 'lucide-vue-next'

// Vuex와 Vue Router 설정
const store = useStore()
const router = useRouter()

// 상태 변수
const departure = computed(() => store.state.departure.departure)
const station = ref(null)
const route = ref(null)

// computed로 데이터 표시
const departureName = computed(() => {
  console.log('[DEBUG] departureName computed 호출:', departure.value?.name)
  return departure.value?.name || '정보 없음'
})

const stationName = computed(() => {
  console.log('[DEBUG] stationName computed 호출:', station.value?.name)
  return station.value?.name || '정보 없음'
})

// 뒤로가기 함수
const goBack = () => {
  console.log('[DEBUG] goBack 호출')
  router.go(-1)
}

// 수정된 지도 초기화 함수
const initializeMap = () => {
  const sx = parseFloat(departure.value?.coordinates?.x)
  const sy = parseFloat(departure.value?.coordinates?.y)
  const ex = parseFloat(station.value?.x)
  const ey = parseFloat(station.value?.y)

  console.log('[DEBUG] initializeMap 호출')
  console.log('[DEBUG] 출발지 좌표 (Vuex):', { sx, sy })
  console.log('[DEBUG] 도착지 좌표 (SessionStorage):', { ex, ey })

  if (!sx || !sy || !ex || !ey) {
    console.error('[ERROR] 지도 초기화에 필요한 좌표가 없습니다.')
    return
  }

  const map = new naver.maps.Map('map', {
    center: new naver.maps.LatLng((sy + ey) / 2, (sx + ex) / 2),
    zoom: 12
  })

  // 출발지와 도착지 좌표로 경계 설정
  const bounds = new naver.maps.LatLngBounds(
    new naver.maps.LatLng(Math.min(sy, ey), Math.min(sx, ex)),
    new naver.maps.LatLng(Math.max(sy, ey), Math.max(sx, ex))
  )

  // 경계에 맞게 지도 조정
  map.fitBounds(bounds, {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
  })

  console.log('[DEBUG] 지도 생성 완료')

  // 경로와 마커 추가
  drawPolyLines(map, route.value)
  drawMarkers(map, sx, sy, ex, ey)
}

// 경로 검색 API 호출
const searchPubTransPath = (map, sx, sy, ex, ey) => {
  console.log('[DEBUG] searchPubTransPath 호출:', {
    SX: sx,
    SY: sy,
    EX: ex,
    EY: ey
  })

  const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=dWY4QsIARSUXfD8U1ZdSig`
  fetch(url)
    .then((response) => {
      console.log('[DEBUG] searchPubTransPath 응답 상태:', response.status)
      return response.json()
    })
    .then((data) => {
      console.log('[DEBUG] searchPubTransPath 응답 데이터:', data)
      if (data.result?.path?.[0]?.info?.mapObj) {
        const mapObj = data.result.path[0].info.mapObj
        console.log('[DEBUG] mapObj 데이터 추출 성공:', mapObj)
        loadLane(map, mapObj, sx, sy, ex, ey)
      } else {
        console.error('[ERROR] mapObj를 찾을 수 없습니다:', data)
      }
    })
    .catch((error) => {
      console.error('[ERROR] searchPubTransPath 호출 중 오류:', error)
    })
}

// 경로 상세 데이터 호출
const loadLane = (map, mapObj, sx, sy, ex, ey) => {
  console.log('[DEBUG] loadLane 호출:', mapObj)

  const url = `https://api.odsay.com/v1/api/loadLane?mapObject=0:0@${mapObj}&apiKey=dWY4QsIARSUXfD8U1ZdSig`
  fetch(url)
    .then((response) => {
      console.log('[DEBUG] loadLane 응답 상태:', response.status)
      return response.json()
    })
    .then((data) => {
      console.log('[DEBUG] loadLane 응답 데이터:', data)

      if (data.result?.lane) {
        console.log('[DEBUG] lane 데이터 추출 성공:', data.result.lane)

        // Polyline 추가
        drawPolyLines(map, data)

        // Polyline 끝 지점 계산 (여기에서 함수 호출)
        const polylineEndCoord = calculatePolylineEndCoord(data)

        if (polylineEndCoord) {
          console.log(
            '[DEBUG] calculatePolylineEndCoord 결과:',
            polylineEndCoord
          )

          // Polyline 끝 좌표를 drawMarkers로 전달
          drawMarkers(
            map,
            sx,
            sy,
            polylineEndCoord.lng(),
            polylineEndCoord.lat()
          )
        } else {
          console.warn('[WARN] Polyline 끝 좌표가 없습니다. 기본 좌표 사용.')
          drawMarkers(map, sx, sy, ex, ey) // 기본 도착지 좌표로 처리
        }
      } else {
        console.error('[ERROR] lane 데이터를 찾을 수 없습니다:', data)
      }
    })
    .catch((error) => {
      console.error('[ERROR] loadLane 호출 중 오류:', error)
    })
}

const calculatePolylineEndCoord = (data) => {
  console.log('[DEBUG] calculatePolylineEndCoord 호출')

  if (!data.result?.lane) {
    console.error('[ERROR] lane 데이터가 없습니다.')
    return null
  }

  let lastCoord = null

  data.result.lane.forEach((lane, laneIndex) => {
    console.log(`[DEBUG] lane ${laneIndex} 처리 중:`, lane)

    if (lane.section?.coords) {
      const coordsArray = lane.section.coords.split('|').map((coord, index) => {
        const [x, y] = coord.split(',')
        const latLng = new naver.maps.LatLng(parseFloat(y), parseFloat(x))

        console.log(`[DEBUG] lane ${laneIndex}, coord ${index}:`, latLng)

        return latLng
      })

      if (coordsArray.length > 0) {
        lastCoord = coordsArray[coordsArray.length - 1]
        console.log(`[DEBUG] lane ${laneIndex}의 마지막 좌표:`, lastCoord)
      }
    } else {
      console.warn(`[WARN] lane ${laneIndex}에 coords 데이터가 없습니다.`)
    }
  })

  console.log('[DEBUG] 최종 Polyline 끝 좌표:', lastCoord)
  return lastCoord
}

// 지도에 마커 추가 (커스텀 마커로 변경)
const drawMarkers = (map, sx, sy, ex, ey) => {
  console.log('[DEBUG] drawMarkers 호출')

  // 출발지 마커
  new naver.maps.Marker({
    position: new naver.maps.LatLng(sy, sx),
    map: map,
    icon: {
      content: `
        <div style="
          width: 40px;
          height: 40px;
          background-color: #4CAF50;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          color: #FFFFFF;
          font-weight: bold;
          font-size: 14px;
        ">
          출발
        </div>
      `,
      size: new naver.maps.Size(40, 40),
      anchor: new naver.maps.Point(20, 20)
    }
  })

  // 도착지 마커
  console.log('[DEBUG] 도착 마커 좌표:', { ex, ey })
  new naver.maps.Marker({
    position: new naver.maps.LatLng(ey, ex),
    map: map,
    icon: {
      content: `
        <div style="
          width: 40px;
          height: 40px;
          background-color: #F44336;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          color: #FFFFFF;
          font-weight: bold;
          font-size: 14px;
        ">
          도착
        </div>
      `,
      size: new naver.maps.Size(40, 40),
      anchor: new naver.maps.Point(20, 20)
    }
  })

  console.log('[DEBUG] 출발지 및 도착지 마커 추가 완료')
}

// 미니 지도 초기화 함수
const initializeMiniMap = () => {
  const ex = parseFloat(station.value?.x)
  const ey = parseFloat(station.value?.y)

  if (!ex || !ey) {
    console.error('[ERROR] 미니 지도 초기화에 필요한 좌표가 없습니다.')
    return
  }

  console.log('[DEBUG] initializeMiniMap 호출')

  const map = new naver.maps.Map('mini-map', {
    center: new naver.maps.LatLng(ey, ex),
    zoom: 15,
    mapTypeControl: false,
    zoomControl: false
  })

  // 도착지 마커 추가
  new naver.maps.Marker({
    position: new naver.maps.LatLng(ey, ex),
    map: map,
    icon: {
      content: `
        <div style="
          width: 30px;
          height: 30px;
          background-color: #F44336;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          color: #FFFFFF;
          font-weight: bold;
          font-size: 12px;
        ">
          도착
        </div>
      `,
      size: new naver.maps.Size(30, 30),
      anchor: new naver.maps.Point(15, 15)
    }
  })

  console.log('[DEBUG] 미니 지도 생성 완료')
}
// 경로에 폴리라인 추가 (전 페이지에서 받은 경로 데이터 사용)
const drawPolyLines = (map, route) => {
  console.log('[DEBUG] drawPolyLines 호출')

  if (!route || !route.subPath) {
    console.error('[ERROR] 경로 데이터가 없습니다.')
    return
  }

  route.subPath.forEach((segment) => {
    if (segment.trafficType === 3) {
      // 도보 구간은 폴리라인을 그리지 않음
      return
    }

    if (segment.passStopList && segment.passStopList.stations) {
      const lineArray = segment.passStopList.stations.map(
        (station) => new naver.maps.LatLng(station.y, station.x)
      )

      const color =
        segment.trafficType === 1
          ? '#3a54fc' // 지하철
          : segment.trafficType === 2
          ? '#f07330' // 버스
          : '#000000' // 기본 색상

      new naver.maps.Polyline({
        map: map,
        path: lineArray,
        strokeWeight: 8,
        strokeColor: color,
        strokeOpacity: 1,
        strokeLineCap: 'round', // 라인 끝 둥글게
        strokeLineJoin: 'round' // 라인 교차점 둥글게
      })

      console.log('[DEBUG] Polyline 추가 완료:', lineArray)
    } else {
      console.warn('[WARN] 해당 구간에 경로 데이터가 없습니다:', segment)
    }
  })
}

// 시간 포맷팅 함수
const formatTime = (minutes) => {
  console.log('[DEBUG] formatTime 호출:', minutes)
  if (!minutes) return ''
  const now = new Date()
  const time = new Date(now.getTime() + minutes * 60000)
  return time.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 거리 포맷팅 함수
const formatDistance = (meters) => {
  console.log('[DEBUG] formatDistance 호출:', meters)
  if (!meters) return ''
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`
}

// 기타 유틸리티 함수
const getMarkerClass = (segment) => {
  console.log('[DEBUG] getMarkerClass 호출:', segment)
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
  console.log('[DEBUG] getLineClass 호출:', segment)
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
  console.log('[DEBUG] getSegmentIcon 호출:', segment)
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
  console.log('[DEBUG] getStationName 호출:', segment)
  if (segment.trafficType === 3) {
    return '도보 이동'
  }
  return segment.startName
}

const getSegmentDetails = (segment) => {
  console.log('[DEBUG] getSegmentDetails 호출:', segment)
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

// 컴포넌트가 마운트될 때 실행
onMounted(() => {
  console.log('[DEBUG] 컴포넌트 마운트')
  console.log('[DEBUG] Vuex 초기 상태:', store.state)

  station.value = JSON.parse(sessionStorage.getItem('station'))
  route.value = JSON.parse(sessionStorage.getItem('route'))

  console.log('[DEBUG] SessionStorage에서 가져온 station:', station.value)
  console.log('[DEBUG] SessionStorage에서 가져온 route:', route.value)

  if (departure.value && station.value && route.value) {
    nextTick(() => {
      initializeMap()
      initializeMiniMap() // 미니 지도 초기화
    })
  } else {
    console.error('[ERROR] 필수 데이터가 없습니다.')
  }
})
</script>

<style scoped src="./NoBusPathDetail.css"></style>

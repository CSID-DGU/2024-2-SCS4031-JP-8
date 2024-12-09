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
          <div class="time-info">
            <span
              >길찾기 요청 시각: {{ vuextimeInfo.hour }}시
              {{ vuextimeInfo.minute }}분</span
            >
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
          <div class="info-item">
            <span class="info-label">총 거리</span>
            <span class="info-value">{{
              formatDistance(route.info.totalDistance)
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">도보 거리</span>
            <span class="info-value">{{
              formatDistance(route.info.totalWalk)
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">총 대기 시간</span>
            <span class="info-value">{{ route.info.totalIntervalTime }}분</span>
          </div>
        </div>
      </div>

      <!-- 경로 세부 사항 (타임라인 스타일) -->
      <div class="route-details">
        <h3 class="section-title">경로 세부 단계</h3>
        <div class="timeline">
          <!-- 출발지 추가 -->
          <div class="timeline-segment">
            <div class="timeline-point">
              <div class="timeline-marker marker-start">
                <MapPinIcon size="16" class="marker-icon" />
              </div>
              <div class="timeline-content">
                <div class="station-info">
                  <h4>{{ route.info.firstStartStation }}</h4>
                  <span class="departure-time">출발</span>
                </div>
              </div>
            </div>
            <div class="timeline-line"></div>
          </div>

          <!-- 기존 경로 세부 사항 -->
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
                <div v-if="segment.trafficType === 2" class="bus-info">
                  <div class="additional-info">
                    <p v-if="segment.lane[0].busLocalBlID">
                      버스 ID: {{ segment.lane[0].busLocalBlID }}
                    </p>
                    <p v-if="segment.startID">
                      출발 정류장 ID: {{ segment.startID }}
                    </p>
                    <p v-if="segment.endID">
                      도착 정류장 ID: {{ segment.endID }}
                    </p>
                    <p v-if="segment.intervalTime">
                      배차 간격: {{ segment.intervalTime }}분
                    </p>
                    <p v-if="segment.way">방향: {{ segment.way }}</p>
                    <p v-if="segment.wayCode">
                      방향 코드: {{ segment.wayCode }}
                    </p>
                    <p v-if="segment.door && segment.door.trim() !== ''">
                      승하차문: {{ segment.door }}
                    </p>
                    <p v-if="segment.hasOwnProperty('isNonStop')">
                      무정차 여부: {{ segment.isNonStop ? '예' : '아니오' }}
                    </p>
                  </div>
                </div>
                <div v-if="segment.trafficType === 1" class="subway-info">
                  <div class="additional-info">
                    <p v-if="segment.subwayCode">
                      지하철 코드: {{ segment.subwayCode }}
                    </p>
                    <p v-if="segment.startID">
                      출발역 ID: {{ segment.startID }}
                    </p>
                    <p v-if="segment.endID">도착역 ID: {{ segment.endID }}</p>
                    <p v-if="segment.intervalTime">
                      배차 간격: {{ segment.intervalTime }}분
                    </p>
                    <p v-if="segment.way">방향: {{ segment.way }}</p>
                    <p v-if="segment.wayCode">
                      방향 코드: {{ segment.wayCode }}
                    </p>
                    <p v-if="segment.door && segment.door.trim() !== ''">
                      승하차문: {{ segment.door }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="segment.passStopList && segment.passStopList.stations"
                  class="transit-stations"
                >
                  <h5>경유 정류장</h5>
                  <ul>
                    <li
                      v-for="(
                        station, index
                      ) in segment.passStopList.stations.slice(0, -1)"
                      :key="station.index"
                    >
                      <span class="station-name">{{
                        station.stationName
                      }}</span>
                      <span class="station-id">{{ station.stationID }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div
              v-if="index < route.subPath.length - 1"
              class="timeline-line"
              :class="getLineClass(segment)"
            ></div>

            <!-- 하차 정류장 추가 -->
            <div
              v-if="segment.trafficType === 1 || segment.trafficType === 2"
              class="timeline-point"
            >
              <div class="timeline-marker marker-alight">
                <component
                  :is="getSegmentIcon(segment)"
                  size="16"
                  class="marker-icon"
                />
              </div>
              <div class="timeline-content">
                <div class="station-info">
                  <h4>{{ segment.endName }}</h4>
                  <span class="alight-time">하차</span>
                </div>
              </div>
            </div>
            <div
              v-if="index < route.subPath.length - 1"
              class="timeline-line"
              :class="getLineClass(segment)"
            ></div>
          </div>

          <!-- 도착지 추가 -->
          <div class="timeline-segment">
            <div class="timeline-point">
              <div class="timeline-marker marker-end">
                <FlagIcon size="16" class="marker-icon" />
              </div>
              <div class="timeline-content">
                <div class="station-info">
                  <h4>{{ route.info.lastEndStation }}</h4>
                  <span class="arrival-time">도착</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 추가 정보 -->
      <!-- <div class="additional-info-two">
        <h3 class="section-title">추가 정보</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">버스 정류장 수</span>
            <span class="info-value">{{ route.info.busStationCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">지하철 역 수</span>
            <span class="info-value">{{ route.info.subwayStationCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">버스 환승 횟수</span>
            <span class="info-value">{{ route.info.busTransitCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">지하철 환승 횟수</span>
            <span class="info-value">{{ route.info.subwayTransitCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">도보 시간</span>
            <span class="info-value">{{
              route.info.totalWalkTime !== -1
                ? `${route.info.totalWalkTime}분`
                : '정보 없음'
            }}</span>
          </div>
        </div>
      </div> -->

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
const vuextimeInfo = computed(() => store.getters['time/getTime'])

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

// // 경로 검색 API 호출
// const searchPubTransPath = (map, sx, sy, ex, ey) => {
//   console.log('[DEBUG] searchPubTransPath 호출:', {
//     SX: sx,
//     SY: sy,
//     EX: ex,
//     EY: ey
//   })

//   const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=dWY4QsIARSUXfD8U1ZdSig`
//   fetch(url)
//     .then((response) => {
//       console.log('[DEBUG] searchPubTransPath 응답 상태:', response.status)
//       return response.json()
//     })
//     .then((data) => {
//       console.log('[DEBUG] searchPubTransPath 응답 데이터:', data)
//       if (data.result?.path?.[0]?.info?.mapObj) {
//         const mapObj = data.result.path[0].info.mapObj
//         console.log('[DEBUG] mapObj 데이터 추출 성공:', mapObj)
//         loadLane(map, mapObj, sx, sy, ex, ey)
//       } else {
//         console.error('[ERROR] mapObj를 찾을 수 없습니다:', data)
//       }
//     })
//     .catch((error) => {
//       console.error('[ERROR] searchPubTransPath 호출 중 오류:', error)
//     })
// }

// 경로 상세 데이터 호출
const loadLane = (map, mapObj) => {
  console.log('[DEBUG] loadLane 호출:', mapObj)

  const url = `https://api.odsay.com/v1/api/loadLane?mapObject=0:0@${mapObj}&apiKey=dgaGoLjsm7kPjeCSwsHSIg`
  fetch(url)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`[ERROR] loadLane 응답 상태: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      if (data.result?.lane) {
        console.log('[DEBUG] lane 데이터 추출 성공:', data.result.lane)

        let lastPolylinePoint = null // 마지막 좌표 저장

        data.result.lane.forEach((lane, index) => {
          console.log(
            `[DEBUG] lane (${index}) class:`,
            lane.class,
            `type:`,
            lane.type
          )

          lane.section.forEach((section) => {
            const lineArray = section.graphPos.map(
              (pos) => new naver.maps.LatLng(pos.y, pos.x)
            )

            // 교통수단에 따른 색상 매칭
            let color
            if (lane.class === 2) {
              color = getSubwayLineColor(lane.type) // 지하철 색상
            } else if (lane.class === 1) {
              color = getBusLineColor(lane.type) // 버스 색상
            } else {
              color = '#ff740a' // 기본 색상
            }

            // 현재 섹션의 폴리라인 생성
            new naver.maps.Polyline({
              map: map,
              path: lineArray,
              strokeWeight: 8,
              strokeColor: color,
              strokeOpacity: 1,
              strokeLineCap: 'round',
              strokeLineJoin: 'round'
            })

            console.log(
              `[DEBUG] Polyline 추가 완료 (lane ${index}):`,
              lineArray,
              `색상: ${color}`
            )

            // 끊긴 부분 연결
            if (lastPolylinePoint) {
              new naver.maps.Polyline({
                map: map,
                path: [lastPolylinePoint, lineArray[0]],
                strokeWeight: 8,
                strokeColor: '#808080',
                strokeOpacity: 1,
                strokeLineCap: 'round',
                strokeLineJoin: 'round'
              })
              console.log(
                `[DEBUG] 끊긴 부분 연결: (lat:${lastPolylinePoint.lat()}, lng:${lastPolylinePoint.lng()}) -> (lat:${lineArray[0].lat()}, lng:${lineArray[0].lng()})`
              )
            }

            // 마지막 좌표 업데이트
            lastPolylinePoint = lineArray[lineArray.length - 1]
          })
        })

        // 출발지 연결
        const departureLatLng = new naver.maps.LatLng(
          parseFloat(departure.value.coordinates.y),
          parseFloat(departure.value.coordinates.x)
        )
        const firstPolylinePoint = data.result.lane[0]?.section[0]?.graphPos[0]
        if (firstPolylinePoint) {
          const firstLatLng = new naver.maps.LatLng(
            firstPolylinePoint.y,
            firstPolylinePoint.x
          )

          new naver.maps.Polyline({
            map: map,
            path: [departureLatLng, firstLatLng],
            strokeWeight: 8,
            strokeColor: '#888888',
            strokeOpacity: 1,
            strokeLineCap: 'round',
            strokeLineJoin: 'round'
          })
          console.log('[DEBUG] 출발지 연결:', {
            departure: departureLatLng,
            firstPoint: firstLatLng
          })
        }

        // 마지막 경로와 station 연결
        const stationLatLng = new naver.maps.LatLng(
          parseFloat(station.value.y),
          parseFloat(station.value.x)
        )
        if (lastPolylinePoint) {
          new naver.maps.Polyline({
            map: map,
            path: [lastPolylinePoint, stationLatLng],
            strokeWeight: 8,
            strokeColor: '#808080',
            strokeOpacity: 1,
            strokeLineCap: 'round',
            strokeLineJoin: 'round'
          })
          console.log('[DEBUG] 마지막 경로 연결:', {
            lastPoint: lastPolylinePoint,
            station: stationLatLng
          })
        }
      } else {
        console.error('[ERROR] lane 데이터를 찾을 수 없습니다:', data)
      }
    })
    .catch((error) => {
      console.error('[ERROR] loadLane 호출 중 오류:', error)
    })
}

// 지하철 라인 색상 매핑 함수
const getSubwayLineColor = (type) => {
  switch (type) {
    case 1:
      return '#003499' // 1호선
    case 2:
      return '#37b42d' // 2호선
    case 3:
      return '#EF7C1C' // 3호선
    case 4:
      return '#00A2D1' // 4호선
    case 5:
      return '#996CAC' // 5호선
    case 6:
      return '#CD7C2F' // 6호선
    case 7:
      return '#747F00' // 7호선
    case 8:
      return '#E6186C' // 8호선
    case 9:
      return '#BB8336' // 9호선
    default:
      return '#808080' // 기본 지하철 색상
  }
}

// 버스 라인 색상 매핑 함수
const getBusLineColor = (type) => {
  switch (type) {
    case 1:
      return '#37b42d' // 간선
    case 2:
      return '#003499' // 지선
    case 3:
      return '#FF5D00' // 광역
    case 4:
      return '#B7C5D6' // 공항
    case 5:
      return '#FFD400' // 순환
    default:
      return '#ff740a' // 기본 버스 색상
  }
}

// const calculatePolylineEndCoord = (data) => {
//   console.log('[DEBUG] calculatePolylineEndCoord 호출')

//   if (!data.result?.lane) {
//     console.error('[ERROR] lane 데이터가 없습니다.')
//     return null
//   }

//   let lastCoord = null

//   data.result.lane.forEach((lane, laneIndex) => {
//     console.log(`[DEBUG] lane ${laneIndex} 처리 중:`, lane)

//     if (lane.section?.coords) {
//       const coordsArray = lane.section.coords.split('|').map((coord, index) => {
//         const [x, y] = coord.split(',')
//         const latLng = new naver.maps.LatLng(parseFloat(y), parseFloat(x))

//         console.log(`[DEBUG] lane ${laneIndex}, coord ${index}:`, latLng)

//         return latLng
//       })

//       if (coordsArray.length > 0) {
//         lastCoord = coordsArray[coordsArray.length - 1]
//         console.log(`[DEBUG] lane ${laneIndex}의 마지막 좌표:`, lastCoord)
//       }
//     } else {
//       console.warn(`[WARN] lane ${laneIndex}에 coords 데이터가 없습니다.`)
//     }
//   })

//   console.log('[DEBUG] 최종 Polyline 끝 좌표:', lastCoord)
//   return lastCoord
// }

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
  console.log('[DEBUG] drawPolyLines 호출:', route)

  const mapObj = route.info?.mapObj // route에서 mapObj 추출
  if (mapObj) {
    console.log('[DEBUG] 전체 route에서 mapObj 발견:', mapObj)

    // loadLane 호출
    loadLane(map, mapObj)
  } else {
    console.warn('[WARN] route에서 mapObj 데이터를 찾을 수 없습니다.')
  }

  console.log('[DEBUG] drawPolyLines 완료')
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
      return Footprints
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
  return {
    vuextimeInfo
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
.custom-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 4px solid;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.start-marker {
  border-color: #4caf50;
}

.start-marker::after {
  content: 'S';
  color: #4caf50;
  font-weight: bold;
  font-size: 16px;
}

.end-marker {
  border-color: #f44336;
}

.end-marker::after {
  content: 'E';
  color: #f44336;
  font-weight: bold;
  font-size: 16px;
}
.mini-map-container {
  margin-top: 24px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 12px;
  text-align: center;
}

.mini-map-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.mini-map {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.marker-start {
  background-color: #4caf50;
}

.marker-end {
  background-color: #f44336;
}

.marker-alight {
  background-color: #ffc107;
}

.departure-time,
.alight-time {
  font-size: 0.875rem;
  color: #64748b;
}
.bus-info,
.subway-info {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.bus-icon,
.subway-icon {
  margin-bottom: 8px;
}

.additional-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  font-size: 0.75rem;
}

.additional-info p {
  display: flex;
  align-items: center;
  color: #4b5563;
  margin: 0;
}

.additional-info p::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 4px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.additional-info p:nth-child(1)::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 9a2 2 0 10-4 0v5a2 2 0 104 0V9z' /%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z' /%3E%3C/svg%3E");
}

.additional-info p:nth-child(2)::before,
.additional-info p:nth-child(3)::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' /%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' /%3E%3C/svg%3E");
}

.additional-info p:nth-child(4)::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' /%3E%3C/svg%3E");
}

.additional-info p:nth-child(5)::before,
.additional-info p:nth-child(6)::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 5l7 7-7 7' /%3E%3C/svg%3E");
}

.additional-info p:nth-child(7)::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' /%3E%3C/svg%3E");
}

.additional-info p:nth-child(8)::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 10V3L4 14h7v7l9-11h-7z' /%3E%3C/svg%3E");
}

.bus-info .bus-icon,
.subway-info .subway-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.bus-info .bus-icon {
  background-color: #10b981;
}

.subway-info .subway-icon {
  background-color: #3b82f6;
}

.bus-icon svg,
.subway-icon svg {
  color: white;
  width: 16px;
  height: 16px;
}

.transit-stations h5 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 20px 20px 8px 0;
}

.transit-stations ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.transit-stations li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.75rem;
}

.transit-stations li:last-child {
  border-bottom: none;
  margin-bottom: 20px;
}

.station-name {
  color: #1f2937;
  font-weight: 500;
}

.station-id {
  color: #6b7280;
  font-size: 0.7rem;
}

.timeline-marker {
  z-index: 2;
}

.timeline-line {
  z-index: 1;
}

.additional-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.75rem;
}

.additional-info p {
  flex: 1 1 auto;
  min-width: calc(50% - 4px);
  display: flex;
  align-items: center;
  color: #4b5563;
  margin: 0;
}

.additional-info-two {
  margin-top: 24px;
  padding: 20px;
  background-color: #f8fafc;
  border-radius: 12px;
}

.additional-info-two .section-title {
  font-size: 1.25rem;
  color: #334155;
  margin-bottom: 16px;
  font-weight: 600;
}

.additional-info-two .info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.additional-info-two .info-item {
  flex: 1 1 calc(20% - 16px); /* 5개 항목을 균등하게 배치 */
  min-width: 100px;
  background-color: #ffffff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.additional-info-two .info-label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 4px;
}

.additional-info-two .info-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

@media (max-width: 768px) {
  .additional-info-two .info-item {
    flex: 1 1 calc(33.333% - 16px); /* 태블릿에서는 3개씩 배치 */
  }
}

@media (max-width: 480px) {
  .additional-info-two .info-item {
    flex: 1 1 calc(50% - 16px); /* 모바일에서는 2개씩 배치 */
  }
}
.time-info {
  background-color: #e2e8f0;
  border-radius: 8px;
  padding: 10px 16px;
  margin-top: 16px;
  text-align: center;
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.time-info span {
  display: inline-block;
}

.time-info span::before {
  content: '🕒';
  margin-right: 8px;
}
</style>

<template>
  <div class="result-page">
    <div class="app-header">
      <button class="back-button" @click="goBack">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      <h1>경로 및 정류장 추천</h1>
    </div>

    <div class="content">
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
            <span class="location-name">{{ fromLocation }}</span>
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
            <span class="location-name">{{ toLocation }}</span>
          </div>
        </div>
      </div>

      <h3 class="section-title">
        길찾기 구간 중<br />
        현재 운행하는 광역버스 노선이에요.
      </h3>
      <div v-if="filteredRoutes.length > 0" class="route-info">
        <ul>
          <li
            v-for="route in filteredRoutes"
            :key="`${route.busNo}-${route.directionText}`"
            @click="selectBusRoute(route)"
            :class="{
              selected: selectedRoute && selectedRoute.busNo === route.busNo
            }"
            class="route-item"
          >
            {{ route.busNo }}
          </li>
        </ul>
      </div>
      <div v-else-if="!loading" class="no-routes">
        <p>제공하는 버스 노선이 없습니다.</p>
      </div>
      <div v-if="loading" class="loading">
        <p>로딩 중입니다...</p>
      </div>
      <div v-if="selectedRoute" class="recommendation">
        <h2 class="section-title">
          {{ selectedRoute.busNo }}번 노선 정류장 추천
        </h2>
        <button @click="checkBusLocation" class="check-route-button">
          노선 정보 확인
        </button>
        <div id="map"></div>
        <div class="sort-options">
          <button
            @click="sortBy('probability')"
            :class="{ active: currentSort === 'probability' }"
            class="sort-button"
          >
            확률순
          </button>
          <button
            @click="sortBy('distance')"
            :class="{ active: currentSort === 'distance' }"
            class="sort-button"
          >
            거리순
          </button>
        </div>
        <div class="stations-list">
          <div
            v-for="(station, index) in sortedStations"
            :key="station.stationID"
            class="station-timeline-item"
            :class="{
              'high-probability': isHighProbability(station.idx),
              'low-probability': !isHighProbability(station.idx),
              first: index === 0,
              last: index === sortedStations.length - 1
            }"
            @click="selectStation(station)"
          >
            <div class="timeline-connector">
              <div class="timeline-node"></div>
            </div>
            <div class="station-content">
              <div class="station-header">
                <h4 class="station-name">{{ station.stationName }}</h4>
                <div class="station-probability">
                  <svg
                    v-if="isHighProbability(station.idx)"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="feather feather-trending-up"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="feather feather-trending-down"
                  >
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                    <polyline points="17 18 23 18 23 12"></polyline>
                  </svg>
                  {{ isHighProbability(station.idx) ? '높음' : '낮음' }}
                </div>
              </div>
              <p class="station-description">
                {{ station.stationName }} 정류장
              </p>
              <div class="bus-arrival-info" v-if="station.arrivalInfo">
                <div class="bus-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="feather feather-clock"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span
                    >첫 번째 버스: {{ station.arrivalInfo.predictTime1 }}분
                    후</span
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="feather feather-users"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>여석: {{ station.arrivalInfo.remainSeatCnt1 }}</span>
                </div>
                <div class="bus-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="feather feather-clock"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span
                    >두 번째 버스: {{ station.arrivalInfo.predictTime2 }}분
                    후</span
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="feather feather-users"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>여석: {{ station.arrivalInfo.remainSeatCnt2 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button @click="refreshBusInfo" class="refresh-button">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-refresh-cw"
      >
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path
          d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
        ></path>
      </svg>
    </button>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'
import apiConfig from '@/utils/API/apiConfig'
import { fetchBusRouteDetails } from './busApi'
import { fetchBusArrivalInfo } from './busArrivalAPI'
import { busRouteData } from './busData'
import { calculateBoardingProbability } from './poisson'

export default {
  setup() {
    const store = useStore()
    const router = useRouter()

    const fromLocation = computed(() => store.state.departure.departure.name)
    const toLocation = computed(() => store.state.destination.destination.name)
    const loading = ref(false)
    const providedRouteExists = ref(false)
    const filteredRoutes = ref([])
    const selectedRoute = ref(null)
    const filteredStations = ref([])
    const selectedStations = ref([])
    const arrivalInfo = ref(null)
    const routeId = ref(null)
    const filePath = ref('')
    const timeSlot = ref('')
    const busBasicInfo = ref({})
    const map = ref(null)
    const markers = ref([])
    const currentSort = ref('probability')
    const currentPosition = ref(null)

    const timeInfo = computed(() => store.getters['time/getTime'])

    const directionText = (direction) => (direction === 'up' ? '상행' : '하행')

    const checkTimeRange = (busNo) => {
      const { hour, minute } = timeInfo.value
      const parsedHour = parseInt(hour, 10)
      const parsedMinute = parseInt(minute, 10)
      const currentTime = parsedHour * 60 + parsedMinute

      if (busNo === '5000' || busNo === '1112' || busNo === '6001') {
        return true
      } else if (busNo === '5000A') {
        return currentTime >= 300 && currentTime < 900
      } else if (busNo === '5000B') {
        return (
          (currentTime >= 725 && currentTime < 1440) ||
          (currentTime >= 0 && currentTime < 180)
        )
      }
      return false
    }

    const searchTransitRoutes = async () => {
      loading.value = true
      try {
        const startX = store.state.departure.departure.coordinates?.x
        const startY = store.state.departure.departure.coordinates?.y
        const endX = store.state.destination.destination.coordinates?.x
        const endY = store.state.destination.destination.coordinates?.y

        if (!startX || !startY || !endX || !endY) {
          alert('출발지와 도착지의 위치를 먼저 설정해주세요.')
          return
        }

        console.log('API 호출 시작:', { startX, startY, endX, endY })
        const response = await axios.get(
          'https://api.odsay.com/v1/api/searchPubTransPathT',
          {
            params: {
              SX: startX,
              SY: startY,
              EX: endX,
              EY: endY,
              apiKey: apiConfig.odsayApiKey
            }
          }
        )

        const paths = response.data.result.path || []
        const routeOptions = ['5000', '5000A', '5000B', '1112', '6001']
        const allRoutes = []

        for (const route of paths) {
          for (const segment of route.subPath) {
            if (segment.trafficType === 2) {
              for (const lane of segment.lane) {
                const busNo = lane.busNo
                if (routeOptions.includes(busNo) && checkTimeRange(busNo)) {
                  console.log(`조건에 맞는 버스 번호 - ${busNo}`)
                  try {
                    const stationDetailResponse = await axios.get(
                      'https://api.odsay.com/v1/api/busLaneDetail',
                      {
                        params: {
                          busID: lane.busID,
                          apiKey: apiConfig.odsayApiKey
                        }
                      }
                    )

                    const stations =
                      stationDetailResponse.data.result.station || []
                    const targetStation = stations.find(
                      (station) => station.stationID === segment.startID
                    )
                    const direction =
                      targetStation?.stationDirection === 2 ? 'up' : 'down'
                    console.log(
                      `상행/하행 판별: ${busNo}, 방향: ${direction}, 정류장 이름: ${segment.startName}`
                    )

                    allRoutes.push({
                      busNo: busNo,
                      directionText: directionText(direction),
                      stationID: segment.startID,
                      stationName: segment.startName,
                      firstStation: {
                        name: stations[0]?.stationName,
                        id: stations[0]?.stationID,
                        direction: directionText(
                          stations[0]?.stationDirection === 2 ? 'up' : 'down'
                        )
                      }
                    })
                  } catch (error) {
                    console.error(`busLaneDetail API 호출 오류 발생: ${error}`)
                  }
                }
              }
            }
          }
        }

        filteredRoutes.value = allRoutes.reduce((acc, current) => {
          const duplicate = acc.find(
            (route) =>
              route.busNo === current.busNo &&
              route.directionText === current.directionText
          )
          if (!duplicate) {
            acc.push(current)
          }
          return acc
        }, [])

        providedRouteExists.value = filteredRoutes.value.length > 0
        console.log(
          '조건에 맞는 모든 노선 (중복 제거 후):',
          filteredRoutes.value
        )

        // 첫 번째 버스 노선 자동 선택
        if (filteredRoutes.value.length > 0) {
          await selectBusRoute(filteredRoutes.value[0])
        }
      } catch (error) {
        console.error('API 호출 중 오류 발생:', error)
      } finally {
        loading.value = false
      }
    }

    const selectBusRoute = async (route) => {
      selectedRoute.value = route
      console.log('다음 페이지로 전달되는 정보:', {
        busNo: route.busNo,
        direction: route.directionText,
        stationID: route.stationID,
        stationName: route.stationName,
        fromLocation: fromLocation.value,
        toLocation: toLocation.value,
        startX: store.state.departure.departure.coordinates?.x,
        startY: store.state.departure.departure.coordinates?.y,
        endX: store.state.destination.destination.coordinates?.x,
        endY: store.state.destination.destination.coordinates?.y,
        month: store.state.time.month,
        day: store.state.time.day,
        hour: store.state.time.hour,
        minute: store.state.time.minute,
        firstStationName: route.firstStation.name,
        firstStationID: route.firstStation.id,
        firstStationDirection: route.firstStation.direction
      })

      try {
        console.log('[INFO] 버스 노선 상세 API 호출 중...')
        const busData = await fetchBusRouteDetails(route.busNo)
        console.log('[INFO] 버스 노선 상세 API 응답:', busData)

        busBasicInfo.value = {
          busStartPoint: busData?.busStartPoint,
          busEndPoint: busData?.busEndPoint,
          busFirstTime: busData?.busFirstTime,
          busLastTime: busData?.busLastTime,
          bus_Interval_Week: busData?.bus_Interval_Week,
          bus_Interval_Sat: busData?.bus_Interval_Sat,
          bus_Interval_Sun: busData?.bus_Interval_Sun
        }

        routeId.value = busRouteData[route.busNo]?.routeId
        if (!routeId.value) {
          console.error(
            `[ERROR] routeId를 찾을 수 없습니다. 노선 번호: ${route.busNo}`
          )
          return
        }

        const directionCode = route.directionText === '상행' ? 2 : 1
        console.log('[DEBUG] directionCode:', directionCode)

        const stations = busData.station
          .map((station, index, fullList) => {
            const nonStopCount = fullList
              .slice(0, index)
              .filter((prevStation) => prevStation.nonstopStation === 1).length
            return {
              ...station,
              idx: station.idx - nonStopCount
            }
          })
          .filter(
            (station) =>
              station.stationDirection === directionCode &&
              station.nonstopStation === 0
          )

        console.log('[INFO] 필터링된 정류장 데이터:', stations)

        filteredStations.value = stations.slice(0, 5)

        const firstStation = filteredStations.value[0]
        if (firstStation) {
          console.log('[INFO] 첫 정류장:', firstStation)

          const arrivalData = await fetchBusArrivalInfo(
            firstStation.localStationID,
            route.busNo,
            timeInfo.value
          )
          arrivalInfo.value = arrivalData

          console.log('[INFO] 실시간 도착 정보:', arrivalInfo.value)

          await setFilePath(route.busNo)
          timeSlot.value = `${timeInfo.value.hour}시`

          console.log('[INFO] CSV 파일 경로:', filePath.value)
          console.log('[INFO] 시간대 정보:', timeSlot.value)

          const endSeq =
            filteredStations.value[filteredStations.value.length - 1]?.idx
          if (!endSeq) {
            console.error(
              '[ERROR] endSeq를 찾을 수 없습니다. filteredStations가 비어있습니다.'
            )
            return
          }

          console.log('[INFO] 마지막 정류장 순번:', endSeq)

          selectedStations.value = await calculateBoardingProbability({
            arrivalInfo: arrivalInfo.value.firstBus?.remainSeats || 0,
            startSeq: filteredStations.value[0]?.idx,
            endSeq,
            filePath: filePath.value,
            timeSlot: timeSlot.value,
            stations
          })

          console.log('[INFO] 계산된 탑승 확률:', selectedStations.value)

          // 지도 초기화 및 마커 추가
          await nextTick()
          initializeMap()
        }
      } catch (error) {
        console.error('노선 선택 오류:', error)
      }
    }

    const initializeMap = () => {
      if (!filteredStations.value.length) return

      const firstStation = filteredStations.value[0]
      const lastStation =
        filteredStations.value[filteredStations.value.length - 1]

      const mapOptions = {
        center: new naver.maps.LatLng(
          (parseFloat(firstStation.y) + parseFloat(lastStation.y)) / 2,
          (parseFloat(firstStation.x) + parseFloat(lastStation.x)) / 2
        ),
        zoom: 12,
        zoomControl: true,
        zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT }
      }

      map.value = new naver.maps.Map('map', mapOptions)

      // 현재 위치 마커 추가
      if (currentPosition.value) {
        const currentPositionMarker = new naver.maps.Marker({
          position: new naver.maps.LatLng(
            currentPosition.value.lat,
            currentPosition.value.lng
          ),
          map: map.value,
          icon: {
            content: `
              <div style="
                background: #4285F4;
                border: 2px solid #FFF;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                box-shadow: 0 0 5px rgba(0,0,0,0.3);
              "></div>
            `,
            anchor: new naver.maps.Point(8, 8)
          }
        })
        markers.value.push(currentPositionMarker)
      }

      // 기존 마커 제거
      markers.value.forEach((marker) => marker.setMap(null))
      markers.value = []

      // 새 마커 추가 및 라인 그리기
      const path = []
      filteredStations.value.forEach((station, index) => {
        const position = new naver.maps.LatLng(station.y, station.x)
        path.push(position)

        const markerColor =
          index === 0
            ? '#007aff'
            : index === filteredStations.value.length - 1
            ? '#ff0000'
            : '#4CAF50'

        const marker = new naver.maps.Marker({
          position: position,
          map: map.value,
          icon: {
            content: `
              <div style="
                background: ${markerColor};
                color: #fff;
                padding: 10px;
                border-radius: 50%;
                font-weight: bold;
                font-size: 14px;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">
                ${index + 1}
              </div>
            `,
            anchor: new naver.maps.Point(15, 15)
          }
        })

        // 정류장 이름 표시
        new naver.maps.InfoWindow({
          content: `<div style="padding: 5px;">${station.stationName}</div>`,
          position: position,
          map: map.value
        })

        markers.value.push(marker)
      })

      // 정류장을 연결하는 라인 그리기
      new naver.maps.Polyline({
        map: map.value,
        path: path,
        strokeColor: '#007aff',
        strokeWeight: 3,
        strokeOpacity: 0.8
      })

      const bounds = new naver.maps.LatLngBounds()
      filteredStations.value.forEach((station) => {
        bounds.extend(new naver.maps.LatLng(station.y, station.x))
      })
      map.value.fitBounds(bounds)
    }

    const getDayType = () => {
      const now = new Date()
      const day = now.getDay()
      return day === 0 ? '일요일' : day === 6 ? '토요일' : '평일'
    }

    const setFilePath = async (busNo) => {
      const dayType = getDayType()
      const csvFolderPath = `/csv/${busNo}/passengers/`
      filePath.value = `${csvFolderPath}${busNo}_${dayType}.csv`
      console.log('[INFO] CSV 파일 경로:', filePath.value)
    }

    const calculateProbabilityForStation = (idx) => {
      const station = filteredStations.value.find((s) => s.idx === idx)
      if (!station) return 0

      const probability = selectedStations.value.find((s) => s.seq === idx)
      return probability ? probability.probability : 0
    }

    const goToNextPage = (station) => {
      router.push({
        name: 'PathfindingPage',
        query: {
          stationName: station.stationName,
          x: station.x,
          y: station.y,
          stationID: station.stationID
        }
      })
    }

    const goBack = () => {
      router.go(-1)
    }

    const refreshBusInfo = async () => {
      if (selectedRoute.value) {
        const firstStation = filteredStations.value[0]
        if (firstStation) {
          arrivalInfo.value = await fetchBusArrivalInfo(
            firstStation.localStationID,
            selectedRoute.value.busNo,
            timeInfo.value
          )
        }
      }
    }

    const checkBusLocation = () => {
      if (selectedRoute.value) {
        router.push({
          path: '/buslocation',
          query: { busNo: selectedRoute.value.busNo }
        })
      }
    }

    const sortBy = (sortType) => {
      currentSort.value = sortType
    }

    const sortedStations = computed(() => {
      return [...filteredStations.value].sort((a, b) => {
        if (currentSort.value === 'probability') {
          const probA =
            selectedStations.value.find((s) => s.seq === a.idx)?.probability ||
            0
          const probB =
            selectedStations.value.find((s) => s.seq === b.idx)?.probability ||
            0
          return probB - probA
        } else {
          return a.idx - b.idx
        }
      })
    })

    const isHighProbability = (idx) => {
      const station = selectedStations.value.find((s) => s.seq === idx)
      return station ? station.probability > 0.5 : false // 예시 임계값
    }

    const selectStation = (station) => {
      router.push({
        path: '/pathfinding',
        query: {
          x: station.x,
          y: station.y,
          name: station.stationName
        }
      })
    }

    const getCurrentPosition = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            currentPosition.value = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          },
          (error) => {
            console.error('Error getting current position:', error)
          }
        )
      } else {
        console.error('Geolocation is not supported by this browser.')
      }
    }

    onMounted(() => {
      getCurrentPosition()
      searchTransitRoutes()
    })

    return {
      fromLocation,
      toLocation,
      loading,
      providedRouteExists,
      filteredRoutes,
      selectedRoute,
      filteredStations,
      selectedStations,
      busBasicInfo,
      arrivalInfo,
      calculateProbabilityForStation,
      goToNextPage,
      goBack,
      refreshBusInfo,
      checkBusLocation,
      sortBy,
      sortedStations,
      isHighProbability,
      selectStation,
      selectBusRoute,
      currentSort,
      currentPosition
    }
  }
}
</script>

<style scoped>
@import './Result.css';
</style>

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
        <div class="time-info">
          <span
            >길찾기 요청 시각: {{ vuextimeInfo.hour }}시
            {{ vuextimeInfo.minute }}분</span
          >
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
        <div id="map" class="map-container">
          <div class="custom-zoom-control">
            <button class="zoom-button zoom-in" @click="zoomIn">+</button>
            <button class="zoom-button zoom-out" @click="zoomOut">-</button>
          </div>
        </div>

        <button @click="checkBusLocation" class="check-route-button">
          노선 정보 확인
        </button>
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
        <div
          v-if="
            filteredStations.length > 0 &&
            filteredStations[0].routeToDestination
          "
          class="destination-route"
        >
          <h3>도착지까지의 최단 경로</h3>
          <p>
            총 소요 시간:
            {{ filteredStations[0].routeToDestination.totalTime }}분
          </p>
          <p>
            환승 횟수: {{ filteredStations[0].routeToDestination.transitCount }}
          </p>
          <p>
            도보 시간: {{ filteredStations[0].routeToDestination.walkTime }}m
          </p>
        </div>

        <div class="recommendation-title">
          {{
            isRealTimeData
              ? '실시간 여석 기반 추천 정류장'
              : '예측된 재차인원 기반 추천 정류장'
          }}
        </div>
        <div class="stations-list">
          <div
            v-for="(station, index) in sortedStations"
            :key="station.stationID"
            class="station-timeline-item"
            :class="{
              'low-probability': isHighProbability(station.idx) === '낮음',
              'medium-probability': isHighProbability(station.idx) === '보통',
              'high-probability': isHighProbability(station.idx) === '높음',
              recommended: isHighestProbability(station.idx),
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
                <h4 class="station-name">
                  {{ station.stationName }}
                  <span
                    v-if="isHighestProbability(station.idx)"
                    class="recommendation-badge"
                    >추천</span
                  >
                </h4>
                <div class="station-probability">
                  <svg
                    v-if="isHighProbability(station.idx) === '높음'"
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
                    v-else-if="isHighProbability(station.idx) === '낮음'"
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
                    class="feather feather-trending-neutral"
                  >
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                  </svg>
                  {{ isHighProbability(station.idx) }}
                </div>
              </div>
              <p class="station-description">
                {{ station.stationID }} ({{
                  station.stationDirection === 2 ? '상행' : '하행'
                }})
              </p>
              <!-- 추가된 경로 정보 표시! -->
              <div class="route-info" v-if="station.routeInfo">
                <p>소요 시간: {{ station.routeInfo.totalTime }}분</p>
                <p>환승 횟수: {{ station.routeInfo.transitCount }}</p>
                <p>도보 시간: {{ station.routeInfo.walkTime }}m</p>
              </div>
              <p
                v-if="index === sortedStations.length - 1"
                class="final-station-label"
              >
                일반 지도 기본 정류장
              </p>
              <div
                class="bus-arrival-info"
                :class="{
                  'no-info':
                    !station.arrivalInfo || station.arrivalInfo.length === 0
                }"
              >
                <div
                  v-if="
                    !station.arrivalInfo || station.arrivalInfo.length === 0
                  "
                  class="no-arrival-info"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="info-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <p class="info-text">도착정보없음</p>
                  <p class="info-subtext">
                    {{
                      isRealTimeData
                        ? '현재 도착 정보를 이용할 수 없습니다.'
                        : '예측 결과는 실시간 도착정보를 제공하지 않습니다.'
                    }}
                  </p>
                </div>
                <div v-else>
                  <div class="bus-info">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span
                      >첫 번째 버스:
                      {{ station.arrivalInfo[0]?.firstBus.time }}분 후</span
                    >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                      ></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span
                      >여석: {{ station.arrivalInfo[0]?.firstBus.seats }}</span
                    >
                  </div>
                  <div class="bus-info">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span
                      >두 번째 버스:
                      {{ station.arrivalInfo[0]?.secondBus.time }}분 후</span
                    >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                      ></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span
                      >여석: {{ station.arrivalInfo[0]?.secondBus.seats }}</span
                    >
                  </div>
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
import { watch, ref, computed, onMounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'
import apiConfig from '@/utils/apiConfig'
import { fetchBusRouteDetails } from './busApi'
import { fetchBusArrivalInfo } from './busArrivalAPI'
import { busRouteData } from './busData'
import { calculateBoardingProbability } from './realpoisson'

export default {
  setup() {
    const store = useStore()
    const searchTime = ref(null)

    const router = useRouter()
    const vuextimeInfo = computed(() => store.getters['time/getTime'])
    const fromLocationx = computed(() => store.state.departure.depature.x)
    const fromLocationy = computed(() => store.state.departure.depature.y)

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
    const lastFetchTime = ref(new Date())
    const isDataCurrent = computed(() => {
      const currentTime = new Date()
      const timeDifference = currentTime - lastFetchTime.value
      return timeDifference <= 60000 // 1분 이내
    })
    const isRealTimeData = computed(() => {
      console.log('[DEBUG] timeInfo 데이터:', timeInfo.value)
      const storeTime = new Date(
        2024, // year을 하드코딩
        timeInfo.value.month - 1,
        timeInfo.value.day,
        timeInfo.value.hour,
        timeInfo.value.minute
      )

      const currentTime = new Date()

      const isStoreCurrent = Math.abs(currentTime - storeTime) <= 60000 // 1분 이내
      const result = isStoreCurrent && isDataCurrent.value

      console.log('[DEBUG] timeInfo 데이터:', timeInfo.value)
      console.log('[DEBUG] isRealTimeData 계산 결과:', {
        storeTime,
        currentTime,
        isStoreCurrent,
        isDataCurrent: isDataCurrent.value,
        result
      })

      return result
    })

    // Duplicate function removed

    const timeInfo = computed(() => store.getters['time/getTime'])

    const directionText = (direction) => (direction === 'up' ? '상행' : '하행')

    const checkTimeRange = (busNo) => {
      const { hour, minute } = timeInfo.value
      const parsedHour = parseInt(hour, 10)
      const parsedMinute = parseInt(minute, 10)
      const currentTime = parsedHour * 60 + parsedMinute

      if (
        busNo === '5000' ||
        busNo === '1112' ||
        busNo === '6001' ||
        busNo === 'M7731' ||
        busNo === '5000B'
      ) {
        return true
      } else if (busNo === '5000A') {
        return currentTime >= 300 && currentTime < 900
      } // } else if (busNo === '5000B') {
      //   // return (
      //   //   (currentTime >= 725 && currentTime < 1440) ||
      //   //   (currentTime >= 0 && currentTime < 180)
      //   // )
      // }
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
                    const enrichedStations = stations.map(
                      (station, index, fullList) => {
                        const nonStopCount = fullList
                          .slice(0, index)
                          .filter(
                            (prevStation) => prevStation.nonstopStation === 1
                          ).length

                        return {
                          ...station,
                          idx: station.idx - nonStopCount,
                          localStationID: station.localStationID // localStationID 추가
                        }
                      }
                    )

                    console.log('[DEBUG] Enriched Stations:', enrichedStations)

                    const targetStation = enrichedStations.find(
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
                      localStationID: targetStation?.localStationID, // localStationID 추가
                      firstStation: {
                        name: enrichedStations[0]?.stationName,
                        id: enrichedStations[0]?.stationID,
                        localStationID: enrichedStations[0]?.localStationID, // 첫 정류장의 localStationID
                        direction: directionText(
                          enrichedStations[0]?.stationDirection === 2
                            ? 'up'
                            : 'down'
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
        // 여기에 새로운 조건 추가
        if (filteredRoutes.value.length === 0) {
          // 제공하는 버스 노선이 없으면 '/nobusroute'로 라우팅
          router.push('/nobusroute')
          return
        }
        // 첫 번째 버스 노선 자동 선택
        if (filteredRoutes.value.length > 0) {
          await selectBusRoute(filteredRoutes.value[0])
        }
      } catch (error) {
        console.error('API 호출 중 오류 발생:', error)
        // 에러 발생 시에도 '/nobusroute'로 라우팅
        router.push('/nobusroute')
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

        console.log('[INFO] fetchRouteInfoForStations 호출 시작')
        await fetchRouteInfoForStations() // 선택된 노선에 대한 경로 정보 다시 가져오기
        console.log('[INFO] fetchRouteInfoForStations 호출 완료')

        const firstStation = filteredStations.value[0]
        if (firstStation) {
          console.log('[INFO] 첫 정류장:', firstStation)
          console.log('[DEBUG] fetchBusArrivalInfo 호출 파라미터@@@@:', {
            stationName: firstStation.stationName,
            firstStationidx: firstStation.idx,
            busNo: route.busNo,
            timeInfo: timeInfo.value,
            localStationID: firstStation.localStationID
          })
          const arrivalData = await fetchBusArrivalInfo(
            firstStation.stationName,
            route.busNo,
            timeInfo.value,
            firstStation.idx,
            firstStation.localStationID
          )

          arrivalInfo.value = arrivalData
          lastFetchTime.value = new Date()

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
          console.log('[INFO] calculateBoardingProbability 호출 파라미터:', {
            arrivalInfo: arrivalInfo.value.firstBus?.remainSeats || 0,
            startSeq: filteredStations.value[0]?.idx,
            endSeq,
            filePath: filePath.value,
            timeSlot: timeSlot.value,
            stations,
            transidx: firstStation.idx,
            searchTime: searchTime.value
          })
          selectedStations.value = await calculateBoardingProbability({
            arrivalInfo: arrivalInfo.value.firstBus?.remainSeats || 0,
            startSeq: filteredStations.value[0]?.idx,
            endSeq,
            filePath: filePath.value,
            timeSlot: timeSlot.value,
            stations,
            transidx: firstStation.idx,
            searchTime: searchTime.value // Vuex에서 가져온 minute 값을 매핑
          })

          console.log('[INFO] 계산된 탑승 확률:', selectedStations.value)
          // selectedStations와 filteredStations의 idx를 연결
          selectedStations.value = selectedStations.value.map(
            (station, index) => {
              const matchingStation = filteredStations.value.find(
                (filtered) => filtered.idx === station.station
              )
              return {
                ...station,
                idx: matchingStation ? matchingStation.idx : station.station
              }
            }
          )

          console.log(
            '[DEBUG] 매핑 후 selectedStations:',
            selectedStations.value
          )
          // 지도 초기화 및 마커 추가
          await nextTick()
          initializeMap()
          await fetchArrivalInfoForStations()
          await fetchShortestRouteToDestination()
        }
      } catch (error) {
        console.error('노선 선택 오류:', error)
      }
    }

    const fetchArrivalInfoForStations = async () => {
      try {
        const promises = filteredStations.value.map(async (station) => {
          const { localStationID: stationId, stationName } = station

          if (!stationId) {
            console.warn(
              `[WARN] localStationID가 없습니다. 정류장: ${stationName}`
            )
            station.arrivalInfo = null
            return
          }

          const routeId = busRouteData[selectedRoute.value.busNo]?.routeId
          const serviceKey =
            'EVTsGjdsoUlBtJTpdh/itgFJXzeeNK/BP4lN8my+i9AaoLGNln1kqRcyVP7CVRY8GsiXkX+OMl2HviEvq6hlfQ=='

          if (!routeId) {
            console.error(
              `[ERROR] routeId를 찾을 수 없습니다. 노선 번호: ${selectedRoute.value.busNo}`
            )
            station.arrivalInfo = null
            return
          }

          const url = `http://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalItem`
          const params = { serviceKey, stationId, routeId }

          console.log(
            `[DEBUG] API 호출: 정류장 ${stationId} (${stationName}), 노선 ${routeId}`
          )

          try {
            const response = await axios.get(url, {
              params,
              responseType: 'text'
            }) // XML 응답 처리
            const parser = new DOMParser()
            const xmlDoc = parser.parseFromString(
              response.data,
              'application/xml'
            )

            // XML에서 필요한 데이터 추출
            const resultCode = xmlDoc.querySelector(
              'msgHeader > resultCode'
            )?.textContent
            const resultMessage = xmlDoc.querySelector(
              'msgHeader > resultMessage'
            )?.textContent
            const busArrivalItems = xmlDoc.querySelectorAll(
              'msgBody > busArrivalItem'
            )

            if (resultCode === '0' && busArrivalItems.length > 0) {
              station.arrivalInfo = Array.from(busArrivalItems).map((item) => ({
                stationId: item.querySelector('stationId')?.textContent || null,
                firstBus: {
                  time: item.querySelector('predictTime1')?.textContent || null,
                  seats:
                    item.querySelector('remainSeatCnt1')?.textContent || null,
                  plate: item.querySelector('plateNo1')?.textContent || null
                },
                secondBus: {
                  time: item.querySelector('predictTime2')?.textContent || null,
                  seats:
                    item.querySelector('remainSeatCnt2')?.textContent || null,
                  plate: item.querySelector('plateNo2')?.textContent || null
                }
              }))

              console.log(
                `[INFO] 정류장 ${stationId} 도착 정보 저장 완료:`,
                station.arrivalInfo
              )
            } else {
              console.warn(
                `[WARN] 정류장 ${stationId} 데이터 없음: ${
                  resultMessage || '알 수 없는 오류'
                }`
              )
              station.arrivalInfo = null
            }
          } catch (apiError) {
            console.error(
              `[ERROR] 정류장 ${stationId} API 호출 오류:`,
              apiError
            )
            station.arrivalInfo = null
          }
        })

        await Promise.all(promises)
        console.log('[INFO] 모든 정류장 도착 정보:', filteredStations.value)
      } catch (error) {
        console.error('[ERROR] 정류장 도착 정보 호출 중 오류:', error)
      }
    }

    const initializeMap = () => {
      if (!filteredStations.value.length) return

      console.log('[INFO] 지도 초기화 시작')

      const firstStation = filteredStations.value[0]
      const lastStation =
        filteredStations.value[filteredStations.value.length - 1]

      console.log('[DEBUG] 첫 번째 정류장:', firstStation)
      console.log('[DEBUG] 마지막 정류장:', lastStation)

      const mapOptions = {
        center: new naver.maps.LatLng(
          (parseFloat(firstStation.y) + parseFloat(lastStation.y)) / 2,
          (parseFloat(firstStation.x) + parseFloat(lastStation.x)) / 2
        ),
        zoom: 12,
        zoomControl: false,
        zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT }
      }

      map.value = new naver.maps.Map('map', mapOptions)
      console.log('[INFO] 지도 생성 완료')

      // 기존 마커 제거
      markers.value.forEach((marker) => marker.setMap(null))
      markers.value = []

      // 출발지 마커 추가
      const departureCoords = store.state.departure.departure.coordinates
      console.log('[DEBUG] 출발지 좌표:', departureCoords)

      const bounds = new naver.maps.LatLngBounds() // 지도 경계를 위한 Bounds 객체 추가

      if (departureCoords) {
        try {
          const departureMarker = new naver.maps.Marker({
            position: new naver.maps.LatLng(
              departureCoords.y,
              departureCoords.x
            ),
            map: map.value,
            icon: {
              content: `
        <div style="
          background: #FF5722;
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
          출발
        </div>
      `,
              anchor: new naver.maps.Point(15, 15) // 동일 anchor 설정
            }
          })
          markers.value.push(departureMarker)

          // **출발지 좌표를 Bounds에 추가**
          bounds.extend(
            new naver.maps.LatLng(departureCoords.y, departureCoords.x)
          )
          console.log('[INFO] 출발지 마커 추가 완료')
        } catch (error) {
          console.error('[ERROR] 출발지 마커 추가 중 오류 발생:', error)
        }
      } else {
        console.warn('[WARN] 출발지 좌표가 없습니다. 마커를 추가하지 않습니다.')
      }

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

        // **정류장 좌표를 Bounds에 추가**
        bounds.extend(position)

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

      // **Bounds를 지도에 적용**
      map.value.fitBounds(bounds)
      console.log('[INFO] 지도 경계 설정 완료')
    }

    const zoomIn = () => {
      if (map.value) {
        map.value.setZoom(map.value.getZoom() + 1)
      }
    }

    const zoomOut = () => {
      if (map.value) {
        map.value.setZoom(map.value.getZoom() - 1)
      }
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

    // const calculateProbabilityForStation = (idx) => {
    //   const station = filteredStations.value.find((s) => s.idx === idx)
    //   if (!station) return 0

    //   const probability = selectedStations.value.find((s) => s.seq === idx)
    //   return probability ? probability.probability : 0
    // }

    // const goToNextPage = (station) => {
    //   router.push({
    //     name: 'PathfindingPage',
    //     query: {
    //       stationName: station.stationName,
    //       x: station.x,
    //       y: station.y,
    //       stationID: station.stationID
    //     }
    //   })
    // }

    const goBack = () => {
      router.go(-1)
    }

    const calculateCombinedSeats = () => {
      if (
        arrivalInfo.value &&
        arrivalInfo.value.firstBus &&
        arrivalInfo.value.secondBus &&
        arrivalInfo.value.firstBus.time !== null &&
        arrivalInfo.value.secondBus.time !== null
      ) {
        const firstBusTime = arrivalInfo.value.firstBus.time
        const secondBusTime = arrivalInfo.value.secondBus.time

        // 도착 시간 차이가 10분(600초) 이내인지 확인
        if (Math.abs(firstBusTime - secondBusTime) <= 10) {
          // 여석 합산
          const combinedSeats =
            (arrivalInfo.value.firstBus.seats || 0) +
            (arrivalInfo.value.secondBus.seats || 0)

          console.log(
            `[INFO] 도착 시간이 10분 이내입니다. 합산된 여석: ${combinedSeats}`
          )

          return combinedSeats // 합산된 여석 반환
        }
      }

      return arrivalInfo.value?.firstBus?.seats || 0 // 조건을 만족하지 않으면 첫 번째 버스의 여석 반환
    }

    /// 이거 아님!!!!!!!!!!!!!!!!!!!!!!!!
    const refreshBusInfo = async () => {
      try {
        if (selectedRoute.value) {
          console.log('[INFO] 정류장 도착 정보를 새로 불러옵니다...')
          // filteredStations에 저장된 정류장의 도착 정보를 다시 호출
          await fetchArrivalInfoForStations()
          lastFetchTime.value = new Date()
          console.log('[INFO] 도착 정보가 새로 업데이트되었습니다.')
        } else {
          console.warn('[WARN] 선택된 노선 정보가 없습니다.')
        }
      } catch (error) {
        console.error('[ERROR] 도착 정보 새로고침 중 오류 발생:', error)
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
      const station = selectedStations.value.find((s) => s.idx === String(idx)) // idx를 문자열로 변환
      if (!station) return '없음'

      const { probability } = station

      if (probability <= 0.4) {
        return '낮음'
      } else if (probability <= 0.7) {
        return '보통'
      } else if (probability <= 1.0) {
        return '높음'
      }

      return '없음'
    }

    const isHighestProbability = (idx) => {
      if (!selectedStations.value || selectedStations.value.length === 0)
        return false

      const maxProbability = Math.max(
        ...selectedStations.value.map((s) => s.probability)
      )

      // maxProbability와 일치하는 정류장 중 첫 번째를 찾음
      const firstMaxStation = selectedStations.value.find(
        (s) => s.probability === maxProbability
      )

      // 현재 idx가 첫 번째로 발견된 정류장의 idx와 같은지 확인
      return firstMaxStation && firstMaxStation.idx === String(idx)
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

    const fetchRouteInfoForStations = async () => {
      // Vuex에서 departure 데이터를 가져오기
      const departure = store.getters['departure/getDeparture'] // 'departure'는 모듈 이름
      if (!departure) {
        console.error(
          '[ERROR] Vuex에서 departure 데이터를 가져오지 못했습니다.'
        )
        return
      }

      const { coordinates } = departure

      if (!coordinates || !coordinates.x || !coordinates.y) {
        console.error(
          '[ERROR] departure 데이터에 좌표가 없습니다. coordinates:',
          coordinates
        )
        return
      }

      console.log('[DEBUG] Vuex - departure:', departure)

      const fromX = coordinates.x // 출발지 X 좌표
      const fromY = coordinates.y // 출발지 Y 좌표

      console.log('[DEBUG] fromX:', fromX)
      console.log('[DEBUG] fromY:', fromY)

      // 정류장 데이터가 있는지 확인
      if (!filteredStations.value || filteredStations.value.length === 0) {
        console.warn('[WARN] filteredStations에 데이터가 없습니다.')
        return
      }

      console.log('[DEBUG] sortedStations:', sortedStations.value)

      const promises = sortedStations.value.map(async (station) => {
        try {
          const response = await axios.get(
            'https://api.odsay.com/v1/api/searchPubTransPathT',
            {
              params: {
                apiKey: process.env.VUE_APP_ODSAY_API_KEY,
                SX: fromX,
                SY: fromY,
                EX: station.x,
                EY: station.y,
                OPT: 0 // 추천 경로 기준
              }
            }
          )

          console.log('[INFO] API 호출 응답:', response.data)
          const paths = response.data.result?.path || []
          const shortestPath = paths.sort(
            (a, b) => a.info.totalTime - b.info.totalTime
          )[0]

          if (shortestPath) {
            station.routeInfo = {
              totalTime: shortestPath.info.totalTime,
              transitCount:
                shortestPath.info.busTransitCount +
                shortestPath.info.subwayTransitCount,
              walkTime: shortestPath.info.totalWalk
            }
          } else {
            station.routeInfo = null
          }
        } catch (error) {
          console.error(
            `[ERROR] 정류장 ${station.stationName} 경로 정보 호출 실패:`,
            error
          )
          station.routeInfo = null
        }
      })

      await Promise.all(promises)
    }
    const fetchShortestRouteToDestination = async () => {
      try {
        // 도착지 좌표 가져오기
        const destination = store.getters['destination/getDestination']
        if (
          !destination ||
          !destination.coordinates ||
          !destination.coordinates.x ||
          !destination.coordinates.y
        ) {
          console.error('[ERROR] 도착지 좌표가 없습니다.')
          return
        }
        const destinationX = destination.coordinates.x
        const destinationY = destination.coordinates.y

        // filteredStations의 첫 번째 정류장 좌표 가져오기
        const firstStation = filteredStations.value[0]
        if (!firstStation || !firstStation.x || !firstStation.y) {
          console.error('[ERROR] filteredStations에 첫 번째 정류장이 없습니다.')
          return
        }
        const firstStationX = firstStation.x
        const firstStationY = firstStation.y

        console.log('[INFO] 길찾기 API 호출 시작', {
          fromX: firstStationX,
          fromY: firstStationY,
          toX: destinationX,
          toY: destinationY
        })

        // ODsay API 호출
        const response = await axios.get(
          'https://api.odsay.com/v1/api/searchPubTransPathT',
          {
            params: {
              SX: firstStationX,
              SY: firstStationY,
              EX: destinationX,
              EY: destinationY,
              OPT: 0, // 추천 경로 기준
              apiKey: apiConfig.odsayApiKey
            }
          }
        )

        // API 응답 처리
        const paths = response.data.result?.path || []
        if (paths.length === 0) {
          console.warn('[WARN] 길찾기 결과가 없습니다.')
          return
        }

        // 최단 시간순으로 정렬
        const shortestPath = paths.sort(
          (a, b) => a.info.totalTime - b.info.totalTime
        )[0]

        if (shortestPath) {
          console.log('[INFO] 최단 경로:', shortestPath)

          // 결과 표시
          firstStation.routeToDestination = {
            totalTime: shortestPath.info.totalTime,
            transitCount:
              shortestPath.info.busTransitCount +
              shortestPath.info.subwayTransitCount,
            walkTime: shortestPath.info.totalWalk
          }

          console.log('[INFO] 경로 정보:', firstStation.routeToDestination)
        } else {
          console.warn('[WARN] 최단 경로를 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('[ERROR] 길찾기 API 호출 중 오류:', error)
      }
    }

    onMounted(async () => {
      getCurrentPosition()

      const timeData = store.getters['time/getTime']
      console.log('[DEBUG] Vuex에서 가져온 시간 데이터:', timeData)

      searchTime.value = timeData.minute
      console.log('[DEBUG] Vuex에서 설정한 searchTime:', searchTime.value)

      // filteredStations 변경 감지
      watch(
        () => filteredStations.value,
        (newVal) => {
          // console.log('[DEBUG] filteredStations 변경됨:', newVal) // filteredStations 변화 확인
          // console.log(
          //   '[DEBUG] filteredStations as JSON:',
          //   JSON.stringify(newVal, null, 2)
          // ) // JSON 포맷으로 보기
        },
        { deep: true }
      )

      // selectedStations 변경 감지
      watch(
        () => selectedStations.value,
        (newVal) => {
          console.log('[DEBUG] selectedStations 변경됨:', newVal) // selectedStations 변화 확인
        },
        { deep: true }
      )

      await searchTransitRoutes()

      console.log('[INFO] fetchRouteInfoForStations 호출 시작')
      await fetchRouteInfoForStations() // 경로 정보를 가져오는 함수 호출
      console.log('[INFO] fetchRouteInfoForStations 호출 완료')
      console.log('[INFO] 도착지 경로 검색 시작')
      await fetchShortestRouteToDestination()
    })

    return {
      searchTime, // 템플릿에서 필요하면 반환
      fromLocationx,
      fromLocationy,
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
      //calculateProbabilityForStation,
      //goToNextPage,
      goBack,
      refreshBusInfo,
      checkBusLocation,
      sortBy,
      sortedStations,
      isHighProbability,
      isHighestProbability,
      selectStation,
      selectBusRoute,
      currentSort,
      currentPosition,
      isRealTimeData,
      refreshBusInfo,
      zoomIn,
      zoomOut,
      vuextimeInfo,
      fetchShortestRouteToDestination
    }
  },
  props: {
    arrivalInfo: {
      type: Object,
      default: null
    }
  }
}
</script>

<style scoped src="./Result.css"></style>

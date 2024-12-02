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
              'high-probability': isHighProbability(station.idx),
              'low-probability': !isHighProbability(station.idx),
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
              <div
                class="bus-arrival-info"
                :class="{ 'no-info': !arrivalInfo }"
              >
                <div v-if="!arrivalInfo" class="no-arrival-info">
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
                    현재 도착 정보를 이용할 수 없습니다.
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
                      >첫 번째 버스: {{ arrivalInfo.firstBus.time }}분 후</span
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
                    <span>여석: {{ arrivalInfo.firstBus.seats }}</span>
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
                      >두 번째 버스: {{ arrivalInfo.secondBus.time }}분 후</span
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
                    <span>여석: {{ arrivalInfo.secondBus.seats }}</span>
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
          await fetchArrivalInfoForStations()
        }
      } catch (error) {
        console.error('노선 선택 오류:', error)
      }
    }
    const fetchArrivalInfoForStations = async () => {
      try {
        for (const station of selectedStations.value) {
          const { localStationID: stationId } = station // 정류장의 localStationID 사용
          const routeId = busRouteData[selectedRoute.value.busNo]?.routeId // busRouteData에서 routeId 가져오기
          const serviceKey =
            'EVTsGjdsoUlBtJTpdh%2FitgFJXzeeNK%2FBP4lN8my%2Bi9AaoLGNln1kqRcyVP7CVRY8GsiXkX%2BOMl2HviEvq6hlfQ%3D%3D' // 인증키

          if (!routeId) {
            console.error(
              `[ERROR] routeId를 찾을 수 없습니다. 노선 번호: ${selectedRoute.value.busNo}`
            )
            continue
          }

          const url = `http://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalItem`
          const params = {
            serviceKey,
            stationId,
            routeId
          }

          console.log(`[DEBUG] API 호출: 정류장 ${stationId}, 노선 ${routeId}`)

          const response = await axios.get(url, { params })
          const data = response.data

          if (data?.msgHeader?.resultCode === '0') {
            console.log(`[INFO] 정류장 ${stationId} 도착 정보:`, data)
            station.arrivalInfo = {
              firstBus: {
                time: data.predictTime1,
                seats: data.remainSeatCnt1,
                plate: data.plateNo1
              },
              secondBus: {
                time: data.predictTime2,
                seats: data.remainSeatCnt2,
                plate: data.plateNo2
              }
            }
          } else {
            console.warn(
              `[WARN] 정류장 ${stationId} 데이터 없음:`,
              data?.msgHeader?.resultMessage || '알 수 없는 오류'
            )
            station.arrivalInfo = null
          }
        }

        console.log('[INFO] 모든 정류장 도착 정보:', selectedStations.value)
      } catch (error) {
        console.error('[ERROR] 정류장 도착 정보 호출 중 오류:', error)
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
        zoom: 13,
        zoomControl: false,
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

      // 출발지 마커 추가
      const departureCoords = store.state.departure.departure.coordinates
      if (departureCoords) {
        const departureMarker = new naver.maps.Marker({
          position: new naver.maps.LatLng(departureCoords.y, departureCoords.x),
          map: map.value,
          icon: {
            content: `
              <div style="
                background: #FF5722;
                color: #fff;
                padding: 5px 10px;
                border-radius: 5px;
                font-weight: bold;
                font-size: 12px;
              ">출발</div>
            `,
            anchor: new naver.maps.Point(30, 15)
          }
        })
        markers.value.push(departureMarker)
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
          lastFetchTime.value = new Date()
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

    const isHighestProbability = (idx) => {
      if (!selectedStations.value || selectedStations.value.length === 0)
        return false
      const maxProbability = Math.max(
        ...selectedStations.value.map((s) => s.probability)
      )
      const station = selectedStations.value.find((s) => s.seq === idx)
      return station && station.probability === maxProbability
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
      isHighestProbability,
      selectStation,
      selectBusRoute,
      currentSort,
      currentPosition,
      isRealTimeData,
      refreshBusInfo
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

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.result-page {
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
  padding: 20px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.back-button {
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-button svg {
  width: 24px;
  height: 24px;
  stroke: #000000;
}

.app-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.content {
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

.section-title {
  font-size: 1.25rem;
  color: #334155;
  margin-bottom: 24px;
  margin-top: 70px;
  font-weight: 600;
}

.content > .section-title:first-of-type {
  margin-top: 48px;
}

.route-info {
  width: 100%;
  margin-bottom: 32px;
}

.route-info ul {
  list-style-type: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
}

.route-item {
  flex: 1 1 auto;
  min-width: 60px;
  max-width: calc(25% - 10px);
  padding: 12px;
  background-color: #f1f5f9;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  text-align: center;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-item:hover {
  background-color: #e2e8f0;
  transform: translateY(-2px);
}

.no-routes,
.loading {
  text-align: center;
  padding: 20px;
  font-size: 1rem;
  color: #64748b;
}

.recommendation {
  margin-top: 48px;
}

#map {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
  height: 200px;
  position: relative;
}

.stations-list {
  display: flex;
  flex-direction: column;
  padding: 16px 0;
}

.station-timeline-item {
  display: flex;
  gap: 32px;
  position: relative;
  padding: 16px 0;
  transition: all 0.3s ease;
}

.station-timeline-item:hover {
  transform: translateX(5px);
}

.timeline-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 2px;
  position: relative;
  margin-left: 32px;
}

.timeline-connector::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  border-left: 2px dashed #cbd5e1;
  transform: translateX(-50%);
}

.station-timeline-item:first-child .timeline-connector::before {
  top: 50%;
}

.station-timeline-item:last-child .timeline-connector::before {
  display: none;
}

.timeline-node {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #e2e8f0;
  border: 2px solid #cbd5e1;
  z-index: 1;
  position: relative;
}

.station-content {
  flex: 1;
  max-width: calc(100% - 80px);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
}

.station-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.station-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.station-probability {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
}

.station-probability svg {
  margin-right: 4px;
}

.station-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 8px 0 0;
}

/* High probability styles */
.station-timeline-item.high-probability .station-content {
  background-color: #93c5fd;
}

.station-timeline-item.high-probability .station-probability {
  color: #1d4ed8;
}

.station-timeline-item.high-probability .timeline-node {
  background-color: #3b82f6;
  border-color: #2563eb;
}

/* Low probability styles */
.station-timeline-item.low-probability .station-content {
  background-color: #e2e8f0;
}

.station-timeline-item.low-probability .station-probability {
  color: #64748b;
}

.sort-options {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  gap: 12px;
}

.sort-button {
  background-color: #f1f5f9;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sort-button.active {
  background-color: #3b82f6;
  color: white;
}

.sort-button:hover {
  background-color: #e2e8f0;
  transform: translateY(-2px);
}

.sort-button.active:hover {
  background-color: #2563eb;
}

.bus-arrival-info {
  margin-top: 12px;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 12px;
}

.bus-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.bus-info:last-child {
  margin-bottom: 0;
}

.bus-info svg {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.bus-info span {
  font-size: 0.875rem;
  color: #4b5563;
  margin-right: 16px;
}

.refresh-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
  transition: all 0.3s ease;
}

.refresh-button:hover {
  background-color: #2563eb;
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 8px rgba(59, 130, 246, 0.3);
}

.refresh-button:active {
  transform: scale(0.95) translateY(1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.no-stations {
  text-align: center;
  padding: 20px;
  background-color: #f8fafc;
  border-radius: 12px;
  margin-top: 16px;
}

.no-stations p {
  color: #64748b;
  font-size: 1rem;
}

@media (max-width: 390px) {
  .station-name {
    font-size: 0.9375rem;
  }

  .station-description,
  .station-probability {
    font-size: 0.8125rem;
  }

  .bus-info {
    font-size: 0.8125rem;
  }

  .refresh-button {
    width: 48px;
    height: 48px;
  }
  .sort-button {
    padding: 8px 16px;
    font-size: 13px;
  }

  .check-route-button {
    padding: 12px 16px;
    font-size: 15px;
  }
}

.custom-zoom-control {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.zoom-button {
  width: 40px;
  height: 40px;
  font-size: 24px;
  font-weight: bold;
  background-color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.zoom-button:hover {
  background-color: #f0f0f0;
}

.zoom-in {
  border-bottom: 1px solid #e0e0e0;
}

.check-route-button {
  display: block;
  width: calc(100% - 40px);
  max-width: 300px;
  margin: 20px auto;
  padding: 14px 20px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
}

.check-route-button:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(59, 130, 246, 0.3);
}

.check-route-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.station-timeline-item.recommended {
  background-color: #e6f7ff;
  border: 2px solid #1890ff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.recommendation-badge {
  background-color: #22c55e;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  vertical-align: middle;
}

.station-timeline-item.recommended {
  background-color: #f0f9ff;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1),
    0 2px 4px -1px rgba(59, 130, 246, 0.06);
  transition: all 0.3s ease;
}

.station-timeline-item.recommended:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1),
    0 4px 6px -2px rgba(59, 130, 246, 0.05);
}

.recommendation-title {
  font-size: 1.25rem;
  color: #334155;
  margin-bottom: 12px;
  margin-top: 80px;
  font-weight: 600;
}

@media (max-width: 390px) {
  .station-name {
    font-size: 0.9375rem;
  }

  .station-description,
  .station-probability {
    font-size: 0.8125rem;
  }

  .bus-info {
    font-size: 0.8125rem;
  }

  .refresh-button {
    width: 48px;
    height: 48px;
  }
  .sort-button {
    padding: 8px 16px;
    font-size: 13px;
  }

  .check-route-button {
    padding: 12px 16px;
    font-size: 15px;
  }
}
.bus-arrival-info {
  margin-top: 12px;
  border-radius: 8px;
  padding: 16px;
  background-color: #f0f9ff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bus-arrival-info.no-info {
  background-color: #f3f4f6;
}

.no-arrival-info {
  text-align: center;
}

.info-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  color: #9ca3af;
}

.info-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 4px;
}

.info-subtext {
  font-size: 0.875rem;
  color: #6b7280;
}

.bus-info {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.bus-info:last-child {
  margin-bottom: 0;
}

.icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  color: #3b82f6;
}

.bus-info span {
  font-size: 0.9375rem;
  color: #1f2937;
  margin-right: 16px;
}
</style>

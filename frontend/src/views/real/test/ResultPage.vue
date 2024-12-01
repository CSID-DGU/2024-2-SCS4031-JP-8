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
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useStore } from 'vuex'
import { fetchBusRouteDetails } from './busApi'
import { fetchBusArrivalInfo } from './busArrivalAPI'
import { calculateBoardingProbability } from './poisson'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const store = useStore()
    const router = useRouter()

    const fromLocation = computed(() => store.state.departure.departure.name)
    const toLocation = computed(() => store.state.destination.destination.name)
    const loading = ref(false)
    const filteredRoutes = ref([])
    const selectedRoute = ref(null)
    const filteredStations = ref([])
    const selectedStations = ref([])
    const map = ref(null)
    const currentSort = ref('probability')

    const goBack = () => {
      router.go(-1)
    }

    const searchTransitRoutes = async () => {
      loading.value = true
      try {
        const startX = store.state.departure.departure.coordinates?.x
        const startY = store.state.departure.departure.coordinates?.y
        const endX = store.state.destination.destination.coordinates?.x
        const endY = store.state.destination.destination.coordinates?.y

        if (!startX || !startY || !endX || !endY) {
          alert('출발지와 도착지의 위치를 확인해주세요.')
          return
        }

        const response = await axios.get(
          'https://api.odsay.com/v1/api/searchPubTransPathT',
          {
            params: {
              SX: startX,
              SY: startY,
              EX: endX,
              EY: endY,
              apiKey: 'dWY4QsIARSUXfD8U1ZdSig'
            }
          }
        )

        const paths = response.data.result.path || []
        const routeOptions = ['5000', '5000A', '5000B', '1112', '6001']
        const allRoutes = []

        paths.forEach((route) => {
          route.subPath.forEach((segment) => {
            if (segment.trafficType === 2) {
              segment.lane.forEach((lane) => {
                if (routeOptions.includes(lane.busNo)) {
                  allRoutes.push({
                    busNo: lane.busNo,
                    directionText:
                      segment.stationDirection === 2 ? '상행' : '하행',
                    stationID: segment.startID,
                    stationName: segment.startName
                  })
                }
              })
            }
          })
        })

        filteredRoutes.value = allRoutes.reduce((acc, current) => {
          const duplicate = acc.find(
            (route) =>
              route.busNo === current.busNo &&
              route.directionText === current.directionText
          )
          if (!duplicate) acc.push(current)
          return acc
        }, [])

        if (filteredRoutes.value.length > 0) {
          selectBusRoute(filteredRoutes.value[0])
        }
      } catch (error) {
        console.error('노선 검색 오류:', error)
      } finally {
        loading.value = false
      }
    }

    const selectBusRoute = async (route) => {
      selectedRoute.value = route
      try {
        const busData = await fetchBusRouteDetails(route.busNo)
        filteredStations.value = busData.station.slice(0, 5)

        initializeMap(busData.station)

        const firstStation = filteredStations.value[0]
        if (firstStation) {
          const arrivalInfo = await fetchBusArrivalInfo(
            firstStation.localStationID,
            route.busNo,
            store.getters['time/getTime']
          )
          const filePath = `/csv/${route.busNo}/passengers/${
            route.busNo
          }_${getDayType()}.csv`

          selectedStations.value = await calculateBoardingProbability({
            arrivalInfo: arrivalInfo.firstBus?.remainSeats || 0,
            startSeq: filteredStations.value[0]?.idx,
            endSeq:
              filteredStations.value[filteredStations.value.length - 1]?.idx,
            filePath,
            timeSlot: `${store.getters['time/getTime'].hour}시`,
            stations: busData.station
          })
        }

        await fetchBusArrivalForStations()
      } catch (error) {
        console.error('노선 선택 오류:', error)
      }
    }

    const fetchBusArrivalForStations = async () => {
      for (const station of filteredStations.value) {
        try {
          const arrivalInfo = await fetchBusArrivalInfo(
            station.stationId,
            selectedRoute.value.busNo
          )
          station.arrivalInfo = arrivalInfo
        } catch (error) {
          console.error(
            `정류장 ${station.stationName}의 도착 정보 조회 오류:`,
            error
          )
        }
      }
    }

    const initializeMap = () => {
      if (!filteredStations.value || filteredStations.value.length === 0) {
        console.error('지도 초기화 실패: 필터링된 정류장 데이터가 없습니다.')
        return
      }

      const firstStation = filteredStations.value[0]
      const lastStation =
        filteredStations.value[filteredStations.value.length - 1]

      const mapOptions = {
        center: new naver.maps.LatLng(
          (firstStation.y + lastStation.y) / 2,
          (firstStation.x + lastStation.x) / 2
        ),
        zoom: 15,
        zoomControl: true,
        zoomControlOptions: {
          style: naver.maps.ZoomControlStyle.SMALL,
          position: naver.maps.Position.TOP_RIGHT
        }
      }

      map.value = new naver.maps.Map('map', mapOptions)

      // Custom zoom control styles
      const customControl = new naver.maps.CustomControl(createZoomControl(), {
        position: naver.maps.Position.TOP_RIGHT
      })

      customControl.setMap(map.value)

      const path = []
      filteredStations.value.forEach((station) => {
        const position = new naver.maps.LatLng(station.y, station.x)
        path.push(position)

        new naver.maps.Marker({
          position,
          map: map.value,
          title: station.stationName,
          icon: {
            content: `
              <div style="background: #007aff; color: #fff; padding: 5px 10px; border-radius: 5px; position: relative; text-align: center; font-size: 12px;">
                ${station.stationName}
                <div style="position: absolute; bottom: -6px; left: 0px; width: 0; height: 7; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #007aff;"></div>
              </div>
            `,
            anchor: new naver.maps.Point(12, 20)
          }
        })
      })

      new naver.maps.Polyline({
        map: map.value,
        path,
        strokeWeight: 4,
        strokeColor: '#FF7F00',
        strokeOpacity: 0.8
      })

      const bounds = new naver.maps.LatLngBounds()
      bounds.extend(new naver.maps.LatLng(firstStation.y, firstStation.x))
      bounds.extend(new naver.maps.LatLng(lastStation.y, lastStation.x))

      map.value.fitBounds(bounds)

      const listener = naver.maps.Event.addListener(map.value, 'idle', () => {
        map.value.setZoom(17)
        naver.maps.Event.removeListener(listener)
      })
    }

    const createZoomControl = () => {
      const zoomControl = document.createElement('div')
      zoomControl.className = 'custom-zoom-control'

      const zoomIn = document.createElement('button')
      zoomIn.innerHTML = '+'
      zoomIn.className = 'zoom-button zoom-in'
      zoomIn.addEventListener('click', () =>
        map.value.setZoom(map.value.getZoom() + 1)
      )

      const zoomOut = document.createElement('button')
      zoomOut.innerHTML = '-'
      zoomOut.className = 'zoom-button zoom-out'
      zoomOut.addEventListener('click', () =>
        map.value.setZoom(map.value.getZoom() - 1)
      )

      zoomControl.appendChild(zoomIn)
      zoomControl.appendChild(zoomOut)

      return zoomControl
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

    const getDayType = () => {
      const now = new Date()
      const day = now.getDay()
      return day === 0 ? '일요일' : day === 6 ? '토요일' : '평일'
    }

    const isHighProbability = (idx) => {
      if (!selectedStations.value || selectedStations.value.length === 0)
        return false
      const currentStation = selectedStations.value.find((s) => s.seq === idx)
      if (!currentStation) return false

      const maxProbability = Math.max(
        ...selectedStations.value.map((s) => s.probability)
      )
      return currentStation.probability >= maxProbability * 0.8 // 80% of max probability is considered high
    }

    const sortBy = (sortType) => {
      currentSort.value = sortType
      sortedStations.value = [...filteredStations.value].sort((a, b) => {
        if (sortType === 'probability') {
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

    const refreshBusInfo = async () => {
      await fetchBusArrivalForStations()
    }

    const checkBusLocation = () => {
      if (selectedRoute.value) {
        router.push({
          path: '/buslocation',
          query: { busNo: selectedRoute.value.busNo }
        })
      }
    }

    onMounted(() => {
      searchTransitRoutes()
    })

    return {
      fromLocation,
      toLocation,
      loading,
      filteredRoutes,
      selectedRoute,
      sortedStations,
      selectBusRoute,
      goBack,
      isHighProbability,
      selectStation,
      currentSort,
      sortBy,
      refreshBusInfo,
      checkBusLocation
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
  margin-top: 40px;
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
</style>

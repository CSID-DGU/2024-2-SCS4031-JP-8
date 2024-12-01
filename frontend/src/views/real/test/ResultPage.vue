<template>
  <div class="result-page">
    <!-- 헤더 -->
    <header class="app-header">
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
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1>경로 및 정류장 추천</h1>
    </header>

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
        <div id="map"></div>
        <div class="stations-list">
          <div
            v-for="(station, index) in filteredStations"
            :key="station.stationID"
            class="station-timeline-item"
            :class="{
              'highest-probability': isHighestProbability(station.idx),
              first: index === 0,
              last: index === filteredStations.length - 1
            }"
            @click="selectStation(station)"
          >
            <div class="timeline-connector">
              <div class="timeline-node"></div>
            </div>
            <div class="station-content">
              <div class="station-header">
                <p class="station-name">{{ station.stationName }}</p>
                <p
                  class="station-probability"
                  v-if="
                    calculateProbabilityForStation(station.idx) !== undefined
                  "
                >
                  {{ calculateProbabilityForStation(station.idx).toFixed(1) }}%
                </p>
              </div>
              <p class="station-description">정류장 {{ station.idx }}번</p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
      } catch (error) {
        console.error('노선 선택 오류:', error)
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
          position: naver.maps.Position.TOP_RIGHT
        }
      }

      map.value = new naver.maps.Map('map', mapOptions)

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

    const calculateProbabilityForStation = (idx) => {
      const station = selectedStations.value.find((s) => s.seq === idx)
      return station ? station.probability : 0
    }

    const isHighestProbability = (idx) => {
      if (!selectedStations.value || selectedStations.value.length === 0)
        return false
      const currentStation = selectedStations.value.find((s) => s.seq === idx)
      if (!currentStation) return false

      const maxProbability = Math.max(
        ...selectedStations.value.map((s) => s.probability)
      )
      return currentStation.probability === maxProbability
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
      filteredStations,
      selectBusRoute,
      calculateProbabilityForStation,
      goBack,
      isHighestProbability,
      selectStation
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
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.back-button {
  background: white;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  margin-right: 16px;
}

.back-button svg {
  width: 24px;
  height: 24px;
  fill: #000000;
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
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
}

/* Highest probability styles */
.station-timeline-item.highest-probability .station-content {
  background-color: #3b82f6;
}

.station-timeline-item.highest-probability .station-name,
.station-timeline-item.highest-probability .station-description,
.station-timeline-item.highest-probability .station-probability {
  color: white;
}

.station-timeline-item.highest-probability .timeline-node {
  background-color: #3b82f6;
  border-color: #2563eb;
}

.station-timeline-item.highest-probability .timeline-connector::before {
  border-left-color: #3b82f6;
}

@media (max-width: 390px) {
  .station-name {
    font-size: 0.9375rem;
  }

  .station-description,
  .station-probability {
    font-size: 0.8125rem;
  }
}
</style>

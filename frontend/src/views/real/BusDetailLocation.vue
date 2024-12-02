<template>
  <div class="bus-location-page">
    <div class="app-header">
      <button class="back-button" @click="$router.go(-1)">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>
      <h1>버스 위치 정보</h1>
    </div>

    <div class="content-wrapper">
      <div id="map" class="map-container">
        <div class="custom-zoom-control">
          <button class="zoom-button zoom-in" @click="zoomIn">+</button>
          <button class="zoom-button zoom-out" @click="zoomOut">-</button>
        </div>
      </div>

      <div class="info-section">
        <div class="info-card">
          <div class="route-header">
            <div class="route-number">{{ busInfo.busNo }}번</div>
            <div class="route-type">{{ getBusType(busInfo.type) }}</div>
          </div>

          <div class="route-details">
            <div class="detail-item">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 3v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
              <span>운행 상태: {{ getBusFlag(busInfo.flag) }}</span>
              <span
                >{{ busInfo.busStartPoint }} ↔ {{ busInfo.busEndPoint }}</span
              >
            </div>
            <div class="detail-item">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                >첫차 {{ busInfo.busFirstTime }} / 막차
                {{ busInfo.busLastTime }}</span
              >
            </div>
            <div class="detail-item">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                >평일 {{ busInfo.bus_Interval_Week }} / 토요일
                {{ busInfo.bus_Interval_Sat }} / 일요일
                {{ busInfo.bus_Interval_Sun }}</span
              >
            </div>
            <div class="detail-item">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <span>총 운행거리: {{ busInfo.busTotalDistance }}km</span>
            </div>
            <div class="detail-item">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                />
              </svg>
              <span>운수회사: {{ busInfo.busCompanyNameKor }}</span>
            </div>
          </div>
        </div>

        <div class="direction-buttons">
          <button
            @click="scrollToDirection('up')"
            :class="{ active: currentDirection === 'up' }"
            class="direction-button"
          >
            상행
          </button>
          <button
            @click="scrollToDirection('down')"
            :class="{ active: currentDirection === 'down' }"
            class="direction-button"
          >
            하행
          </button>
        </div>

        <div class="stops-list">
          <div
            v-for="(stop, index) in filteredStops"
            :key="index"
            class="stop-item"
          >
            <div class="stop-marker" :class="{ 'has-bus': stop.busInfo }"></div>
            <div class="stop-content">
              <div class="stop-name">{{ stop.stationName }}</div>
              <div class="stop-details">
                <span class="stop-arsid">{{ stop.arsID }}</span>
                <span v-if="stop.nonstopStation === 1" class="nonstop-badge"
                  >미정차</span
                >
                <span
                  v-if="stop.busOnlyCentralLane === 1"
                  class="central-lane-badge"
                  >중앙차로</span
                >
              </div>
              <div v-if="stop.busInfo" class="bus-indicator">
                <div
                  class="bus-icon"
                  :class="{
                    'low-bus': stop.busInfo && stop.busInfo.lowPlate === 1
                  }"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M8 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
                    />
                    <path d="M4 17H2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11h-2" />
                    <path d="M4 11h16" />
                    <path d="M8 5v6" />
                    <path d="M16 5v6" />
                  </svg>
                </div>
                <div class="bus-info-bubble">
                  <p class="bus-number">{{ stop.busInfo.plateNo }}</p>
                  <p class="seats-info">
                    잔여
                    {{
                      stop.busInfo
                        ? stop.busInfo.remainSeatCnt === -1
                          ? '정보없음'
                          : `${stop.busInfo.remainSeatCnt}석`
                        : '정보없음'
                    }}
                  </p>
                </div>
              </div>
              <p
                v-if="stop.busInfo && stop.busInfo.lowPlate === 1"
                class="low-bus-text"
              >
                저상버스
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      busInfo: {
        busNo: '',
        type: null,
        busStartPoint: '',
        busEndPoint: '',
        busFirstTime: '',
        busLastTime: '',
        bus_Interval_Week: '',
        bus_Interval_Sat: '',
        bus_Interval_Sun: '',
        busTotalDistance: '',
        busCompanyNameKor: '',
        direction: '상행'
      },
      busStops: [],
      localBusID: null,
      map: null,
      hasBusInfo: false,
      currentDirection: 'up',
      busMarkers: [],
      updateInterval: null
    }
  },
  computed: {
    filteredStops() {
      if (this.currentDirection === 'up') {
        return this.busStops.slice(0, Math.ceil(this.busStops.length / 2))
      } else {
        return this.busStops.slice(Math.ceil(this.busStops.length / 2))
      }
    }
  },
  methods: {
    getBusInfo(stop, index) {
      console.log(
        `[DEBUG] GetBusInfo called for stop: ${stop.stationName}, index: ${index}`
      )
      if (stop.busInfo) {
        return {
          plateNo: stop.busInfo.plateNo,
          seats: stop.busInfo.remainSeatCnt,
          lowPlate: stop.busInfo.lowPlate,
          flag: stop.busInfo.flag
        }
      }
      if (index === 0 && !this.hasBusInfo) {
        return {
          plateNo: '서울75사1234',
          seats: 15,
          lowPlate: 0,
          flag: 'RUN'
        }
      }
      return {
        plateNo: '',
        seats: 0,
        lowPlate: 0,
        flag: ''
      }
    },
    getBusFlag(flag) {
      console.log(`[DEBUG] GetBusFlag called for flag: ${flag}`)
      const flagDescriptions = {
        RUN: '운행중',
        PASS: '운행중',
        STOP: '운행종료',
        WAIT: '회차지대기'
      }
      return flagDescriptions[flag] || '정보없음'
    },
    initMap() {
      console.log('[DEBUG] Initializing map...')
      if (typeof naver === 'undefined' || !naver.maps) {
        console.error('Naver Maps API is not loaded')
        return
      }

      this.map = new naver.maps.Map('map', {
        center: new naver.maps.LatLng(37.5665, 126.978),
        zoom: 13,
        zoomControl: false,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        mapTypeControl: false
      })
      console.log('[DEBUG] Map initialized successfully.')
    },
    displayRoute() {
      console.log('[DEBUG] DisplayRoute called.')
      if (!this.busStops.length) return

      const path = this.busStops.map(
        (stop) => new naver.maps.LatLng(stop.lat, stop.lng)
      )

      new naver.maps.Polyline({
        path,
        map: this.map,
        strokeColor: '#3b82f6',
        strokeWeight: 6,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        strokeLineJoin: 'round',
        strokeLineCap: 'round',
        outlineColor: '#000000',
        outlineWeight: 40,
        outlineOpacity: 1
      })

      const bounds = new naver.maps.LatLngBounds()
      path.forEach((point) => bounds.extend(point))
      this.map.fitBounds(bounds)
      console.log('[DEBUG] Route displayed on map.')
    },
    scrollToDirection(direction) {
      console.log(
        `[DEBUG] ScrollToDirection called for direction: ${direction}`
      )
      this.currentDirection = direction
      const targetStop =
        direction === 'up'
          ? this.busStops[0]
          : this.busStops[Math.ceil(this.busStops.length / 2)]
      if (targetStop) {
        this.map.setCenter(
          new naver.maps.LatLng(targetStop.lat, targetStop.lng)
        )
        this.map.setZoom(15)
      }
    },
    zoomIn() {
      console.log('[DEBUG] ZoomIn called.')
      if (this.map) {
        this.map.setZoom(this.map.getZoom() + 1)
      }
    },
    zoomOut() {
      console.log('[DEBUG] ZoomOut called.')
      if (this.map) {
        this.map.setZoom(this.map.getZoom() - 1)
      }
    },
    getBusType(type) {
      console.log(`[DEBUG] GetBusType called for type: ${type}`)
      const types = {
        1: '공항버스',
        2: '마을버스',
        3: '간선버스',
        4: '지선버스',
        5: '순환버스',
        6: '광역버스',
        7: '인천버스',
        8: '경기버스',
        9: '폐지예정',
        0: '공용노선'
      }
      return types[type] || '일반버스'
    },
    async fetchBusRouteInfo() {
      try {
        console.log('[DEBUG] FetchBusRouteInfo started.')
        const routeResponse = await axios.get(
          'https://api.odsay.com/v1/api/searchBusLane',
          {
            params: {
              apiKey: process.env.VUE_APP_ODSAY_API_KEY,
              busNo: this.$route.query.busNo
            }
          }
        )
        console.log('[DEBUG] Route response received:', routeResponse.data)

        const selectedBus = routeResponse.data.result.lane[0]
        this.localBusID = selectedBus.localBusID
        console.log(`[DEBUG] Selected bus localBusID: ${this.localBusID}`)

        const infoResponse = await axios.get(
          'https://api.odsay.com/v1/api/busLaneDetail',
          {
            params: {
              apiKey: process.env.VUE_APP_ODSAY_API_KEY,
              busID: selectedBus.busID
            }
          }
        )
        console.log('[DEBUG] Bus info response received:', infoResponse.data)

        const busInfo = infoResponse.data.result
        this.busInfo = {
          busNo: busInfo.busNo,
          type: busInfo.type,
          busStartPoint: busInfo.busStartPoint,
          busEndPoint: busInfo.busEndPoint,
          busFirstTime: busInfo.busFirstTime,
          busLastTime: busInfo.busLastTime,
          bus_Interval_Week: busInfo.bus_Interval_Week,
          bus_Interval_Sat: busInfo.bus_Interval_Sat,
          bus_Interval_Sun: busInfo.bus_Interval_Sun,
          busTotalDistance: (busInfo.busTotalDistance / 1000).toFixed(1),
          busCompanyNameKor: busInfo.busCompanyNameKor,
          direction: busInfo.directionDescription || '상행'
        }
        console.log('[DEBUG] Updated busInfo:', this.busInfo)

        this.busStops = busInfo.station.map((stop) => ({
          stationName: stop.stationName,
          lat: parseFloat(stop.y),
          lng: parseFloat(stop.x),
          localStationID: stop.localStationID,
          arsID: stop.arsID,
          nonstopStation: stop.nonstopStation,
          busOnlyCentralLane: stop.busOnlyCentralLane,
          busInfo: null
        }))
        console.log('[DEBUG] Updated busStops:', this.busStops)

        this.displayRoute()

        // Fetch real-time bus location information
        await this.fetchBusLocations()
      } catch (error) {
        console.error('[DEBUG] Error in FetchBusRouteInfo:', error)
      }
    },
    async fetchBusLocations() {
      try {
        console.log('[DEBUG] FetchBusLocations started.')
        const params = {
          serviceKey:
            'EVTsGjdsoUlBtJTpdh/itgFJXzeeNK/BP4lN8my+i9AaoLGNln1kqRcyVP7CVRY8GsiXkX+OMl2HviEvq6hlfQ==',
          routeId: this.localBusID
        }
        console.log('[DEBUG] Gyeonggi Bus API Parameters:', params)

        const gyeonggiBusResponse = await axios.get(
          'http://apis.data.go.kr/6410000/buslocationservice/getBusLocationList',
          { params }
        )
        console.log(
          '[DEBUG] Gyeonggi Bus response received:',
          gyeonggiBusResponse.data
        )

        const busLocations = this.parseXML(gyeonggiBusResponse.data)
        console.log('[DEBUG] Parsed bus locations:', busLocations)

        busLocations.forEach((bus) => {
          const matchedStop = this.busStops.find(
            (stop) => stop.localStationID === bus.stationId
          )
          if (matchedStop) {
            matchedStop.busInfo = {
              plateNo: bus.plateNo,
              plateType: bus.plateType,
              remainSeatCnt: bus.remainSeatCnt,
              lowPlate: bus.lowPlate === '1' ? 1 : 0,
              flag: bus.flag
            }
            this.hasBusInfo = true
            console.log('[DEBUG] Updated busInfo for stop:', matchedStop)
          }
        })

        // Update bus markers on the map
        this.updateBusMarkers(busLocations)
      } catch (error) {
        console.error('[DEBUG] Error in FetchBusLocations:', error)
      }
    },
    parseXML(xmlData) {
      console.log('[DEBUG] Parsing XML data.')
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlData, 'text/xml')
      const busLocationList = Array.from(
        xmlDoc.getElementsByTagName('busLocationList')
      )
      const parsedData = busLocationList.map((bus) => ({
        stationId: bus.getElementsByTagName('stationId')[0]?.textContent,
        plateNo: bus.getElementsByTagName('plateNo')[0]?.textContent,
        plateType: bus.getElementsByTagName('plateType')[0]?.textContent,
        remainSeatCnt:
          bus.getElementsByTagName('remainSeatCnt')[0]?.textContent,
        lowPlate: bus.getElementsByTagName('lowPlate')[0]?.textContent,
        lat: parseFloat(bus.getElementsByTagName('lat')[0]?.textContent),
        lng: parseFloat(bus.getElementsByTagName('lng')[0]?.textContent)
      }))
      console.log('[DEBUG] Parsed XML data:', parsedData)
      return parsedData
    },
    updateBusMarkers(busLocations) {
      console.log('[DEBUG] Updating bus markers on the map.')
      // Remove existing bus markers
      if (this.busMarkers) {
        this.busMarkers.forEach((marker) => marker.setMap(null))
      }
      this.busMarkers = []

      // Add new bus markers
      busLocations.forEach((bus) => {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(bus.lat, bus.lng),
          map: this.map,
          icon: {
            content: `<div class="bus-marker">${bus.plateNo}</div>`,
            size: new naver.maps.Size(30, 30),
            anchor: new naver.maps.Point(15, 15)
          }
        })
        this.busMarkers.push(marker)
      })
      console.log('[DEBUG] Bus markers updated:', this.busMarkers)
    },
    startRealTimeUpdates() {
      console.log('[DEBUG] Starting real-time updates.')
      // Update bus locations every 30 seconds
      this.updateInterval = setInterval(() => {
        this.fetchBusLocations()
      }, 30000)
    },
    stopRealTimeUpdates() {
      console.log('[DEBUG] Stopping real-time updates.')
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
      }
    }
  },
  async mounted() {
    try {
      console.log('[DEBUG] Component mounted. Initializing...')
      this.initMap()
      if (!this.map) {
        console.error('[DEBUG] Map initialization failed.')
        return
      }

      await this.fetchBusRouteInfo()
      this.startRealTimeUpdates()
    } catch (error) {
      console.error('[DEBUG] Error in mounted:', error)
    }
  },
  beforeDestroy() {
    console.log('[DEBUG] Component is being destroyed.')
    this.stopRealTimeUpdates()
  }
}
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.bus-location-page {
  width: 425px;
  max-width: 100%;
  margin: 0 auto;
  font-family: 'Pretendard', sans-serif;
  background-color: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  padding: 16px;
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
  stroke: #1e293b;
}

.app-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.content-wrapper {
  flex: 1;
  position: relative;
  overflow: visible;
}

.map-container {
  width: 100%;
  height: 60vh;
  position: relative;
}

.custom-zoom-control {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.zoom-button {
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  font-size: 24px;
  font-weight: bold;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.zoom-button:hover {
  background: #f1f5f9;
}

.info-section {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  background: transparent;
  z-index: 10;
}

.info-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin: 0 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.route-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.route-number {
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
  margin-right: 12px;
}

.route-type {
  font-size: 14px;
  color: #64748b;
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 12px;
}

.route-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 14px;
}

.detail-item svg {
  width: 16px;
  height: 16px;
  stroke: #64748b;
}

.direction-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin: 24px 0;
}

.direction-button {
  padding: 8px 24px;
  border: none;
  border-radius: 20px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.direction-button.active {
  background: #3b82f6;
  color: white;
}

.stops-list {
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 20px 40px;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1);
}

.stop-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
  position: relative;
}

.stop-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e2e8f0;
  margin-right: 20px;
  margin-top: 6px;
  position: relative;
}

.stop-marker.has-bus {
  background: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
}

.stop-marker::before {
  content: '';
  position: absolute;
  top: 16px;
  left: 50%;
  width: 2px;
  height: calc(100% + 16px);
  background: #e2e8f0;
  transform: translateX(-50%);
}

.stop-item:last-child .stop-marker::before {
  display: none;
}

.stop-content {
  flex: 1;
}

.stop-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.stop-details {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.stop-arsid {
  font-size: 12px;
  color: #64748b;
}

.nonstop-badge,
.central-lane-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.nonstop-badge {
  background-color: #fee2e2;
  color: #dc2626;
}

.central-lane-badge {
  background-color: #e0f2fe;
  color: #0284c7;
}

.bus-indicator {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

.bus-icon {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bus-icon svg {
  width: 24px;
  height: 24px;
  stroke: white;
}

.bus-info-bubble {
  background: #f0f9ff;
  padding: 10px 16px;
  border-radius: 12px;
  position: relative;
  font-size: 14px;
  color: #1e40af;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.bus-info-bubble::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  border-style: solid;
  border-width: 8px 8px 8px 0;
  border-color: transparent #f0f9ff transparent transparent;
}

.bus-number {
  font-weight: 700;
  margin-right: 12px;
}

.seats-info {
  background: #dbeafe;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.low-bus-text {
  font-size: 12px;
  color: #059669;
  font-weight: 600;
  margin-top: 4px;
}

.bus-marker {
  background-color: #3b82f6;
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}
</style>

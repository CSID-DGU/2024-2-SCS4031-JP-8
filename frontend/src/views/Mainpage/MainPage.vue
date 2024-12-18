<template>
  <div class="background">
    <div class="mobile-container">
      <header class="header">
        <div class="logo">
          <div class="logo-icon-container">
            <Bus class="logo-icon" />
          </div>
          <h1 class="logo-text">또타자</h1>
        </div>
      </header>
      <SearchFormComponent />
      <div class="map-container" ref="mapContainer">
        <div class="map-controls">
          <button class="map-button zoom-in" @click="zoomIn">
            <Plus />
          </button>
          <button class="map-button zoom-out" @click="zoomOut">
            <Minus />
          </button>
        </div>
        <button class="location-button" @click="getLocation">
          <Crosshair />
        </button>
      </div>

      <button
        class="search-button"
        :disabled="!canSearch"
        @click="searchRoutes"
      >
        길 찾기
      </button>

      <Footer />
    </div>
  </div>
</template>

<script>
import SearchFormComponent from '@/components/layout/SearchFormComponent.vue'
import { mapState, mapActions } from 'vuex'
//import SlidingMenu from '../../SlidingMenu.vueenu.vue'
import Footer from './Footer.vue'
import { Bus, Plus, Minus, Crosshair } from 'lucide-vue-next'

export default {
  components: {
    SearchFormComponent,
    Footer,
    Bus,
    Plus,
    Minus,
    Crosshair
  },
  data() {
    return {
      location: {
        latitude: 37.51347, // 기본 위치 (서울)
        longitude: 127.041722
      },
      map: null,
      showMenu: false
    }
  },
  computed: {
    ...mapState('departure', {
      departureName: (state) => state.departure?.name || '출발지를 입력하세요',
      departureCoordinates: (state) => state.departure?.coordinates || {}
    }),
    ...mapState('destination', {
      destinationName: (state) =>
        state.destination?.name || '도착지를 입력하세요',
      destinationCoordinates: (state) => state.destination?.coordinates || {}
    }),
    ...mapState('time', {
      month: (state) => state.month,
      day: (state) => state.day,
      hour: (state) => state.hour,
      minute: (state) => state.minute
    }),
    canSearch() {
      const validDeparture =
        this.departureName && this.departureName !== '출발지를 입력하세요'
      const validDestination =
        this.destinationName && this.destinationName !== '도착지를 입력하세요'

      // 시간 정보가 0일 경우도 true로 처리
      const validTime =
        this.month !== null &&
        this.day !== null &&
        this.hour !== null &&
        this.minute !== null

      console.log('[DEBUG] 출발지 설정 여부:', validDeparture)
      console.log('[DEBUG] 도착지 설정 여부:', validDestination)
      console.log('[DEBUG] 시간 설정 여부:', validTime)

      return validDeparture && validDestination && validTime
    }
  }, // Vuex 상태 변경 감지 watch
  watch: {
    '$store.state.departure.departure': {
      handler(newVal, oldVal) {
        console.log('[DEBUG] 출발지 변경 감지:')
        console.log('새 값:', newVal, '이전 값:', oldVal)
        console.log('canSearch 평가 결과:', this.canSearch)
      },
      deep: true
    },
    '$store.state.destination.destination': {
      handler(newVal, oldVal) {
        console.log('[DEBUG] 도착지 변경 감지:')
        console.log('새 값:', newVal, '이전 값:', oldVal)
        console.log('canSearch 평가 결과:', this.canSearch)
      },
      deep: true
    },
    '$store.state.time': {
      handler(newVal, oldVal) {
        console.log('[DEBUG] 시간 변경 감지:')
        console.log('새 값:', newVal, '이전 값:', oldVal)
        console.log('canSearch 평가 결과:', this.canSearch)
      },
      deep: true
    }
  },
  methods: {
    ...mapActions('departure', ['updateDeparture']),
    ...mapActions('destination', ['updateDestination']),
    ...mapActions('time', ['updateTime']),
    searchRoutes() {
      console.log('출발지 좌표:', this.departureCoordinates)
      console.log('도착지 좌표:', this.destinationCoordinates)

      const { x: startX, y: startY } = this.departureCoordinates
      const { x: endX, y: endY } = this.destinationCoordinates

      if (!startX || !startY || !endX || !endY) {
        console.error('출발지와 도착지의 x, y 좌표가 설정되지 않았습니다.')
        alert('출발지와 도착지의 위치를 먼저 설정해주세요.')
        return
      }

      this.$router.push({
        path: '/result',
        query: {
          startX,
          startY,
          endX,
          endY,
          month: this.$store.state.time.month,
          day: this.$store.state.time.day,
          hour: this.$store.state.time.hour,
          minute: this.$store.state.time.minute
        }
      })
    },
    getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          this.showPosition,
          this.showError
        )
      } else {
        alert('이 브라우저는 Geolocation을 지원하지 않습니다.')
        this.initMap() // Geolocation이 없을 때 기본 위치로 초기화
      }
    },
    showPosition(position) {
      this.location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
      this.initMap()
    },
    showError(error) {
      alert('위치를 불러오지 못했습니다. 기본 위치로 설정합니다.')
      this.initMap() // 오류 발생 시 기본 위치로 지도 초기화
    },
    initMap() {
      this.$nextTick(() => {
        const mapContainer = this.$refs.mapContainer

        if (mapContainer) {
          this.map = new naver.maps.Map(mapContainer, {
            center: new naver.maps.LatLng(
              this.location.latitude,
              this.location.longitude
            ),
            zoom: 16,
            zoomControl: false,
            scaleControl: false,
            logoControl: false,
            mapDataControl: false,
            minZoom: 6
          })

          // 위치에 마커 추가
          new naver.maps.Marker({
            position: new naver.maps.LatLng(
              this.location.latitude,
              this.location.longitude
            ),
            map: this.map,
            icon: '../../assets/Icons/Group 24.png' // 커스텀 마커 아이콘 경로
          })
        } else {
          console.error('지도 컨테이너를 찾을 수 없습니다.')
        }
      })
    },
    zoomIn() {
      if (this.map) {
        this.map.setZoom(this.map.getZoom() + 1)
      }
    },
    zoomOut() {
      if (this.map) {
        this.map.setZoom(this.map.getZoom() - 1)
      }
    }
  },
  createMarkerIcon(color) {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')

    ctx.beginPath()
    ctx.arc(16, 16, 12, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(16, 16, 4, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    return canvas.toDataURL()
  },
  mounted() {
    this.getLocation() // 컴포넌트가 마운트되면 위치 요청
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Gugi&display=swap');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.background {
  background-color: #ffffff;
  min-height: 100vh;
  width: 100%;
}

.mobile-container {
  width: 420px;
  margin: 0 auto;
  padding: 0;
  background-color: white;
  height: 100vh;
  overflow-y: auto;
  position: relative;
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #f0f9ff;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70px;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.logo {
  display: flex;
  align-items: center;
}

.logo-icon-container {
  background-color: #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.logo-icon {
  font-size: 24px;
  color: #ffffff;
}

.logo-text {
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
  font-family: 'Gugi', cursive;
}

.map-container {
  width: 100%;
  height: 350px;
  margin: 0 0 20px 0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
}

.map-button,
.location-button {
  width: 48px;
  height: 48px;
  background-color: #ffffff;
  color: #3b82f6;
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-button {
  margin-bottom: 12px;
}

.map-button:hover,
.location-button:hover {
  background-color: #f0f9ff;
  transform: scale(1.05);
}

.map-button:active,
.location-button:active {
  transform: scale(0.95);
}

.map-button svg,
.location-button svg {
  width: 24px;
  height: 24px;
  stroke-width: 2.5;
}

.location-button {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 100;
}

.search-button-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 1) 80%,
    rgba(255, 255, 255, 0) 100%
  );
  padding: 16px 16px 24px;
  display: flex;
  justify-content: center;
  z-index: 100;
}

.search-button {
  width: calc(100% - 32px);
  max-width: 390px;
  margin: 0 auto;
  padding: 14px;
  background-color: #3b82f6;
  color: white;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25),
    0 8px 16px rgba(59, 130, 246, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-button:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(59, 130, 246, 0.3),
    0 10px 20px rgba(59, 130, 246, 0.15);
}

.search-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.search-button:disabled {
  background-color: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

@media (max-width: 390px) {
  .header {
    padding: 12px;
  }

  .logo-icon-container {
    width: 36px;
    height: 36px;
  }

  .logo-icon {
    font-size: 20px;
  }

  .logo-text {
    font-size: 1.25rem;
  }

  .search-button {
    font-size: 16px;
    padding: 12px;
  }

  .search-button-container {
    padding: 12px 16px 20px;
  }

  .map-button,
  .location-button {
    width: 44px;
    height: 44px;
  }

  .map-button svg,
  .location-button svg {
    width: 22px;
    height: 22px;
  }
}
</style>

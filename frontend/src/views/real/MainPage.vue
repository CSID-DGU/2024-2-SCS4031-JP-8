<template>
  <div class="background">
    <div class="mobile-container">
      <header class="header">
        <img
          :src="require('@/assets/Icons/MainLogo.svg')"
          alt="Logo"
          style="margin-right: -170px"
        />

        <h1>만차 버스 길찾기</h1>
        <SlidingMenu />
      </header>
      <SearchFormComponent />
      <button
        class="search-button"
        :disabled="!canSearch"
        @click="searchRoutes"
        style="color: #625858"
      >
        길 찾기
      </button>

      <!-- 내 위치 다시 불러오기 버튼 -->
      <button class="location-button" @click="getLocation">
        내 위치 다시 불러오기
      </button>

      <!-- 네이버 지도 -->
      <div class="map-container" ref="mapContainer"></div>

      <!-- main-landing.png 이미지 -->
      <img
        src="@/assets/Icons/main-landing.png"
        alt="Landing Background"
        class="landing-image"
      />

      <Footer />
    </div>
  </div>
</template>

<script>
import SearchFormComponent from '@/components/layout/SearchFormComponent.vue'
import { mapState, mapActions } from 'vuex'
import SlidingMenu from '../SlidingMenu.vue'
import Footer from '../Footer.vue'
import MainLogo from '@/assets/Icons/MainLogo.svg'

export default {
  components: {
    SearchFormComponent,
    SlidingMenu,
    Footer
  },
  data() {
    return {
      location: {
        latitude: 37.51347, // 기본 위치 (서울)
        longitude: 127.041722
      }
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
      return (
        this.departureName !== '출발지를 입력하세요' &&
        this.destinationName !== '도착지를 입력하세요' &&
        this.month &&
        this.day &&
        this.hour &&
        this.minute
      )
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
          const map = new naver.maps.Map(mapContainer, {
            center: new naver.maps.LatLng(
              this.location.latitude,
              this.location.longitude
            ),
            zoom: 16,
            zoomControl: true, // 확대/축소 버튼 추가
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
            map: map,
            icon: '../../assets/Icons/Group 24.png' // 커스텀 마커 아이콘 경로
          })
        } else {
          console.error('지도 컨테이너를 찾을 수 없습니다.')
        }
      })
    }
  },
  mounted() {
    this.getLocation() // 컴포넌트가 마운트되면 위치 요청
  }
}
</script>

<style scoped>
.background {
  background-color: #ffffff;
  min-height: 100vh;
  width: 100%;
}

.mobile-container {
  width: 100%;
  max-width: 425px;
  margin: 0 auto;
  padding: 0;
  background-color: white;
  height: 100vh;
  overflow-y: auto;
  position: relative;
}

.header {
  background-color: #ff4d15;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.header h1 {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  text-transform: none;
  letter-spacing: normal;
}

.header img {
  height: 28px;
  margin-right: 0 !important;
}

.search-button {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 393px;
  padding: 16px;
  background-color: #ff4d15;
  color: white !important;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(255, 77, 21, 0.2);
  z-index: 100;
}

.search-button:disabled {
  background-color: #ffe5dd;
  color: rgba(255, 77, 21, 0.5) !important;
}

.location-button {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 393px;
  padding: 14px;
  background-color: #f5f6f7;
  color: #666666;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  z-index: 100;
}

.map-container {
  width: 100%;
  height: calc(100vh - 60px);
  margin: 0;
  border-radius: 0;
}

/* Hide the landing image as it's not present in the design */
.landing-image {
  display: none;
}

/* Ensure the map takes up the full height */
.map-container div {
  height: 100% !important;
}
</style>

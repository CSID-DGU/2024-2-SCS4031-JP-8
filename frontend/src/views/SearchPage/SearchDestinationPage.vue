<template>
  <div class="background">
    <div class="mobile-container">
      <header>
        <button class="back-button" @click="goBack">
          <ArrowLeft />
        </button>
        <h1>도착지 검색</h1>
      </header>
      <div class="input-group">
        <Search class="search-icon" />
        <input
          v-model="keyword"
          placeholder="도착지를 검색하세요"
          @keyup.enter="searchPlaces"
        />
        <button v-if="keyword" class="clear-button" @click="clearKeyword">
          <X />
        </button>
        <button v-if="keyword && showSearchButton" @click="searchPlaces">
          검색하기
        </button>
      </div>

      <!-- '내 위치' 버튼 -->
      <button @click="setCurrentLocation" class="location-button">
        <Crosshair /> 내 위치
      </button>

      <!-- 최근 검색 목록 -->
      <div
        v-if="recentSearches.length > 0 && !keyword.trim()"
        class="recent-searches"
      >
        <h3>최근 검색</h3>
        <ul>
          <li v-for="(search, index) in recentSearches" :key="index">
            <div class="search-info" @click="applyRecentSearch(search.query)">
              <span class="search-query">{{ search.query }}</span>
              <span class="search-details">
                {{ search.date }} {{ search.type === 'place' ? '(장소)' : '' }}
              </span>
            </div>
            <button
              @click.stop="removeRecentSearch(index)"
              class="remove-button"
            >
              <X />
            </button>
          </li>
        </ul>
      </div>

      <!-- 즐겨찾기 목록 -->
      <div v-if="favorites.length > 0" class="favorites">
        <h3>즐겨찾기</h3>
        <ul>
          <li v-for="(favorite, index) in favorites" :key="index">
            <div class="search-info" @click="applyRecentSearch(favorite.query)">
              <span class="search-query">{{ favorite.query }}</span>
              <span class="search-details">{{ favorite.date }}</span>
            </div>
            <button @click.stop="removeFavorite(index)" class="remove-button">
              <Star />
            </button>
          </li>
        </ul>
      </div>

      <!-- 장소명/정류장 선택 버튼 -->
      <div class="search-type-toggle">
        <button
          :class="{ active: searchType === 'place' }"
          @click="setSearchType('place')"
        >
          장소명
        </button>
        <button
          :class="{ active: searchType === 'station' }"
          @click="setSearchType('station')"
        >
          정류장
        </button>
      </div>

      <!-- 검색 결과 목록 -->
      <ul v-if="filteredPlaces.length > 0" class="place-list">
        <li
          v-for="(place, index) in filteredPlaces"
          :key="index"
          class="place-item"
          @click="selectPlace(place)"
        >
          <h3>{{ place.place_name }}</h3>
          <p>{{ place.address_name }}</p>
          <p>{{ place.category_name }}</p>
          <p>{{ place.phone || '정보 없음' }}</p>
          <div class="button-container">
            <button @click.stop="toggleMap(index, place)" class="map-button">
              <MapPin /> 지도
            </button>
            <button @click.stop="toggleFavorite(place)" class="favorite-button">
              <Star :fill="isFavorite(place) ? 'currentColor' : 'none'" />
              즐겨찾기
            </button>
          </div>

          <!-- 지도 표시 영역 -->
          <div
            v-if="mapVisibleIndex === index"
            class="mini-map"
            :ref="'map' + index"
          ></div>
        </li>
      </ul>
      <p v-else class="no-results">검색 결과가 없습니다.</p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { mapMutations } from 'vuex'
import { useRouter } from 'vue-router'
import { ArrowLeft, Search, X, Crosshair, MapPin, Star } from 'lucide-vue-next'

export default {
  components: {
    ArrowLeft,
    Search,
    X,
    Crosshair,
    MapPin,
    Star
  },
  setup() {
    const router = useRouter()

    return {
      router
    }
  },
  data() {
    return {
      keyword: '',
      places: [],
      stations: [],
      searchType: 'place',
      recentSearches: [],
      favorites: [],
      mapVisibleIndex: null,
      showSearchButton: true
    }
  },
  computed: {
    filteredPlaces() {
      return this.searchType === 'place' ? this.places : this.stations
    }
  },
  methods: {
    ...mapMutations('destination', ['setDestination']),
    setSearchType(type) {
      this.searchType = type
      console.log('searchType이 변경되었습니다:', this.searchType)
      this.searchPlaces()
    },
    searchPlaces() {
      if (!this.keyword.trim()) {
        alert('키워드를 입력해주세요!')
        return
      }

      this.showSearchButton = false
      this.addRecentSearch(this.keyword)
      console.log('현재 searchType:', this.searchType)

      if (this.searchType === 'place') {
        console.log('카카오 API 호출 시작')
        fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
            this.keyword
          )}`,
          {
            headers: {
              Authorization: `KakaoAK ${process.env.VUE_APP_KAKAO_REST_KEY}`
            }
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            return response.json()
          })
          .then((data) => {
            this.places = data.documents
            this.stations = []
            if (this.places.length > 0) {
              this.$nextTick(() => {
                this.toggleMap(0, this.places[0])
              })
            }
          })
          .catch((error) => {
            console.error('카카오 API 검색 중 오류가 발생했습니다.', error)
            alert('카카오 API 검색 중 오류가 발생했습니다. 다시 시도해주세요.')
          })
      } else if (this.searchType === 'station') {
        console.log('오디세이 API 호출 시작')
        fetch(
          `https://api.odsay.com/v1/api/searchStation?stationName=${encodeURIComponent(
            this.keyword
          )}&apiKey=${process.env.VUE_APP_ODSAY_API_KEY}`
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`ODsay API error! status: ${response.status}`)
            }
            return response.json()
          })
          .then((odsayData) => {
            console.log('ODsay API 응답:', odsayData)

            if (odsayData.result && Array.isArray(odsayData.result.station)) {
              this.stations = odsayData.result.station.map((station) => ({
                place_name: station.stationName,
                address_name: `${station.do} ${station.gu} ${station.dong}`,
                category_name: '대중교통 정류장',
                phone: '정보 없음',
                x: station.x,
                y: station.y
              }))
              this.places = []
              if (this.stations.length > 0) {
                this.$nextTick(() => {
                  this.toggleMap(0, this.stations[0])
                })
              }
            } else {
              console.warn('ODsay API 응답에서 station 데이터가 없습니다.')
            }
          })
          .catch((error) => {
            console.error('ODsay API 검색 중 오류가 발생했습니다.', error)
            alert('ODsay API 검색 중 오류가 발생했습니다. 다시 시도해주세요.')
          })
      }
    },
    clearKeyword() {
      this.keyword = ''
      this.places = []
      this.showSearchButton = true
    },
    addRecentSearch(query, type = 'search') {
      const date = new Date().toLocaleDateString('ko-KR', {
        month: 'numeric',
        day: 'numeric'
      })
      const newSearch = { query, date, type }

      const existingIndex = this.recentSearches.findIndex(
        (item) => item.query === query
      )
      if (existingIndex !== -1) {
        this.recentSearches.splice(existingIndex, 1)
      } else if (this.recentSearches.length >= 3) {
        this.recentSearches.pop()
      }
      this.recentSearches.unshift(newSearch)
      localStorage.setItem(
        'recentSearches',
        JSON.stringify(this.recentSearches)
      )
    },
    loadRecentSearches() {
      const storedSearches = localStorage.getItem('recentSearches')
      if (storedSearches) {
        this.recentSearches = JSON.parse(storedSearches)
      }
      const storedFavorites = localStorage.getItem('favorites')
      if (storedFavorites) {
        this.favorites = JSON.parse(storedFavorites)
      }
    },
    applyRecentSearch(query) {
      this.keyword = query
      this.searchPlaces()
    },
    removeRecentSearch(index) {
      this.recentSearches.splice(index, 1)
      localStorage.setItem(
        'recentSearches',
        JSON.stringify(this.recentSearches)
      )
    },
    toggleFavorite(place) {
      const favoriteIndex = this.favorites.findIndex(
        (fav) => fav.place_name === place.place_name
      )
      if (favoriteIndex === -1) {
        this.favorites.push({
          query: place.place_name,
          date: new Date().toLocaleDateString('ko-KR', {
            month: 'numeric',
            day: 'numeric'
          }),
          x: place.x,
          y: place.y
        })
      } else {
        this.favorites.splice(favoriteIndex, 1)
      }
      localStorage.setItem('favorites', JSON.stringify(this.favorites))
    },
    removeFavorite(index) {
      this.favorites.splice(index, 1)
      localStorage.setItem('favorites', JSON.stringify(this.favorites))
    },
    isFavorite(place) {
      return this.favorites.some((fav) => fav.query === place.place_name)
    },
    toggleMap(index, place) {
      if (this.mapVisibleIndex === index) {
        this.mapVisibleIndex = null
      } else {
        this.mapVisibleIndex = index
        this.$nextTick(() => {
          this.showMap(index, place.x, place.y)
        })
      }
    },
    showMap(index, x, y) {
      const mapContainer = this.$refs[`map${index}`][0]
      const map = new naver.maps.Map(mapContainer, {
        center: new naver.maps.LatLng(y, x),
        zoom: 15
      })

      new naver.maps.Marker({
        position: new naver.maps.LatLng(y, x),
        map: map
      })
    },
    selectPlace(place) {
      this.addRecentSearch(place.place_name, 'place')
      this.setDestination({
        name: place.place_name,
        coordinates: { x: place.x, y: place.y }
      })
      this.router.push('/')
    },
    setCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.setDestination({
              name: '내 위치',
              coordinates: {
                x: position.coords.longitude,
                y: position.coords.latitude
              }
            })
            this.router.push('/')
          },
          (error) => {
            alert('위치를 불러오지 못했습니다.')
          }
        )
      } else {
        alert('이 브라우저는 Geolocation을 지원하지 않습니다.')
      }
    },
    goBack() {
      this.router.go(-1)
    }
  },
  mounted() {
    this.loadRecentSearches()
  }
}
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

* {
  font-family: 'Pretendard', sans-serif;
}

.background {
  background-color: #ffffff;
  min-height: 100vh;
  width: 100%;
}

.mobile-container {
  width: 420px;
  margin: 0 auto;
  padding: 24px;
  background-color: white;
  height: 100vh;
  overflow-y: auto;
  position: relative;
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
}

header {
  background-color: #ffffff;
  padding: 16px 0;
  display: flex;
  align-items: center;
  height: 60px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.back-button {
  background: none;
  border: none;
  font-size: 20px;
  color: #1e293b;
  cursor: pointer;
  padding: 0 16px 0 0;
}

header h1 {
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
  text-align: right;
}

.input-group {
  position: relative;
  margin-bottom: 16px;
}

.input-group input {
  width: 100%;
  padding: 14px 16px 14px 40px;
  padding-right: 140px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.3s ease;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.input-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-group button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.input-group button:hover {
  background: #2563eb;
}

.clear-button {
  position: absolute;
  right: 100px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
}

.location-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 16px;
  background-color: #f1f5f9;
  color: #1e293b;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-button:hover {
  background-color: #e2e8f0;
}

.recent-searches,
.favorites {
  margin-bottom: 16px;
}

.recent-searches h3,
.favorites h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e293b;
}

.recent-searches ul,
.favorites ul {
  list-style: none;
  padding: 0;
}

.recent-searches li,
.favorites li {
  background-color: #f1f5f9;
  border-radius: 12px;
  padding: 8px 12px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
}

.recent-searches li:hover,
.favorites li:hover {
  background-color: #e2e8f0;
}

.search-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  cursor: pointer;
}

.search-query {
  font-weight: 500;
  margin-bottom: 4px;
}

.search-details {
  font-size: 12px;
  color: #64748b;
}

.remove-button {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  margin-left: 8px;
}

.search-type-toggle {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.search-type-toggle button {
  flex: 1;
  padding: 12px;
  border: none;
  cursor: pointer;
  background-color: #f1f5f9;
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.3s ease;
}

.search-type-toggle button:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.search-type-toggle button:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.search-type-toggle .active {
  background-color: #3b82f6;
  color: white;
}

.place-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.place-item {
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.place-item:hover {
  background-color: #f1f5f9;
}

.place-item h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #1e293b;
}

.place-item p {
  font-size: 14px;
  margin: 4px 0;
  color: #64748b;
}

.button-container {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.place-item button {
  flex: 1;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.place-item button:last-child {
  margin-right: 0;
}

.place-item button.map-button {
  background: #3b82f6;
}

.place-item button.map-button:hover {
  background: #2563eb;
}

.place-item button.favorite-button {
  background: #60a5fa;
}

.place-item button.favorite-button:hover {
  background: #3b82f6;
}

.no-results {
  text-align: center;
  font-size: 16px;
  color: #64748b;
  margin-top: 24px;
}

.mini-map {
  width: 100%;
  height: 200px;
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
}

@media (max-width: 420px) {
  .mobile-container {
    width: 100%;
    padding: 16px;
  }

  header {
    padding: 12px 0;
  }

  header h1 {
    font-size: 1.25rem;
  }

  .input-group input,
  .search-type-toggle button {
    font-size: 14px;
  }

  .place-item h3 {
    font-size: 16px;
  }

  .place-item p {
    font-size: 12px;
  }
}
</style>

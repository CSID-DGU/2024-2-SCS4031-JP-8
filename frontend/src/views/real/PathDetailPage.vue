<template>
  <div class="path-detail-page" v-if="departure && station && route">
    <!-- 지도 표시 -->
    <div id="map" style="width: 100%; height: 400px"></div>

    <!-- 상단에 출발지와 선택한 정류장 정보 표시 -->
    <div class="route-summary">
      <h2>길찾기 세부 정보</h2>
      <p>
        <strong>출발지:</strong> {{ departureName || '정보 없음' }} ({{
          departure.x
        }}, {{ departure.y }} )
      </p>
      <p>
        <strong>도착지 (정류장):</strong> {{ stationName || '정보 없음' }} ({{
          station.x
        }}, {{ station.y }} )
      </p>
      <p><strong>경로 소요 시간:</strong> {{ route.info.totalTime }}분</p>
      <p><strong>총 요금:</strong> {{ route.info.payment }}원</p>
    </div>

    <!-- 경로 세부 사항 -->
    <div class="route-details">
      <h3>경로 세부 단계</h3>
      <div
        v-for="(segment, index) in route.subPath"
        :key="index"
        class="segment"
      >
        <div v-if="segment.trafficType === 3">
          <p>도보 거리: {{ segment.distance }}미터</p>
        </div>
        <div v-else-if="segment.trafficType === 2">
          <p>버스 번호: {{ segment.lane[0].busNo }}</p>
          <p>출발지: {{ segment.startName }} → 도착지: {{ segment.endName }}</p>
          <p>정류장 수: {{ segment.stationCount }}</p>
        </div>
        <div v-else-if="segment.trafficType === 1">
          <p>지하철 노선: {{ segment.lane[0].name }}</p>
          <p>출발지: {{ segment.startName }} → 도착지: {{ segment.endName }}</p>
          <p>역 개수: {{ segment.stationCount }}</p>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <h3>세부 경로 정보를 불러올 수 없습니다.</h3>
    <p>출발지, 정류장 또는 경로 데이터가 없습니다.</p>
  </div>
</template>

<script>
import { nextTick } from 'vue'

export default {
  data() {
    return {
      departure: null,
      station: null,
      route: null
    }
  },
  computed: {
    departureName() {
      return this.departure?.name || '정보 없음'
    },
    stationName() {
      return this.station?.name || '정보 없음'
    }
  },
  methods: {
    initializeMap() {
      const sx = this.departure.x
      const sy = this.departure.y
      const ex = this.station.x
      const ey = this.station.y

      // 지도 초기화
      const centerPoint = new naver.maps.LatLng((sy + ey) / 2, (sx + ex) / 2)
      const mapOptions = {
        center: centerPoint,
        zoom: 10,
        zoomControl: true,
        zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT }
      }
      const map = new naver.maps.Map('map', mapOptions)

      // ODsay API로 경로 데이터 가져오기
      this.searchPubTransPath(map, sx, sy, ex, ey)
    },
    searchPubTransPath(map, sx, sy, ex, ey) {
      const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=dWY4QsIARSUXfD8U1ZdSig`
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          if (data.result?.path?.[0]?.info?.mapObj) {
            this.loadLane(map, data.result.path[0].info.mapObj, sx, sy, ex, ey)
          }
        })
        .catch((error) => console.error('경로 검색 중 오류:', error))
    },
    loadLane(map, mapObj, sx, sy, ex, ey) {
      const url = `https://api.odsay.com/v1/api/loadLane?mapObject=0:0@${mapObj}&apiKey=dWY4QsIARSUXfD8U1ZdSig`
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          this.drawMarkers(map, sx, sy, ex, ey)
          this.drawPolyLines(map, data)
        })
        .catch((error) => console.error('경로 데이터 로드 중 오류:', error))
    },
    drawMarkers(map, sx, sy, ex, ey) {
      // 출발지 마커
      new naver.maps.Marker({
        position: new naver.maps.LatLng(sy, sx),
        map: map
      })

      // 도착지 마커
      new naver.maps.Marker({
        position: new naver.maps.LatLng(ey, ex),
        map: map
      })
    },
    drawPolyLines(map, data) {
      data.result.lane.forEach((lane) => {
        lane.section.forEach((section) => {
          const lineArray = section.graphPos.map(
            (pos) => new naver.maps.LatLng(pos.y, pos.x)
          )
          const color =
            lane.type === 1
              ? '#3a54fc'
              : lane.type === 2
              ? '#42c700'
              : '#000000'
          new naver.maps.Polyline({
            map: map,
            path: lineArray,
            strokeWeight: 7,
            strokeColor: color
          })
        })
      })
    }
  },
  mounted() {
    // 세션 스토리지에서 데이터 가져오기
    this.departure = JSON.parse(sessionStorage.getItem('departure'))
    this.station = JSON.parse(sessionStorage.getItem('station'))
    this.route = JSON.parse(sessionStorage.getItem('route'))

    if (this.departure && this.station && this.route) {
      nextTick(() => {
        this.initializeMap()
      })
    } else {
      console.error('필수 데이터가 없습니다.')
    }
  }
}
</script>

<style scoped>
.path-detail-page {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.route-summary {
  margin-bottom: 20px;
  border-bottom: 2px solid #ddd;
  padding-bottom: 15px;
}

.route-details {
  margin-top: 20px;
}

.segment {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>

<template>
  <div class="path-detail-page" v-if="departure && station && route">
    <div class="route-summary">
      <h2>길찾기 세부 정보</h2>
      <p>
        <strong>출발지:</strong> {{ departure.name || '정보 없음' }} ({{
          departure.x
        }}, {{ departure.y }})
      </p>
      <p>
        <strong>도착지 (정류장):</strong> {{ station.name || '정보 없음' }} ({{
          station.x
        }}, {{ station.y }})
      </p>
      <p><strong>경로 소요 시간:</strong> {{ route.info.totalTime }}분</p>
      <p><strong>총 요금:</strong> {{ route.info.payment }}원</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      departure: null,
      station: null,
      route: null
    }
  },
  mounted() {
    // 세션스토리지에서 데이터 불러오기
    this.departure = JSON.parse(sessionStorage.getItem('departure'))
    this.station = JSON.parse(sessionStorage.getItem('station'))
    this.route = JSON.parse(sessionStorage.getItem('route'))

    if (!this.departure || !this.station || !this.route) {
      console.error('세션스토리지에서 데이터를 불러올 수 없습니다.')
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

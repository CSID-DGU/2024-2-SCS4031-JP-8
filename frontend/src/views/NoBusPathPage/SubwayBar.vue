<template>
  <div
    class="subway-bar"
    :style="{ backgroundColor: getSubwayColor(subwayLineType) }"
  >
    <div class="subway-label">{{ subwayName }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  subwayLineType: Number, // API에서 제공하는 노선 타입
  subwayName: String // 노선 이름
})

// 지하철 노선 타입에 따른 색상표
const subwayColors = {
  1: '#0052A4', // 수도권 1호선
  2: '#00A84D', // 수도권 2호선
  3: '#EF7C1C', // 수도권 3호선
  4: '#00A5DE', // 수도권 4호선
  5: '#996CAC', // 수도권 5호선
  6: '#CD7C2F', // 수도권 6호선
  7: '#747F00', // 수도권 7호선
  8: '#E6186C', // 수도권 8호선
  9: '#BDB092', // 수도권 9호선
  91: '#9A6292', // GTX-A
  104: '#77C4A3', // 경의중앙선
  108: '#0C8E72', // 경춘선
  109: '#D4003B', // 신분당선
  110: '#22246F', // 의정부경전철
  112: '#003DA5', // 경강선
  116: '#F5A200', // 수인분당선
  115: '#AD8605', // 김포골드라인
  101: '#0090D2', // 공항철도
  102: '#FFCD12', // 자기부상철도
  113: '#B7C452', // 우이신설선
  114: '#81A914', // 서해선
  117: '#6789CA', // 신림선
  21: '#7CA8D5', // 인천 1호선
  22: '#ED8B00', // 인천 2호선
  31: '#007448', // 대전 1호선
  41: '#D93F5C', // 대구 1호선
  42: '#00AA80', // 대구 2호선
  43: '#FFB100', // 대구 3호선
  51: '#009088', // 광주 1호선
  71: '#F06A00', // 부산 1호선
  72: '#81BF48', // 부산 2호선
  73: '#BB8C00', // 부산 3호선
  74: '#217DCB', // 부산 4호선
  78: '#0C8E72', // 동해선
  79: '#8652A1', // 부산-김해경전철
  107: '#7CA8D5' // 에버라인
}

// 노선 타입에 따른 색상을 반환
const getSubwayColor = (subwayLineType) => {
  return subwayColors[subwayLineType] || '#CCCCCC' // 기본값은 회색
}
</script>

<style scoped>
.subway-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  color: white;
  border-radius: 5px;
  margin: 10px 0;
}

.subway-label {
  font-size: 14px;
  padding: 5px;
}
</style>

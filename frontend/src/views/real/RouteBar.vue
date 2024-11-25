<template>
  <div class="route-bar">
    <!-- 각 구간에 맞는 색상 및 레이블 출력 -->
    <div
      v-for="(segment, index) in route.subPath"
      :key="index"
      class="segment-bar"
      :style="{
        width: calculateBarWidth(segment) + '%',
        backgroundColor: getSegmentColor(segment)
      }"
    >
      <div class="segment-label">
        {{ getSegmentLabel(segment) }}: {{ segmentSectionTime(segment) }}분
      </div>
    </div>
  </div>
</template>

<script setup>
import { getBusRouteColor, getSubwayColor } from './TransportationColor.js'

const props = defineProps({
  route: Object
})

// 각 구간의 소요 시간을 %로 환산하여 막대 너비 결정
const calculateBarWidth = (segment) => {
  const totalTime = props.route.info?.totalTime || 1 // 방어 코드로 기본값 설정
  const segmentTime = segmentSectionTime(segment)
  return (segmentTime / totalTime) * 100
}

// 구간에 따른 색상 반환
const getSegmentColor = (segment) => {
  console.log('Segment:', segment) // segment 데이터 구조 확인

  if (segment.trafficType === 1) {
    // 지하철 구간 색상
    const subwayCode = segment?.lane?.[0]?.subwayCode
    console.log('Subway Code:', subwayCode) // subwayCode 확인

    return getSubwayColor(subwayCode) || '#CCCCCC' // 기본값 설정
  }
  if (segment.trafficType === 2) {
    // 버스 구간 색상
    const busRouteType = segment?.lane?.[0]?.type
    const busNo = segment?.lane?.[0]?.busNo // 버스 번호도 사용
    console.log('Bus Route Type:', busRouteType, 'Bus No:', busNo)

    // 버스 타입에 맞는 색상 반환
    return getBusRouteColor(busRouteType) || '#CCCCCC' // 기본값 설정
  }
  if (segment.trafficType === 3) return '#B0B0B0' // 도보 구간 색상
  return '#CCCCCC' // 기본값
}

// 구간에 따른 레이블 설정
const getSegmentLabel = (segment) => {
  if (segment.trafficType === 3) return '도보'
  if (segment.trafficType === 2) {
    const busNo = segment?.lane?.[0]?.busNo
    return busNo ? `버스 ${busNo}` : '버스'
  }
  if (segment.trafficType === 1) {
    const subwayName = segment?.lane?.[0]?.name
    return subwayName ? `${subwayName}` : '지하철'
  }
  return '기타'
}

// 구간의 소요 시간
const segmentSectionTime = (segment) => {
  return segment.sectionTime || 0
}
</script>

<style scoped>
.route-bar {
  display: flex;
  height: 30px;
  margin: 20px 0;
  border-radius: 15px;
  overflow: hidden;
}

.segment-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  padding: 5px;
  height: 100%;
}
</style>

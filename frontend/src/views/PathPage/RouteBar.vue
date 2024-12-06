<template>
  <div class="route-bar-container">
    <div class="route-bar">
      <div class="segment-divider start-divider"></div>
      <div
        v-for="(segment, index) in route.subPath"
        :key="index"
        class="segment-bar"
        :style="{
          width: calculateAdjustedBarWidth(segment) + '%',
          backgroundColor: getSegmentColor(segment)
        }"
        v-show="segmentSectionTime(segment) > 0"
      >
        <div
          v-if="shouldShowDivider(index, segment)"
          class="segment-divider"
          :style="{ backgroundColor: getSegmentColor(segment) }"
        ></div>
        <span v-if="segmentSectionTime(segment) > 0" class="segment-time">
          {{ segmentSectionTime(segment) }}분
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  getBusRouteColor,
  getSubwayColor
} from '../../utils/TransportationColor.js'

const props = defineProps({
  route: Object
})

const calculateBarWidth = (segment) => {
  const totalTime = props.route.info?.totalTime || 1
  const segmentTime = segmentSectionTime(segment)
  return (segmentTime / totalTime) * 100
}

const calculateAdjustedBarWidth = (segment) => {
  const rawWidth = calculateBarWidth(segment)
  return Math.max(rawWidth, 10) // 최소 10%의 너비 보장
}

const getSegmentColor = (segment) => {
  if (segment.trafficType === 1) {
    const subwayCode = segment?.lane?.[0]?.subwayCode
    return getSubwayColor(subwayCode) || '#CCCCCC'
  }
  if (segment.trafficType === 2) {
    const busRouteType = segment?.lane?.[0]?.type
    return getBusRouteColor(busRouteType) || '#CCCCCC'
  }
  if (segment.trafficType === 3) return '#B0B0B0'
  return '#CCCCCC'
}

const segmentSectionTime = (segment) => {
  return segment.sectionTime || 0
}

const shouldShowDivider = (index, segment) => {
  if (index === 0) return false // Don't show divider for the first segment
  if (segment.trafficType === 3) return false // Don't show divider for walking segments
  if (segmentSectionTime(segment) === 0) return false // Don't show divider for 0-minute segments
  return true
}
</script>

<style scoped>
.route-bar-container {
  margin: 20px 0;
  padding: 10px 0;
  width: 100%; /* 90%에서 100%로 변경 */
  max-width: 500px; /* 400px에서 500px로 변경 */
  margin-left: auto;
  margin-right: auto;
}

.route-bar {
  display: flex;
  height: 20px; /* 28px에서 20px로 줄임 */
  border-radius: 10px; /* 14px에서 10px로 줄임 */
  overflow: visible;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.segment-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  height: 100%;
  position: relative;
}

.segment-time {
  z-index: 2;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  font-size: 10px; /* 12px에서 10px로 변경 */
  padding: 0 2px; /* 좌우 패딩 추가 */
}

.segment-divider {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 24px; /* 32px에서 24px로 줄임 */
  height: 24px; /* 32px에서 24px로 줄임 */
  border-radius: 50%;
  z-index: 1;
  left: -12px; /* -16px에서 -12px로 조정 */
}

.start-divider {
  left: -12px; /* -16px에서 -12px로 조정 */
  background-color: #b0b0b0;
}

.segment-bar:first-child {
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.segment-bar:last-child {
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

@media (max-width: 768px) {
  .route-bar {
    height: 16px; /* 24px에서 16px로 줄임 */
  }

  .segment-time {
    font-size: 9px; /* 10px에서 9px로 변경 */
  }

  .segment-divider {
    width: 20px; /* 28px에서 20px로 줄임 */
    height: 20px; /* 28px에서 20px로 줄임 */
    left: -10px; /* -14px에서 -10px로 조정 */
  }
}
</style>

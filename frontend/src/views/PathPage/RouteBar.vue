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
  if (index === 0) return false
  if (segment.trafficType === 3) return false
  if (segmentSectionTime(segment) === 0) return false
  return true
}
</script>

<style scoped>
.route-bar-container {
  margin: 20px 0;
  padding: 10px 0;
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.route-bar {
  display: flex;
  height: 20px;
  border-radius: 10px;
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
  font-size: 10px;
  padding: 0 2px;
}

.segment-divider {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  z-index: 1;
  left: -12px;
}

.start-divider {
  left: -12px;
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
    height: 16px;
  }

  .segment-time {
    font-size: 9px;
  }

  .segment-divider {
    width: 20px;
    height: 20px;
    left: -10px;
  }
}
</style>

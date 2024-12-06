<template>
  <div class="route-bar-container">
    <div class="route-bar">
      <div
        v-for="(segment, index) in route.subPath"
        :key="index"
        class="segment-bar"
        :style="{
          width: calculateBarWidth(segment) + '%',
          backgroundColor: getSegmentColor(segment)
        }"
      >
        <div class="segment-label-container">
          <div class="segment-label">
            {{ getSegmentLabel(segment) }}
          </div>
          <div class="segment-time">{{ segmentSectionTime(segment) }}분</div>
        </div>
      </div>
    </div>
    <div class="segment-details">
      <div
        v-for="(segment, index) in route.subPath"
        :key="index"
        class="segment-detail"
        :style="{ color: getSegmentColor(segment) }"
      >
        <div class="segment-icon">
          {{ getSegmentIcon(segment) }}
        </div>
        <div class="segment-info">
          <div class="segment-label">{{ getSegmentLabel(segment) }}</div>
          <div class="segment-time">{{ segmentSectionTime(segment) }}분</div>
        </div>
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

const getSegmentIcon = (segment) => {
  if (segment.trafficType === 3) return '🚶'
  if (segment.trafficType === 2) return '🚌'
  if (segment.trafficType === 1) return '🚇'
  return '🔄'
}

const segmentSectionTime = (segment) => {
  return segment.sectionTime || 0
}
</script>

<style scoped>
.route-bar-container {
  margin: 10px 0;
}

.route-bar {
  display: flex;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.segment-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  padding: 2px;
  height: 100%;
  transition: all 0.3s ease;
}

.segment-bar:hover {
  transform: scaleY(1.1);
}

.segment-label-container {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
}

.segment-bar:hover .segment-label-container {
  display: flex;
}

.segment-label {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.segment-time {
  font-size: 8px;
}

.segment-details {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}

.segment-detail {
  display: flex;
  align-items: center;
  padding: 2px 5px;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.segment-detail:hover {
  transform: translateY(-1px);
}

.segment-icon {
  font-size: 14px;
  margin-right: 3px;
}

.segment-info {
  display: flex;
  flex-direction: column;
}

.segment-info .segment-label {
  font-size: 10px;
  font-weight: bold;
}

.segment-info .segment-time {
  font-size: 8px;
}
</style>

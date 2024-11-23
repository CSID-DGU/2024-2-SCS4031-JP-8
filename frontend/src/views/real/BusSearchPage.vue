<template>
  <div class="result-page">
    <div class="header">
      <h2>대중교통 경로 검색 결과</h2>
      <p>출발지: {{ fromLocation }}</p>
      <p>도착지: {{ toLocation }}</p>
    </div>
    <h3>길찾기 구간 중 <br />현재 제공하는 <br />광역버스 노선이에요.</h3>
    <div v-if="providedRouteExists" class="route-info">
      <ul>
        <li
          v-for="route in filteredRoutes"
          :key="`${route.busNo}-${route.stationID}-${route.directionText}`"
          @click="selectBusRoute(route)"
        >
          버스 번호: {{ route.busNo }} ({{ route.directionText }})
        </li>
      </ul>
    </div>
    <div v-if="loading" class="loading-spinner">로딩 중...</div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import apiConfig from '@/utils/API/apiConfig'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const store = useStore()
    const router = useRouter()

    const fromLocation = store.state.departure.departure.name
    const toLocation = store.state.destination.destination.name
    const loading = ref(false)
    const providedRouteExists = ref(false)
    const filteredRoutes = ref([])

    const directionText = (direction) => (direction === 'up' ? '상행' : '하행')

    const checkTimeRange = (busNo) => {
      const { hour, minute } = store.getters['time/getTime']
      const parsedHour = parseInt(hour, 10)
      const parsedMinute = parseInt(minute, 10)
      const currentTime = parsedHour * 60 + parsedMinute

      console.log(
        `현재 시간: ${parsedHour}시 ${parsedMinute}분 (분 단위: ${currentTime})`
      )

      if (busNo === '5000' || busNo === '1112' || busNo === '6001') {
        return true
      } else if (busNo === '5000A') {
        return currentTime >= 300 && currentTime < 900
      } else if (busNo === '5000B') {
        return (
          (currentTime >= 725 && currentTime < 1440) ||
          (currentTime >= 0 && currentTime < 180)
        )
      }
      return false
    }

    const searchTransitRoutes = async () => {
      loading.value = true
      try {
        const startX = store.state.departure.departure.coordinates?.x
        const startY = store.state.departure.departure.coordinates?.y
        const endX = store.state.destination.destination.coordinates?.x
        const endY = store.state.destination.destination.coordinates?.y

        if (!startX || !startY || !endX || !endY) {
          alert('출발지와 도착지의 위치를 먼저 설정해주세요.')
          return
        }

        console.log('API 호출 시작:', { startX, startY, endX, endY })
        const response = await axios.get(
          'https://api.odsay.com/v1/api/searchPubTransPathT',
          {
            params: {
              SX: startX,
              SY: startY,
              EX: endX,
              EY: endY,
              apiKey: apiConfig.odsayApiKey
            }
          }
        )

        const paths = response.data.result.path || []
        const routeOptions = ['5000', '5000A', '5000B', '1112', '6001']
        const allRoutes = []

        for (const route of paths) {
          for (const segment of route.subPath) {
            if (segment.trafficType === 2) {
              for (const lane of segment.lane) {
                const busNo = lane.busNo
                //console.log(`버스 번호 확인 중: ${busNo}`)

                if (routeOptions.includes(busNo) && checkTimeRange(busNo)) {
                  console.log(`조건에 맞는 버스 번호 - ${busNo}`)
                  try {
                    const stationDetailResponse = await axios.get(
                      'https://api.odsay.com/v1/api/busLaneDetail',
                      {
                        params: {
                          busID: lane.busID,
                          apiKey: apiConfig.odsayApiKey
                        }
                      }
                    )

                    const stations =
                      stationDetailResponse.data.result.station || []
                    const targetStation = stations.find(
                      (station) => station.stationID === segment.startID
                    )
                    const direction =
                      targetStation?.stationDirection === 2 ? 'up' : 'down'
                    console.log(
                      `상행/하행 판별: ${busNo}, 방향: ${direction}, 정류장 이름: ${segment.startName}`
                    )

                    allRoutes.push({
                      busNo: busNo,
                      directionText: directionText(direction),
                      stationID: segment.startID,
                      stationName: segment.startName,
                      firstStation: {
                        name: stations[0]?.stationName, // 첫 번째 정류장 이름
                        id: stations[0]?.stationID, // 첫 번째 정류장 ID
                        direction: directionText(
                          stations[0]?.stationDirection === 2 ? 'up' : 'down'
                        ) // 첫 번째 정류장 방향
                      }
                    })
                  } catch (error) {
                    console.error(`busLaneDetail API 호출 오류 발생: ${error}`)
                  }
                } else {
                  // console.log(`시간 조건에 맞지 않음 - ${busNo}`)
                }
              }
            }
          }
        }

        const uniqueRoutes = allRoutes.reduce((acc, current) => {
          const duplicate = acc.find(
            (route) =>
              route.busNo === current.busNo &&
              route.directionText === current.directionText
          )
          if (!duplicate) {
            acc.push(current)
          }
          return acc
        }, [])

        filteredRoutes.value = uniqueRoutes
        providedRouteExists.value = uniqueRoutes.length > 0
        console.log(
          '조건에 맞는 모든 노선 (중복 제거 후):',
          filteredRoutes.value
        )
      } catch (error) {
        console.error('API 호출 중 오류 발생:', error)
      } finally {
        loading.value = false
      }
    }

    const selectBusRoute = (route) => {
      console.log('다음 페이지로 전달되는 정보:', {
        busNo: route.busNo,
        direction: route.directionText,
        stationID: route.stationID,
        stationName: route.stationName,
        fromLocation,
        toLocation,
        startX: store.state.departure.departure.coordinates?.x,
        startY: store.state.departure.departure.coordinates?.y,
        endX: store.state.destination.destination.coordinates?.x,
        endY: store.state.destination.destination.coordinates?.y,
        month: store.state.time.month,
        day: store.state.time.day,
        hour: store.state.time.hour,
        minute: store.state.time.minute,
        firstStationName: route.firstStation.name, // ******** 첫 번째 정류장 이름
        firstStationID: route.firstStation.id, // ******** 첫 번째 정류장 ID
        firstStationDirection: route.firstStation.direction // ******** 첫 번째 정류장 방향
      })

      router.push({
        path: '/final',
        query: {
          busNo: route.busNo,
          direction: route.directionText,
          stationID: route.stationID,
          stationName: route.stationName,
          fromLocation,
          toLocation,
          startX: store.state.departure.departure.coordinates?.x,
          startY: store.state.departure.departure.coordinates?.y,
          endX: store.state.destination.destination.coordinates?.x,
          endY: store.state.destination.destination.coordinates?.y,
          month: store.state.time.month,
          day: store.state.time.day,
          hour: store.state.time.hour,
          minute: store.state.time.minute,
          firstStationName: route.firstStation.name, // ******** 첫 번째 정류장 이름
          firstStationID: route.firstStation.id, // ******** 첫 번째 정류장 ID
          firstStationDirection: route.firstStation.direction // ******** 첫 번째 정류장 방향
        }
      })
    }

    onMounted(() => {
      searchTransitRoutes()
    })

    return {
      fromLocation,
      toLocation,
      loading,
      providedRouteExists,
      filteredRoutes,
      selectBusRoute
    }
  }
}
</script>

<style scoped>
* {
  font-family: 'Pretendard', sans-serif;
}

.background {
  background-color: #eaeaea;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.result-page {
  min-width: 425px;

  margin: 0 auto;
  padding: 25px;
  background-color: white;
  overflow-y: auto;
  height: 100vh;
}

.header {
  padding-bottom: 20px;
}

.header h2 {
  font-size: 18px;
  margin: 0 0 5px;
}

.header p {
  font-size: 14px;
  margin: 0;
  color: #666;
}

h3 {
  font-size: 18px;
  margin-bottom: 15px;
}

.route-info {
  display: flex;
  flex-direction: column;
}

.route-info ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.route-info li {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 18px;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  cursor: pointer;
}

.route-info li::after {
  content: '→';
  font-size: 18px;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  font-size: 16px;
  color: #666;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

.loading-spinner::after {
  content: '...';
  animation: pulse 1.5s infinite;
  margin-left: 4px;
}

footer {
  text-align: center;
  padding-top: 20px;
  font-size: 14px;
  color: #666;
}
</style>

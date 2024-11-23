import axios from 'axios'
import { busRouteData } from './busData'

/**
 * 경기도 공공데이터포털 버스 도착 정보 API 호출 함수
 * @param {string} stationId - 정류소 ID (localStationID)
 * @param {string} busNo - 노선 번호
 * @returns {Object} 실시간 버스 도착 정보 (첫 번째/두 번째 버스)
 */
export async function fetchBusArrivalInfo(stationId, busNo) {
  const serviceKey =
    'EVTsGjdsoUlBtJTpdh/itgFJXzeeNK/BP4lN8my+i9AaoLGNln1kqRcyVP7CVRY8GsiXkX+OMl2HviEvq6hlfQ=='

  const routeId = busRouteData[busNo]?.routeId

  if (!routeId) {
    console.error(`[ERROR] routeId를 찾을 수 없습니다. 노선 번호: ${busNo}`)
    return {
      firstBus: { locationNo: -1, predictTime: -1, remainSeats: -1 },
      secondBus: { locationNo: -1, predictTime: -1, remainSeats: -1 }
    }
  }

  try {
    const response = await axios.get(
      'http://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalItem',
      {
        params: {
          serviceKey,
          stationId,
          routeId
        }
      }
    )

    console.log('[DEBUG] 원본 API 응답:', response.data)

    // DOMParser를 이용한 XML 파싱
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(response.data, 'text/xml')

    // 데이터 파싱
    const busArrivalItem = xmlDoc.querySelector('busArrivalItem')
    if (!busArrivalItem) {
      throw new Error('도착 정보가 없습니다.')
    }

    const arrivalInfo = {
      firstBus: {
        locationNo:
          parseInt(
            busArrivalItem.querySelector('locationNo1')?.textContent,
            10
          ) || -1,
        predictTime:
          parseInt(
            busArrivalItem.querySelector('predictTime1')?.textContent,
            10
          ) || -1,
        lowPlate:
          parseInt(
            busArrivalItem.querySelector('lowPlate1')?.textContent,
            10
          ) || 0,
        plateNo: busArrivalItem.querySelector('plateNo1')?.textContent || '',
        remainSeats:
          parseInt(
            busArrivalItem.querySelector('remainSeatCnt1')?.textContent,
            10
          ) || -1
      },
      secondBus: {
        locationNo:
          parseInt(
            busArrivalItem.querySelector('locationNo2')?.textContent,
            10
          ) || -1,
        predictTime:
          parseInt(
            busArrivalItem.querySelector('predictTime2')?.textContent,
            10
          ) || -1,
        lowPlate:
          parseInt(
            busArrivalItem.querySelector('lowPlate2')?.textContent,
            10
          ) || 0,
        plateNo: busArrivalItem.querySelector('plateNo2')?.textContent || '',
        remainSeats:
          parseInt(
            busArrivalItem.querySelector('remainSeatCnt2')?.textContent,
            10
          ) || -1
      }
    }

    console.log('[INFO] 정류소 도착 정보:', arrivalInfo)

    return arrivalInfo
  } catch (error) {
    console.error('[ERROR] API 호출 실패:', error)
    return {
      firstBus: { locationNo: -1, predictTime: -1, remainSeats: -1 },
      secondBus: { locationNo: -1, predictTime: -1, remainSeats: -1 }
    }
  }
}

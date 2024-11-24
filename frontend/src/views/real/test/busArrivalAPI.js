import axios from 'axios'
import { busRouteData, busStartStations } from './busData'
import Papa from 'papaparse'

/**
 * CSV 파일에서 정류장별 평균 재차 인원 가져오기
 * @param {string} filePath - CSV 파일 경로
 * @param {string} stationName - 정류장명
 * @param {string} timeSlot - 시간대 (예: '17시')
 * @returns {number} 평균 재차 인원 (정류장 데이터가 없으면 0 반환)
 */
async function fetchAverageReboarding(filePath, stationName, timeSlot) {
  try {
    console.log(`[INFO] CSV 로드 시도: ${filePath}`)
    const response = await fetch(filePath)
    const csvText = await response.text()

    console.log('[DEBUG] CSV 파일 내용:', csvText.slice(0, 500)) // 500자만 출력

    const parsedData = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    }).data

    console.log('[DEBUG] CSV 파싱 결과:', parsedData)

    const stationData = parsedData.find(
      (row) => row['정류장명'] === stationName
    )

    const avgReboarding =
      stationData && stationData[timeSlot]
        ? parseFloat(stationData[timeSlot]) || 0
        : 0

    console.log(
      `[INFO] ${stationName}의 ${timeSlot} 평균 재차 인원: ${avgReboarding}`
    )

    return avgReboarding
  } catch (error) {
    console.error('[ERROR] CSV 로드 실패:', error)
    return 0 // 실패 시 0 반환
  }
}

/**
 * 경기도 공공데이터포털 버스 도착 정보 API 호출 함수
 * @param {string} stationId - 정류소 ID (localStationID)
 * @param {string} busNo - 노선 번호
 * @param {Object} timeInfo - 시간 정보 객체 (월, 일, 시, 분)
 * @returns {Object} 실시간 버스 도착 정보 또는 계산된 대체 데이터
 */
export async function fetchBusArrivalInfo(stationId, busNo, timeInfo) {
  console.log('[INFO] Vuex에서 전달받은 데이터:', {
    stationId,
    busNo,
    timeInfo
  })

  const serviceKey =
    'EVTsGjdsoUlBtJTpdh/itgFJXzeeNK/BP4lN8my+i9AaoLGNln1kqRcyVP7CVRY8GsiXkX+OMl2HviEvq6hlfQ=='

  const routeId = busRouteData[busNo]?.routeId
  const folderPath = busRouteData[busNo]?.folderPath
  const startStations = busStartStations[busNo]

  console.log('[DEBUG] routeId:', routeId)
  console.log('[DEBUG] folderPath:', folderPath)
  console.log('[DEBUG] startStations:', startStations)

  if (!routeId || !folderPath || !startStations) {
    console.error(`[ERROR] 노선 데이터가 불완전합니다. 노선 번호: ${busNo}`)
    return {
      firstBus: { locationNo: -1, predictTime: -1, remainSeats: -1 },
      secondBus: { locationNo: -1, predictTime: -1, remainSeats: -1 }
    }
  }

  try {
    // 1. API 호출
    console.log('[INFO] 실시간 도착 정보 API 호출 중...')
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

    // 2. DOMParser를 이용한 XML 파싱
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
  } catch (apiError) {
    console.warn(
      '[WARN] 실시간 API 호출 실패, 대체 데이터 계산 시작:',
      apiError
    )

    // 3. 실시간 데이터가 없을 경우 대체 데이터 계산
    console.log('[INFO] 대체 데이터 계산 시작...')
    const timeSlot = `${timeInfo.hour}시`
    const dayType = timeInfo.dayType || 'weekday' // Vuex에서 전달된 요일 정보 사용
    const filePath = `${folderPath}${busNo}_${dayType}.csv`

    console.log('[INFO] CSV 경로:', filePath)
    console.log('[INFO] 대상 정류장명:', stationId)
    console.log('[INFO] 시간대:', timeSlot)

    const avgReboarding = await fetchAverageReboarding(
      filePath,
      stationId,
      timeSlot
    )

    // 배차 대수 (디폴트: 6)
    const dispatchCount = busRouteData[busNo]?.dispatchCount || 6

    const remainSeats = Math.max(0, (60 - avgReboarding) / dispatchCount)

    console.log('[INFO] 대체 여석 계산 결과:', {
      remainSeats,
      avgReboarding,
      dispatchCount
    })

    return {
      firstBus: {
        locationNo: -1,
        predictTime: -1,
        remainSeats
      },
      secondBus: {
        locationNo: -1,
        predictTime: -1,
        remainSeats: -1
      }
    }
  }
}

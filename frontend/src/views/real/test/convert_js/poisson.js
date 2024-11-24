import axios from 'axios'
import { busRouteData, busStartStations } from './busData'
import Papa from 'papaparse'

/**
 * 요일 계산 함수
 * @param {number} month - 월
 * @param {number} day - 일
 * @returns {string} 'weekday', 'saturday', 'sunday'
 */
function getDayType(month, day) {
  const date = new Date(2024, month - 1, day) // JavaScript의 month는 0부터 시작
  const dayOfWeek = date.getDay() // 0: 일요일, 6: 토요일
  if (dayOfWeek === 0) return 'sunday'
  if (dayOfWeek === 6) return 'saturday'
  return 'weekday'
}

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
 * @param {string} stationName - 정류장명
 * @param {string} busNo - 노선 번호
 * @param {Object} timeInfo - 시간 정보 객체 (월, 일, 시, 분)
 * @returns {Object} 실시간 데이터와 대체 데이터를 포함한 `arrivalInfo`
 */
export async function fetchBusArrivalInfo(stationName, busNo, timeInfo) {
  console.log('[INFO] Vuex에서 전달받은 데이터:', {
    stationName,
    busNo,
    timeInfo
  })

  const serviceKey =
    'EVTsGjdsoUlBtJTpdh/itgFJXzeeNK/BP4lN8my+i9AaoLGNln1kqRcyVP7CVRY8GsiXkX+OMl2HviEvq6hlfQ=='

  const routeId = busRouteData[busNo]?.routeId
  const folderPath = `/csv/${busNo}/` // 절대 경로 사용
  const startStations = busStartStations[busNo]

  console.log('[DEBUG] routeId:', routeId)
  console.log('[DEBUG] folderPath:', folderPath)
  console.log('[DEBUG] startStations:', startStations)

  if (!routeId || !folderPath || !startStations) {
    console.error(`[ERROR] 노선 데이터가 불완전합니다. 노선 번호: ${busNo}`)
    return {
      firstBus: { locationNo: -1, predictTime: -1, remainSeats: 0 },
      secondBus: { locationNo: -1, predictTime: -1, remainSeats: 0 }
    }
  }

  let arrivalInfo = {
    firstBus: { locationNo: -1, predictTime: -1, remainSeats: 0 },
    secondBus: { locationNo: -1, predictTime: -1, remainSeats: 0 }
  }

  try {
    // 1. 실시간 API 호출
    console.log('[INFO] 실시간 도착 정보 API 호출 중...')
    const response = await axios.get(
      'http://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalItem',
      {
        params: {
          serviceKey,
          stationId: stationName,
          routeId
        }
      }
    )

    console.log('[DEBUG] 원본 API 응답:', response.data)

    // 2. XML 파싱
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(response.data, 'text/xml')
    const busArrivalItem = xmlDoc.querySelector('busArrivalItem')

    if (!busArrivalItem) {
      throw new Error('도착 정보가 없습니다.')
    }

    arrivalInfo = {
      firstBus: {
        locationNo: parseInt(
          busArrivalItem.querySelector('locationNo1')?.textContent,
          10
        ),
        predictTime: parseInt(
          busArrivalItem.querySelector('predictTime1')?.textContent,
          10
        ),
        remainSeats:
          parseInt(
            busArrivalItem.querySelector('remainSeatCnt1')?.textContent,
            10
          ) ?? 0
      },
      secondBus: {
        locationNo: parseInt(
          busArrivalItem.querySelector('locationNo2')?.textContent,
          10
        ),
        predictTime: parseInt(
          busArrivalItem.querySelector('predictTime2')?.textContent,
          10
        ),
        remainSeats:
          parseInt(
            busArrivalItem.querySelector('remainSeatCnt2')?.textContent,
            10
          ) ?? 0
      }
    }

    console.log('[INFO] 실시간 도착 정보:', arrivalInfo)
    return arrivalInfo // 실시간 데이터를 반환
  } catch (apiError) {
    console.warn('[WARN] 실시간 API 호출 실패:', apiError)
  }

  // 3. 실시간 API 실패 시 CSV 데이터를 사용하여 대체
  console.log('[INFO] CSV 데이터를 사용하여 대체 계산을 시작합니다...')
  const timeSlot = `${timeInfo.hour}시`
  const dayType = getDayType(timeInfo.month, timeInfo.day)
  const filePath = `${folderPath}${busNo}_${dayType}.csv`

  console.log('[INFO] CSV 경로:', filePath)
  console.log('[INFO] 대상 정류장명:', stationName)
  console.log('[INFO] 시간대:', timeSlot)

  const avgReboarding = await fetchAverageReboarding(
    filePath,
    stationName,
    timeSlot
  )

  const dispatchCount = busRouteData[busNo]?.dispatchCount || 6
  arrivalInfo.firstBus.remainSeats = Math.max(
    0,
    (60 - avgReboarding) / dispatchCount
  )

  console.log(
    '[INFO] Poisson 계산으로 전달할 여석 값 (대체):',
    arrivalInfo.firstBus.remainSeats
  )
  return arrivalInfo // 대체 데이터를 포함한 전체 정보 반환
}

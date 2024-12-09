import axios from 'axios'
import { busRouteData, busStartStations } from './busData'
import Papa from 'papaparse'

/**
 * 요일 계산 함수
 * @param {number} month - 월
 * @param {number} day - 일
 * @returns {string} '평일', '토요일', '일요일'
 */
function getDayType(month, day) {
  const date = new Date(2024, month - 1, day) // JavaScript의 month는 0부터 시작
  const dayOfWeek = date.getDay() // 0: 일요일, 6: 토요일
  if (dayOfWeek === 0) return '일요일'
  if (dayOfWeek === 6) return '토요일'
  return '평일'
}

/**
 * CSV 파일에서 정류장 순번별 평균 재차 인원 가져오기
 * @param {string} filePath - CSV 파일 경로
 * @param {string} stationName - 정류장명 (로그용)
 * @param {number} idx - 정류장 순번
 * @param {string} timeSlot - 시간대 (예: '17시')
 * @returns {number} 평균 재차 인원 (정류장 데이터가 없으면 0 반환)
 */
async function fetchAverageReboarding(filePath, stationName, timeSlot, idx) {
  try {
    console.log('[INFO] fetchAverageReboarding 호출', {
      filePath,
      stationName, // 로그용
      idx,
      timeSlot
    })

    console.log(`[INFO] CSV 로드 시도: ${filePath}`)
    const response = await fetch(filePath)
    const csvText = await response.text()

    console.log('[DEBUG] CSV 파일 내용:', csvText.slice(0, 500)) // 500자만 출력

    const parsedData = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    }).data

    console.log('[DEBUG] CSV 파싱 결과:', parsedData)

    // "정류장순번" 열을 기준으로 데이터를 찾음
    const stationData = parsedData.find(
      (row) => parseInt(row['정류장순번'], 10) === idx
    )

    // 해당 시간대의 평균 재차 인원을 계산
    const avgReboarding =
      stationData && stationData[timeSlot]
        ? parseFloat(stationData[timeSlot]) || 0
        : 0

    console.log(
      `[INFO] 순번 ${idx} (${stationName})의 ${timeSlot} 평균 재차 인원: ${avgReboarding}`
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
 * @param {number} idx
 * @param {number} localStationId
 * @returns {Object} 실시간 데이터와 대체 데이터를 포함한 `arrivalInfo`
 */
export async function fetchBusArrivalInfo(
  stationName,
  busNo,
  timeInfo,
  idx,
  localStationId
) {
  console.log('[INFO] Vuex에서 전달받은 데이터:', {
    stationName,
    busNo,
    timeInfo,
    idx
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
    console.log('[DEBUG] 호출 파라미터:', {
      serviceKey,
      stationId: localStationId,
      routeId
    })
    const response = await axios.get(
      'https://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalItem',
      {
        params: {
          serviceKey,
          stationId: localStationId,
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

    // 실시간 도착 정보 설정
    const firstBusTime = parseInt(
      busArrivalItem.querySelector('predictTime1')?.textContent,
      10
    )
    const secondBusTime = parseInt(
      busArrivalItem.querySelector('predictTime2')?.textContent,
      10
    )

    const firstBusSeats = parseInt(
      busArrivalItem.querySelector('remainSeatCnt1')?.textContent,
      10
    )
    const secondBusSeats = parseInt(
      busArrivalItem.querySelector('remainSeatCnt2')?.textContent,
      10
    )

    // 두 버스의 도착 시간 차이를 계산하고 합산
    let combinedSeats = firstBusSeats
    if (
      firstBusTime !== null &&
      secondBusTime !== null &&
      Math.abs(firstBusTime - secondBusTime) <= 10
    ) {
      combinedSeats += secondBusSeats
      console.log(
        `[INFO] 도착 시간 차이가 10분 이내입니다. 여석 합산: ${combinedSeats}`
      )
    }

    arrivalInfo = {
      firstBus: {
        locationNo: parseInt(
          busArrivalItem.querySelector('locationNo1')?.textContent,
          10
        ),
        predictTime: firstBusTime,
        remainSeats: combinedSeats // 합산된 여석 사용
      },
      secondBus: {
        locationNo: parseInt(
          busArrivalItem.querySelector('locationNo2')?.textContent,
          10
        ),
        predictTime: secondBusTime,
        remainSeats: secondBusSeats
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
    timeSlot,
    idx
  )

  // 버스 노선 번호에 따라 기준 좌석 수 설정
  let baseSeats = 45 // 기본 좌석 수
  if (busNo === '5000B') {
    baseSeats = 70 // 5000B의 경우 기준 좌석 수를 70으로 설정
  }

  // 기준 좌석 수와 평균 재차 인원 확인 로그
  console.log(`[DEBUG] 기준 좌석 수 (baseSeats): ${baseSeats}`)
  console.log(`[DEBUG] 평균 재차 인원 (avgReboarding): ${avgReboarding}`)

  // 잔여 좌석 계산
  arrivalInfo.firstBus.remainSeats = Math.max(0, baseSeats - avgReboarding)
  console.log(
    `[DEBUG] baseSeats (${baseSeats}) - avgReboarding (${avgReboarding}) = ${
      baseSeats - avgReboarding
    }`
  )

  // 최종 잔여 좌석 값 확인 로그
  console.log(
    '[INFO] Poisson 계산으로 전달할 여석 값 (대체):',
    arrivalInfo.firstBus.remainSeats
  )

  return arrivalInfo
}

//const dispatchCount = busRouteData[busNo]?.dispatchCount || 6

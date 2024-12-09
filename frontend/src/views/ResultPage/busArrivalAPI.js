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
 */
async function fetchAverageReboarding(filePath, stationName, timeSlot, idx) {
  try {
    console.log('[INFO] fetchAverageReboarding 호출', {
      filePath,
      stationName,
      idx,
      timeSlot
    })

    const response = await fetch(filePath)
    const csvText = await response.text()

    const parsedData = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    }).data

    const stationData = parsedData.find(
      (row) => parseInt(row['정류장순번'], 10) === idx
    )

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
    return 0
  }
}

/**
 * 경기도 공공데이터포털 버스 도착 정보 API 호출 함수
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
  const folderPath = `/csv/${busNo}/`
  const startStations = busStartStations[busNo]

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

  // 현재 시각과 Vuex 시간 비교
  const storeTime = new Date(
    2024,
    timeInfo.month - 1,
    timeInfo.day,
    timeInfo.hour,
    timeInfo.minute
  )
  const currentTime = new Date()

  console.log('[DEBUG] 현재 시각:', currentTime)
  console.log('[DEBUG] Vuex에서 가져온 시각:', storeTime)

  const isWithinTwoMinutes = Math.abs(currentTime - storeTime) <= 2 * 60 * 1000 // 2분 이내 판단

  if (!isWithinTwoMinutes) {
    console.log(
      '[INFO] Vuex 시간과 현재 시간이 2분 이상 차이납니다. CSV 데이터를 사용합니다.'
    )

    return await fetchCSVData(busNo, folderPath, stationName, timeInfo, idx)
  }

  try {
    console.log('[INFO] 실시간 도착 정보 API 호출 중...')
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

    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(response.data, 'text/xml')
    const busArrivalItem = xmlDoc.querySelector('busArrivalItem')

    if (!busArrivalItem) {
      throw new Error('도착 정보가 없습니다.')
    }

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

    let combinedSeats = firstBusSeats
    if (
      firstBusTime !== null &&
      secondBusTime !== null &&
      Math.abs(firstBusTime - secondBusTime) <= 10
    ) {
      combinedSeats += secondBusSeats
    }

    arrivalInfo = {
      firstBus: {
        locationNo: parseInt(
          busArrivalItem.querySelector('locationNo1')?.textContent,
          10
        ),
        predictTime: firstBusTime,
        remainSeats: combinedSeats
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

    return arrivalInfo
  } catch (apiError) {
    console.warn('[WARN] 실시간 API 호출 실패:', apiError)
    console.log('[INFO] CSV 데이터로 대체합니다.')
    return await fetchCSVData(busNo, folderPath, stationName, timeInfo, idx)
  }
}

/**
 * CSV 데이터를 가져오는 함수
 */
async function fetchCSVData(busNo, folderPath, stationName, timeInfo, idx) {
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

  let baseSeats = 45
  if (busNo === '5000B') {
    baseSeats = 70
  }

  const remainSeats = Math.max(0, baseSeats - avgReboarding)

  console.log(
    `[DEBUG] baseSeats (${baseSeats}) - avgReboarding (${avgReboarding}) = ${remainSeats}`
  )

  return {
    firstBus: { locationNo: -1, predictTime: -1, remainSeats: remainSeats },
    secondBus: { locationNo: -1, predictTime: -1, remainSeats: 0 }
  }
}

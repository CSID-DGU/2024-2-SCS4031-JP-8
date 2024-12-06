// 필요한 라이브러리 가져오기
const fs = require('fs')
const math = require('mathjs')
const { parse } = require('csv-parse/sync')

// CSV 파일에서 승차 인원 데이터를 읽어오는 함수
function loadPassengerData(filePath) {
  const data = fs.readFileSync(filePath, 'utf8')
  const records = parse(data, { columns: true })
  const passengerData = {}
  records.forEach((record) => {
    passengerData[record['정류장명']] = record
  })
  return passengerData
}

// 실시간 버스 위치 정보를 가져오는 함수 (예시)
function getBusLocation(routeId) {
  // 실제로는 API를 호출해야 하지만, 여기서는 예시 값을 반환
  return [39, 40] // 현재 정류장, 다음 정류장
}

// 포아송 확률 계산 함수
function poissonProb(k, sigma, lam) {
  let sum = 0
  for (let i = k; i < sigma; i++) {
    sum += (math.exp(-lam) * Math.pow(lam, i)) / math.factorial(i)
  }
  return sum
}

// 메인 함수
function calculateBoardingProbability(
  routeId,
  targetStation,
  currentTime,
  passengerData
) {
  const [currentStation, nextStation] = getBusLocation(routeId)

  // 남은 좌석 수 (예시 값, 실제로는 API나 다른 소스에서 가져와야 함)
  let remainSeat = 31

  // 현재 시간을 시간대로 변환 (예: '17시')
  const timeSlot = `${currentTime.getHours()}시`

  // 현재 정류장부터 목표 정류장까지의 데이터 필터링
  const stationList = Object.keys(passengerData)
  const startIndex = currentStation
  const endIndex = targetStation
  const relevantStations = stationList.slice(startIndex, endIndex + 1)
  const alreadyPass = stationList[startIndex - 1]

  const timeInterval = 10 // 배차 간격 (분)
  const totalBus = 60 / timeInterval // 시간당 배차수

  const probabilities = []

  for (const station of relevantStations) {
    const stationIndex = relevantStations.indexOf(station)

    let avgPass
    if (stationIndex === 0) {
      avgPass =
        parseFloat(passengerData[station][timeSlot]) -
        parseFloat(passengerData[alreadyPass][timeSlot])
    } else {
      avgPass =
        parseFloat(passengerData[station][timeSlot]) -
        parseFloat(passengerData[relevantStations[stationIndex - 1]][timeSlot])
    }

    if (isNaN(avgPass)) {
      avgPass = 0
    }

    // 각 정류장까지의 예상 소요 시간 계산 (간단한 예시)
    const totalPass = Math.max(0, avgPass * totalBus)
    const busArrivalTime = stationIndex * timeInterval

    let busesUntilNow = Math.floor(busArrivalTime / timeInterval)
    if (busArrivalTime < 30) {
      busesUntilNow = totalBus - busesUntilNow
    }

    const passPerTime = totalPass / busesUntilNow

    remainSeat -= avgPass

    const targetPass = Math.max(1, Math.floor(totalPass - remainSeat))

    const prob = poissonProb(targetPass, totalPass, passPerTime)
    probabilities.push({ station, prob })
  }

  return probabilities
}

// 사용 예시
;(async function () {
  // CSV 파일 경로
  const csvFilePath = '2024-2-SCS4031-JP-8/backend/sarima_weekday.csv'

  // CSV 파일에서 데이터 로드
  const passengerData = loadPassengerData(csvFilePath)

  const routeId = '5000B번'
  const targetStation = 44
  const currentTime = new Date()

  const results = calculateBoardingProbability(
    routeId,
    targetStation,
    currentTime,
    passengerData
  )
  results.forEach(({ station, prob }) => {
    console.log(`정류장 ${station}의 탑승 확률: ${(prob * 100).toFixed(2)}%`)
  })
})()

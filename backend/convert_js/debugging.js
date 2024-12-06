// 그냥 메모
// 혼잡 시간대 아닐때는 프론트 페이지를 길찾기부터 띄우고 선택 정류장 버튼 만드는것도조을듯? 원래는 다 통일할랬는데...
// M7731

const fs = require('fs')
const math = require('mathjs')
const { parse } = require('csv-parse/sync')

// 승차인원 데이터 불러오기
const passengerData = loadPassengerData('int_passenger_flow.csv')

// CSV 파일에서 승차 인원 데이터를 불러오는 함수
function loadPassengerData(filePath) {
  const data = fs.readFileSync(filePath, 'utf8')
  const records = parse(data, { columns: true })
  const passengerData = {}
  records.forEach((record) => {
    passengerData[record['정류장명']] = record
  })
  return passengerData
}

// 필요한 함수들 정의
function poissonProb(k, sigma, lam) {
  return Array.from({ length: sigma - k }, (_, i) => k + i).reduce(
    (sum, i) => sum + (math.exp(-lam) * Math.pow(lam, i)) / math.factorial(i),
    0
  )
}

// 버스 위치 정보를 가져오는 함수
function getBusLocation(routeId) {
  // 이 함수는 실제 API나 다른 데이터 소스에서 버스 위치 정보를 가져와야 합니다.
  //앞의 버스 위치, 뒤의 버스 위치에서 10분 이내이면 합치는 코드 api로 받아오기
  // 여기서는 예시로 임의의 값을 반환합니다.
  return [38, 13] // 현재 정류장 인덱스, 다음 정류장 인덱스
}
// 무정차 정류장 제외하고 받아오기

function calculateBoardingProbability(
  routeId,
  targetStation,
  currentTime,
  passengerData
) {
  const [currentBus, nextBus] = getBusLocation(routeId)

  let remainSeat = 60
  const timeSlot = '18시_승하차' //`f"{currentTime.hour}시_승하차"` 로 변경?

  const stationList = Object.keys(passengerData)
  const relevantStations = stationList.slice(currentBus, targetStation + 1)

  const timeInterval = 15
  const totalBus = 60 / timeInterval

  const probabilities = []

  for (const station of relevantStations) {
    const stationIndex = relevantStations.indexOf(station)

    let avgPass = parseFloat(passengerData[station][timeSlot])

    if (Array.isArray(avgPass)) {
      avgPass = avgPass[0]
    }
    if (isNaN(avgPass)) {
      avgPass = 0
    }

    const totalPass = Math.max(0, avgPass * totalBus)
    const busArrivalTime = 19 + stationIndex * 10

    let busesUntilNow = Math.floor(busArrivalTime / timeInterval)
    if (busArrivalTime < 30) {
      busesUntilNow = totalBus - busesUntilNow
    }

    const passPerTime = busesUntilNow > 0 ? totalPass / busesUntilNow : 0

    const targetPass = Math.floor(totalPass - remainSeat)
    const prob =
      targetPass <= 0 ? 1 : poissonProb(targetPass, totalPass, passPerTime)
    probabilities.push([station, prob])

    if (remainSeat > 0) {
      remainSeat -= avgPass
      remainSeat = Math.max(0, remainSeat)
    }
  }

  return probabilities
}

// 데이터로 저장해두기

// 예시 실행
const routeId = '5000B'
const targetStation = 44 //종점 상행/하행노선별로 다름
const currentTime = new Date()

const result = calculateBoardingProbability(
  routeId,
  targetStation,
  currentTime,
  passengerData
)

console.log('승차 확률:')
result.forEach(([station, prob]) => {
  console.log(`${station}: ${(prob * 100).toFixed(2)}%`)
})

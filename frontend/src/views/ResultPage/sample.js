const math = require('mathjs')
const fs = require('fs')
const csv = require('csv-parser')

// 승차인원 데이터 불러오기
let passengerData = {}

fs.createReadStream('5000B_week_pass.csv')
  .pipe(csv())
  .on('data', (row) => {
    const station = row['정류장']
    if (!passengerData[station]) passengerData[station] = {}
    Object.keys(row).forEach((key) => {
      if (key !== '정류장')
        passengerData[station][key] = parseFloat(row[key] || 0)
    })
  })

// 최악 상황
function worstProb(k, sigma, lam) {
  let prob = 0
  for (let i = k; i < Math.floor(sigma); i++) {
    prob += (Math.exp(-lam) * Math.pow(lam, i)) / math.factorial(i)
  }
  return prob
}

// total pass < remain seat
function normalProb(k, lam) {
  let prob = 0
  for (let i = 0; i < Math.floor(k); i++) {
    prob += (Math.exp(-lam) * Math.pow(lam, i)) / math.factorial(i)
  }
  return prob
}

function getBusLocation(routeId) {
  // 이 함수는 실제 API나 다른 데이터 소스에서 버스 위치 정보를 가져와야 합니다.
  // 여기서는 예시로 임의의 값을 반환합니다.
  return 38 // 현재 정류장 인덱스
}

function calculateBoardingProbability(
  routeId,
  targetStation,
  currentTime,
  passengerData
) {
  const currentBus = getBusLocation(routeId)

  let remainSeat = 64
  const timeSlot = `${currentTime.getHours()}시`
  const searchTime = currentTime.getMinutes()

  const stationList = Object.keys(passengerData)
  const relevantStations = stationList.slice(currentBus, targetStation + 1)

  const timeInterval = 15
  const totalBus = 60 / timeInterval

  const probabilities = []
  let cumulativeProb = 1.0

  relevantStations.forEach((station) => {
    let totalPass = passengerData[station]?.[timeSlot]

    if (totalPass === undefined || isNaN(totalPass)) {
      totalPass = 0
    }

    const avgPass = totalPass / totalBus
    const busesUntilNow = Math.max(1, Math.floor(searchTime / timeInterval))
    const passPerTime = Math.max(1, avgPass) * busesUntilNow

    const targetPass = Math.floor(totalPass - remainSeat)
    let stationProb
    if (targetPass <= 0) {
      stationProb = normalProb(remainSeat, passPerTime)
    } else {
      stationProb = worstProb(targetPass, totalPass, passPerTime)
    }

    cumulativeProb *= stationProb

    probabilities.push({ station, probability: cumulativeProb })

    if (remainSeat > 0) {
      remainSeat -= avgPass
      remainSeat = Math.max(0, remainSeat)
    }
  })

  return probabilities
}

// 예시 실행
const routeId = '5000B'
const targetStation = 44
const currentTime = new Date()

setTimeout(() => {
  const result = calculateBoardingProbability(
    routeId,
    targetStation,
    currentTime,
    passengerData
  )

  console.log('승차 확률:')
  result.forEach(({ station, probability }) => {
    console.log(`${station}: ${(probability * 100).toFixed(2)}%`)
  })
}, 1000) // CSV 파일 로드를 기다리기 위해 1초 지연

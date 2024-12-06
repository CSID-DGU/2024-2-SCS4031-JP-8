import Papa from 'papaparse'

// CSV 파일에서 승차 인원 데이터를 읽어오는 함수
async function loadPassengerData(filePath) {
  try {
    const response = await fetch(filePath)
    const csvText = await response.text()

    const parsedData = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    }).data

    const passengerData = {}
    parsedData.forEach((row) => {
      const stationName = row['정류장']
      if (!stationName) return
      passengerData[stationName] = row
    })

    return passengerData
  } catch (error) {
    console.error('[ERROR] CSV 로드 실패:', error)
    return {}
  }
}

// 포아송 확률 계산 함수
function poissonProb(k, sigma, lam) {
  let prob = 0
  for (let i = k; i < sigma; i++) {
    prob += (Math.exp(-lam) * Math.pow(lam, i)) / factorial(i)
  }
  return prob
}

// 정규분포 확률 계산 함수
function normalProb(k, lam) {
  let prob = 0
  for (let i = 0; i < k; i++) {
    prob += (Math.exp(-lam) * Math.pow(lam, i)) / factorial(i)
  }
  return prob
}

// 팩토리얼 계산 함수
function factorial(n) {
  if (n === 0 || n === 1) return 1
  return n * factorial(n - 1)
}

// 실시간 버스 위치 정보를 가져오는 함수 (예시)
function getBusLocation(routeId) {
  return 41 // 현재 정류장 인덱스
}

// 메인 함수: 승차 확률 계산
async function calculateBoardingProbability(
  routeId,
  targetStation,
  currentTime,
  passengerData
) {
  const currentBus = getBusLocation(routeId) //

  let remainSeat = 34 //
  let timeSlot = 15
  let searchTime = 19 //

  const stationList = Object.keys(passengerData)
  const relevantStations = stationList.slice(currentBus, targetStation + 1)

  const timeInterval = 10 // 배차 간격 (분)
  const totalBus = 60 / timeInterval // 시간당 배차 수

  const probabilities = []
  let cumulativeProb = 1.0

  for (const station of relevantStations) {
    let totalPass = parseFloat(passengerData[station]?.[`${timeSlot}시`] || 0)

    const avgPass = Math.max(1, Math.floor(totalPass / totalBus))
    const busesUntilNow = Math.max(1, Math.floor(searchTime / timeInterval))

    const passPerTime = Math.max(1, avgPass) * busesUntilNow
    const targetPass = Math.max(0, Math.floor(totalPass - remainSeat))

    let stationProb
    if ((7 <= timeSlot && timeSlot < 10) || (17 <= timeSlot && timeSlot < 20)) {
      stationProb = poissonProb(targetPass, totalPass, passPerTime)
    } else {
      stationProb = normalProb(remainSeat, passPerTime)
    }

    cumulativeProb *= stationProb
    probabilities.push({ station, probability: cumulativeProb })

    if (remainSeat > 0) {
      remainSeat -= avgPass
      remainSeat = Math.max(0, remainSeat)
    }

    searchTime += timeInterval
    if (searchTime >= 60) {
      searchTime -= 60
      timeSlot += 1
    }
  }

  return probabilities
}

// 예시 실행
;(async () => {
  const csvFilePath = '5000B_week_pass.csv'
  const passengerData = await loadPassengerData(csvFilePath)

  const routeId = '1112'
  const targetStation = 44
  const currentTime = new Date()

  const result = await (routeId, targetStation, currentTime, passengerData)

  console.log('승차 확률:')
  result.forEach(({ station, probability }) => {
    console.log(`${station}: ${(probability * 100).toFixed(2)}%`)
  })
})()

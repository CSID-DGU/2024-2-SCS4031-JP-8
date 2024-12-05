import Papa from 'papaparse'

// 포아송 확률 계산 함수
function poissonProb(k, sigma, lambda) {
  let prob = 0
  for (let i = k; i < sigma; i++) {
    prob += (Math.exp(-lambda) * Math.pow(lambda, i)) / factorial(i)
  }
  return prob
}

// 정규분포 확률 계산 함수
function normalProb(k, lambda) {
  let prob = 0
  for (let i = 0; i < k; i++) {
    prob += (Math.exp(-lambda) * Math.pow(lambda, i)) / factorial(i)
  }
  return prob
}

// 팩토리얼 함수
function factorial(n) {
  if (n === 0 || n === 1) return 1
  return n * factorial(n - 1)
}

// // 실시간 버스 위치 정보를 가져오는 함수 (예시)
// function getBusLocation(routeId) {
//   return 41 // 현재 정류장 인덱스
// }

// // CSV 데이터를 로드하는 함수
// async function loadPassengerData(csvUrl) {
//   return new Promise((resolve, reject) => {
//     Papa.parse(csvUrl, {
//       download: true,
//       header: true,
//       dynamicTyping: true,
//       complete: (results) => {
//         const data = {}
//         results.data.forEach((row) => {
//           const station = row['정류장']
//           if (!station) return
//           data[station] = row
//         })
//         resolve(data)
//       },
//       error: (error) => reject(error)
//     })
//   })
// }

// 메인 함수: 승차 확률 계산
async function calculateBoardingProbability(
  routeId,
  targetStation,
  currentTime,
  passengerData
) {
  const currentBus = getBusLocation(routeId)

  let remainSeat = 34 /////
  let timeSlot = 15 /////
  let searchTime = 19 /////

  const stationList = Object.keys(passengerData)
  const relevantStations = stationList.slice(currentBus, targetStation + 1)

  const timeInterval = 10 // 배차 간격
  const totalBus = 60 / timeInterval // 시간당 배차수

  const probabilities = []
  let cumulativeProb = 1.0

  for (const station of relevantStations) {
    const totalPass = passengerData[station]?.[`${timeSlot}시`] || 0
    const avgPass = Math.floor(totalPass / totalBus)

    const busesUntilNow = Math.max(1, Math.floor(searchTime / timeInterval))
    const passPerTime = Math.max(1, avgPass) * busesUntilNow

    const targetPass = Math.max(0, totalPass - remainSeat)

    let stationProb
    if ((timeSlot >= 7 && timeSlot < 10) || (timeSlot >= 17 && timeSlot < 20)) {
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

    searchTime += 10
    if (searchTime >= 60) {
      searchTime -= 60
      timeSlot += 1
    }
  }

  return probabilities
}

// 실행 예시
;(async () => {
  const csvUrl = '/path/to/5000B_week_pass.csv' // CSV 파일 경로
  try {
    const passengerData = await loadPassengerData(csvUrl)
    const routeId = '1112'
    const targetStation = 44
    const currentTime = new Date()

    const result = await calculateBoardingProbability(
      routeId,
      targetStation,
      currentTime,
      passengerData
    )

    console.log('승차 확률:')
    result.forEach(({ station, probability }) => {
      console.log(`${station}: ${(probability * 100).toFixed(2)}%`)
    })
  } catch (error) {
    console.error('오류 발생:', error)
  }
})()

export {
  poissonProb,
  normalProb,
  factorial,
  //getBusLocation,
  //loadPassengerData,
  calculateBoardingProbability
}

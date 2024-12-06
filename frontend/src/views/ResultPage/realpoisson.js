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

// CSV 파일에서 정류장 순번별 평균 승차 인원 가져오기
async function fetchAverageReboarding(filePath, idx, timeSlot) {
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

    // "정류장순번" 열을 기준으로 데이터를 찾음
    const stationData = parsedData.find(
      (row) => parseInt(row['정류장순번'], 10) === idx
    )

    // 해당 시간대의 평균 승차 인원을 계산
    const avgReboarding =
      stationData && stationData[timeSlot]
        ? parseFloat(stationData[timeSlot]) || 0
        : 0

    console.log(
      `[INFO] 순번 ${idx}의 ${timeSlot} 평균 승차 인원: ${avgReboarding}`
    )

    return avgReboarding
  } catch (error) {
    console.error('[ERROR] CSV 로드 실패:', error)
    return 0 // 실패 시 0 반환
  }
}

// 메인 함수: 승차 확률 계산
async function calculateBoardingProbability({
  arrivalInfo, // 초기 남은 좌석 수
  startSeq, // 시작 정류장 순번
  endSeq, // 마지막 정류장 순번
  filePath, // CSV 파일 경로
  timeSlot, // 시간대 정보
  stations, // 정류장 정보 목록
  transidx // 특정 정류장 순번
}) {
  console.log('[INFO] Poisson 계산 시작', {
    arrivalInfo,
    startSeq,
    endSeq,
    filePath,
    timeSlot,
    stations,
    transidx
  })

  // 특정 정류장 순번 데이터 로드
  const avgReboarding = await fetchAverageReboarding(
    filePath,
    transidx,
    timeSlot
  )

  if (avgReboarding === 0) {
    console.warn(`[WARN] 정류장순번 ${transidx}에 대한 데이터가 없습니다.`)
    return []
  }

  let remainSeat = arrivalInfo // 남은 좌석 초기값
  const probabilities = []
  const timeInterval = 10 // 배차 간격
  const totalBus = 60 / timeInterval // 시간당 배차 수

  for (let seq = startSeq; seq <= endSeq; seq++) {
    const station = stations.find((st) => st.idx === seq)
    if (!station) {
      console.warn(`[WARN] 순번 ${seq}에 해당하는 정류장이 없습니다.`)
      continue
    }

    const totalPass = Math.max(1, avgReboarding * totalBus) // 시간당 평균 환산
    const targetPass = Math.max(0, Math.floor(totalPass - remainSeat))

    let stationProb
    if (
      timeSlot.includes('7시') ||
      timeSlot.includes('8시') ||
      timeSlot.includes('9시')
    ) {
      stationProb = poissonProb(targetPass, totalPass, remainSeat)
    } else {
      stationProb = normalProb(remainSeat, totalPass)
    }

    probabilities.push({
      stationName: station.stationName,
      seq,
      probability: stationProb * 100 // 퍼센트로 변환
    })

    remainSeat -= avgReboarding
    remainSeat = Math.max(remainSeat, 0) // 음수 방지
  }

  console.log('[INFO] 계산된 확률:', probabilities)
  return probabilities
}

// // 실행 예시
// ;(async () => {
//   const csvUrl = '/path/to/5000B_week_pass.csv' // CSV 파일 경로
//   try {
//     const passengerData = await loadPassengerData(csvUrl)
//     const routeId = '1112'
//     const targetStation = 44
//     const currentTime = new Date()

//     const result = await calculateBoardingProbability(
//       routeId,
//       targetStation,
//       currentTime,
//       passengerData
//     )

//     console.log('승차 확률:')
//     result.forEach(({ station, probability }) => {
//       console.log(`${station}: ${(probability * 100).toFixed(2)}%`)
//     })
//   } catch (error) {
//     console.error('오류 발생:', error)
//   }
// })()

export {
  poissonProb,
  normalProb,
  factorial,
  fetchAverageReboarding,
  calculateBoardingProbability
}

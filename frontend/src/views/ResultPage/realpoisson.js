import Papa from 'papaparse'

// 포아송 확률 계산 함수
function poissonProb(k, sigma, lam) {
  console.log('[DEBUG] poissonProb 호출:', { k, sigma, lam })
  let prob = 0
  for (let i = k; i < sigma; i++) {
    prob += (Math.exp(-lam) * Math.pow(lam, i)) / factorial(i)
  }
  console.log('[DEBUG] 최종 포아송 확률:', prob)
  return prob
}

// 팩토리얼 계산 함수
function factorial(n) {
  if (n === 0 || n === 1) return 1
  const result = n * factorial(n - 1)
  return result
}

// 정규분포 확률 계산 함수
function normalProb(k, lam) {
  console.log('[DEBUG] normalProb 호출:', { k, lam })
  let prob = 0
  for (let i = 0; i < k; i++) {
    prob += (Math.exp(-lam) * Math.pow(lam, i)) / factorial(i)
  }
  console.log('[DEBUG] 최종 정규분포 확률:', prob)
  return prob
}

// CSV 파일에서 정류장별 데이터를 로드하는 함수
async function loadPassengerData(filePath) {
  console.log('[INFO] loadPassengerData 호출:', { filePath })
  try {
    console.log(`[INFO] CSV 로드 시도: ${filePath}`)
    const response = await fetch(filePath)
    const csvText = await response.text()

    console.log('[DEBUG] CSV 파일 내용:', csvText.slice(0, 500)) // 500자만 출력

    const parsedData = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    }).data

    const passengerData = {}
    parsedData.forEach((row, index) => {
      console.log(`[DEBUG] 처리 중인 row(${index}):`, row)

      const stationSeq = parseInt(row['정류장순번'], 10)
      if (isNaN(stationSeq)) {
        console.warn(
          `[WARN] 정류장순번이 유효하지 않음. 무시됨:`,
          row['정류장순번']
        )
        return // 정류장순번이 숫자가 아니면 무시
      }

      if (passengerData[stationSeq]) {
        console.warn(
          `[WARN] 중복된 정류장순번(${stationSeq})이 발견됨. 기존 데이터가 덮어씌워질 수 있습니다.`
        )
      }

      passengerData[stationSeq] = row
      console.log(`[DEBUG] 추가된 정류장 데이터:`, { stationSeq, data: row })
    })

    console.log('[INFO] 최종 로드된 passengerData:', passengerData)

    console.log('[DEBUG] 로드된 승객 데이터:', passengerData)
    return passengerData
  } catch (error) {
    console.error('[ERROR] CSV 로드 실패:', error)
    return {}
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
  transidx, // 특정 정류장 순번
  searchTime
}) {
  console.log('[INFO] calculateBoardingProbability 호출:', {
    arrivalInfo,
    startSeq,
    endSeq,
    filePath,
    timeSlot,
    transidx,
    searchTime
  })

  const currentBus = transidx
  console.log('[DEBUG] currentBus:', currentBus)

  let remainSeat = arrivalInfo
  console.log('[DEBUG] 초기 남은 좌석 수:', remainSeat)

  let realtimeSlot = timeSlot
  let realsearchTime = searchTime // 분
  console.log('[DEBUG] 초기 시간대 및 분:', { realtimeSlot, realsearchTime })

  const passengerData = await loadPassengerData(filePath)
  const targetStation = endSeq

  console.log('[DEBUG] 대상 정류장 순번:', { startSeq, targetStation })

  const stationList = Object.keys(passengerData)
  const relevantStations = stationList.slice(currentBus, targetStation + 1)
  console.log('[DEBUG] 대상 정류장 목록:', relevantStations)

  const timeInterval = 10 // 배차 간격 (분)
  const totalBus = 60 / timeInterval // 시간당 배차 수
  console.log('[DEBUG] 배차 간격 및 시간당 배차 수:', {
    timeInterval,
    totalBus
  })

  const probabilities = []
  let cumulativeProb = 1.0

  for (const station of relevantStations) {
    console.log('[DEBUG] 현재 처리 중인 정류장:', station)

    console.log('[DEBUG] 현재 처리 중인 정류장 데이터:', {
      station,
      passengerDataEntry: passengerData[station],
      timeKey: `${realtimeSlot}`,
      matchedValue: passengerData[station]?.[`${realtimeSlot}`]
    })
    let totalPass = parseFloat(passengerData[station]?.[`${realtimeSlot}`] || 0)
    console.log('[DEBUG] totalPass 계산:', {
      station,
      timeKey: `${realtimeSlot}`,
      matchedValue: passengerData[station]?.[`${realtimeSlot}`],
      totalPass
    })

    const avgPass = Math.max(1, Math.floor(totalPass / totalBus))
    console.log('[DEBUG] avgPass 계산:', {
      totalPass,
      totalBus,
      avgPass
    })

    const busesUntilNow = Math.max(1, Math.floor(realsearchTime / timeInterval))
    console.log('[DEBUG] busesUntilNow:', busesUntilNow)

    const passPerTime = Math.max(1, avgPass) * busesUntilNow
    console.log('[DEBUG] passPerTime:', passPerTime)

    const targetPass = Math.max(0, Math.floor(totalPass - remainSeat))
    console.log('[DEBUG] targetPass:', targetPass)

    let stationProb
    if (
      (7 <= realtimeSlot && realtimeSlot < 10) ||
      (17 <= realtimeSlot && realtimeSlot < 20)
    ) {
      stationProb = poissonProb(targetPass, totalPass, passPerTime)
    } else {
      stationProb = normalProb(remainSeat, passPerTime)
    }

    console.log('[DEBUG] stationProb:', stationProb)
    // 확률 저장 및 로그 출력
    console.log('[DEBUG] 저장할 확률 데이터:', {
      station,
      probability: cumulativeProb
    })

    cumulativeProb *= stationProb
    probabilities.push({ station, probability: cumulativeProb })
    console.log('[DEBUG] 현재까지의 확률 배열:', probabilities)

    if (remainSeat > 0) {
      remainSeat -= avgPass
      remainSeat = Math.max(0, remainSeat)
    }
    console.log('[DEBUG] 업데이트된 남은 좌석 수:', remainSeat)

    realsearchTime += timeInterval
    if (realsearchTime >= 60) {
      realsearchTime -= 60
      realtimeSlot += 1
    }
    console.log('[DEBUG] 업데이트된 시간:', {
      realtimeSlot,
      realsearchTime
    })
  }

  console.log('[INFO] 계산된 확률:', probabilities)
  return probabilities
}

export {
  poissonProb,
  factorial,
  loadPassengerData,
  calculateBoardingProbability
}

import Papa from 'papaparse'

/**
 * CSV 파일 데이터를 로드합니다.
 * @param {string} filePath - CSV 파일 경로
 * @returns {Promise<Object>} CSV 데이터 객체
 */
async function loadPassengerData(filePath) {
  return new Promise((resolve, reject) => {
    Papa.parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('[INFO] CSV 데이터 로드 성공:', results.data)
        resolve(results.data)
      },
      error: (error) => {
        console.error('[ERROR] CSV 데이터 로드 실패:', error)
        reject(error)
      }
    })
  })
}

/**
 * 팩토리얼 계산 함수
 * @param {number} n - 팩토리얼 계산을 위한 숫자
 * @returns {number} n! 값
 */
function factorial(n) {
  if (n === 0 || n === 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

/**
 * 포아송 확률 계산 공식
 * @param {number} k - 최소 목표 값
 * @param {number} sigma - 최대 목표 값
 * @param {number} lambda - 평균 값
 * @returns {number} 계산된 확률 값
 */
function poissonProb(k, sigma, lambda) {
  if (lambda <= 0) {
    console.warn('[WARN] Lambda 값이 0 이하입니다. 기본값(1)로 대체합니다.')
    lambda = 1 // Lambda 기본값 설정
  }

  let sum = 0
  for (let i = k; i <= sigma; i++) {
    const eMinusLambda = Math.exp(-lambda)
    const lambdaPowerK = Math.pow(lambda, i)
    const factorialK = factorial(i)

    if (factorialK === 0) {
      console.error('[ERROR] 팩토리얼 계산 오류: i =', i)
      continue
    }

    const probability = (eMinusLambda * lambdaPowerK) / factorialK
    sum += probability
  }

  console.log('[DEBUG] Poisson 확률 계산 완료:', {
    k,
    sigma,
    lambda,
    result: sum
  })
  return sum
}

/**
 * 포아송 확률을 이용한 정류장별 확률 계산
 * @param {Object} options - 옵션 객체
 * @param {Object} options.arrivalInfo - 초기 남은 좌석 정보
 * @param {number} options.startSeq - 시작 정류장 순번
 * @param {number} options.endSeq - 종점 정류장 순번
 * @param {string} options.filePath - CSV 파일 경로
 * @param {string} options.timeSlot - 시간대 정보
 * @param {Array} options.stations - 정류장 목록
 * @returns {Promise<Array>} 모든 정류장의 확률 데이터
 */
export async function calculateBoardingProbability({
  arrivalInfo,
  startSeq,
  endSeq,
  filePath,
  timeSlot,
  stations
}) {
  try {
    console.log('[INFO] 포아송 계산 시작')
    console.log('[INFO] 입력된 데이터:', {
      arrivalInfo,
      startSeq,
      endSeq,
      filePath,
      timeSlot
    })

    // CSV 데이터 로드
    const passengerData = await loadPassengerData(filePath)
    console.log('[INFO] CSV 로드 완료. 데이터:', passengerData)

    // 초기 남은 좌석 정보
    let remainSeats = arrivalInfo || 0
    console.log('[INFO] 초기 남은 좌석 수:', remainSeats)

    const probabilities = []

    for (let seq = startSeq; seq <= endSeq; seq++) {
      console.log('[DEBUG] 현재 순번:', seq)

      const station = stations.find((st) => st.idx === seq)
      if (!station) {
        console.warn('[WARN] 해당 순번 정류장을 찾을 수 없습니다:', seq)
        continue
      }

      const avgPass = parseFloat(passengerData[seq]?.[timeSlot] || 0)
      if (isNaN(avgPass)) {
        console.warn(
          `[WARN] 시간대(${timeSlot})에 해당하는 평균 승차 인원을 찾을 수 없습니다. 기본값(0) 사용.`
        )
        continue
      }

      const totalPass = Math.max(1, avgPass * (60 / 15)) // 최소값 1 보장
      console.log('[DEBUG] 평균 승차 인원:', avgPass)
      console.log('[DEBUG] 시간당 환산 승차 인원:', totalPass)

      const targetPass = Math.max(0, Math.floor(totalPass - remainSeats))
      const prob = poissonProb(targetPass, totalPass, remainSeats)

      console.log('[DEBUG] Poisson 계산 결과:', {
        seq,
        stationName: station.stationName,
        targetPass,
        totalPass,
        prob
      })

      probabilities.push({
        seq,
        stationName: station.stationName,
        probability: prob * 100 // 퍼센트로 변환
      })

      remainSeats -= avgPass
      remainSeats = Math.max(remainSeats, 0) // 음수 방지
    }

    console.log('[INFO] 모든 확률 결과:', probabilities)

    return probabilities
  } catch (error) {
    console.error('[ERROR] Poisson 계산 실패:', error)
    throw error
  }
}

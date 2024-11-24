/**
 * 포아송 확률 계산 공식
 * @param {number} k - 최소 목표 값
 * @param {number} sigma - 최대 목표 값
 * @param {number} lambda - 평균 값
 * @returns {number} 계산된 확률 값
 */
function poissonProb(k, sigma, lambda) {
  let sum = 0
  for (let i = k; i <= sigma; i++) {
    const eMinusLambda = Math.exp(-lambda)
    const lambdaPowerK = Math.pow(lambda, i)
    const factorialK = factorial(i)
    sum += (eMinusLambda * lambdaPowerK) / factorialK
  }
  return sum
}

/**
 * 포아송 확률을 이용한 정류장별 확률 계산
 * @param {Object} options - 옵션 객체
 * @param {Object} options.arrivalInfo - 도착 정보 (여석 계산용)
 * @param {number} options.startSeq - 시작 정류장 순번
 * @param {number} options.endSeq - 종점 정류장 순번
 * @param {string} options.filePath - CSV 파일 경로
 * @param {string} options.timeSlot - 시간대 (예: '17시')
 * @returns {Promise<Array>} 각 정류장의 확률 데이터
 */
export async function calculateBoardingProbability({
  arrivalInfo,
  startSeq,
  endSeq,
  filePath,
  timeSlot
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

    // 남은 좌석 정보
    let remainSeats = arrivalInfo.firstBus?.remainSeats || 0
    console.log('[INFO] 초기 남은 좌석 수:', remainSeats)

    const probabilities = []

    // 정류장 순번 순회
    for (let seq = startSeq; seq <= endSeq; seq++) {
      console.log('[DEBUG] 현재 순번:', seq)

      const currentStationData = passengerData[seq]
      const previousStationData = passengerData[seq - 1] || null

      if (!currentStationData) {
        console.warn(
          '[WARN] CSV에서 해당 순번 데이터를 찾을 수 없음. 순번:',
          seq
        )
        continue
      }

      // 평균 승차 인원 계산 (현재 정류장 - 이전 정류장)
      let avgPass = parseFloat(currentStationData[timeSlot] || 0)
      if (previousStationData) {
        avgPass -= parseFloat(previousStationData[timeSlot] || 0)
      }
      avgPass = Math.max(avgPass, 0) // 음수 값 방지

      const totalPass = avgPass * (60 / 15) // 시간당 환산
      console.log(
        '[DEBUG] 평균 승차 인원:',
        avgPass,
        '시간당 승차 인원:',
        totalPass
      )

      // 포아송 확률 계산
      const targetPass = Math.max(1, Math.floor(totalPass - remainSeats))
      const prob = poissonProb(targetPass, totalPass, remainSeats)

      console.log('[DEBUG] 포아송 계산 값:', {
        seq,
        targetPass,
        totalPass,
        prob
      })

      probabilities.push({ seq, probability: prob * 100 })

      // 남은 좌석 업데이트
      remainSeats -= avgPass
      remainSeats = Math.max(remainSeats, 0) // 음수 방지
    }

    console.log('[INFO] 모든 확률 결과:', probabilities)

    // 60% 이상 확률 필터링
    const filteredStations = probabilities.filter(
      ({ probability }) => probability >= 60
    )
    console.log('[INFO] 60% 이상 확률 정류장:', filteredStations)

    return filteredStations
  } catch (error) {
    console.error('[ERROR] 포아송 계산 실패:', error)
    throw error
  }
}

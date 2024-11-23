import { calculateAvailableSeats } from './seatCalculation'
import Papa from 'papaparse'

/**
 * CSV 파일에서 승차 인원 데이터를 읽어오는 함수
 * @param {string} filePath - CSV 파일 경로 (URL 형태)
 * @returns {Promise<Object>} 정류장별 승차 인원 데이터
 */
async function loadPassengerData(filePath) {
  return new Promise((resolve, reject) => {
    Papa.parse(filePath, {
      download: true,
      header: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('[ERROR] CSV 파싱 에러:', results.errors)
          reject(results.errors)
        } else {
          const passengerData = {}
          results.data.forEach((record) => {
            passengerData[record['정류장명']] = record
          })
          resolve(passengerData)
        }
      },
      error: (error) => {
        console.error('[ERROR] CSV 로드 실패:', error)
        reject(error)
      }
    })
  })
}

/**
 * 팩토리얼 계산 함수
 * @param {number} n - 입력 숫자
 * @returns {number} 팩토리얼 결과
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
 * @param {number} k - 목표 값
 * @param {number} lambda - 평균 값
 * @returns {number} 계산된 확률 값
 */
function poissonProb(k, lambda) {
  const eMinusLambda = Math.exp(-lambda)
  const lambdaPowerK = Math.pow(lambda, k)
  const factorialK = factorial(k)
  return (eMinusLambda * lambdaPowerK) / factorialK
}

/**
 * 포아송 확률을 이용한 정류장별 확률 계산
 * @param {Object} options - 옵션 객체
 * @param {Object} options.arrivalInfo - 도착 정보 (여석 계산용)
 * @param {string} options.routeId - 노선 ID
 * @param {number} options.startSeq - 시작 정류장 순번
 * @param {number} options.endSeq - 종점 정류장 순번
 * @param {string} options.filePath - CSV 파일 경로
 * @param {string} options.timeSlot - 시간대 (예: '17시')
 * @param {Array} options.stations - 정류장 목록
 * @returns {Promise<Array>} 각 정류장의 확률 데이터
 */
export async function calculateBoardingProbability({
  arrivalInfo,
  routeId,
  startSeq,
  endSeq,
  filePath,
  timeSlot,
  stations
}) {
  // 여석 계산
  const remainSeats = calculateAvailableSeats(arrivalInfo)

  // CSV 데이터 로드
  const passengerData = await loadPassengerData(filePath)

  const probabilities = []

  for (let seq = startSeq; seq <= endSeq; seq++) {
    // 정류장 이름 및 정보 가져오기
    const station = stations.find((s) => s.idx === seq)
    if (!station) continue

    const stationName = station.stationName

    const avgPass = parseFloat(passengerData[stationName]?.[timeSlot] || 0)
    const totalPass = avgPass * (60 / 15) // 15분 단위 승차 인원을 시간당 환산

    const k = totalPass - remainSeats
    const lambda = totalPass

    const prob = k <= 0 ? 1 : poissonProb(k, lambda)

    probabilities.push({ stationName, probability: prob * 100 })
  }

  // 60% 이상 확률 필터링
  const filteredStations = probabilities.filter(
    (station) => station.probability >= 60
  )

  return filteredStations
}

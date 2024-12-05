/**
 * 10분 내 여석 합산 로직
 * @param {Object} arrivalInfo - 도착 정보 (firstBus, secondBus 포함)
 * @returns {number} 계산된 남은 좌석 수
 */
export function calculateAvailableSeats(arrivalInfo) {
  if (
    arrivalInfo.firstBus.predictTime <= 10 &&
    arrivalInfo.secondBus.predictTime <= 10
  ) {
    // 10분 이내 두 버스의 남은 좌석 합산
    const totalSeats =
      arrivalInfo.firstBus.remainSeats + arrivalInfo.secondBus.remainSeats
    console.log('[INFO] 10분 내 두 버스 여석 합산:', totalSeats)
    return totalSeats
  } else {
    // 10분 초과일 경우 첫 번째 버스의 남은 좌석만 사용
    const firstBusSeats = arrivalInfo.firstBus.remainSeats
    console.log('[INFO] 첫 번째 버스 여석만 사용:', firstBusSeats)
    return firstBusSeats
  }
}

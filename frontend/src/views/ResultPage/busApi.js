import axios from 'axios'

// 버스 노선 정보 사전 데이터
const busRouteData = {
  '5000A': { busID: 11151 },
  '5000B': { busID: 11011 },
  1112: { busID: 10052 },
  6001: { busID: 16017 }
}

// 오디세이 API 키
const apiKey = 'dWY4QsIARSUXfD8U1ZdSig'

// 오디세이 버스 상세 노선 조회 API 호출 함수
export async function fetchBusRouteDetails(busNo) {
  const busID = busRouteData[busNo]?.busID
  if (!busID) {
    throw new Error(
      `[ERROR] 버스 번호 ${busNo}에 해당하는 busID를 찾을 수 없습니다.`
    )
  }

  const url = 'https://api.odsay.com/v1/api/busLaneDetail'
  const params = {
    apiKey,
    busID,
    lang: 0, // 한국어
    output: 'json'
  }

  try {
    const response = await axios.get(url, { params })
    console.log('[INFO] API 응답 데이터:', response.data)
    return response.data.result
  } catch (error) {
    console.error('[ERROR] API 호출 실패:', error)
    throw error
  }
}

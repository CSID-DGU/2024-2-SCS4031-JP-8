// gyeonggiBusAPI.js
// 경기도 버스 노선 조회
// 경기도 버스 노선 조회 API를 사용하여 버스 노선 정보를 조회하는 함수
// https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15080662
// API 사용 신청 후 발급받은 서비스 키를 사용하여 API 호출
// 서비스 키는 URL 인코딩 또는 디코딩이 필요함
// XML 형식으로 응답을 받아야 하므로 text()로 받아야 함
// DOMParser를 사용하여 XML 파싱
// 필요한 데이터를 추출하여 JSON 형태로 반환
// API 호출에 실패하면 에러를 던지고 콘솔에 에러 메시지 출력
// API 호출에 성공하면 콘솔에 XML 응답과 파싱 결과를 출력
// API 호출에 성공하면 JSON 형태로 변환된 데이터를 반환

const serviceKeyEncoded =
  'EVTsGjdsoUlBtJTpdh%2FitgFJXzeeNK%2FBP4lN8my%2Bi9AaoLGNln1kqRcyVP7CVRY8GsiXkX%2BOMl2HviEvq6hlfQ%3D%3D' // 인코딩된 서비스 키
const serviceKeyDecoded =
  'EVTsGjdsoUlBtJTpdh/itgFJXzeeNK/BP4lN8my+i9AaoLGNln1kqRcyVP7CVRY8GsiXkX+OMl2HviEvq6hlfQ==' // 디코딩된 서비스 키

export async function getBusRouteList(keyword) {
  // API 호출 URL
  const url = `https://apis.data.go.kr/6410000/busrouteservice/getBusRouteList`
  const queryParams = `?serviceKey=${serviceKeyEncoded}&keyword=${encodeURIComponent(
    keyword
  )}`

  try {
    const response = await fetch(url + queryParams)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const xmlData = await response.text() // API가 XML 형식이므로 text로 받아야 함
    // XML 응답을 콘솔에 출력하여 확인
    console.log('API XML 응답: ', xmlData)

    // DOMParser를 사용하여 XML 파싱
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlData, 'application/xml')

    // 필요한 데이터 추출 (예: busRouteList 정보)
    const busRoutes = xmlDoc.getElementsByTagName('busRouteList')
    console.log('busRouteList 추출 결과: ', busRoutes) // busRouteList 확인용

    const routesArray = Array.from(busRoutes).map((route) => ({
      routeId: route.getElementsByTagName('routeId')[0]?.textContent,
      routeName: route.getElementsByTagName('routeName')[0]?.textContent,
      routeTypeCd: route.getElementsByTagName('routeTypeCd')[0]?.textContent,
      routeTypeName:
        route.getElementsByTagName('routeTypeName')[0]?.textContent,
      regionName: route.getElementsByTagName('regionName')[0]?.textContent,
      districtCd: route.getElementsByTagName('districtCd')[0]?.textContent
    }))

    console.log('파싱된 결과: ', routesArray) // 파싱된 결과 확인용
    return routesArray // JSON 형태로 반환
  } catch (error) {
    console.error('Error fetching bus route data:', error)
    throw error
  }
}

import Papa from 'papaparse' // CSV 파싱 라이브러리 (https://www.npmjs.com/package/papaparse)

/**
 * CSV 파일 로드 및 파싱
 * @param {string} filePath - CSV 파일 경로
 * @returns {Promise<Object>} 정류장별 승차 데이터
 */
export async function loadCSVData(filePath) {
  return new Promise((resolve, reject) => {
    Papa.parse(filePath, {
      download: true,
      header: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('[ERROR] CSV 파싱 에러:', results.errors)
          reject(results.errors)
        } else {
          const parsedData = results.data.reduce((acc, row) => {
            const stationName = row['StationName'] // CSV에서 정류장 이름 열
            const timeSlot = row['TimeSlot'] // CSV에서 시간대 열
            const passengerCount = parseFloat(row['PassengerCount'] || 0) // 승차 인원 열

            if (!acc[stationName]) acc[stationName] = {}
            acc[stationName][timeSlot] = passengerCount

            return acc
          }, {})
          console.log('[INFO] CSV 데이터 파싱 완료:', parsedData)
          resolve(parsedData)
        }
      },
      error: (error) => {
        console.error('[ERROR] CSV 로드 실패:', error)
        reject(error)
      }
    })
  })
}

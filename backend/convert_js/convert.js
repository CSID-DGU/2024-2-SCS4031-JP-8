// 필요한 라이브러리 가져오기
const fs = require('fs')
const { parse, stringify } = require('csv')
const path = require('path')

// CSV 파일 읽기
const inputFilePath = '5000B_week.csv'
const outputFilePath = 'passenger_flow.csv'

// 승하차 인원 계산 함수
function calculatePassengerFlow(series) {
  return series.map((value, index, arr) => {
    if (index === 0) return 0 // 첫 번째 값은 diff를 계산할 수 없으므로 0
    return Math.abs(value - arr[index - 1])
  })
}

// CSV 파일 처리 함수
function processCsv(filePath) {
  const csvData = fs.readFileSync(filePath, 'utf8')

  parse(csvData, { columns: true }, (err, records) => {
    if (err) {
      console.error('CSV 파싱 오류:', err)
      return
    }

    // '정류장명' 열을 제외한 모든 열을 숫자형으로 변환
    const numericColumns = Object.keys(records[0]).filter(
      (col) => col !== '정류장명'
    )
    const resultRecords = []

    records.forEach((record, rowIndex) => {
      // 새로운 데이터프레임용 객체 생성
      const resultRecord = { 정류장명: record['정류장명'] }

      numericColumns.forEach((col) => {
        record[col] = parseFloat(record[col]) || 0 // NaN 값을 0으로 대체
      })

      // 각 시간대별로 승하차 인원 계산
      if (rowIndex === 0) {
        // 첫 번째 행의 승하차 인원은 원래 값 유지
        numericColumns.forEach((col) => {
          resultRecord[`${col}_승하차`] = parseFloat(record[col]) || 0
        })
      } else {
        numericColumns.forEach((col) => {
          const previousValue = parseFloat(records[rowIndex - 1][col]) || 0
          const currentValue = parseFloat(record[col]) || 0
          resultRecord[`${col}_승하차`] = Math.abs(currentValue - previousValue)
        })
      }

      resultRecords.push(resultRecord)
    })

    // 결과 저장
    stringify(resultRecords, { header: true }, (err, output) => {
      if (err) {
        console.error('CSV 변환 오류:', err)
        return
      }
      fs.writeFileSync(outputFilePath, output, 'utf8')
      console.log(
        "처리가 완료되었습니다. 'passenger_flow.csv' 파일을 확인해주세요."
      )
    })
  })
}

// CSV 파일 처리 실행
processCsv(inputFilePath)

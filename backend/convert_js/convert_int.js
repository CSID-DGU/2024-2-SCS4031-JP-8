// 필요한 라이브러리 가져오기
const fs = require('fs')
const { parse, stringify } = require('csv')
const path = require('path')

// CSV 파일 읽기
const inputFilePath = 'passenger_flow.csv'
const outputFilePath = 'int_passenger_flow.csv'

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
    records.forEach((record) => {
      numericColumns.forEach((col) => {
        // 소수점 값을 반올림하여 정수로 변환
        if (record[col] !== null && record[col] !== '') {
          record[col] = Math.round(parseFloat(record[col]) || 0)
        } else {
          record[col] = 0 // NaN 값을 0으로 대체
        }
      })
    })

    // 결과 저장
    stringify(records, { header: true }, (err, output) => {
      if (err) {
        console.error('CSV 변환 오류:', err)
        return
      }
      fs.writeFileSync(outputFilePath, output, 'utf8')
      console.log('처리가 완료되었습니다. 파일을 확인해주세요.')
    })
  })
}

// CSV 파일 처리 실행
processCsv(inputFilePath)

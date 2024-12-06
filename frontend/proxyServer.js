const express = require('express')
const axios = require('axios')
const app = express()
const port = 3001

// CORS 설정 추가
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
})

app.get('/api/bus-info', async (req, res) => {
  const { busRouteId } = req.query
  const serviceKey =
    'EVTsGjdsoUlBtJTpdh/itgFJXzeeNK/BP4lN8my+i9AaoLGNln1kqRcyVP7CVRY8GsiXkX+OMl2HviEvq6hlfQ=='
  const url = `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRouteAll?serviceKey=${encodeURIComponent(
    serviceKey
  )}&busRouteId=${encodeURIComponent(busRouteId)}`

  try {
    const response = await axios.get(url, { responseType: 'text' })
    console.log('API 응답 데이터:', response.data) // XML 데이터 확인
    res.send(response.data) // XML 데이터를 그대로 전달
  } catch (error) {
    console.error('API 요청 중 오류 발생:', error)
    res.status(500).send('API 요청 실패')
  }
})

app.listen(port, () => {
  console.log(`프록시 서버가 http://localhost:${port} 에서 실행 중입니다.`)
})

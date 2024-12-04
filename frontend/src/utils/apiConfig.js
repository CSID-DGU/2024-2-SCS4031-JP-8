const apiConfig = {
  naverClientId: process.env.VUE_APP_NAVER_CLIENT_ID,
  naverClientSecret: process.env.VUE_APP_NAVER_CLIENT_SECRET,
  odsayApiKey: process.env.VUE_APP_ODSAY_API_KEY,
  naverDevKey: process.env.VUE_APP_NAVER_DEV_API_KEY,
  busServiceKeyEncoded: process.env.VUE_APP_BUS_SERVICE_KEY_ENCODED,
  busServiceKeyDecoded: process.env.VUE_APP_BUS_SERVICE_KEY_DECODED
}

export default apiConfig
///////////
// 사용법 //
///////////
// import apiConfig from '@/utils/API/apiConfig'

// function initializeAPI() {
//   const naverKey = apiConfig.NAVER_CLIENT_ID;
//   const odsayKey = apiConfig.ODSAY_API_KEY;

//   // API에 연결할 때 사용
//   console.log(`NAVER API Key: ${naverKey}`);
//   console.log(`ODSAY API Key: ${odsayKey}`);
// }

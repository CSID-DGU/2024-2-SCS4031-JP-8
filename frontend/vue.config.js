const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const dotenv = require('dotenv')
const webpack = require('webpack') // webpack import 추가
dotenv.config()

module.exports = defineConfig({
  lintOnSave: false,
  transpileDependencies: true,
  chainWebpack: (config) => {
    // ESLint 비활성화
    config.module.rules.delete('eslint')
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: true, // Options API 사용 여부
        __VUE_PROD_DEVTOOLS__: false, // 프로덕션에서 devtools 사용 여부
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false // Hydration Mismatch 플래그
      })
    ]
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'https://apis.data.go.kr', // API 서버의 URL
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      },
      '/v1/search': {
        target: 'https://openapi.naver.com', // Naver API 주소
        changeOrigin: true, // CORS 해결을 위한 설정
        pathRewrite: { '^/v1/search': '/v1/search' }, // 실제 경로와 일치하도록 설정
        secure: false // HTTPS 인증서 관련 문제 무시
      }
    }
  }
})

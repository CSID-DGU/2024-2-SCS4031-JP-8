/* eslint-disable */
import { createRouter, createWebHashHistory } from 'vue-router'
import BusInfo from '../views/BusInfoPage.vue'
import BusSearchResults from '../views/BusSearchResultsPage.vue'
import NaverMapView from '../views/MapTestPage/NaverMapView.vue'
import { NaverMap } from 'vue3-naver-maps'
import NaverLocationSearchView from '@/views/MapTestPage/NaverLocationSearchView.vue'
import OdisayAPITestView from '@/views/MapTestPage/OdisayAPITestView.vue'
import GeologicalAPITest from '@/views/MapTestPage/GeologicalAPITest.vue'
import odi from '@/views/MapTestPage/odi.vue'
import RouteSearchResultView from '@/views/MapTestPage/RouteSearchResultView.vue'
import KakaoAPIView from '@/views/MapTestPage/kakaoAPIView.vue'
import plus from '@/views/MapTestPage/plus.vue'
import Mobiletest from '@/views/real/mobiletest.vue'
import Kakaokeyword from '@/views/MapTestPage/kakaokeyword.vue'
import gonggong from '@/views/real/gonggong.vue'

//real
import MainPage from '@/views/real/MainPage.vue'
import SearchDeparturePage from '@/views/real/SearchDeparturePage.vue'
import SearchDestinationPage from '@/views/real/SearchDestinationPage.vue'
import BusSearchPage from '@/views/real/BusSearchPage.vue'
import BusRouteDetailsPage from '@/views/real/BusRouteDetailsPage.vue'
import DetailedRoutePage from '@/views/real/DetailedRoutePage.vue'
import Gonggong from '@/views/real/gonggong.vue'
import BusDetailInfo from '@/views/real/BusDetailInfo.vue'
import BusDetailLocation from '@/views/real/BusDetailLocation.vue'
import FinalPage from '@/views/real/test/FinalPage.vue'
import Debugging from '@/views/real/test/Debugging.vue'
import PathfindingPage from '@/views/real/PathfindingPage.vue'
import PathDetail from '@/views/real/PathDetailPage.vue'
import ResultPage from '@/views/real/test/ResultPage.vue'

const routes = [
  { path: '/', component: MainPage }, // MainPage.vue
  { path: '/search-departure', component: SearchDeparturePage }, // 출발지 검색
  { path: '/search-destination', component: SearchDestinationPage }, // 도착지 검색
  { path: '/bus-search', component: BusSearchPage }, // 버스 검색 페이지
  {
    path: '/bus-route-details',
    component: BusRouteDetailsPage,
    props: (route) => ({
      busNumber: route.query.busNumber,
      departure: route.query.departure,
      destination: route.query.destination
    })
  }, // 정류장 정보 페이지
  {
    path: '/detailed-route',
    component: DetailedRoutePage,
    props: (route) => ({
      departure: route.query.departure,
      destination: route.query.destination,
      stop: route.query.stop
    })
  }, // 상세 경로 페이지
  {
    path: '/route',
    name: 'RouteSearchResultView',
    component: RouteSearchResultView
  },
  {
    path: '/final',
    name: 'FinalPage',
    component: FinalPage
  },
  {
    path: '/pathfinding',
    name: 'PathfindingPage',
    component: PathfindingPage
  },
  {
    path: '/pathfinding',
    name: 'PathfindingPage',
    component: PathfindingPage
  },
  {
    path: '/pathdetail',
    name: 'PathDetail',
    component: PathDetail
  },
  {
    path: '/result',
    name: 'ResultPage',
    component: ResultPage
  },
  // {
  //   path: '/',
  //   name: 'BusInfoPage',
  //   component: BusInfo
  // },
  // {
  //   path: '/search',
  //   name: 'BusSearchResults',
  //   component: () =>
  //     import(
  //       /* webpackChunkName: "about" */ '../views/BusSearchResultsPage.vue'
  //     )
  // },
  // {
  //   path: '/map',
  //   name: 'NaverMapView',
  //   component: NaverMapView
  // },
  // {
  //   path: '/location',
  //   name: 'NaverLocationSearchView',
  //   component: NaverLocationSearchView
  // },

  {
    path: '/geo',
    name: 'GeologicalAPITest',
    component: GeologicalAPITest
  },
  {
    path: '/bus',
    name: 'BusDetailInfo',
    component: BusDetailInfo
  },
  {
    path: '/odi',
    name: 'odi',
    component: odi
  },
  {
    path: '/gong',
    name: 'gong',
    component: gonggong
  },
  {
    path: '/buslocation',
    name: 'buslocation',
    component: BusDetailLocation
  },
  {
    path: '/buslocation',
    name: 'buslocation',
    component: BusDetailLocation
  },
  {
    path: '/debugging',
    name: 'debugging',
    component: Debugging
  }

  // {
  //   path: '/kakao',
  //   name: 'KakaoAPIView',
  //   component: KakaoAPIView
  // },
  // {
  //   path: '/plus',
  //   name: 'plus',
  //   component: plus
  // },
  // {
  //   path: '/mobile',
  //   name: 'mobiletest',
  //   component: Mobiletest
  // },
  // {
  //   path: '/kakaoo',
  //   name: 'kakao',
  //   component: Kakaokeyword
  // },

  // {
  //   path: '/:catchAll(.*)',
  //   redirect: '/auth/signin' // 잘못된 경로는 로그인 페이지로 리다이렉트
  // }

  //{ path: '*', component: NotFoundPage } // 404 페이지 처리 (활성화 필요시)
]

const router = createRouter({
  history: createWebHashHistory('/busmiri/'), // Hash 모드를 사용
  routes
})

export default router

//component: importedViews['HomeView'], // 자동 임포트 적용

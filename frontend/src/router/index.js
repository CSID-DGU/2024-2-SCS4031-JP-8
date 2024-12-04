/* eslint-disable */
import { createRouter, createWebHashHistory } from 'vue-router'
//import BusInfo from '../views/ATrash/BusInfoPage.vue'
//import BusSearchResults from '../views/ATrash/BusSearchResultsPage.vue'
//import NaverMapView from '../views/ATrash/MapTestPage/NaverMapView.vue'
import { NaverMap } from 'vue3-naver-maps'
//import NaverLocationSearchView from '@/views/ATrash/MapTestPage/NaverLocationSearchView.vue'
//import OdisayAPITestView from '@/views/ATrash/MapTestPage/OdisayAPITestView.vue'
//import GeologicalAPITest from '@/views/ATrash/MapTestPage/GeologicalAPITest.vue'
//import odi from '@/views/ATrash/MapTestPage/odi.vue'
//import RouteSearchResultView from '@/views/ATrash/MapTestPage/RouteSearchResultView.vue'
//import KakaoAPIView from '@/views/ATrash/MapTestPage/kakaoAPIView.vue'
//import plus from '@/views/ATrash/MapTestPage/plus.vue'
//import Mobiletest from '@/views/ATrash/real/mobiletest.vue'
//import Kakaokeyword from '@/views/ATrash/MapTestPage/kakaokeyword.vue'
//import gonggong from '@/views/ATrash/real/gonggong.vue'

//real
import MainPage from '@/views/Mainpage/MainPage.vue'
import SearchDeparturePage from '@/views/SearchPage/SearchDeparturePage.vue'
import SearchDestinationPage from '@/views/SearchPage/SearchDestinationPage.vue'
//import BusSearchPage from '@/views/ATrash/real/BusSearchPage.vue'
//import BusRouteDetailsPage from '@/views/ATrash/real/BusRouteDetailsPage.vue'
//import DetailedRoutePage from '@/views/ATrash/real/DetailedRoutePage.vue'
//import Gonggong from '@/views/ATrash/real/gonggong.vue'
//import BusDetailInfo from '@/views/ATrash/real/BusDetailInfo.vue'
import BusDetailLocation from '@/views/ResultPage/BusDetailPage/BusDetailLocation.vue'
//import FinalPage from '@/views/ATrash/test/FinalPage.vue'
//import Debugging from '@/views/ATrash/test/Debugging.vue'
import PathfindingPage from '@/views/PathPage/PathfindingPage.vue'
import PathDetail from '@/views/PathPage/PathDetailPage.vue'
import ResultPage from '@/views/ResultPage/ResultPage.vue'
import NoBusPathDetailPage from '@/views/NoBusPathPage/NoBusPathDetailPage.vue'
import NoBusPathfindingPage from '@/views/NoBusPathPage/NoBusPathfindingPage.vue'

const routes = [
  { path: '/', name: 'MainPage', component: MainPage }, // MainPage.vue
  {
    path: '/search-departure',
    name: 'SearchDeparturePage',
    component: SearchDeparturePage
  }, // 출발지 검색
  {
    path: '/search-destination',
    name: 'SearchDestinationPage',
    component: SearchDestinationPage
  }, // 도착지 검색
  {
    path: '/result',
    name: 'ResultPage',
    component: ResultPage
  },
  {
    path: '/buslocation',
    name: 'buslocation',
    component: BusDetailLocation
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
    path: '/nobusroutedetail',
    name: 'NoBusPathDetailPage',
    component: NoBusPathDetailPage
  },
  {
    path: '/nobusroute',
    name: 'NoBusPathfindingPage',
    component: NoBusPathfindingPage
  }

  //{ path: '/bus-search', component: BusSearchPage }, // 버스 검색 페이지
  // {
  //   path: '/bus-route-details',
  //   component: BusRouteDetailsPage,
  //   props: (route) => ({
  //     busNumber: route.query.busNumber,
  //     departure: route.query.departure,
  //     destination: route.query.destination
  //   })
  // }, // 정류장 정보 페이지
  // {
  //   path: '/detailed-route',
  //   component: DetailedRoutePage,
  //   props: (route) => ({
  //     departure: route.query.departure,
  //     destination: route.query.destination,
  //     stop: route.query.stop
  //   })
  // }, // 상세 경로 페이지
  // {
  //   path: '/route',
  //   name: 'RouteSearchResultView',
  //   component: RouteSearchResultView
  // },
  // {
  //   path: '/final',
  //   name: 'FinalPage',
  //   component: FinalPage
  // },

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

  // {
  //   path: '/geo',
  //   name: 'GeologicalAPITest',
  //   component: GeologicalAPITest
  // },
  // {
  //   path: '/bus',
  //   name: 'BusDetailInfo',
  //   component: BusDetailInfo
  // },
  // {
  //   path: '/odi',
  //   name: 'odi',
  //   component: odi
  // },
  // {
  //   path: '/gong',
  //   name: 'gong',
  //   component: gonggong
  // },

  // {
  //   path: '/debugging',
  //   name: 'debugging',
  //   component: Debugging
  // }

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
// import { ResultPage } from '@/views/real/ResultPage/ResultPage.vue'

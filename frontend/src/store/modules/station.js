const state = {
  stationData: null, // 정류장 정보
  finalResults: [] // 최종 계산 결과
}

const mutations = {
  SET_STATION_DATA(state, data) {
    state.stationData = data
  },
  SET_FINAL_RESULTS(state, results) {
    state.finalResults = results
  }
}

export default {
  namespaced: true,
  state,
  mutations
}

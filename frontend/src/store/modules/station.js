const state = {
  stationData: null,
  finalResults: []
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

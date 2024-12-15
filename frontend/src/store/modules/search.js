export const search = {
  namespaced: true,
  state: () => ({
    results: []
  }),
  mutations: {
    SET_RESULTS(state, payload) {
      state.results = payload
    }
  },
  actions: {
    setResults({ commit }, results) {
      commit('SET_RESULTS', results)
    }
  },
  getters: {
    getResults: (state) => state.results
  }
}

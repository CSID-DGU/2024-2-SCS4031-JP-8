const state = {
  route: null
}

const mutations = {
  setRoute(state, route) {
    state.route = route
  }
}

const actions = {
  updateRoute({ commit }, route) {
    commit('setRoute', route)
  }
}

const getters = {
  getRoute(state) {
    return state.route
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

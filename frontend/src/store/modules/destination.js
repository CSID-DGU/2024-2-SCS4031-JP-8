const state = {
  initialize: false, // 초기화 플래그
  destination: null
}

const mutations = {
  setDestination(state, destination) {
    state.destination = destination
    console.log('Vuex - setDestination:', state.destination)
  },
  resetDestination(state) {
    state.destination = null
  },
  setInitialize(state, initialize) {
    state.initialize = initialize
  }
}

const actions = {
  updateDestination({ commit }, destination) {
    commit('setDestination', destination)
  },
  initialize({ commit, state }) {
    if (!state.initialize) {
      commit('setInitialize', true)
      commit('resetDestination')
    }
  }
}

const getters = {
  getDestination(state) {
    return state.destination
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

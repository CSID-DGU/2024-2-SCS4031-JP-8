const state = {
  initialize: false,
  departure: null
}

const mutations = {
  setDeparture(state, departure) {
    state.departure = departure
    console.log('Vuex - setDeparture:', state.departure)
  },
  resetLocations(state) {
    state.departure = null
  },
  setInitialize(state, initialize) {
    state.initialize = initialize
  }
}

const actions = {
  updateDeparture({ commit }, departure) {
    commit('setDeparture', departure)
  },
  initialize({ commit, state }) {
    if (!state.initialize) {
      commit('setInitialize', true)
      commit('resetLocations')
    }
  }
}

const getters = {
  getDeparture(state) {
    return state.departure
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

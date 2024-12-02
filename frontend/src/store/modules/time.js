const state = {
  initialize: false, // 초기화 플래그 추가
  month: new Date().getMonth() + 1, // 0부터 시작하므로 +1
  day: new Date().getDate(),
  hour: new Date().getHours(),
  minute: new Date().getMinutes()
}

const mutations = {
  setTime(state, { month, day, hour, minute }) {
    state.month = month
    state.day = day
    state.hour = hour
    state.minute = minute
  },
  resetTime(state) {
    // 기본 값을 현재 시간으로 설정
    const now = new Date()
    state.month = now.getMonth() + 1
    state.day = now.getDate()
    state.hour = now.getHours()
    state.minute = now.getMinutes()
  },
  setInitialize(state, initialize) {
    state.initialize = initialize
  }
}

const actions = {
  updateTime({ commit }, time) {
    commit('setTime', time)
  },
  initialize({ commit, state }) {
    if (!state.initialize) {
      commit('setInitialize', true)
      commit('resetTime')
    }
  }
}

const getters = {
  getTime(state) {
    const now = new Date()
    return {
      month: state.month || now.getMonth() + 1,
      day: state.day || now.getDate(),
      hour: state.hour || now.getHours(),
      minute: state.minute || now.getMinutes()
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

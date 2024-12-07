<template>
  <div class="search-form">
    <div class="input-group">
      <MapPinIcon class="input-icon" />
      <input
        v-model="departureName"
        placeholder="출발지를 입력하세요"
        @focus="goToSearchDeparture"
        readonly
      />
      <XCircleIcon
        v-if="departureName"
        @click="clearDeparture"
        class="clear-button"
      />
    </div>
    <div class="input-group">
      <FlagIcon class="input-icon" />
      <input
        v-model="destinationName"
        placeholder="도착지를 입력하세요"
        @focus="goToSearchDestination"
        readonly
      />
      <XCircleIcon
        v-if="destinationName"
        @click="clearDestination"
        class="clear-button"
      />
    </div>

    <div class="input-group">
      <ClockIcon class="input-icon" />
      <input :value="formattedTime" @click="openTimeModal" readonly />
      <button
        @click="setCurrentTime"
        class="realtime-button"
        :class="{
          'current-time': isCurrentTime,
          'not-current-time': !isCurrentTime
        }"
      >
        <ZapIcon class="realtime-icon" />
        실시간
      </button>
    </div>

    <div class="switch-button-container">
      <button @click="switchLocations" class="switch-button">
        <ArrowDownUp class="switch-icon" />
        출발지와 도착지 바꾸기
      </button>
    </div>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showTimeModal" class="modal">
          <div class="modal-content">
            <div class="modal-handle"></div>
            <h3>출발 시각 설정</h3>
            <div class="time-selector">
              <div class="date-picker scrollable">
                <button
                  v-for="(day, index) in dateOptions"
                  :key="index"
                  @click="tempSelectedDay = day.value"
                  :class="{ selected: tempSelectedDay === day.value }"
                >
                  {{ day.text }}
                </button>
              </div>
              <div class="time-picker">
                <div class="scrollable">
                  <div
                    v-for="hour in 12"
                    :key="hour"
                    class="time-option"
                    :class="{ selected: tempSelectedHour === hour }"
                    @click="tempSelectedHour = hour"
                  >
                    {{ hour.toString().padStart(2, '0') }}
                  </div>
                </div>
                <span class="time-separator">:</span>
                <div class="scrollable">
                  <div
                    v-for="minute in 6"
                    :key="minute"
                    class="time-option"
                    :class="{
                      selected: tempSelectedMinute === (minute - 1) * 10
                    }"
                    @click="tempSelectedMinute = (minute - 1) * 10"
                  >
                    {{ ((minute - 1) * 10).toString().padStart(2, '0') }}
                  </div>
                </div>
              </div>
              <div class="meridiem-picker">
                <button
                  @click="tempSelectedMeridiem = 'AM'"
                  :class="{ selected: tempSelectedMeridiem === 'AM' }"
                >
                  오전
                </button>
                <button
                  @click="tempSelectedMeridiem = 'PM'"
                  :class="{ selected: tempSelectedMeridiem === 'PM' }"
                >
                  오후
                </button>
              </div>
            </div>
            <div class="modal-actions">
              <button @click="confirmTime" class="modal-button primary">
                설정
              </button>
              <button @click="closeTimeModal" class="modal-button secondary">
                닫기
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import {
  MapPinIcon,
  FlagIcon,
  ClockIcon,
  XCircleIcon,
  ZapIcon,
  ArrowDownUp
} from 'lucide-vue-next'

const store = useStore()
const router = useRouter()

const showTimeModal = ref(false)
const selectedMeridiem = ref('AM')
const selectedDay = ref('today')
const selectedHour = ref('')
const selectedMinute = ref('')

const tempSelectedMeridiem = ref('AM')
const tempSelectedDay = ref('today')
const tempSelectedHour = ref('')
const tempSelectedMinute = ref('')

const dateOptions = ref([])

const departureName = computed({
  get: () => {
    const name = store.state.departure.departure?.name || ''
    logVuexState('출발지 변경')
    return name
  },
  set: (value) => {
    store.commit('departure/setDeparture', { name: value })
    logVuexState('출발지 설정')
  }
})

const destinationName = computed({
  get: () => {
    const name = store.state.destination.destination?.name || ''
    logVuexState('도착지 변경')
    return name
  },
  set: (value) => {
    store.commit('destination/setDestination', { name: value })
    logVuexState('도착지 설정')
  }
})

const clearDeparture = () => {
  store.commit('departure/setDeparture', { name: '', coordinates: {} })
  logVuexState('출발지 초기화')
}
const clearDestination = () => {
  store.commit('destination/setDestination', { name: '', coordinates: {} })
  logVuexState('도착지 초기화')
}

const formattedTime = computed(() => {
  const time = store.getters['time/getTime']
  console.log('[DEBUG] formattedTime 계산 중:', time)

  if (!time) {
    return '출발 시간을 설정하세요'
  }

  const dayText =
    time.day === new Date().getDate()
      ? '오늘'
      : time.day === new Date().getDate() + 1
      ? '내일'
      : `${time.month}월 ${time.day}일`

  const meridiemText = time.hour >= 12 ? '오후' : '오전'
  const formattedHour = time.hour % 12 || 12 // 12시간제로 표시
  const formattedMinute = time.minute.toString().padStart(2, '0')

  return `${dayText} ${meridiemText} ${formattedHour}:${formattedMinute} 출발`
})

watch(
  () => store.getters['time/getTime'],
  (newTime) => {
    console.log('[DEBUG] Vuex 시간 상태 변경 감지:', newTime)
  },
  { immediate: true } // 초기 값도 감지
)

const setCurrentTime = () => {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const hour = now.getHours()
  const minute = now.getMinutes()

  // Vuex 상태 업데이트
  store.commit('time/setTime', { month, day, hour, minute })

  // 상태 업데이트 확인 로그
  console.log(
    '[DEBUG] setCurrentTime 호출 완료:',
    store.getters['time/getTime']
  )
}

const openTimeModal = () => {
  tempSelectedDay.value = selectedDay.value
  tempSelectedMeridiem.value = selectedMeridiem.value
  tempSelectedHour.value = selectedHour.value
  tempSelectedMinute.value = selectedMinute.value
  logVuexState('시간 설정 모달 열기')

  showTimeModal.value = true
}

const switchLocations = () => {
  const tempDeparture = {
    name: store.state.departure.departure?.name || '',
    coordinates: store.state.departure.departure?.coordinates || {}
  }
  const tempDestination = {
    name: store.state.destination.destination?.name || '',
    coordinates: store.state.destination.destination?.coordinates || {}
  }

  store.commit('departure/setDeparture', tempDestination)
  store.commit('destination/setDestination', tempDeparture)
  logVuexState('출발지와 도착지 교환')
}

const confirmTime = () => {
  selectedDay.value = tempSelectedDay.value
  selectedMeridiem.value = tempSelectedMeridiem.value
  selectedHour.value = tempSelectedHour.value
  selectedMinute.value = tempSelectedMinute.value

  const month = new Date().getMonth() + 1
  const day =
    selectedDay.value === 'today'
      ? new Date().getDate()
      : selectedDay.value === 'tomorrow'
      ? new Date().getDate() + 1
      : parseInt(selectedDay.value)
  const hour =
    selectedMeridiem.value === 'PM'
      ? parseInt(selectedHour.value) + 12
      : parseInt(selectedHour.value)
  const minute = parseInt(selectedMinute.value)

  store.commit('time/setTime', { month, day, hour, minute })
  logVuexState('시간 설정 완료')
  showTimeModal.value = false
}

const closeTimeModal = () => {
  logVuexState('시간 설정 모달 닫기')
  showTimeModal.value = false
}

const generateDateOptions = () => {
  const now = new Date()
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate()
  dateOptions.value = [
    { text: '오늘', value: 'today' },
    { text: '내일', value: 'tomorrow' }
  ]
  for (let i = 2; i <= endOfMonth - now.getDate(); i++) {
    const futureDate = new Date()
    futureDate.setDate(now.getDate() + i)
    dateOptions.value.push({
      text: `${futureDate.getMonth() + 1}월 ${futureDate.getDate()}일`,
      value: `${futureDate.getDate()}`
    })
  }
}

onMounted(() => {
  // Vuex 초기화 액션 호출
  store.dispatch('time/initialize')
  console.log('[DEBUG] 초기화 완료:', store.getters['time/getTime'])
  setCurrentTime()
  generateDateOptions()
})

const goToSearchDeparture = () => router.push({ path: '/search-departure' })
const goToSearchDestination = () => router.push({ path: '/search-destination' })

const isCurrentTime = computed(() => {
  const now = new Date()
  const time = store.getters['time/getTime']
  return (
    time.month === now.getMonth() + 1 &&
    time.day === now.getDate() &&
    time.hour === now.getHours() &&
    time.minute === now.getMinutes()
  )
})

const logVuexState = (action) => {
  console.log(`[DEBUG - ${action}]`)
  console.log('출발지:', store.state.departure.departure)
  console.log('도착지:', store.state.destination.destination)
  console.log('시간:', store.getters['time/getTime'])
}

// Vuex 상태 변화를 감지하여 로그 출력
watch(
  () => store.state.departure.departure,
  () => logVuexState('출발지 변경 감지'),
  { deep: true }
)

watch(
  () => store.state.destination.destination,
  () => logVuexState('도착지 변경 감지'),
  { deep: true }
)

watch(
  () => store.getters['time/getTime'],
  () => logVuexState('시간 변경 감지'),
  { deep: true }
)
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.search-form {
  font-family: 'Pretendard', sans-serif;
  padding: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.input-group {
  position: relative;
  margin-bottom: 12px;
}

.input-group input {
  width: 100%;
  margin: 0;
  padding: 12px 40px 12px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.3s ease;
  height: 44px;
}

.input-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-group input::placeholder {
  color: #94a3b8;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #3b82f6;
  width: 20px;
  height: 20px;
}

.clear-button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  cursor: pointer;
  width: 20px;
  height: 20px;
  transition: color 0.3s ease;
}

.clear-button:hover {
  color: #64748b;
}

.switch-button-container {
  margin-top: 12px;
}

.switch-button {
  width: 100%;
  padding: 12px;
  background: #f1f5f9;
  border: none;
  border-radius: 12px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  height: 44px;
}

.switch-button:hover {
  background: #e2e8f0;
}

.switch-icon {
  margin-right: 8px;
  width: 20px;
  height: 20px;
}

.realtime-button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.realtime-button:hover {
  background: #2563eb;
}

.realtime-icon {
  margin-right: 4px;
  width: 14px;
  height: 14px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0 16px;
  box-sizing: border-box;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 20px 20px 0 0;
  width: 420px;
  max-width: 100%;
  margin: 0 auto;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
}

.time-selector {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.date-picker,
.time-picker .scrollable {
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.date-picker::-webkit-scrollbar,
.time-picker .scrollable::-webkit-scrollbar {
  display: none;
}

.date-picker {
  display: flex;
  gap: 10px;
  padding-bottom: 10px;
}

.date-picker button {
  flex: 0 0 auto;
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  font-size: 14px;
  color: #1e293b;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.date-picker button:active,
.meridiem-picker button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.date-picker button.selected,
.time-option.selected,
.meridiem-picker button.selected {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.time-picker {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.time-picker .scrollable {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 120px; /* 3개의 항목이 보이도록 높이 조정 */
  scroll-behavior: smooth;
  position: relative;
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.time-option {
  padding: 8px;
  font-size: 16px;
  color: #1e293b;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-option.selected {
  font-size: 20px;
  font-weight: 600;
  color: white;
  position: relative;
}

.time-option.selected::before {
  content: '';
  position: absolute;
  left: -10px;
  right: -10px;
  top: 0;
  bottom: 0;
  background-color: #3b82f6;
  z-index: -1;
  border-radius: 20px;
}

.time-separator {
  font-size: 24px;
  color: #64748b;
  align-self: center;
}

.meridiem-picker {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
}

.meridiem-picker button {
  padding: 10px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.meridiem-picker button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.meridiem-picker button.selected {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.modal-button {
  flex: 1;
  padding: 15px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal-button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.modal-button.primary {
  background: #3b82f6;
  color: white;
}

.modal-button.secondary {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.modal-handle {
  width: 40px;
  height: 4px;
  background-color: #e2e8f0;
  border-radius: 2px;
  margin: 0 auto 16px;
}

.realtime-button.current-time {
  background: #3b82f6;
  color: white;
}

.realtime-button.not-current-time {
  background: #e2e8f0;
  color: #64748b;
}
</style>

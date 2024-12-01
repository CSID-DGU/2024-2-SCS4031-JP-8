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
      <button @click="setCurrentTime" class="realtime-button">
        <ZapIcon class="realtime-icon" />
        실시간
      </button>
    </div>

    <div class="switch-button-container">
      <button @click="switchLocations" class="switch-button">
        <ArrowsUpDownIcon class="switch-icon" />
        출발지와 도착지 바꾸기
      </button>
    </div>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showTimeModal" class="modal">
          <div class="modal-content">
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
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import {
  MapPinIcon,
  FlagIcon,
  ClockIcon,
  XCircleIcon,
  ZapIcon,
  ArrowsUpDownIcon
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
  get: () => store.state.departure.departure?.name || '',
  set: (value) => store.commit('departure/setDeparture', { name: value })
})
const destinationName = computed({
  get: () => store.state.destination.destination?.name || '',
  set: (value) => store.commit('destination/setDestination', { name: value })
})

const clearDeparture = () => {
  store.commit('departure/setDeparture', { name: '', coordinates: {} })
}
const clearDestination = () => {
  store.commit('destination/setDestination', { name: '', coordinates: {} })
}

const formattedTime = computed(() => {
  const dayText =
    selectedDay.value === 'today'
      ? '오늘'
      : selectedDay.value === 'tomorrow'
      ? '내일'
      : `${new Date().getMonth() + 1}월 ${selectedDay.value}일`
  const meridiemText = selectedMeridiem.value === 'AM' ? '오전' : '오후'
  return `${dayText} ${meridiemText} ${selectedHour.value}:${
    selectedMinute.value < 10
      ? '0' + selectedMinute.value
      : selectedMinute.value
  } 출발`
})

const setCurrentTime = () => {
  const now = new Date()
  selectedDay.value = 'today'
  selectedMeridiem.value = now.getHours() >= 12 ? 'PM' : 'AM'
  selectedHour.value = now.getHours() % 12 || 12
  selectedMinute.value = now.getMinutes()
}

const openTimeModal = () => {
  tempSelectedDay.value = selectedDay.value
  tempSelectedMeridiem.value = selectedMeridiem.value
  tempSelectedHour.value = selectedHour.value
  tempSelectedMinute.value = selectedMinute.value
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
      : selectedDay.value
  const hour =
    selectedMeridiem.value === 'PM'
      ? selectedHour.value + 12
      : selectedHour.value
  const minute = selectedMinute.value
  store.commit('time/setTime', { month, day, hour, minute })
  showTimeModal.value = false
}

const closeTimeModal = () => {
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
  setCurrentTime()
  generateDateOptions()
})

const goToSearchDeparture = () => router.push({ path: '/search-departure' })
const goToSearchDestination = () => router.push({ path: '/search-destination' })
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.search-form {
  font-family: 'Pretendard', sans-serif;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.input-group {
  position: relative;
  margin-bottom: 16px;
}

.input-group input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.3s ease;
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
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
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
  margin-top: 20px;
}

.switch-button {
  width: 100%;
  padding: 14px;
  background: #f1f5f9;
  border: none;
  border-radius: 12px;
  color: #1e293b;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
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
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
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
  width: 16px;
  height: 16px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 32px;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-content h3 {
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
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
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.date-picker::-webkit-scrollbar,
.time-picker .scrollable::-webkit-scrollbar {
  width: 6px;
}

.date-picker::-webkit-scrollbar-track,
.time-picker .scrollable::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.date-picker::-webkit-scrollbar-thumb,
.time-picker .scrollable::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}

.date-picker button,
.time-option {
  width: 100%;
  padding: 12px;
  text-align: center;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.date-picker button.selected,
.time-option.selected {
  background: #e0f2fe;
  color: #3b82f6;
  border-radius: 8px;
  font-weight: 600;
}

.time-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.time-separator {
  font-size: 24px;
  color: #64748b;
}

.meridiem-picker {
  display: flex;
  gap: 12px;
}

.meridiem-picker button {
  flex: 1;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #1e293b;
  font-size: 16px;
  transition: all 0.3s ease;
}

.meridiem-picker button.selected {
  background: #e0f2fe;
  color: #3b82f6;
  border-color: #3b82f6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-button {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-button.primary {
  background: #3b82f6;
  color: white;
}

.modal-button.primary:hover {
  background: #2563eb;
}

.modal-button.secondary {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-button.secondary:hover {
  background: #e2e8f0;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

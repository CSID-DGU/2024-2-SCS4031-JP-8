<template>
  <div class="search-form">
    <div class="input-group">
      <label><i class="fas fa-map-marker-alt"></i></label>
      <input
        v-model="departureName"
        placeholder="출발지를 입력하세요"
        @focus="goToSearchDeparture"
        readonly
      />
      <button v-if="departureName" @click="clearDeparture" class="clear-button">
        ✕
      </button>
    </div>
    <div class="input-group">
      <label><i class="fas fa-flag-checkered"></i></label>
      <input
        v-model="destinationName"
        placeholder="도착지를 입력하세요"
        @focus="goToSearchDestination"
        readonly
      />
      <button
        v-if="destinationName"
        @click="clearDestination"
        class="clear-button"
      >
        ✕
      </button>
    </div>

    <!-- 최근 경로 -->
    <!-- <div v-if="recentRoutes.length > 0" class="recent-routes">
      <h3>최근 경로</h3>
      <ul>
        <li v-for="(route, index) in recentRoutes" :key="index">
          <span @click="applyRecentRoute(route)">
            {{ route.departureName }} ➔ {{ route.destinationName }}
          </span>
          <button @click="removeRecentRoute(index)">x</button>
        </li>
      </ul>
    </div> -->

    <div class="input-group">
      <label><i class="fas fa-clock"></i></label>
      <input :value="formattedTime" @click="openTimeModal" readonly />
      <button @click="setCurrentTime" class="realtime-button">실시간</button>
    </div>

    <div class="switch-button-container">
      <button @click="switchLocations" class="switch-button">
        출발지와 도착지 바꾸기
      </button>
    </div>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showTimeModal" class="modal">
          <div class="modal-content">
            <h3>출발 시각 설정</h3>
            <div class="horizontal-pickers">
              <div id="date-picker" class="picker scrollable">
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
                    {{ hour }}
                  </div>
                </div>
                <span>시</span>
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
                    {{ (minute - 1) * 10 }}
                  </div>
                </div>
                <span>분</span>
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
            <button @click="confirmTime" class="modal-button primary">
              설정
            </button>
            <button @click="closeTimeModal" class="modal-button secondary">
              닫기
            </button>
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
//import './SearchFormStyle.css'

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

// 모달을 열 때 기존의 선택 값을 임시 값에 복사
const openTimeModal = () => {
  tempSelectedDay.value = selectedDay.value
  tempSelectedMeridiem.value = selectedMeridiem.value
  tempSelectedHour.value = selectedHour.value
  tempSelectedMinute.value = selectedMinute.value
  showTimeModal.value = true
}

const switchLocations = () => {
  // 현재 출발지와 도착지 정보 가져오기
  const tempDeparture = {
    name: store.state.departure.departure?.name || '',
    coordinates: store.state.departure.departure?.coordinates || {}
  }
  const tempDestination = {
    name: store.state.destination.destination?.name || '',
    coordinates: store.state.destination.destination?.coordinates || {}
  }

  // 출발지와 도착지를 Vuex에 저장
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

// 닫기 버튼 클릭 시 임시 값을 초기화하고 모달 닫기
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
.search-form {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  background: white;
  padding: 16px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.input-group {
  position: relative;
  margin-bottom: 8px;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  padding-left: 40px;
  border: 1px solid #e8e9ea;
  border-radius: 8px;
  font-size: 15px;
  color: #333;
  background: #f5f6f7;
}

.input-group input::placeholder {
  color: #999;
}

.input-group label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #ff4d15;
}

.clear-button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  padding: 4px;
  cursor: pointer;
}

.switch-button-container {
  margin-top: 12px;
}

.switch-button {
  width: 100%;
  padding: 12px;
  background: #f5f6f7;
  border: none;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.realtime-button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: #ff4d15;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* Modal styles */
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
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 360px;
}

.modal-content h3 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.modal-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  margin-top: 12px;
}

.modal-button.primary {
  background: #ff4d15;
  color: white;
}

.modal-button.secondary {
  background: #f5f6f7;
  color: #666;
}

/* Time picker styles */
.time-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0;
}

.time-option {
  padding: 8px 16px;
  text-align: center;
  cursor: pointer;
}

.time-option.selected {
  background: #ffe5dd;
  color: #ff4d15;
  border-radius: 4px;
}

.meridiem-picker {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.meridiem-picker button {
  flex: 1;
  padding: 10px;
  border: 1px solid #e8e9ea;
  border-radius: 6px;
  background: white;
  color: #666;
}

.meridiem-picker button.selected {
  background: #ffe5dd;
  color: #ff4d15;
  border-color: #ff4d15;
}
</style>

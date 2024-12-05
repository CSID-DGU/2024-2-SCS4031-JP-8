const calculateProbabilityForStation = (idx) => {
  const station = filteredStations.value.find((s) => s.idx === idx)
  if (!station) return 0

  const probability = selectedStations.value.find((s) => s.seq === idx)
  return probability ? probability.probability : 0
}

const goToNextPage = (station) => {
  router.push({
    name: 'PathfindingPage',
    query: {
      stationName: station.stationName,
      x: station.x,
      y: station.y,
      stationID: station.stationID
    }
  })
}

const getDayType = () => {
  const now = new Date()
  const day = now.getDay()
  return day === 0 ? '일요일' : day === 6 ? '토요일' : '평일'
}

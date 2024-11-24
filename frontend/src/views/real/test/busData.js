//종점 정보
export const busTargetStations = {
  '5000A': { up: 57, down: 28 },
  '5000B': { up: 78, down: 39 },
  6001: { up: 41, down: 18 },
  1112: { up: 51, down: 24 },
  M7731: { up: 25, down: 10 }
}

// 기점 정보
export const busStartStations = {
  '5000A': { up: 29, down: 0 }, // 하행: 0, 상행: down + 1
  '5000B': { up: 40, down: 0 },
  6001: { up: 19, down: 0 },
  1112: { up: 25, down: 0 },
  M7731: { up: 11, down: 0 }
}

export const busRouteData = {
  '5000A': {
    busID: 11151,
    localBusID: 228000388,
    busLocalBlID: 228000388,
    routeId: 228000388,
    region: '용인',
    folderPath: '../../../../public/csv/5000A/'
  },
  '5000B': {
    busID: 11011,
    localBusID: 228000174,
    busLocalBlID: 228000174,
    routeId: 228000174,
    region: '용인',
    folderPath: '../../../../public/csv/5000B/'
  },
  1112: {
    busID: 10052,
    localBusID: 234000016,
    busLocalBlID: 234000016,
    routeId: 234000016,
    region: '수원',
    folderPath: '../../../../public/csv/1112/'
  },
  6001: {
    busID: 16017,
    localBusID: 233000131,
    busLocalBlID: 233000131,
    routeId: 233000131,
    region: '화성',
    folderPath: '../../../../public/csv/6001/'
  },
  M7731: {
    busID: 5541,
    localBusID: 218000158,
    busLocalBlID: 218000158,
    routeId: 218000158,
    region: '고양',
    folderPath: '../../../../public/csv/M7731/'
  }
}

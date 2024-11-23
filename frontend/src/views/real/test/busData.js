export const busTargetStations = {
  '5000A': { up: 57, down: 28 },
  '5000B': { up: 78, down: 41 },
  6001: { up: 41, down: 18 },
  1112: { up: 51, down: 24 },
  M7731: { up: 25, down: 10 }
}

export const busRouteData = {
  '5000A': {
    busID: 11151,
    localBusID: 228000388,
    busLocalBlID: 228000388,
    routeId: 228000388,
    region: '용인',
    folderPath: '../public/csv/5000A/',
    upStartIndex: 58 // up + 1
  },
  '5000B': {
    busID: 11011,
    localBusID: 228000174,
    busLocalBlID: 228000174,
    routeId: 228000174,
    region: '용인',
    folderPath: '../public/csv/5000B/',
    upStartIndex: 79 // up + 1
  },
  1112: {
    busID: 10052,
    localBusID: 234000016,
    busLocalBlID: 234000016,
    routeId: 234000016,
    region: '수원',
    folderPath: '../public/csv/1112/',
    upStartIndex: 52 // up + 1
  },
  6001: {
    busID: 16017,
    localBusID: 233000131,
    busLocalBlID: 233000131,
    routeId: 233000131,
    region: '화성',
    folderPath: '../public/csv/6001/',
    upStartIndex: 42 // up + 1
  },
  M7731: {
    busID: 12345, // 예시 ID
    localBusID: 228000100, // 예시 local ID
    busLocalBlID: 228000100, // 예시 블록 ID
    routeId: 228000100, // 예시 route ID
    region: '서울', // 예시 지역
    folderPath: '../public/csv/M7731/',
    upStartIndex: 26 // up + 1
  }
}

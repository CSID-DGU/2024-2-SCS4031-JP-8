###그냥 메모
## 혼잡 시간대 아닐때는 프론트 페이지를 길찾기부터 띄우고 선택 정류장 버튼 만드는것도조을듯? 원래는 다 통일할랬는데...
# M7731

import pandas as pd
import math
from datetime import datetime

# 승차인원 데이터 불러오기
passenger_data = pd.read_csv('int_passenger_flow.csv', index_col='정류장명')

# 필요한 함수들 정의
def poisson_prob(k, sigma, lam):
    return sum(math.exp(-lam) * (lam ** i) / math.factorial(i) for i in range(k, int(sigma)))

###########################
def get_bus_location(route_id):
    # 이 함수는 실제 API나 다른 데이터 소스에서 버스 위치 정보를 가져와야 합니다.
    #앞의 버스 위치, 뒤의 버스 위치에서 10분 이내이면 합치는 코드 api로 받아오기
    # 여기서는 예시로 임의의 값을 반환합니다.
    return 38, 13  # 현재 정류장 인덱스, 다음 정류장 인덱스
# 무정차 정류장 제외하고 받아오기

def calculate_boarding_probability(route_id, target_station, current_time, passenger_data):
    current_bus, next_bus = get_bus_location(route_id)
    
    ##################
    remain_seat = 60
    time_slot = f"18시_승하차" #f"{current_time.hour}시_승하차" 로 변경?
    
    station_list = passenger_data.index.tolist()
    relevant_stations = station_list[current_bus:target_station+1]
    
    time_interval = 15
    total_bus = 60 / time_interval
    
    probabilities = []
    
    for station in relevant_stations:
        station_index = relevant_stations.index(station)
        
        avg_pass = passenger_data.loc[station, f"{time_slot}"]
        
        if isinstance(avg_pass, pd.Series):
            avg_pass = avg_pass.iloc[0]
        if pd.isna(avg_pass):
            avg_pass = 0
        
        total_pass = max(0, avg_pass * total_bus)
        bus_arrival_time = 19 + station_index * 10
        
        buses_until_now = int(bus_arrival_time / time_interval)
        if bus_arrival_time < 30:
            buses_until_now = total_bus - buses_until_now
        
        pass_per_time = total_pass / buses_until_now if buses_until_now > 0 else 0
        
        target_pass = int(total_pass - remain_seat)
        if target_pass <= 0:
            prob = 1
        else:
            prob = poisson_prob(target_pass, total_pass, pass_per_time)
        probabilities.append((station, prob))
        
        if remain_seat > 0:
            remain_seat -= avg_pass
            remain_seat = max(0, remain_seat)
    
    return probabilities

    ################## 데이터로 저장해두기
# 예시 실행
route_id = "5000B"
target_station = 44 #종점 상행/하행노선별로 다름
current_time = datetime.now()

result = calculate_boarding_probability(route_id, target_station, current_time, passenger_data)

print("승차 확률:")
for station, prob in result:
    print(f"{station}: {prob:.2%}")
import pandas as pd
import math
from datetime import datetime

# 승차인원 데이터 불러오기
passenger_data = pd.read_csv('5000B_week_pass.csv', index_col='정류장')

# 최악 상황
def worst_prob(k, sigma, lam):
    return sum(math.exp(-lam) * (lam ** i) / math.factorial(i) for i in range(k, int(sigma)))

#total pass < remain seat
def normal_prob(k, lam):
    return sum(math.exp(-lam) * (lam ** i) / math.factorial(i) for i in range(0, int(k)))

def get_bus_location(route_id):
    # 이 함수는 실제 API나 다른 데이터 소스에서 버스 위치 정보를 가져와야 합니다.
    # 여기서는 예시로 임의의 값을 반환합니다.
    return 38  # 현재 정류장 인덱스, 다음 정류장 인덱스

def calculate_boarding_probability(route_id, target_station, current_time, passenger_data):
    current_bus = get_bus_location(route_id)
    
    remain_seat = 64
    time_slot = f"17시" #current_time.hour
    search_time = 39 #current_time.minute
    
    station_list = passenger_data.index.tolist()
    relevant_stations = station_list[current_bus:target_station+1]
    
    time_interval = 15
    total_bus = 60 / time_interval
    
    probabilities = []
    cumulative_prob = 1.0
    
    for station in relevant_stations:
        
        total_pass = passenger_data.loc[station, f"{time_slot}"]
        
        if isinstance(total_pass, pd.Series):
            total_pass = total_pass.iloc[0]
        if pd.isna(total_pass):
            total_pass = 0
        
        avg_pass = total_pass / total_bus
        
        buses_until_now = max(1, int(search_time / time_interval))
        #if search_time < 30:
        #    buses_until_now = total_bus - buses_until_now
        
        pass_per_time = max(1, avg_pass) * buses_until_now
        
        target_pass = int(total_pass - remain_seat)
        if target_pass <= 0:
            station_prob = normal_prob(remain_seat, pass_per_time)
        else:
            station_prob = worst_prob(target_pass, total_pass, pass_per_time)
            
        cumulative_prob *= station_prob
            
        probabilities.append((station, cumulative_prob))
        
        if remain_seat > 0:
            remain_seat -= avg_pass
            remain_seat = max(0, remain_seat)
    
    return probabilities

# 예시 실행
route_id = "5000B"
target_station = 44
current_time = datetime.now()

result = calculate_boarding_probability(route_id, target_station, current_time, passenger_data)

print("승차 확률:")
for station, prob in result:
    print(f"{station}: {prob:.2%}")
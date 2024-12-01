import pandas as pd
import math
from datetime import datetime

# 승차인원 데이터 불러오기
passenger_data = pd.read_csv('5000B_week_pass.csv', index_col='정류장')
# passenger_data = pd.read_csv('1112_week_pass.csv', index_col='정류장')

def poisson_prob(k, sigma, lam):
    return sum(math.exp(-lam) * (lam ** i) / math.factorial(i) for i in range(k, int(sigma)))

def get_bus_location(route_id):
    return 38 # 현재 정류장 인덱스, 다음 정류장 인덱스

def calculate_boarding_probability(route_id, target_station, current_time, passenger_data):
    current_bus = get_bus_location(route_id)
    
    remain_seat = 42    
    time_slot = 7
    search_time = 42    #current_time.minute
    
    station_list = passenger_data.index.tolist()
    relevant_stations = station_list[current_bus:target_station+1]
    
    time_interval = 10
    total_bus = 60 / time_interval
    
    probabilities = []
    cumulative_prob = 1.0
    
    for station in relevant_stations:
        total_pass = passenger_data.loc[station, f"{time_slot}시"]
        
        if isinstance(total_pass, pd.Series):
            total_pass = total_pass.iloc[0]
        if pd.isna(total_pass):
            total_pass = 0
        
        avg_pass = int(total_pass / total_bus)
        
        buses_until_now = max(1, int(search_time / time_interval))
        #if search_time < 30:
        #    buses_until_now = total_bus - buses_until_now
        
        pass_per_time = max(1, avg_pass) * buses_until_now
        
        target_pass = max(0, int(total_pass - remain_seat))
        station_prob = poisson_prob(target_pass, total_pass, pass_per_time)
        
        cumulative_prob *= station_prob
        
        probabilities.append((station, cumulative_prob))
        
        if remain_seat > 0:
            remain_seat -= avg_pass
            remain_seat = max(0, remain_seat)

        search_time += 10
        if search_time >= 60:
            search_time -= 60
            time_slot += 1
            
    return probabilities

# 예시 실행
route_id = "1112"
target_station = 44 # 5000B
# target_station = 13
current_time = datetime.now()

result = calculate_boarding_probability(route_id, target_station, current_time, passenger_data)

print("승차 확률:")
for station, prob in result:
    print(f"{station}: {prob:.2%}")
    

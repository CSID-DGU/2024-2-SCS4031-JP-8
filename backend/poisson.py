import math
import datetime
import pandas as pd

# CSV 파일에서 승차 인원 데이터를 읽어오는 함수
def load_passenger_data(file_path):
    return pd.read_csv(file_path, index_col='정류장명')

# 실시간 버스 위치 정보를 가져오는 함수 (예시)
def get_bus_location(route_id):
    # 실제로는 API를 호출해야 하지만, 여기서는 예시 값을 반환
    return 39, 40  # 현재 정류장, 다음 정류장

# 포아송 확률 계산 함수
def poisson_prob(k, sigma, lam):
    return sum(math.exp(-lam) * (lam ** i) / math.factorial(i) for i in range(k, int(sigma)))

# 메인 함수
def calculate_boarding_probability(route_id, target_station, current_time, passenger_data):
    current_station, next_station = get_bus_location(route_id)
    
    # 남은 좌석 수 (예시 값, 실제로는 API나 다른 소스에서 가져와야 함)
    remain_seat = 31
    
    # 현재 시간을 시간대로 변환 (예: '17시')
    time_slot = f"{current_time.hour}시"
    
    # 현재 정류장부터 목표 정류장까지의 데이터 필터링
    station_list = passenger_data.index.tolist()
    start_index = current_station
    end_index = target_station
    relevant_stations = station_list[start_index:end_index+1]
    already_pass = station_list[start_index-1]
    
    time_interval = 10  # 배차 간격 (분)
    total_bus = 60 / time_interval  # 시간당 배차수
    
    probabilities = []
    
    for station in relevant_stations:
        station_index = relevant_stations.index(station)
        
        if station_index == 0:
            avg_pass = passenger_data.loc[station, time_slot] - passenger_data.loc[already_pass, time_slot]
        else:
            station_index -= 1
            relevant_stations
            avg_pass = passenger_data.loc[station, time_slot] - passenger_data.loc[station-1, time_slot] 
            
        if pd.isna(avg_pass):
            avg_pass = 0
        else:
            avg_pass = float(avg_pass)
        
        # 각 정류장까지의 예상 소요 시간 계산 (간단한 예시)
        total_pass = max(0, avg_pass * total_bus)
        bus_arrival_time = station_index * time_interval
        
        buses_until_now = int(bus_arrival_time / time_interval)
        if bus_arrival_time < 30:
            buses_until_now = total_bus - buses_until_now
        
        pass_per_time = total_pass / buses_until_now
        
        remain_seat -= avg_pass
        
        target_pass = max(1, int(total_pass - remain_seat))
        
        prob = poisson_prob(target_pass, total_pass, pass_per_time)
        probabilities.append((station, prob))
    
    return probabilities

# 사용 예시
if __name__ == "__main__":
    # CSV 파일 경로
    csv_file_path = '2024-2-SCS4031-JP-8/backend/sarima_weekday.csv'
    
    # CSV 파일에서 데이터 로드
    passenger_data = load_passenger_data(csv_file_path)
    
    route_id = "5000B번"
    target_station = 44
    current_time = datetime.datetime.now()

    results = calculate_boarding_probability(route_id, target_station, current_time, passenger_data)
    for station, prob in results:
        print(f"정류장 {station}의 탑승 확률: {prob:.2%}")
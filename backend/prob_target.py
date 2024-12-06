import math
# import pandas as pd

#file_path = '/mnt/data/sarima_predictions_all_stations_weekday.csv'
#df = pd.read_csv(file_path)

#def get_total_pass(bus_location, time, df):
#    """bus_location부터 마지막 행까지의 정류장에 대해서 각 정류장의 총승차인원을 저장"""
    

# f_bus_location = 39 # 현재 버스가 위치한 정류장번호
# s_bus_location = 39 # 현재 버스가 위치한 정류장번호

time = '17시'
bus_arrival_time = 5 # 버스 도착시간 (분)
time_interval = 10  # 배차 간격 (분)
total_bus = 60/time_interval # 시간 당 배차수
buses_until_now = int((bus_arrival_time)/time_interval)  # 도착시간 전에 운행된 버스 수
remain_seat = 4

#total_pass = get_total_pass(bus_location, time, df)
total_pass = 59
target_pass = total_pass - remain_seat  # 도착시간 이전에 탑승해야 할 최소 승객 수

if(target_pass <= 0):
    target_pass = 1

if(bus_arrival_time < 30):
    buses_until_now = total_bus - buses_until_now

pass_per_time = total_pass / (60 / time_interval) * buses_until_now # 도착시간 기준 평균탑승자수

def poisson_prob(k, lam):
    """k명 이상이 버스에 탑승할 확률 계산"""
    prob = sum(math.exp(-lam) * (lam ** i) / math.factorial(i) for i in range(k, total_pass))
    return prob

prob_target_or_more = poisson_prob(target_pass, pass_per_time)

print(prob_target_or_more)

#버스 도착시간을 토대로 csv 파일에서 해당 시간대의 total_pass 값을 가져오도록 하고싶다
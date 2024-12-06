import pandas as pd
import numpy as np

# CSV 파일 읽기
df = pd.read_csv('5000B_week.csv')

# '정류장명' 열을 제외한 모든 열을 숫자형으로 변환
numeric_columns = df.columns.drop('정류장명')
for col in numeric_columns:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# NaN 값을 0으로 대체
df[numeric_columns] = df[numeric_columns].fillna(0)

# 승하차 인원 계산 함수
def calculate_passenger_flow(series):
    return abs(series.diff())

# 결과를 저장할 새로운 데이터프레임 생성
result_df = pd.DataFrame()
result_df['정류장명'] = df['정류장명']

# 각 시간대별로 승하차 인원 계산
for col in numeric_columns:
    result_df[f'{col}_승하차'] = calculate_passenger_flow(df[col])

# 첫 번째 행의 승하차 인원을 해당 시간대의 재차인원과 동일하게 설정
result_df.iloc[0, 1:] = df.iloc[0, 1:]

# 결과 저장
result_df.to_csv('passenger_flow.csv', index=False)

print("처리가 완료되었습니다. 'passenger_flow.csv' 파일을 확인해주세요.")
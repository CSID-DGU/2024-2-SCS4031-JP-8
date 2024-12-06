import pandas as pd
import numpy as np

# CSV 파일 읽기
df = pd.read_csv('passenger_flow.csv')

# '정류장명' 열을 제외한 모든 열을 숫자형으로 변환
numeric_columns = df.columns.drop('정류장명')
for col in numeric_columns:
    # 소수점 값을 반올림하여 정수로 변환
    df[col] = df[col].apply(lambda x: round(float(x)) if pd.notnull(x) else x).astype('Int64')

# NaN 값을 0으로 대체
df[numeric_columns] = df[numeric_columns].fillna(0)

# 결과 저장
df.to_csv('int_passenger_flow.csv', index=False)

print("처리가 완료되었습니다. 파일을 확인해주세요.")
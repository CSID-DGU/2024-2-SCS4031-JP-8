<img src="https://capsule-render.vercel.app/api?type=waving&color=7aaff5&height=150&section=header&text=🚌잔여좌석을%20반영한%20최단시간%20길%20찾기:%20서울-경기%20광역버스&fontSize=30&fontColor=102f57" />


# 2024-2-SCS4031-JP-8

### 🚀 프로젝트 이름

> 머신러닝 기반 버스 정류장 추천 웹 애플리케이션 - 또타자<br>
(잔여좌석을 반영한 최단시간 길 찾기 : 서울-경기 광역버스)
<br>

### 🧑‍🤝‍🧑 팀 구성원

| **장 민** | **박주한** | **정영균** | **정지원** |
| :-----------------: | :-----------------: | :-----------------: | :----------------: |
| <img src="https://github.com/user-attachments/assets/366f8c51-8cc2-4a2f-8acd-789431a6f1d3" width="120" height="120" /> | <img src="https://github.com/user-attachments/assets/fea9c564-9334-4ce0-b974-a01f472f44db" width="120" height="120" />  |   <img src="https://github.com/user-attachments/assets/192ecbc1-7f14-4dde-9e09-e9dd180b272e" width="120" height="120" />  |   <img src="https://github.com/user-attachments/assets/9dfd6b44-71f5-4d9d-acd8-27987ebf15dd" width="120" height="120" /> |
| 팀장, 백엔드  | 프론트엔드    | 백엔드  | 프론트엔드 |
| 산업시스템공학과  | 사학과      | 일어일문학과 | 건축공학전공 |
| 융합SW연계전공    | 융합SW연계전공    | 융합SW연계전공 | 융합SW연계전공 |
| [@JangMin99](https://github.com/JangMin99) | [@pjh4028](https://github.com/pjh0428) | [@suipizza](https://github.com/suipizza) | [@study2895](https://github.com/study2895) |
### 👨‍🏫 지도교수님
**📘 융합SW교육원 신연순&박효순 교수님**
#### 👩 멘토님: **김다은 멘토님**

<br>

### ❗ 확인사항
> API 키를 주기적으로 교체하고 있으나 현재 부족한 API 호출 횟수로 인해 **락**이 걸릴 수 있는 상태입니다.<br>
> 혹시 실행이 안되신다면 연락 부탁드립니다.<br>

> 광역버스 노선이 제공되는 수도권(서울-경기-인천) 권역 내 길찾기가 제공됩니다.


### 💻 실행 방법(윈도우 기준)
1. **다운로드**: 폴더명을 특수문자 없는 소문자로 하여 Clone 받거나 ZIP 파일을 다운로드 합니다.
2. **폴더 이동**: 이후 2024-2-SCS4031-JP-8 폴더에서 VSC를 실행하여 frontend 폴더로 이동합니다.
     ```bash
     cd frontend
3. **환경 설정**: `Node.js`, `npm`, `vue-cli`를 설치합니다.
     ```bash
     npm install -g @vue/cli
4. **의존성 설치**:<br>
   ```bash
   npm install 
5. **프로젝트 실행**: 실행 명령어로 프로젝트를 시작합니다.
   ```bash
   npm run dev (윈도우 기준)
> 현재 express 서버도 함께 실행하도록 설정되어 있어 `npm run serve`가 아닌 `dev`를 사용해야 합니다.<br>
혹시 실행이 안되신다면 `concurrently` 패키지를 설치합니다.

    
     npm install concurrently --save-dev

<br>


### 📝 프로젝트 개요 및 개발 동기
>2022년 서울 및 경기 광역버스에 안전상의 이유로 버스에 설치된 좌석 수 이상의 승객을 태울 수 없도록 하는 `입석 금지법`이 시행되었다. 그로 인해 출퇴근 시간대에 승객 수요가 몰리며 대부분의 좌석이 기점 인근에서 소진되는 문제가 발생했고 결국 **중간 정류장에서는 버스가 무정차로 경유**하는 상황이 반복적으로 발생하고 있다. 

>한편 기존의 경로 안내 서비스는 환승 효율성과 이동 거리를 우선하여 버스 탑승 정류장을 추천해주기 때문에 **혼잡도가 높은 정류장으로 경로를 안내하는 문제점**이 있었다. 결국 사용자들은 경험적인 판단에 따라 여러 정류장들을 비교하며 스스로 경로를 선택해야만 한다. 

>따라서 본 프로젝트에서는 기존 서비스의 한계를 극복하기 위하여 `교통카드 빅데이터 통합정보시스템`에서 제공하는 데이터를 이용해 버스의 `재차 인원`을 예측하고, 이를 기반으로 **만차가 예상되는 정류장을 분석**하여 경로 추천 알고리즘을 구현하는 것을 목표로 한다. 
사용자가 출발지와 도착지를 입력하면 오디세이 대중교통 길찾기 API를 통해 일반 경로를 안내한다. 이때 광역버스를 이용하는 경로가 포함된 경우 혼잡도가 낮을 것으로 예상되는 정류장을 추천 경로로 안내하고 이와 동시에 각 정류장별 예측 혼잡도를 제공하여 사용자가 자신의 상황에 맞게 취사선택할 수 있도록 한다. 지도 API를 사용하여 길찾기 알고리즘을 시각화하고 일반 지도 및 버스 안내 앱에서 제공하는 부수적인 기능을 함께 제공한다. 

>이를 통해 반복적인 결정 과정에서 오는 **피로와 선택 과정의 실수를 줄여** 사용자에게 보다 효율적인 경로 탐색을 제공하는 것을 목표로 한다.
<br>

### 🎯 개발 목표 및 범위
>본 프로젝트는 `교통카드 빅데이터`를 기반으로 **정류장별 탑승 확률**을 예측하는 알고리즘을 개발하는 것이 목표이다. 머신러닝 모델, 특히 `Propeht` 알고리즘을 적용하여 시계열 데이터 분석을 통해 **정류장별 재차인원과 승차인원**을 예측하고 이에 **포아송 분포**를 적용하여 탑승 확률이 계산된 추천 알고리즘을 개발한다.
프로젝트의 주요 접근 방식은 두 가지로 구분된다:

* 버스 노선 별 정류장별 탑승 확률 비교
* 데이터 분석을 통한 최적 대안 경로 제시

>최종 목표는 탑승 확률 분석 결과를 바탕으로 만차 예측 및 최적 경로를 추천하는 효율적인 수도권 내 경로 안내 서비스 개발이다. 한정된 개발 기한 내 효과적인 구현을 위해 핵심 기능에 집중하여 **수도권** 버스 정류장 추천 시스템과 경로 안내 서비스에 초점을 맞춘다. 사용자 편의성을 극대화하기 위해 모바일 웹 플랫폼으로 개발하여 실용적인 서비스가 될 수 있도록 한다.




<br>

### 🏗 설계 및 구현

- ### 🧩 시스템 구조  
<p align="left">
  <img src="https://github.com/user-attachments/assets/7af6ea15-9d63-451b-8ff9-58d8f3f9ed29" width="900" alt="시스템 구조">
</p>

> 교통카드 빅데이터 시스템의 **노선별 재차 인원**과 **승하차 인원**을 기반으로 데이터의 경향성에 따라 `평일`, `토요일`, `일요일`로 나누어 잔여 좌석을 예측하며 대상 노선은 `5000A`, `5000B`, `1112`, `6001`, `M7731`이다. 예측 모델로는 `SARIMA`, `LSTM`, `Prophet`이 사용되었으며 최종적으로 `Prophet`으로 결정되었다. 

> 사용자는 메인 페이지에서 **출발지**와 **도착지**를 입력하고 **시간**을 설정한 뒤 길 찾기를 수행할 수 있다. 설정 시각이 **실시간** 일때는 공공데이터포탈 API를 통해 잔여 좌석을 확인하고, **미래시**이면 예측 모델 기반 잔여 좌석을 이용한다.

> 최적 정류장을 도출하기 위해 **포아송 분포**를 통해 **탑승 확률**을 계산한다. 이후 `추천순`, `확률순`과 `거리순`을 기준으로 최적의 정류장과 함께 그 정류장까지의 경로를 사용자에게 제공한다. 개발은 Vue.js, 배포는 Amazon EC2로 이루어진다.

<br>

- ### 📂 프로젝트 구조
<details>
     
 <summary>📦 ML</summary>
 
       
       
       ┣ 📂LSTM
       ┃ ┗ 📜LSTM.ipynb
       ┣ 📂Prophet
       ┃ ┗ 📜Prophet.ipynb
       ┣ 📂SARIMA
       ┃ ┗ 📜SARIMA.ipynb
       ┣ 📂시각화 및 분석
       ┃ ┣ 📜데이터수집.ipynb
       ┃ ┣ 📜모델결과_시각화.ipynb
       ┃ ┣ 📜모델평가(LSTM,SARIMA,Prophet).ipynb
       ┃ ┗ 📜초기시각화.ipynb
       ┗ 📜init.txt
       
      
</details>
<details>
     
 <summary>📦 frontend</summary>
 
          
          
          ┣ 📂dist
          ┣ 📂node_modules
          ┣ 📂public
          ┃ ┣ 📂csv
          ┃ ┗ 📂img
          ┣ 📂src
          ┃ ┣ 📂assets
          ┃ ┣ 📂components           
          ┃ ┃ ┗ 📂layout             # 메인페이지 컴포넌트
          ┃ ┣ 📂router
          ┃ ┣ 📂store                # Vuex 모듈
          ┃ ┃ ┗ 📂modules
          ┃ ┣ 📂utils
          ┃ ┗ 📂views
          ┃   ┣ 📂BusDetailPage      # 버스 상세노선 페이지
          ┃   ┣ 📂MainPage           # 메인 페이지
          ┃   ┣ 📂NoBusPage          # 제공하는 노선 없는 경우 길안내 페이지
          ┃   ┣ 📂PathPage           # 정류장 선택시 길안내 페이지
          ┃   ┣ 📂ResultPage         # 정류장 목록 페아지
          ┃   ┗ 📂SearchPage         # 출발지, 도착지 검색 페이지
          ┣ 📜package.json
          ┣ 📜README.md
          ┗ 📜vue.config.js
          
        
          
</details>
<details>
     
 <summary>📦backend</summary>
 
          
          
          
           ┣ 📂convert_js
           ┃ ┣ 📜convert.js
           ┃ ┣ 📜convert_int.js
           ┃ ┣ 📜debugging.js
           ┃ ┗ 📜poisson.js
           ┣ 📜convert.py
           ┣ 📜convert_int.py
           ┣ 📜debugging.py
           ┣ 📜poisson.py
           ┣ 📜prob_target.py
           ┗ 📜test.txt
          
        
          
</details>

<br>
<br>

### 🚀 서비스 구현 결과

<br>

| 메인페이지 | 출발지 검색 | 도착지 검색 | 시간 선택 |
|-------|-------|-------|-------|
| <img src="https://github.com/user-attachments/assets/723b6bdf-95bb-4bb6-9ed2-fae27719cc18" width="200"> | <img src="https://github.com/user-attachments/assets/06f22aea-b673-4642-b3b0-61c14ca35b80" width="200"> | <img src="https://github.com/user-attachments/assets/5725c97d-9a19-4393-85dd-626c62f0fcd6" width="200"> | <img src="https://github.com/user-attachments/assets/9b52cb3e-4d4f-4de2-89e0-a8aa6ee7459f" width="200"> |


> 1. **출발지-도착지 검색**
* 최근 검색 기능
* 즐겨찾기 제공
> 2. **시간 선택**
* 실시간 선택 버튼
* 날짜, 시각, 분, 오전/오후 선택 모달 창

<br><br>

| 실시간 추천 |  | 경로 안내 | 세부 경로 안내 |
|-------|-------|-------|-------|
| <img src="https://github.com/user-attachments/assets/bace7f7f-649f-4684-be87-0c0d4996e0a4" width="200"> | <img src="https://github.com/user-attachments/assets/0911b524-f4d2-4de7-b30d-135afff7ed79" width="200"> | <img src="https://github.com/user-attachments/assets/067accd8-3eb9-468d-9575-284e7255aee9" width="200"> | <img src="https://github.com/user-attachments/assets/72be911a-2786-44eb-997c-209e78c8a4ba" width="200"> |

> 3. **광역버스 승차 가능 여부를 판단하여 최적의 정류장 추천**
* 길찾기 구간 중 현재 운행하는 광역버스 노선 목록
* 선택된 노선 정류장 추천
* 현재 위치와 추천에 활용된 5개의 정류장을 나타낸 지도
* 실시간 여석 기반 / 예측된 재차인원 기반으로 잔여 좌석을 예측하여 승차 가능 확률 계산하고 추천 정류장 제공
  * 추천순, 확률순, 거리순으로 정렬 가능하고 추천 정류장은 확률이 높음이면서 가장 접근하기 용이한 곳
  * 일반 지도 기본 정류장은 기존 지도 서비스에서 안내하는 정류장에 표시(사용 API에 따라 한두 정거장 정도 차이날 수 있음)
* 정류장명, 확률(높음, 보통), 정류장 번호, 정류장까지의 경로 기본 정보, 공공데이터포탈 API를 활용하여 첫 번째 버스와 두 번째 버스의 실시간 도착 정보 및 잔여 좌석 정보 제공
> 4. **정류장까지 가기 위한 경로 안내**
* 버스, 지하철, 버스+지하철로 나누어 안내, 최소 도보순, 최소 시간순, 최소 환승순으로 정렬
* 전체적인 경로를 요약해서 표시
* 세부 경로 확인 버튼 클릭 시 세부적인 경로 및 출발, 도착지를 지도에 표시
* 총 소요 시간, 요금, 거리, 도보 거리, 대기 시간과 경로 세부 단계 및 경유 정류장, 정류장 정보 등을 안내
  
<br><br>

| 예측 추천 | 버스 노선 상세 안내 |  | 노선 없음 |
|-------|-------|-------|-------|
| <img src="https://github.com/user-attachments/assets/8de0f27c-d6c1-4da0-aebd-760a666b312d" width="200"> | <img src="https://github.com/user-attachments/assets/600a724d-b4b8-4761-b86e-72a6f14d3c82" width="200"> | <img src="https://github.com/user-attachments/assets/00f1c427-c73c-4ebf-89df-4664a9771d05" width="200"> | <img src="https://github.com/user-attachments/assets/b4d81cb6-b097-464f-8c09-6620ab1a46a4" width="200"> |
> 5. **선택된 노선 정보 확인**
* 지도 및 노선 상세 정보 제공
* 노선의 현재 실시간 버스 위치 정보 및 새로고침 기능 제공

<br>

> 6. **퇴근 시간대 실시간 경로 캡처: 기존 시간대와 비교**
<p align="left">
  <img src="https://github.com/user-attachments/assets/b172f215-7e44-4afd-9450-5a670a0376b8" width="900" alt="포아송 분포 이미지 2">
</p>

> 추가적으로, 오후 7시 36분에 실시간으로 경로를 검색했을 때, 실시간 여석 기반 추천 정류장 목록에 숭례문과 서울역버스환승센터가 추가 되었고 기존의 네이버지도나 카카오맵에서는 모두 숭례문의 3번째 뒤 정류장인 순천향대학병원을 안내해주어 적합하지 않은 정류장을 안내한 것이 확인이 된다. 상행/하행을 바꿔 검색하면 반대 경로는 혼잡하지 않기 때문에 여러 정류장이 추천된 것을 확인할 수 있었다.


<br><br>

### 📊 기대효과

#### 1. 사회적 측면
- 
  급격히 수요가 몰리는 출퇴근 시간대의 버스 승객들에게 실질적인 정보를 제공함으로써 기존 서비스가 고려하지 못한 문제로 인한 피로감을 줄이고, 실수의 가능성을 방지하여 사용자 경험을 향상시킨다.  

- 
  예상 대기 시간을 계산하기 위해 정리된 **경로별 혼잡 데이터**를 바탕으로, 특정 노선 및 시간대별 예상 대기 시간이 긴 구간을 파악할 수 있다.  
  > 이를 통해 **배차 횟수 조정** 등의 공공 정책 설계에 활용될 수 있다. 이러한 데이터를 기반으로 **더 나은 대중교통 서비스**를 제공하고, 교통 혼잡을 완화할 수 있을 것으로 기대된다.


#### 2. 경제적 측면
- 
  기존 길찾기 서비스 사업자들은 본 시스템을 도입하여 **광역버스로 인한 대기시간 문제를 고려**할 수 있게 되어, 서비스 품질을 개선할 수 있다.

- 
  운수 사업자는 **혼잡도 예측 데이터**를 활용하여 운영 효율성을 높일 수 있다.  
  > 데이터 분석 및 머신러닝 예측 모델을 통해 **대기시간비용**과 **혼잡비용**을 낮출 수 있다. 이를 통해 사회적 비용이 감소하고, 장기적으로 **대중교통 시스템의 발전**에 기여할 것으로 기대된다.

<br>

### 🎥 시연 영상

[![YouTube](https://img.shields.io/badge/YouTube-red?style=for-the-badge&logo=youtube)](https://youtu.be/zi8N4UBdILU?si=0_2XRTO9GjNxiqJp?feature=shared)




<br>

### 🛠 기술 스택

| **분야**    | **기술 스택**   |
|---------------|-------------|
| **Frontend**  | <img src="https://img.shields.io/badge/Vue.js-4FC08D?style=flat-square&logo=Vue.js&logoColor=white"> <img src="https://img.shields.io/badge/Vuex-41B883?style=flat-square&logo=Vue.js&logoColor=white"> <img src="https://img.shields.io/badge/Vuex-persistedstate-41B883?style=flat-square&logo=Vue.js&logoColor=white"> <img src="https://img.shields.io/badge/Vue%20Query-41B883?style=flat-square&logo=Vue.js&logoColor=white"> <img src="https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white"> <br> <img src="https://img.shields.io/badge/Javascript-F7DF1E?style=flat-square&logo=javascript&logoColor=black"> <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white"> <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white"> <img src="https://img.shields.io/badge/Papaparse-0E76A8?style=flat-square&logo=Papaparse&logoColor=white"> <img src="https://img.shields.io/badge/LucideVueNext-4FC08D?style=flat-square&logo=lucide&logoColor=white"> |
| **Backend**   | <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white"> <img src="https://img.shields.io/badge/Prophet-FF9900?style=flat-square&logo=prophet&logoColor=white"> <img src="https://img.shields.io/badge/LSTM-006400?style=flat-square&logo=deep-learning&logoColor=white"> <img src="https://img.shields.io/badge/SARIMA-800080?style=flat-square&logo=analytics&logoColor=white"> <img src="https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=Pandas&logoColor=white"> |
| **DevOps**    | <img src="https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazonwebservices&logoColor=white"> <img src="https://img.shields.io/badge/AWS EC2-FF9900?style=flat-square&logo=amazonec2&logoColor=white"> |
| **Tools**     | <img src="https://img.shields.io/badge/Figma-F24E1E?style=flat-square&logo=figma&logoColor=white"> <img src="https://img.shields.io/badge/Notion-000000?style=flat-square&logo=notion&logoColor=white"> <img src="https://img.shields.io/badge/Github-181717?style=flat-square&logo=github&logoColor=white"> <img src="https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white"> |
| **API** | <img src="https://img.shields.io/badge/카카오 키워드 장소 검색 API-FFCD00?style=flat-square&logo=kakaotalk&logoColor=black"> <br><img src="https://img.shields.io/badge/네이버 지도 Web Dynamic Map API-03C75A?style=flat-square&logo=naver&logoColor=white"> <br><img src="https://img.shields.io/badge/Geolocation 위치 정보 제공 API-FF5733?style=flat-square&logo=googlemaps&logoColor=white"> <br><img src="https://img.shields.io/badge/오디세이 대중교통 API-fc9d38?style=flat-square&logoColor=white"> `버스 노선 조회`, `노선 상세정보 조회`, `정류장 세부 정보 조회`,<br>`노선 그래픽 데이터 검색`, `대중교통 정류장 검색`, `대중교통 길찾기`<br><img src="https://img.shields.io/badge/공공데이터포탈 API-0054A6?style=flat-square&logo=data&logoColor=white"> `경기도_버스위치정보 조회`, `경기도_버스도착정보 조회` |
| **사용 데이터**     | <img src="https://img.shields.io/badge/교통카드 빅데이터 통합정보시스템-1E90FF?style=flat-square&logo=databricks&logoColor=white"> `노선별 이용량`,`노선별 차내 재차인원` 데이터 |

<br>







---

<br>

### 📝 커밋 규칙
#### 커밋 헤더

형식 > &nbsp;            `타입: 설명` &nbsp; 또는 &nbsp; `타입 #이슈번호: 설명 `<br>
예시 >   &nbsp; `Feat: 사용자 로그인 기능 추가`

#### 커밋 헤더 타입

| 타입 | 설명 |
| --- | --- |
| Feat | 새로운 기능을 추가할 경우 |
| Add | 새로운 파일이나 리소스를 추가할 경우 |
| Fix | 버그 및 코드를 수정할 경우 |
| Design | UI 디자인 및 CSS 변경이 있을 경우 |
| BREAKING CHANGE | 큰 API 변경이 있을 경우 |
| HOTFIX | 치명적인 버그를 급하게 수정할 경우 |
| Style | 코드 포맷 변경, 세미콜론 누락 등, 기능 변경이 없는 경우 |
| Refactor | 코드 리팩토링 |
| Comment | 주석을 추가하거나 수정할 경우 |
| Docs | 문서를 수정할 경우 |
| Test | 테스트 추가 또는 테스트 리팩토링 (프로덕션 코드 변경 없음) |
| Chore | 빌드 설정, 패키지 매니저 설정 등 (프로덕션 코드 변경 없음) |
| Rename | 파일 또는 폴더명을 수정하거나 옮길 때 |
| Remove | 파일을 삭제하는 작업만 있을 경우 |

#### 📝 커밋 본문

자유롭게 작성, 생략 가능

#### 🔖 커밋 푸터

이슈 번호 추가, 생략 가능

# 2024-2-SCS4031-JP-8

### 🚀 프로젝트 이름

> 머신러닝 기반 버스 정류장 추천 웹 애플리케이션 - 또타자<br>
(잔여좌석을 반영한 최단시간 길 찾기 : 서울-경기 광역버스)
<br>

### 🧑‍🤝‍🧑 팀 구성원

| 장 민 | 박주한 | 정영균 | 정지원 |
| :-----------------: | :-----------------: | :-----------------: | :----------------: |
| 팀장, 백엔드  | 프론트엔드    | 프론트엔드  | 백엔드 |
| 산업시스템공학과  | 사학과      | 일어일문학과 | 건축공학전공 |
| 융합SW연계전공    | 융합SW연계전공    | 융합SW연계전공 | 융합SW연계전공 |
| [@JangMin99](https://github.com/JangMin99) | [@pjh4028](https://github.com/pjh0428) | [@suipizza](https://github.com/suipizza) | [@study2895](https://github.com/study2895) |
### 👨‍🏫 지도교수
**📘 융합SW교육원 신연순&박효순 교수님**

<br>

### ❗ 주의사항
> API 키를 주기적으로 교체하고 있으나 현재 부족한 API 호출 횟수로 인해 락이 걸릴 수 있는 상태입니다.<br>
> 혹시 실행이 안되신다면 연락 부탁드립니다.


### 💻 실행 방법
1. **다운로드**: 폴더명을 특수문자 없는 소문자로 하여 Fork 받거나 ZIP 파일을 다운로드 합니다.
2. **폴더 이동**: 이후 2024-2-SCS4031-JP-8 폴더에서 VSC를 실행하여 frontend 폴더로 이동합니다.
     ```bash
     cd frontend
3. **환경 설정**: Node.js, npm, vue-cli를 설치합니다.
     ```bash
     npm install -g @vue/cli
4. **의존성 설치**:<br>
   ```bash
   npm install 
5. **프로젝트 실행**: 실행 명령어로 프로젝트를 시작합니다.
   ```bash
   npm run dev

<br>


### 📝 프로젝트 개요 및 개발 동기

<br>

### 🎯 개발 목표 및 범위

<br>

### 🏗 설계 및 구현

<br>

- ### 🧩 시스템 구조
![최종발표_S8_J P-이미지-10](https://github.com/user-attachments/assets/7af6ea15-9d63-451b-8ff9-58d8f3f9ed29)
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


<br>

### 🚀 서비스 구현 결과

<br>


### 📊 기대효과

#### 1. 사회적 측면
- 
  급격히 수요가 몰리는 출퇴근 시간대의 버스 승객들에게 실질적인 정보를 제공함으로써 기존 서비스가 고려하지 못한 문제로 인한 피로감을 줄이고, 실수의 가능성을 방지하여 사용자 경험을 향상시킵니다.  

- 
  예상 대기 시간을 계산하기 위해 정리된 **경로별 혼잡 데이터**를 바탕으로, 특정 노선 및 시간대별 예상 대기 시간이 긴 구간을 파악할 수 있습니다.  
  - **배차 횟수 조정** 등의 공공 정책 설계에 활용될 수 있습니다.
  - 이러한 데이터를 기반으로 **더 나은 대중교통 서비스**를 제공하고, 교통 혼잡을 완화할 수 있을 것으로 기대됩니다.


#### 2. 경제적 측면
- 
  기존 길찾기 서비스 사업자들은 본 시스템을 도입하여 **광역버스로 인한 대기시간 문제를 고려**할 수 있게 되어, 서비스 품질을 개선할 수 있습니다.

- 
  운수 사업자는 **혼잡도 예측 데이터**를 활용하여 운영 효율성을 높일 수 있습니다.  
  - 데이터 분석 및 머신러닝 예측 모델을 통해 **대기시간비용**과 **혼잡비용**을 낮출 수 있습니다.
  - 이를 통해 사회적 비용이 감소하고, 장기적으로 **대중교통 시스템의 발전**에 기여할 것으로 기대됩니다.

<br>

### 🛠 기술 스택

| **분야**    | **기술 스택**   |
|---------------|-------------|
| **Frontend**  | <img src="https://img.shields.io/badge/Vue.js-4FC08D?style=flat-square&logo=Vue.js&logoColor=white"> <img src="https://img.shields.io/badge/Vuex-41B883?style=flat-square&logo=Vue.js&logoColor=white"> <img src="https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white"> <img src="https://img.shields.io/badge/Javascript-F7DF1E?style=flat-square&logo=javascript&logoColor=black"> <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white"> |
| **Backend**   | <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white"> <img src="https://img.shields.io/badge/Prophet-FF9900?style=flat-square&logo=prophet&logoColor=white"> <img src="https://img.shields.io/badge/LSTM-006400?style=flat-square&logo=deep-learning&logoColor=white"> <img src="https://img.shields.io/badge/SARIMA-800080?style=flat-square&logo=analytics&logoColor=white"> |
| **DevOps**    | <img src="https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazonaws&logoColor=white"> <img src="https://img.shields.io/badge/AWS EC2-FF9900?style=flat-square&logo=amazonaws&logoColor=white"> |
| **Tools**     | <img src="https://img.shields.io/badge/Figma-F24E1E?style=flat-square&logo=figma&logoColor=white"> <img src="https://img.shields.io/badge/Notion-000000?style=flat-square&logo=notion&logoColor=white"> <img src="https://img.shields.io/badge/Github-181717?style=flat-square&logo=github&logoColor=white"> <img src="https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white"> |
| **API** | <img src="https://img.shields.io/badge/카카오 키워드 장소 검색 API-FFCD00?style=flat-square&logo=kakaotalk&logoColor=black"> <br><img src="https://img.shields.io/badge/네이버 지도 Web Dynamic Map API-03C75A?style=flat-square&logo=naver&logoColor=white"> <br><img src="https://img.shields.io/badge/Geolocation 위치 정보 제공 API-FF5733?style=flat-square&logo=googlemaps&logoColor=white"> <br><img src="https://img.shields.io/badge/오디세이 대중교통 API-fc9d38?style=flat-square&logoColor=white"> 버스 노선 조회, 노선 상세정보 조회, 정류장 세부 정보 조회,<br>노선 그래픽 데이터 검색, 대중교통 정류장 검색, 대중교통 길찾기<br><img src="https://img.shields.io/badge/공공데이터포탈 API-0054A6?style=flat-square&logo=data&logoColor=white"> 경기도_버스위치정보 조회, 경기도_버스도착정보 조회 |
| **사용 데이터**     | <img src="https://img.shields.io/badge/교통카드 빅데이터 통합정보시스템-1E90FF?style=flat-square&logo=databricks&logoColor=white"> 노선별 이용량, 노선별 차내 재차인원 데이터 |

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

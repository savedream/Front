# [살려드림] - Frontend

> 응급안내키트 프론트엔드 (아이패드 화면)  
> 통신이 안 되는 곳에서 응급 처치를 음성으로 안내하는 온디바이스 키트

---

## 📌 프로젝트 소개

살려드림은 산·계곡처럼 통신이 안 되는 곳에서 일반인에게 응급 처치를 음성으로 안내하는 키트입니다.  
프론트엔드는 키트와 같은 Wi-Fi(AP)로 연결된 아이패드에서 실행되며, 말하기·대화 안내·긴급 매뉴얼·타이머·메트로놈·구조신호 화면을 제공합니다.  
키트 백엔드와는 REST API와 이벤트 스트림(SSE)으로 통신합니다.

---
## ✨기술 스택

### 프론트엔드 (React Native, Expo)
| 구분 | 기술 |
|------|------|
| 언어 | JavaScript (JSX) |
| 프레임워크 | React Native 0.86, React 19, Expo SDK 57 (New Architecture) |
| 화면 이동 | React Navigation 7 (native-stack) |
| 아이콘·폰트 | @expo/vector-icons, expo-font (Noto Sans KR) |
| API 통신 | REST API (fetch), SSE (XMLHttpRequest) |
| 설정 | `.env` (`EXPO_PUBLIC_` 환경변수) |
| 실행 환경 | iPad 가로 화면 (iOS) · Android · Web |

---


## 🖥️ Service Screen

<div align="center">

| <img width="1024" height="768" alt="image" src="https://github.com/user-attachments/assets/9d0de06d-40bd-45c6-be2a-13bb40d28e4a" /> |
<img width="1024" height="768" alt="image" src="https://github.com/user-attachments/assets/de212daf-a6b3-4fe3-90a8-f664fb5af291" />
 |
|:---:|:---:|
| **메인 · 응급 안내 대화** | **말하기 (음성 인식)** |

| <img width="1024" height="768" alt="image" src="https://github.com/user-attachments/assets/b4feeaa6-6f0b-442f-adcb-ad6f38b19e0d" />
|<img width="1024" height="768" alt="image" src="https://github.com/user-attachments/assets/6a6c4c42-8a6e-40d5-91c1-7d8959956fc8" />
 |
|:---:|:---:|
| **긴급 매뉴얼** | **긴급 매뉴얼 상세 (단계별 안내)** |

---

</div>


### 실행

```bash
npm install
npx expo start
```

| 명령어 | 설명 |
| --- | --- |
| `npx expo start` | 개발 서버 실행 (Expo Go · 시뮬레이터에서 열기) |
| `npx expo start -c` | 캐시를 지우고 실행 (`.env` 를 바꾼 뒤에는 꼭 이걸로) |
| `npm run ios` | iOS 시뮬레이터로 실행 |
| `npm run android` | Android 에뮬레이터로 실행 |
| `npm run web` | 웹 브라우저로 실행 |
| `npm run lint` | 코드 검사 |

---

### Git 명령어

| 명령어 | 설명 |
| --- | --- |
| `git clone <url>` | 원격 저장소 복제 |
| `git add .` | 전체 변경 파일 스테이징 |
| `git add <파일명>` | 특정 파일만 스테이징 |
| `git commit -m "메시지"` | 커밋 메시지와 함께 커밋 |
| `git log` | 커밋 히스토리 확인 |
| `git branch` | 현재 브랜치 목록 확인 |
| `git checkout <이름>` | 해당 브랜치로 이동 |
| `git checkout -b <이름>` | 새 브랜치 생성 + 이동 |
| `git push` | 현재 브랜치 내용을 원격 저장소에 푸시 |
| `git pull origin main` | 원격 `main` 브랜치 내용 가져오기 (병합) |


<br>

### ✍️ **커밋 메시지 규칙**

```
type : 한국어 설명
```

| type | 예시 |
|------|------|
| `feat` | `feat : 긴급 매뉴얼 상세 화면 추가` |
| `fix` | `fix : 상세 매뉴얼 화살표 잘림 수정` |
| `refactor` | `refactor : 음성 모달 파일 분리` |
| `chore` | `chore : .env 설정 추가` |
| `perf` | `perf : 매뉴얼 목록 캐시 적용` |
| `hotfix` | `hotfix : 앱 시작 오류 수정` |
| `test` | `test : 말하기 상태 테스트 추가` |

<br>


---

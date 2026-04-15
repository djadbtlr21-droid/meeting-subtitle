# 회의 자막 번역 (Meeting Subtitle Translator)

화상회의에서 한국어 ↔ 중국어 실시간 자막 + 번역을 화면 하단에 오버레이로 띄워주는 PWA 웹앱입니다.

- **음성 인식**: Web Speech API (브라우저 내장, 무료)
- **번역**: Gemini API (`gemini-2.5-flash`)
- **프론트엔드**: React 18 + Vite 5 + Tailwind CSS 3
- **PWA**: 모바일 홈화면 추가 → 풀스크린 실행 가능

## 주요 기능

- 화면 하단 반투명 검정 배경 + 흰색 자막 (원문 + 번역 2단)
- 한국어/중국어 주 언어 선택 → 반대 언어로 자동 번역
- 폰트 크기 4단계(작게/보통/크게/매우크게)
- 무음 구간에서 Gemini API 호출하지 않음 (final 결과 + 중복 캐시로 비용 절약)
- 시작/중지 버튼, 상태 뱃지
- PC Chrome/Edge, 모바일 Android Chrome에서 동작 (iOS Safari는 제한적)

---

## 1. 사전 준비

- **Node.js 20 이상** 설치 (`node -v`로 확인)
- **Gemini API 키** 발급: https://aistudio.google.com/apikey
  - 발급 후 Google Cloud 콘솔에서 **HTTP 리퍼러 제한**(예: `http://localhost:5173/*`, `https://*.vercel.app/*`)을 걸어두세요. `VITE_*` 환경변수는 클라이언트 번들에 포함되므로 도메인 제한이 사실상 유일한 보안 수단입니다.

## 2. 로컬 실행

```bash
# 1) 의존성 설치
npm install

# 2) 환경 변수 파일 생성
#    Windows (PowerShell/cmd):
copy .env.example .env.local
#    macOS/Linux:
cp .env.example .env.local

# 3) .env.local 열어서 VITE_GEMINI_KEY 값 입력
#    VITE_GEMINI_KEY=AIza...실제키...

# 4) 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 → **시작** 버튼 → 마이크 권한 허용.

> 📱 같은 와이파이의 폰에서 테스트하고 싶다면 dev 서버 실행 후 콘솔에 찍힌 `http://192.168.x.x:5173` 주소로 접속. 단, **모바일은 HTTPS가 아니면 마이크가 동작하지 않을 수 있습니다** → Vercel 배포본으로 테스트하는 것이 가장 확실합니다.

## 3. GitHub 레포 생성 및 푸시

### 방법 A — `gh` CLI 사용 (권장)

```bash
# gh CLI 인증 (최초 1회)
gh auth login

# 이 프로젝트 폴더 안에서:
git init
git add .
git commit -m "init: 회의 자막 번역 PWA"
gh repo create meeting-subtitle --public --source=. --push
```

`gh repo create`가 레포를 만들고 자동으로 `main` 브랜치를 푸시합니다.

### 방법 B — GitHub 웹 UI + git

1. https://github.com/new 에서 빈 레포 `meeting-subtitle` 생성 (README/gitignore 추가하지 마세요)
2. 터미널에서:
```bash
git init
git add .
git commit -m "init: 회의 자막 번역 PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/meeting-subtitle.git
git push -u origin main
```

## 4. Vercel 배포

1. https://vercel.com 로그인 → **Add New... → Project**
2. 방금 만든 GitHub 레포 `meeting-subtitle` 선택 → **Import**
3. 설정 화면:
   - **Framework Preset**: `Vite` (자동 감지됨, 그대로 두기)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `dist` (기본값)
   - **Environment Variables** → 아래 변수를 추가:
     | Key | Value |
     |---|---|
     | `VITE_GEMINI_KEY` | `AIza...실제키...` |
   - 환경은 **Production / Preview / Development** 모두 체크
4. **Deploy** 클릭 → 약 1~2분 후 `meeting-subtitle-xxx.vercel.app` URL 발급
5. 이후 `git push` 할 때마다 자동 재배포됩니다.

### Vercel 환경변수를 나중에 추가하려면

프로젝트 Dashboard → **Settings → Environment Variables** → `VITE_GEMINI_KEY` 추가 → **Redeploy**.

## 5. 사용 방법

1. 배포된 URL 또는 `http://localhost:5173` 접속
2. 상단 **주 언어** 셀렉트에서 주로 발화할 언어 선택 (한국어/中文)
3. **● 시작** 버튼 → 마이크 권한 허용
4. 말하면 화면 하단에 **원문(작게) + 번역(크게)** 표시됨
5. 폰트 크기는 상단 우측 버튼으로 조절
6. 끝나면 **■ 중지**

### 모바일 홈화면 추가 (PWA)

- **Android Chrome**: 주소창 우측 ⋮ → "홈 화면에 추가"
- **iOS Safari**: 공유 버튼 → "홈 화면에 추가" (단, iOS는 Web Speech API 지원이 불안정함)

## 6. 한계 및 주의사항

- **iOS Safari**: Web Speech API가 불안정. 인식이 자주 끊기고 정확도가 낮습니다. → **Android 또는 PC Chrome 권장**.
- **언어 자동 감지**: Web Speech API는 실제로는 한 번에 한 언어만 인식합니다. 주 발화자가 한국어면 "한국어" 선택, 중국어면 "中文" 선택하세요. 두 언어를 번갈아 쓰는 회의라면 발언 전환 시 셀렉트를 바꿔주세요.
- **API 키 노출**: `VITE_*` 변수는 최종 번들에 포함됩니다. Google Cloud 콘솔에서 **HTTP 리퍼러 제한**을 반드시 설정하세요. 엄격한 보안이 필요하면 Vercel Serverless Function으로 프록시 레이어를 추가하는 것이 안전합니다.
- **Gemini 무료 티어**: `gemini-2.5-flash`는 분당 RPM 제한이 있습니다. 정상적인 회의 대화(발언 간 1~3초 간격)에서는 충분합니다.

## 7. 프로젝트 구조

```
meeting-subtitle/
├── public/            # PWA 아이콘
├── src/
│   ├── components/    # SubtitleOverlay, ControlPanel, StatusBadge
│   ├── hooks/         # useSpeechRecognition
│   ├── lib/           # gemini, detectLang
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── scripts/           # PWA 아이콘 생성 스크립트
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## 8. 개발용 명령어

```bash
npm run dev       # 로컬 개발 서버 (localhost:5173)
npm run build     # 프로덕션 빌드 → dist/
npm run preview   # 빌드 결과 미리보기
```

## 라이선스

MIT

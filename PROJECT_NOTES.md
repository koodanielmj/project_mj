# project_mj 작업 노트

최종 갱신: 2026-09-27

## 1. 프로젝트 개요

- 프로젝트명: 빙고서점 키오스크
- 사용처: 서울서빙고초등학교 축제
- 목적: 어린이들이 만든 책의 사진과 정보를 태블릿에서 보여주고, 대여·반납 상태를 관리한다.
- GitHub 저장소: https://github.com/koodanielmj/project_mj
- 공개 사이트: https://koodanielmj.github.io/project_mj/

## 2. 결정한 구성

- 화면 배포: GitHub Pages
- 공용 데이터베이스·인증·실시간 동기화: Supabase
- 별도 애플리케이션 서버 및 Vercel은 사용하지 않는다.
- 저장소는 Public으로 운영한다.
- 일반 방문자는 도서 목록과 대여 상태를 볼 수 있고, 로그인한 운영자만 상태를 변경하도록 한다.

## 3. 현재 구현된 화면

- 태블릿용 반응형 도서 카드 UI
- 도서명·작가명 검색
- 전체 / 대여 가능 / 대여 중 필터
- 도서 상세 정보 및 대여 확인
- 대여 관리 화면에서 반납 및 전체 초기화
- PWA manifest와 service worker
- 서울서빙고초등학교 로고 적용
- 샘플 도서 6권

주요 파일:

- `index.html`: 화면 구조와 대화상자
- `styles.css`: 태블릿 중심 반응형 디자인
- `app.js`: 검색, 필터, 대여·반납 로직
- `books.json`: 기존 샘플 도서 데이터
- `manifest.webmanifest`, `sw.js`: PWA 구성
- `supabase/schema.sql`: Supabase 데이터베이스 스키마와 정책

## 4. Supabase 구성

- 프로젝트명: `bingo-bookstore`
- 프로젝트 참조 ID: `jhmvkanvykbjolbelpit`
- Project URL: `https://jhmvkanvykbjolbelpit.supabase.co`
- 리전: Northeast Asia (Tokyo)
- 요금제: Free

2026-09-27 SQL Editor에서 `supabase/schema.sql`을 실행했고, `Success. No rows returned` 결과를 확인했다.

생성·설정된 항목:

- `public.books` 테이블
- 샘플 도서 6권
- Row Level Security(RLS)
- 누구나 도서 목록과 현재 상태를 읽을 수 있는 정책
- 로그인한 운영자만 `status`, `borrowed_at`, `updated_at`을 변경할 수 있는 정책
- `books` 테이블 Realtime 등록

보안 원칙:

- 브라우저에는 Publishable Key만 사용한다.
- 데이터베이스 비밀번호와 `service_role` 키는 저장소나 웹 코드에 넣지 않는다.
- 학생 개인정보는 수집하지 않으며, 꼭 필요한 경우에도 학교가 승인한 이름 또는 별칭만 사용한다.

## 5. 현재 상태

- GitHub Pages 배포: 완료
- Supabase 프로젝트 생성: 완료
- 데이터베이스 스키마 실행: 완료
- RLS 정책 및 Realtime 등록: 완료
- 프런트엔드의 Supabase 연결: 완료
- 비밀번호만 입력하는 운영자 로그인 화면: 완료
- Supabase 내부 운영자 계정 등록 및 로그인 검증: 완료
- 관리자 도서 추가·삭제 화면: 완료
- 관리자 도서 정보 수정 화면: 완료 (책 번호·사진·책 이름·작가)
- Supabase Storage 표지 이미지 저장: 완료
- 태블릿 전체화면 전환: 완료
- 관리자 도서 추가·삭제용 RLS 및 Storage 정책 적용: 완료
- 로그인 운영자의 `id`, `title`, `author`, `cover_url`, `updated_at` 수정 권한 적용: 완료
- 여러 기기 간 대여 상태 동기화 검증: 미완료

`app.js`는 Supabase에서 도서와 대여 상태를 읽고 쓰며 Realtime 변경을 구독한다. 일반 방문자는 읽기만 가능하고 운영자 세션이 있는 기기에서만 대여·반납할 수 있다.

## 6. 다음 작업

1. 일반 방문자의 상태 변경이 차단되고 운영자만 변경 가능한지 추가 검증한다.
2. 태블릿과 별도 기기에서 동시 접속 테스트를 한다.
3. 관리자 모드에서 실제 도서 사진, 제목, 어린이 작가명을 등록하고 수정 기능을 현장 점검한다.

### 6.1 2026-09-27 관리자 편집 기능

- 등록된 책마다 `수정` 버튼을 제공한다.
- 책 번호는 `B004` 또는 `4` 형식으로 입력하며 `B`와 세 자리 이상의 숫자로 정규화한다.
- 책 번호가 바뀌면 숫자 부분을 기준으로 전체 도서 목록을 다시 정렬한다.
- 이미 사용 중인 책 번호는 저장할 수 없다.
- 책 이름과 작가명은 필수이며 기존 값이 자동으로 입력된다.
- 새 사진은 선택 사항이다. 선택하지 않으면 기존 표지를 유지한다.
- 새 사진을 선택하면 새 파일 업로드와 도서 정보 저장이 성공한 뒤 기존 표지를 삭제한다.
- 수정 결과는 Supabase Realtime을 통해 접속 중인 다른 기기에 반영된다.
- 공개 방문자의 수정 권한은 허용하지 않고, Supabase 인증을 마친 운영자에게만 수정 권한을 부여한다.

## 7. 주요 Git 기록

- `ac8ce3d` — Build Bingo Bookstore tablet kiosk
- `c7129ee` — Add Supabase books schema and access policies

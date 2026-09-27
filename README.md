# 빙고서점 키오스크

서울서빙고초등학교 축제에서 어린이 작가들이 만든 책을 소개하고 대여 상태를 관리하는 태블릿 전용 정적 웹사이트입니다.

## 운영 구조

```text
GitHub 저장소 → GitHub Pages → 행사장 태블릿과 운영 기기
                                    └─ Supabase: 도서·대여 상태·운영자 인증·Realtime
```

- 별도의 직접 운영 서버 없이 GitHub Pages와 Supabase를 사용합니다.
- 도서와 대여 상태는 Supabase에 저장되어 여러 기기에서 공유됩니다.
- 일반 방문자는 목록을 읽을 수 있고, 로그인한 운영자만 대여·반납 상태를 바꿀 수 있습니다.
- 변경 사항은 Supabase Realtime으로 연결된 화면에 반영됩니다.

## 주요 기능

- 책 표지 카드, 제목·작가 검색
- 전체 / 대여 가능 / 대여 중 필터
- 책 상세 정보와 대여 확인
- 대여 관리 화면에서 반납 처리
- PWA 및 오프라인 캐시
- 태블릿과 모바일 화면 대응

## 실제 책으로 교체하기

1. 표지 사진을 `assets/books/` 폴더에 추가합니다.
2. `books.json`에서 샘플 정보를 실제 책 정보로 바꿉니다.
3. 각 책에 `"cover": "./assets/books/파일명.jpg"` 항목을 추가합니다.

예시:

```json
{
  "id": "B001",
  "title": "책 제목",
  "author": "어린이 작가",
  "grade": "전 학년",
  "description": "책 소개",
  "cover": "./assets/books/B001.jpg",
  "color": "#dcefff"
}
```

학생 이름과 사진의 공개 범위는 학교의 개인정보 보호 기준에 맞춰 결정해야 합니다.

## GitHub Pages 배포

저장소의 **Settings → Pages → Build and deployment**에서 Source를 `Deploy from a branch`, Branch를 `main / (root)`로 지정합니다.

배포 주소: `https://koodanielmj.github.io/project_mj/`

## Supabase 설정

데이터베이스 스키마와 RLS 정책은 `supabase/schema.sql`에 있습니다. 브라우저에는 RLS로 제한되는 Publishable Key만 사용하며, 데이터베이스 비밀번호와 Secret/Service Role Key는 절대로 저장소에 올리지 않습니다.

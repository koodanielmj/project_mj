# 빙고서점 키오스크

서울서빙고초등학교 축제에서 어린이 작가들이 만든 책을 소개하고 대여 상태를 관리하는 태블릿 전용 정적 웹사이트입니다.

## 운영 구조

```text
GitHub 저장소 → GitHub Pages → 행사장 태블릿 한 대
                                    └─ 대여 상태: 브라우저 localStorage
```

- 별도 서버와 데이터베이스가 없습니다.
- 대여 상태는 사용하는 태블릿의 현재 브라우저에만 저장됩니다.
- 브라우저 데이터 삭제, 시크릿 모드, 다른 브라우저 사용 시 대여 상태가 유지되지 않습니다.

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

## 성장 시 재검토할 부분

여러 기기에서 같은 대여 상태를 공유해야 하거나 대여 이력이 중요해지면 Firebase·Supabase 같은 공용 저장소를 추가해야 합니다.

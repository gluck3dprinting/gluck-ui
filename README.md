# GLUCK 공용 디자인 시스템 (gluck-ui) — v2.0.0-preview

> 사내 공용 디자인 시스템 — 각자 만드는 서비스(홈페이지·견적·채용·브로슈어·Madmin·Hermes OS)가 **같은 파일**을 가져다 쓰기 위한 저장소입니다.
> 라이브: https://gluck3dprinting.github.io/gluck-ui/ · 기존 `design-system` v1.1은 문서 아카이브로 유지.

## 바로 쓰기 (제품 쪽에 한 줄)

```html
<!-- 최신 (main) -->
<link rel="stylesheet" href="https://gluck3dprinting.github.io/gluck-ui/dist/gluck.css">
<!-- 버전 고정 (태그 발행 후) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/gluck3dprinting/gluck-ui@v2.0.0-preview/dist/gluck.css">
<meta name="gluck-ds-version" content="2.0.0-preview">
```

- 디자인 시스템(구성원용): https://gluck3dprinting.github.io/gluck-ui/ · 개발자 문서: https://gluck3dprinting.github.io/gluck-ui/dev.html
- 토큰만: `dist/gluck-tokens.css` · 원본: `tokens/gluck.tokens.json`
- 적용 전·후 비교: `docs/before-after.png` (페이지: `docs/compare/`)
- **AI 코딩 도구(Claude 등)용 참조: `llms.txt`** — 프로젝트 CLAUDE.md에 "https://gluck3dprinting.github.io/gluck-ui/llms.txt 를 읽고 따를 것" 한 줄이면 됩니다
- 파비콘·로고: `assets/logo/` · 아이콘 스프라이트: `assets/icons/icons.svg`

## 구조

```
gluck-ui/
├─ index.html · dev.html      디자인 시스템 페이지 · 개발자 문서 (둘 다 dist/gluck.css 의 소비자)
├─ docs/docs.css · docs.js    문서 페이지 전용 크롬 (배포 대상 아님)
├─ tokens/gluck.tokens.json   ★ 단일 원본 (W3C DTCG). 손으로 편집하는 유일한 값 파일
├─ dist/
│  ├─ gluck-tokens.css        :root 시맨틱 변수 + [data-theme="dark"] + [data-theme="admin"]
│  └─ gluck.css               fonts + tokens + base(a11y) + components + utilities  ← 제품은 이 한 줄만 link
├─ assets/
│  ├─ logo/                   워드마크·심볼·파비콘 (brand-resource-center 원본 미러)
│  └─ icons/icons.svg         Lucide 스프라이트 46종 + 로고 <symbol>
└─ CHANGELOG.md
```

## 소비 (제품 쪽)

```html
<link rel="stylesheet" href=".../dist/gluck.css">
<meta name="gluck-ds-version" content="2.0.0-preview">
<html lang="ko" data-theme="admin">   <!-- 운영 툴은 admin 고정. 생략 = 라이트 + OS 다크 존중 -->
```

규칙: HEX 리터럴 금지 · `--gluck-*` 원시 토큰 직접 참조 금지(시맨틱만) · `.gluck-*` 클래스 조립.

## v1.1 → v2 주요 변경

| 항목 | v1.1 | v2 |
|---|---|---|
| 배포 | HTML에서 복사 | `dist/gluck.css` link 한 줄 |
| 토큰 | 컬러·폰트 32개 (spacing 등은 문서만) | primitive/semantic/theme 3계층, spacing·radius·shadow·z·motion·breakpoint 전부 변수 |
| 테마 | 없음 (관리자는 별도 `.adm-*` 22개) | `[data-theme="dark"]`, `[data-theme="admin"]` — 컴포넌트 한 벌 |
| 서체 | SUIT + JetBrains Mono | SUIT 단일 + `.t-num` |
| 로고 | 텍스트 "GLUCK" | 워드마크 SVG `<symbol>` + 파비콘 |
| `--text-tertiary` | #B3B8C2 (1.99:1) | #6B7280 (4.83:1) |
| Primary hover | #337AFF (3.91:1) | #0047CC (7.57:1) |
| 대비표 | 정적 수치 (오기 포함) | 페이지 로드 시 실제 변수에서 계산 |
| 폼 | focus만 | 상태 7종 · 컨트롤 9종 · label/aria 연결 |
| 오버레이·테이블·앱 셸 | 문서만 | `<dialog>` 모달 · 토스트 · 정렬/선택/밀도 테이블 · 사이드바 셸 |

## 브랜드팀 결정 대기 (Draft 표기)

1. 다크 서피스 팔레트 (`gluck.dark.*`) — 리소스 센터 값 채택 여부
2. 다크 배경 위 텍스트 블루 `blue-200 #7AA5FF` / `blue-300 #4585FF`
3. info 배경/보더 `blue-50 #EAF3FE` / `blue-150 #C9DEFB` (DESIGN-ADMIN 값 승격)
4. Admin Primary — 브랜드 파생 #0047CC(권장) vs #3182F6 유지 · Admin 뉴트럴 4종(#F7F8FA #F1F3F6 #E4E7EC #CDD3DC #5B6472)
5. `gray-400 #8A9099` (입력 보더 3:1용) 신설 여부
6. 로고 최소 사용 크기

> 토큰 파일에서 `"status": "draft"` 로 표시된 항목이 위 목록과 1:1 대응합니다. `dist/gluck-tokens.css` 는 현재 JSON과 **수동 동기화**(빌드 스크립트는 다음 단계).

# Changelog

형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) · 버전: SemVer

## [2.2.0-preview] — 2026-10-01
### Changed — `data-theme="admin"` = 사내 관리 화면 언어
- 조직도 시스템(GLUCK ORG) · 소재 시스템(TDS) · 온보딩 시스템 3차의 실측 수치로 admin 테마 전체를 재조정. `<html data-theme="admin">` 한 줄로 적용:
  글자 14px/1.5 · 제목 22px 700 -0.01em · 통계 28px 800 -0.02em · 사이드바 220px · 상단바 52px · 페이지 26/30/60 · 블록 간격 16 · 카드 16/18 라운드 10 · 컨트롤 36px 라운드 8 · 표 머리글 12px/셀 13.5px/행 40px · 배지 11px 700 알약 · 라벨 12.5px 600
- 버튼 기본형 = 흰 바탕 + 1px 선(강조만 파랑) · `--secondary` = 파랑 선 · `--danger-outline` = 빨간 글자 선 버튼 · 배지 점·테두리 없음(`--dot`으로 켬) · 필터 줄은 상자 없이 배치 · 통계 카드는 숫자 먼저
- Admin Primary: blue-700 → **브랜드 키 컬러 blue-600 #0059FF**(5.4:1) · 선 #E6E9EF · 바탕 #F5F6F8 · 본문 #1F2329 / #4B515B
- 테이블 밀도 `default` 48→44px
### Added
- `templates/app.html` — 사내 시스템 시작 템플릿(셸 + 시작·목록·문서 읽기·등록·편집·설정 5개 화면)
- 문서·온보딩 패턴(§18): `gluck-nextup` · `gluck-checklist` · `gluck-stepper` · `gluck-doc` + `gluck-outline` + `gluck-doc-nav` · `gluck-callout`(`--check|--caution|--tip|--ok`) · `gluck-procedure` · `gluck-kv` · `gluck-list` · `gluck-meta` · `gluck-muted` · `gluck-section-title` · `gluck-card__head` · `gluck-card--accent|--link` · `gluck-cols-2|3` · `gluck-login` · `gluck-sidebar__product|__desc` · `gluck-page--narrow|--wide` · `gluck-badge--square|--dot`
- `dist/gluck.js`: 아이콘 스프라이트 자동 주입(문서에 `#i-*`가 없으면 `assets/icons/icons.svg`를 불러와 삽입, `data-sprite="off"`로 끔)
- Lucide 아이콘 8종(book-open · circle-help · folder · graduation-cap · house · link · list-checks · users → 60종)
- 토큰: `--page-max` · `--color-focus-halo` · `--color-text-section` · `--color-bg-canvas`
- llms.txt: "사내 시스템을 만들거나 다시 작업할 때"(화면 언어 수치 · 셸 뼈대 · 화면별 구성 · 다시 작업하는 순서 · 검수 목록)
### Fixed
- 사이드바 하단 아바타 글자가 가운데 정렬되지 않던 문제 · 필드 안 세그먼트가 가로로 늘어나던 문제

## [2.1.0-preview] — 2026-09-29
### Added
- **등록·편집 화면 패턴** (디자인 시스템 §17) — 소재 TDS 생성기·조직도 시스템에서 검증된 등록 UX를 공용 컴포넌트로 승격: `gluck-savebar`(저장 상태·더티·Ctrl+S) · `gluck-editor [--library]`(목록 | 폼 | 스티키 미리보기) · `gluck-form-section`(헤어라인 섹션 제목) · `gluck-seg`(세그먼트) · `gluck-rows`(동적 행: 추가/삭제/이동/그립 드래그·최대 개수) · `gluck-chips`(칩 입력) · `gluck-canvas` + `gluck-sheet`(출력물 미리보기 시트 · `__head/__body/__kv/__tags/__foot`) · `gluck-issues`/`gluck-issue` · `gluck-changes`/`gluck-change` · `gluck-steps`/`gluck-step` · `gluck-status-panel` + `gluck-status-dot` · `gluck-busy` · `gluck-list-group`/`gluck-list-row`
- 동작하는 데모: 소재(TDS) 등록 화면(목록 전환·복제·새 소재·실시간 시트·인라인+요약 검증·저장 단계·저장 충돌·초안 복원·NAS 끊김·PDF 생성 알약·소프트 삭제) · 조직도형 모달 폼 → 그룹 목록 반영 · 그립 정렬
- `dist/gluck.js`: 세그먼트 전환(`gluck:change`) · 동적 행(`data-row-add|remove|up|down`, 그립 드래그, `gluck:limit`) · 칩 입력(Enter/쉼표/Backspace, `window.gluckChipAdd`) · `window.gluckSaveState(bar, state, text)`
- 자간 토큰 `--tracking-display|heading|title|label|eyebrow` (tokens.json `tracking` 그룹) — 텍스트 유틸·KPI·페이지 제목·사이드바 그룹에 적용
- Lucide 아이콘 6종 추가 (arrow-up · arrow-down · grip-vertical · history · image · save → 52종)
- llms.txt: "등록·편집 화면" 섹션(클래스 계약 + UX 규칙 8가지) · 자간 토큰 · 아이콘 목록
### Fixed
- 테마가 다른 서브트리(`[data-theme]` 프레임)에서 글자색이 바깥 페이지 색을 상속해 다크 모드의 admin 데모 텍스트가 보이지 않던 문제 — `[data-theme] { color: var(--color-text-primary) }`

### Changed
- 문서 페이지(index.html · dev.html)가 `dist/gluck.js`를 직접 사용 — docs.js의 중복 동작(메뉴·모달·툴팁·셸·토스트) 제거
- 등록 화면 UX 규칙: 명시적 저장 · 더티 표시 · 이탈 경고 · 인라인+요약 검증 · 충돌 시 덮어쓰기 금지 · 초안 복원 · 안전한 삭제 기본값 · 복제 우선 · Toast/Alert 구분

## [2.0.0-preview] — 2026-09-18
### Added
- `llms.txt` (AI 코딩 도구용 규칙·클래스·토큰 참조) · `dist/gluck.js` (드롭다운·툴팁·드로어·모달·토스트 공통 동작, 선택) · `dev.html` 개발자 문서 탭
- `tokens/gluck.tokens.json` 단일 원본 (DTCG) · `dist/gluck-tokens.css` · `dist/gluck.css`
- 테마 레이어 `[data-theme="dark"]`, `[data-theme="admin"]` (시맨틱 재바인딩)
- 비컬러 토큰: space 14 + 반단계 3 · radius 7 · shadow 3 · z 8 · duration 4 · ease 3 · container · bp · control/icon size
- 컴포넌트: 폼 컨트롤 9종(상태 7종) · 드롭존 · 태그 selectable/removable · 배지 5 status · 카드 · 헤더(드로어) · 브레드크럼 · 탭 · 페이지네이션 · 모달(`<dialog>`) · 토스트 · 툴팁 · 메뉴 · 알럿 · 배너 · 스피너 · 스켈레톤 · 빈 상태 · 프로그레스 · 데이터 테이블(정렬·선택·밀도·빈/로딩) · 앱 셸(사이드바·탑바·필터바·KPI) · 권한 잠금 상태
- a11y 베이스: `:focus-visible` 전역 · `.sr-only` · `.skip-link` · `prefers-reduced-motion` · `scroll-padding-top`
- 워드마크/심볼 `<symbol>` · 파비콘 · Lucide 스프라이트 46종
- 문서: 대비표 실시간 계산(16쌍 × 3테마) · 시맨틱 토큰 테마별 실시간 값 · 채택 현황 표 · PR 체크리스트
### Changed
- `--text-tertiary` #B3B8C2 → #6B7280 (1.99 → 4.83:1)
- Primary hover #337AFF → #0047CC (3.91 → 7.57:1)
- WCAG 큰 텍스트 정의 정정: 24px 이상 또는 18.66px 이상 Bold
- 토큰 네이밍: `--gluck-{hue}-{step}` 숫자 스케일 · 시맨틱 `--color-*` 접두
### Removed
- JetBrains Mono (`--font-mono`는 SUIT 별칭으로 1버전 유지)
- 관리자 별도 컴포넌트 `.adm-*` (admin 테마로 대체)
- 텍스트 로고 · 이모지 아이콘

## [1.1.0] — 2026-07
- 관리자 확장(DESIGN-ADMIN.md) · 상태 컬러 문서화 · recruit 페이지

## [1.0.0] — 2026-05
- 초판: 컬러 · 타이포 · 버튼 · 헤더 · 태그 · 카드 · 견적 폼 · 푸터

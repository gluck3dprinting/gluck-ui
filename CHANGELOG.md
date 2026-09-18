# Changelog

형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) · 버전: SemVer

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

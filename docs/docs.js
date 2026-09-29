/* docs/docs.js — 문서 페이지(index.html · dev.html) 공용 스크립트. 각 블록은 해당 요소가 있을 때만 동작. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;

  /* ---------------- theme toggle ---------------- */
  const themeBtn = $('#themeToggle');
  function applyTheme(t) {
    if (!themeBtn) return;
    root.dataset.theme = t;
    const dark = t === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
    themeBtn.querySelector('span').textContent = dark ? '라이트 모드' : '다크 모드';
    themeBtn.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
    $('meta[name="theme-color"]').setAttribute('content', dark ? '#0F1115' : '#0059FF');
    renderTokens();
  }
  themeBtn.addEventListener('click', () => {
    const t = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('gluck-theme', t); } catch (e) {}
    applyTheme(t);
  });

  /* ---------------- nav: mobile toggle + scrollspy ---------------- */
  const nav = $('#dsNav'), navToggle = $('#navToggle');
  if (nav && navToggle) navToggle.addEventListener('click', () => { const open = nav.classList.toggle('is-open'); navToggle.setAttribute('aria-expanded', String(open)); });
  if (nav) nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('is-open'); navToggle.setAttribute('aria-expanded', 'false'); } });
  const links = nav ? $$('a[href^="#"]', nav) : [];
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id)); } });
  }, { rootMargin: '-20% 0px -70% 0px' });
  $$('.ds-section').forEach(s => io.observe(s));
  window.addEventListener('scroll', () => { if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) links.forEach(a => a.classList.toggle('is-active', a === links[links.length - 1])); }, { passive: true });

  /* ---------------- copy buttons ---------------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const pre = b.parentElement.cloneNode(true); pre.querySelector('[data-copy]').remove(); const txt = pre.textContent.trim();
    if (!navigator.clipboard) { toast('danger', '복사 실패', '보안 컨텍스트(https)에서만 복사할 수 있습니다.'); return; }
    navigator.clipboard.writeText(txt).then(() => toast('success', '복사됨', '설치 스니펫이 클립보드에 복사되었습니다.'));
  }));

  /* ---------------- color helpers ---------------- */
  function resolve(token, scopeEl) {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;color:var(' + token + ')';
    (scopeEl || document.body).appendChild(probe);
    const c = getComputedStyle(probe).color; probe.remove();
    return c;
  }
  function parse(c) {
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(',').map(s => parseFloat(s)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function hex(c) { const p = parse(c); if (!p) return c; const h = n => Math.round(n).toString(16).padStart(2, '0').toUpperCase(); return '#' + h(p.r) + h(p.g) + h(p.b) + (p.a < 1 ? ' · ' + Math.round(p.a * 100) + '%' : ''); }
  function blend(fg, bg) { if (fg.a >= 1) return fg; return { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 }; }
  function lum(c) { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
  function ratio(fg, bg, page) {
    let F = parse(fg), B = parse(bg); if (!F || !B) return null;
    const P = page ? parse(page) : { r: 255, g: 255, b: 255, a: 1 };
    B = blend(B, P); F = blend(F, B);
    const l1 = lum(F), l2 = lum(B); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  /* ---------------- swatches (primitive) ---------------- */
  $$('[data-swatches]').forEach(grid => {
    grid.innerHTML = grid.dataset.swatches.split(',').map(t => {
      const v = resolve(t); const badge = /-(200|300|400)$|blue-(50|150)$|gray-400|dark-/.test(t) && !/gray-300|blue-400/.test(t) ? '<span class="gluck-badge gluck-badge--warning gluck-badge--no-dot">Draft</span>' : (t === '--gluck-blue-600' ? '<span class="gluck-badge gluck-badge--brand gluck-badge--no-dot">KEY</span>' : (t === '--gluck-gray-300' || t === '--gluck-blue-400' ? '<span class="gluck-badge gluck-badge--danger gluck-badge--no-dot">텍스트 금지</span>' : ''));
      const onWhite = ratio(v, 'rgb(255,255,255)');
      return `<div class="ds-swatch"><div class="ds-swatch__chip" style="background: var(${t})">${badge}</div><div class="ds-swatch__info"><b>${t.replace('--gluck-', '')}</b><span>${hex(v)}</span><span>on white ${onWhite ? onWhite.toFixed(2) : '–'}:1</span></div></div>`;
    }).join('');
  });

  /* ---------------- semantic lists + contrast table (re-render on theme change) ---------------- */
  const SEM = ['--color-bg-page', '--color-bg-surface', '--color-bg-subtle', '--color-bg-inverse', '--color-text-primary', '--color-text-secondary', '--color-text-tertiary', '--color-text-link', '--color-border-default', '--color-border-input', '--color-focus-ring', '--color-action-primary', '--color-action-primary-hover', '--color-action-selected-bg', '--color-status-success-text', '--color-status-danger-bg'];
  const PAIRS = [
    ['--color-text-primary', '--color-bg-page', '본문 · 4.5', 4.5],
    ['--color-text-secondary', '--color-bg-page', '보조 본문 · 4.5', 4.5],
    ['--color-text-tertiary', '--color-bg-page', '캡션·헬퍼 · 4.5', 4.5],
    ['--color-text-link', '--color-bg-page', '링크 · 4.5', 4.5],
    ['--color-text-on-brand', '--color-action-primary', 'Primary 버튼 라벨 14–16px · 4.5', 4.5],
    ['--color-text-on-brand', '--color-action-primary-hover', 'Primary hover 라벨 · 4.5', 4.5],
    ['--color-text-on-inverse', '--color-action-secondary', 'Secondary 버튼 라벨 · 4.5', 4.5],
    ['--color-action-selected-text', '--color-action-selected-bg', '선택 메뉴·태그 · 4.5', 4.5],
    ['--color-status-success-text', '--color-status-success-bg', 'success 배지 · 4.5', 4.5],
    ['--color-status-warning-text', '--color-status-warning-bg', 'warning 배지 · 4.5', 4.5],
    ['--color-status-danger-text', '--color-status-danger-bg', 'danger 배지 · 4.5', 4.5],
    ['--color-status-info-text', '--color-status-info-bg', 'info 배지 · 4.5', 4.5],
    ['--color-text-danger', '--color-bg-page', '에러 메시지 · 4.5', 4.5],
    ['--color-border-input', '--color-bg-surface', '입력 보더 (비텍스트) · 3', 3],
    ['--color-focus-ring', '--color-bg-page', '포커스 링 (비텍스트) · 3', 3],
    ['--color-text-disabled', '--color-bg-page', '비활성 텍스트 (WCAG 예외·참고)', 0],
  ];
  function scopeEl(theme) {   // 시맨틱 표가 없는 페이지에서도 대비 계산이 되도록 숨은 테마 컨테이너 생성
    const list = $('[data-semantic-list][data-scope="' + theme + '"]'); if (list) return list.parentElement;
    let w = $('#dsScope-' + theme);
    if (!w) { w = document.createElement('div'); w.id = 'dsScope-' + theme; w.dataset.theme = theme; w.setAttribute('aria-hidden', 'true'); w.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; document.body.appendChild(w); }
    return w;
  }
  const scopes = { page: document.body, dark: scopeEl('dark'), admin: scopeEl('admin') };
  function renderTokens() {
    Object.entries(scopes).forEach(([k, el]) => {
      const list = $('[data-semantic-list][data-scope="' + k + '"]'); if (!list) return;
      list.innerHTML = SEM.map(t => { const v = resolve(t, el); return `<div class="ds-sem-row"><i style="background:${v}"></i><b>${t.replace('--color-', '')}</b><span>${hex(v)}</span></div>`; }).join('');
    });
    const tb = $('#contrastTable tbody'); if (!tb) return;
    tb.innerHTML = PAIRS.map(([fg, bg, use, min]) => {
      const cells = ['page', 'dark', 'admin'].map(k => {
        const el = scopes[k]; const page = resolve('--color-bg-page', el);
        const r = ratio(resolve(fg, el), resolve(bg, el), page); if (r == null) return '<td>–</td>';
        const pass = min ? r >= min : null;
        const badge = pass === null ? '<span class="gluck-badge">참고</span>' : pass ? '<span class="gluck-badge gluck-badge--success">PASS</span>' : '<span class="gluck-badge gluck-badge--danger">FAIL</span>';
        return `<td><span class="ratio">${r.toFixed(2)}</span> ${badge}</td>`;
      }).join('');
      return `<tr><td><code>${fg.replace('--color-', '')}</code> / <code>${bg.replace('--color-', '')}</code></td><td>${use}</td>${cells}</tr>`;
    }).join('');
  }

  /* ---------------- spacing scale ---------------- */
  const spaceEl = $('[data-space-scale]');
  if (spaceEl) spaceEl.innerHTML = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32'].map(n => {
    const v = getComputedStyle(root).getPropertyValue('--space-' + n).trim();
    return `<div class="ds-space-row"><b>--space-${n}</b><span>${v || '0'}</span><i style="width: var(--space-${n}); min-width: 2px"></i></div>`;
  }).join('');

  /* ---------------- icon grid ---------------- */
  const iconGrid = $('[data-icon-grid]');
  if (iconGrid) iconGrid.innerHTML = $$('symbol[id^="i-"]').map(s => { const n = s.id.slice(2); return `<div><svg class="gluck-icon gluck-icon--lg" role="img" aria-label="${n}"><use href="#${s.id}"/></svg>${n}</div>`; }).join('');

  /* ---------------- button matrix ---------------- */
  const VARIANTS = [['primary', '바로 견적 요청'], ['secondary', '문의하기'], ['tertiary', '회원가입'], ['outline', '제조사례'], ['ghost', '로그인'], ['danger', '삭제'], ['link', '더보기']];
  const btnMatrix = $('[data-btn-matrix]');
  if (btnMatrix) btnMatrix.innerHTML = VARIANTS.map(([v, l]) => {
    const b = (attrs = '') => `<button class="gluck-btn gluck-btn--${v} gluck-btn--sm" ${attrs}>${l}</button>`;
    return `<tr><td>${v}</td><td>${b()}</td><td>${b('data-state="hover"')}</td><td>${b('data-state="focus"')}</td><td>${b('data-state="active"')}</td><td>${b('disabled')}</td><td>${b('data-loading="true"')}</td></tr>`;
  }).join('');

  /* ---------------- indeterminate demo ---------------- */
  const ind = $('#indet'); if (ind) ind.indeterminate = true;

  /* ---------------- tag toggle · tabs · pills ---------------- */
  document.addEventListener('click', e => {
    const tag = e.target.closest('[data-tag-toggle] .gluck-tag'); if (tag && !tag.disabled) { tag.setAttribute('aria-pressed', tag.getAttribute('aria-pressed') !== 'true'); }
    const tab = e.target.closest('[data-tabs] button'); if (tab) { $$('button', tab.parentElement).forEach(t => t.setAttribute('aria-pressed', String(t === tab))); }
    const pill = e.target.closest('.gluck-pill'); if (pill) { $$('.gluck-pill', pill.parentElement).forEach(p => p.setAttribute('aria-pressed', String(p === pill))); }
    const rm = e.target.closest('.gluck-tag__remove'); if (rm) { rm.closest('.gluck-tag').remove(); }
  });

  /* ---------------- toast · 모달 · 툴팁 · 메뉴 · 셸 → dist/gluck.js 가 담당 (문서 페이지도 소비자) ---------------- */
  const TITLE = { success: '저장되었습니다', info: '안내', warning: '확인이 필요합니다', danger: '실패했습니다' };
  const MSG = { success: '견적 Q-2026-0918-031이 발송 대기로 이동했습니다.', info: '새 견적 요청 2건이 접수되었습니다.', warning: '유효기간이 2일 남은 견적이 있습니다.', danger: '서버 오류로 발송하지 못했습니다. 잠시 후 다시 시도하세요.' };
  document.addEventListener('click', e => { const b = e.target.closest('[data-toast]'); if (b && !b.dataset.toastTitle) { b.dataset.toastTitle = TITLE[b.dataset.toast] || ''; b.dataset.toastMsg = b.dataset.toastMsg || MSG[b.dataset.toast] || ''; } }, true);

  /* ---------------- quote form validation ---------------- */
  const form = $('#quoteForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault(); let firstBad = null;
    $$('[required]', form).forEach(inp => {
      const field = inp.closest('.gluck-field'); let bad = !inp.value || (inp.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value)) || (inp.type === 'checkbox' && !inp.checked);
      if (field) { field.classList.toggle('is-invalid', bad); inp.setAttribute('aria-invalid', String(bad)); const err = $('.gluck-error', field); if (err) inp.setAttribute('aria-describedby', err.id); }
      if (bad && !firstBad) firstBad = inp;
    });
    if (firstBad) { firstBad.focus(); toast('danger', '입력을 확인하세요', '필수 항목이 비어 있거나 형식이 올바르지 않습니다.'); return; }
    const btn = $('#quoteSubmit'); btn.dataset.loading = 'true';
    setTimeout(() => { delete btn.dataset.loading; toast('success', '견적 요청 접수', '담당자가 확인 후 회신합니다.'); }, 1200);
  });
  if (form) form.addEventListener('input', e => { const f = e.target.closest('.gluck-field.is-invalid'); if (f && e.target.value) { f.classList.remove('is-invalid'); e.target.setAttribute('aria-invalid', 'false'); } });

  /* ---------------- data table (있는 페이지에서만) ---------------- */
  if ($('#quoteTable')) {
  const ROWS = [
    { id: 'Q-2026-0918-031', company: '(주)에이치모빌리티', item: '내장 브라켓 20종 · 200ea', proc: ['SLA', '도색', '조립'], status: ['info', 'SQL 진행 중'], amount: 11780000, date: '2026-09-18' },
    { id: 'Q-2026-0918-030', company: '메디텍바이오', item: '하우징 · 1,200ea', proc: ['SLA', 'UV'], status: ['warning', '팔로업 필요'], amount: 48200000, date: '2026-09-18' },
    { id: 'Q-2026-0917-028', company: '스튜디오 감각', item: '전시 조형물 · 3ea', proc: ['SLA', '사상', '도색'], status: ['success', 'Deal 성사'], amount: 9600000, date: '2026-09-17' },
    { id: 'Q-2026-0917-027', company: '로보틱스랩', item: '그리퍼 핑거 · 60ea', proc: ['SLA'], status: ['neutral', '보류'], amount: 2340000, date: '2026-09-17' },
    { id: 'Q-2026-0916-025', company: '(주)에이치모빌리티', item: '커넥터 커버 · 500ea', proc: ['SLA', '도색'], status: ['danger', 'LOSS'], amount: 7150000, date: '2026-09-16' },
    { id: 'Q-2026-0916-024', company: '브랜드굿즈컴퍼니', item: '피규어 · 2,000ea', proc: ['SLA', '도색', '패키징'], status: ['info', 'SQL 진행 중'], amount: 63000000, date: '2026-09-16' },
    { id: 'Q-2026-0915-021', company: '헤리티지 스튜디오', item: '복원 파트 · 12ea', proc: ['SLA', '사상'], status: ['success', '발송 완료'], amount: 4120000, date: '2026-09-15' },
    { id: 'Q-2026-0915-019', company: 'IoT센서웍스', item: '센서 하우징 · 300ea', proc: ['SLA', 'UV', '조립'], status: ['warning', '검토 대기'], amount: 8900000, date: '2026-09-15' },
  ];
  let sortKey = 'date', sortDir = -1, state = 'data';
  const body = $('#tblBody'), chkAll = $('#chkAll'), bulk = $('#bulkBar'), bulkCount = $('#bulkCount');
  const won = n => '₩' + n.toLocaleString('ko-KR');
  function renderTable() {
    if (state === 'loading') { body.innerHTML = Array.from({ length: 5 }, () => `<tr>${'<td><span class="gluck-skeleton gluck-skeleton--text"></span></td>'.repeat(9)}</tr>`).join(''); return; }
    if (state === 'empty') { body.innerHTML = `<tr class="is-empty"><td colspan="9"><div class="gluck-empty gluck-empty--compact"><svg class="gluck-icon gluck-icon--lg" aria-hidden="true"><use href="#i-inbox"/></svg><div class="gluck-empty__title" style="font: var(--font-body-sm); font-weight: 600">조건에 맞는 견적이 없습니다</div><p class="gluck-empty__desc">기간이나 상태 필터를 조정해 보세요.</p><button class="gluck-btn gluck-btn--outline gluck-btn--sm">필터 초기화</button></div></td></tr>`; return; }
    const rows = [...ROWS].sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : a[sortKey] < b[sortKey] ? -1 : 0) * sortDir);
    body.innerHTML = rows.map(r => `<tr data-id="${r.id}"><td class="col-check"><label class="gluck-check"><input type="checkbox" aria-label="${r.id} 선택"></label></td><td class="is-primary t-num">${r.id}</td><td>${r.company}</td><td>${r.item}</td><td><div class="gluck-row" style="--row-gap:4px">${r.proc.map(p => `<span class="gluck-tag gluck-tag--capability" style="height:22px;padding:0 6px;font-size:11px">${p}</span>`).join('')}</div></td><td><span class="gluck-badge gluck-badge--${r.status[0]}">${r.status[1]}</span></td><td class="is-num is-primary">${won(r.amount)}</td><td class="t-num">${r.date}</td><td class="col-actions"><details class="gluck-menu"><summary class="gluck-btn gluck-btn--ghost gluck-btn--icon gluck-btn--xs" aria-label="${r.id} 액션"><svg class="gluck-icon" aria-hidden="true"><use href="#i-ellipsis"/></svg></summary><ul class="gluck-menu__list gluck-menu__list--right"><li><button class="gluck-menu__item"><svg class="gluck-icon gluck-icon--sm" aria-hidden="true"><use href="#i-eye"/></svg> 상세</button></li><li><button class="gluck-menu__item"><svg class="gluck-icon gluck-icon--sm" aria-hidden="true"><use href="#i-pencil"/></svg> 수정</button></li><li><hr></li><li><button class="gluck-menu__item is-danger" data-modal="modalDelete"><svg class="gluck-icon gluck-icon--sm" aria-hidden="true"><use href="#i-trash-2"/></svg> 삭제</button></li></ul></details></td></tr>`).join('');
    syncSelection();
  }
  function syncSelection() {
    const boxes = $$('tbody input[type="checkbox"]', $('#quoteTable')); const n = boxes.filter(b => b.checked).length;
    boxes.forEach(b => b.closest('tr').setAttribute('aria-selected', String(b.checked)));
    chkAll.checked = n > 0 && n === boxes.length; chkAll.indeterminate = n > 0 && n < boxes.length;
    bulk.classList.toggle('is-visible', n > 0); bulkCount.textContent = n;
    cloneAdminTable();
  }
  chkAll.addEventListener('change', () => { $$('tbody input[type="checkbox"]', $('#quoteTable')).forEach(b => b.checked = chkAll.checked); syncSelection(); });
  body.addEventListener('change', e => { if (e.target.type === 'checkbox') syncSelection(); });
  $$('#quoteTable th[aria-sort]').forEach(th => th.querySelector('button').addEventListener('click', () => {
    const k = th.dataset.key; if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
    $$('#quoteTable th[aria-sort]').forEach(t => t.setAttribute('aria-sort', t === th ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'));
    renderTable();
  }));
  $$('[data-density-ctl] button').forEach(b => b.addEventListener('click', () => {
    $$('[data-density-ctl] button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('[data-density]').forEach(w => w.dataset.density = b.dataset.d);
  }));
  $$('[data-tbl-state]').forEach(b => b.addEventListener('click', () => { state = b.dataset.tblState; renderTable(); if (state !== 'data') cloneAdminTable(); }));
  renderTable();

  /* admin shell: 같은 테이블 마크업을 복제해 admin 테마 안에서 렌더 (컴포넌트 한 벌 증명) */
  function cloneAdminTable() {
    const src = $('#quoteTable'), dst = $('[data-clone-of="quoteTable"]');
    dst.querySelector('thead').innerHTML = src.querySelector('thead').innerHTML;
    dst.querySelector('tbody').innerHTML = src.querySelector('tbody').innerHTML;
    $$('[id]', dst).forEach(el => el.removeAttribute('id'));
    // innerHTML은 checked/indeterminate 프로퍼티를 옮기지 않으므로 별도 복사
    const sb = $$('tbody input[type="checkbox"]', src), db = $$('tbody input[type="checkbox"]', dst);
    db.forEach((b, i) => { b.checked = !!(sb[i] && sb[i].checked); });
    const sa = $('thead input[type="checkbox"]', src), da = $('thead input[type="checkbox"]', dst);
    if (sa && da) { da.checked = sa.checked; da.indeterminate = sa.indeterminate; }
  }
  // 복제본(관리자 셸) 조작은 원본으로 위임 → 항상 동기화
  const adminTbl = $('[data-clone-of="quoteTable"]');
  adminTbl.addEventListener('change', e => {
    if (e.target.type !== 'checkbox') return;
    const tr = e.target.closest('tbody tr');
    if (tr) { const o = $(`#tblBody tr[data-id="${tr.dataset.id}"] input[type="checkbox"]`); if (o) { o.checked = e.target.checked; o.dispatchEvent(new Event('change', { bubbles: true })); } }
    else { chkAll.checked = e.target.checked; chkAll.dispatchEvent(new Event('change')); }
  });
  adminTbl.addEventListener('click', e => { const th = e.target.closest('th[data-key]'); if (th && e.target.closest('button')) { const b = $(`#quoteTable th[data-key="${th.dataset.key}"] button`); if (b) b.click(); } });
  cloneAdminTable();

  }   /* end: data table · shell */

  /* ---------------- 17 등록·편집 화면 데모 (있는 페이지에서만) ---------------- */
  const ed = $('#editorDemo');
  if (ed) {
    const bar = $('#edBar'), form = $('#edForm'), saveBtns = [$('#edSave'), $('#edSave2')], resetBtn = $('#edReset');
    const LABEL = { name: '소재명', code: '코드', process: '공정', status: '게시 상태', desc: '한 줄 설명', fit: '이미지 맞춤', credit: '출처', props: '물성표', tags: '키워드', memo: '내부 메모' };
    const ITEMS = {
      pa12:   { name: 'PA12',        code: 'SLS-PA12',   process: 'SLS', desc: '내구성이 높은 범용 나일론 — 기능성 시제품과 소량 양산에 적합', tags: ['내구성', '내화학성', '기능성 부품'], props: [['인장 강도', '48', 'MPa'], ['파단 연신율', '18', '%'], ['열변형 온도', '175', '°C'], ['레이어 두께', '0.1', 'mm']] },
      pa12gf: { name: 'PA12 GF',     code: 'SLS-PA12GF', process: 'SLS', desc: '글라스 비드 강화 나일론 — 강성과 치수 안정성이 필요한 하우징', tags: ['고강성', '치수 안정성'], props: [['인장 강도', '51', 'MPa'], ['굴곡 탄성률', '3200', 'MPa'], ['열변형 온도', '179', '°C']] },
      tough:  { name: 'Tough 1500',  code: 'SLA-T1500',  process: 'SLA', desc: '탄성이 있는 강인한 레진 — 스냅핏·반복 하중 부품', tags: ['내충격', '스냅핏'], props: [['인장 강도', '33', 'MPa'], ['파단 연신율', '51', '%'], ['레이어 두께', '0.05', 'mm']] },
      clear:  { name: 'Clear Resin', code: 'SLA-CLEAR',  process: 'SLA', desc: '투명 레진 — 유체 흐름 확인, 광학 시제품', tags: ['투명', '광학'], props: [['인장 강도', '65', 'MPa'], ['광 투과율', '92', '%']] },
      pa11:   { name: 'PA11',        code: 'MJF-PA11',   process: 'MJF', desc: '바이오 기반 나일론 — 유연하고 충격에 강한 힌지·클립', tags: ['유연', '내충격', '바이오 기반'], props: [['인장 강도', '52', 'MPa'], ['파단 연신율', '50', '%']] },
      petg:   { name: 'PETG',        code: 'FDM-PETG',   process: 'FDM', desc: '저비용 범용 필라멘트 — 지그·픽스처, 초기 형상 확인', tags: ['저비용', '지그'], props: [['인장 강도', '50', 'MPa'], ['레이어 두께', '0.2', 'mm']] },
    };
    const rowTpl = $('template', $('#edProps'));
    const esc = s => String(s == null ? '' : s);

    function segSet(seg, value) { $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String((b.dataset.value ?? b.textContent.trim()) === value))); }
    function segGet(seg) { const b = $('button[aria-pressed="true"]', seg); return b ? (b.dataset.value ?? b.textContent.trim()) : ''; }
    function collect() {
      const o = {};
      $$('[data-bind]', form).forEach(el => {
        const k = el.dataset.bind;
        if (el.classList.contains('gluck-seg')) o[k] = segGet(el);
        else if (el.classList.contains('gluck-chips')) o[k] = $$('.gluck-tag', el).map(t => t.dataset.value);
        else if (el.classList.contains('gluck-rows')) o[k] = $$('.gluck-rows__row', el).map(r => $$('input', r).map(i => i.value.trim()));
        else o[k] = el.value;
      });
      return o;
    }
    function fill(d) {                       // 데이터 → 폼 (목록 전환 · 복원 · 변경 취소)
      $$('[data-bind]', form).forEach(el => {
        const k = el.dataset.bind; if (!(k in d)) return;
        if (el.classList.contains('gluck-seg')) segSet(el, d[k]);
        else if (el.classList.contains('gluck-chips')) { $$('.gluck-tag', el).forEach(t => t.remove()); el.classList.remove('is-full'); d[k].forEach(v => window.gluckChipAdd(el, v)); }
        else if (el.classList.contains('gluck-rows')) { const body = $('.gluck-rows__body', el); body.innerHTML = ''; d[k].forEach(r => { const n = rowTpl.content.firstElementChild.cloneNode(true); $$('input', n).forEach((i, x) => i.value = r[x] || ''); body.appendChild(n); }); }
        else el.value = d[k];
      });
    }
    const now = () => new Date().toTimeString().slice(0, 5);
    let base = collect(), baseJson = JSON.stringify(base), savedAt = '14:02', conflict = false;

    function validate(d) {
      const issues = [];
      if (!d.name.trim()) issues.push(['오류', '소재명은 필수입니다.', 'name']);
      if (!/^[A-Z0-9-]{3,}$/.test(d.code.trim())) issues.push(['오류', '코드는 대문자·숫자·하이픈 3자 이상이어야 합니다 (예: SLS-PA12).', 'code']);
      const rows = d.props.filter(r => r.some(Boolean));
      if (!rows.length) issues.push(['오류', '물성표는 1행 이상 필요합니다.']);
      rows.forEach((r, i) => { if (!r[0] || !r[1]) issues.push(['오류', `물성표 ${i + 1}행: 항목과 값을 모두 채워주세요.`]); });
      if (!d.desc.trim()) issues.push(['주의', '한 줄 설명이 비어 있으면 소재 카드에 코드만 표시됩니다.']);
      if (d.tags.length < 2) issues.push(['주의', '키워드는 2개 이상을 권장합니다 (카드 필터에 사용).']);
      if (d.status === '비공개') issues.push(['주의', '비공개 상태입니다 — 저장해도 홈페이지 소재 목록에는 나오지 않습니다.']);
      return issues;
    }
    function renderPreview(d, issues) {
      $('[data-pv="name"]', ed).textContent = d.name.trim() || '소재명';
      $('[data-pv="code"]', ed).textContent = (d.code.trim() || '코드') + ' · ' + d.process;
      $('[data-pv="desc"]', ed).textContent = d.desc.trim() || '—';
      $('[data-pv="credit"]', ed).textContent = d.credit.trim();
      $('#edPvImg').style.setProperty('--fit', d.fit);
      $('#edPvRows').innerHTML = d.props.filter(r => r.some(Boolean)).map(r => `<tr><th>${esc(r[0]) || '<i>항목</i>'}</th><td class="t-num">${esc(r[1]) || '<i>값</i>'}</td><td class="u">${esc(r[2])}</td></tr>`).join('') || '<tr><td colspan="3"><i>물성표 없음</i></td></tr>';
      $('#edPvTags').innerHTML = d.tags.map(t => `<span>${esc(t)}</span>`).join('');
      const st = $('#edPvStatus'); st.textContent = d.status; st.className = 'gluck-badge gluck-badge--no-dot ' + (d.status === '게시' ? 'gluck-badge--success' : '');
      $('#edIssues').innerHTML = issues.map(([lv, msg]) => `<div class="gluck-issue${lv === '주의' ? ' gluck-issue--warning' : ''}"><b class="lv">${lv}</b><span>${esc(msg)}</span></div>`).join('');
      const errs = issues.filter(i => i[0] === '오류').length;
      const v = $('[data-step="validate"]', ed); v.className = 'gluck-step ' + (errs ? 'is-fail' : 'is-done'); $('.gluck-step__note', v).textContent = errs ? `오류 ${errs} — 저장 불가` : (issues.length ? `주의 ${issues.length}` : '이슈 0');
      $('.gluck-step__ic', v).innerHTML = errs ? '<svg class="gluck-icon" aria-hidden="true"><use href="#i-x"/></svg>' : '<svg class="gluck-icon" aria-hidden="true"><use href="#i-check"/></svg>';
      // 인라인 오류
      [['name', 'edName'], ['code', 'edCode']].forEach(([k, id]) => { const bad = issues.some(i => i[2] === k); const inp = document.getElementById(id); inp.closest('.gluck-field').classList.toggle('is-invalid', bad); inp.setAttribute('aria-invalid', String(bad)); });
      $('#edDescN').textContent = d.desc.length;
    }
    function renderChanges(d) {
      const list = Object.keys(LABEL).filter(k => JSON.stringify(d[k]) !== JSON.stringify(base[k]));
      $('#edChgN').textContent = list.length ? `${list.length}건` : '변경 없음';
      $('#edChanges').innerHTML = list.length ? list.map(k => {
        const a = base[k], b = d[k]; let kind = '수정', detail = '';
        if (Array.isArray(b)) { kind = b.length > a.length ? '추가' : (b.length < a.length ? '삭제' : '수정'); detail = `${a.length} → ${b.length}${k === 'props' ? '행' : '개'}`; }
        else { detail = (a === '' ? '(비어 있음)' : String(a).slice(0, 18)) + ' → ' + (b === '' ? '(비어 있음)' : String(b).slice(0, 18)); }
        const cls = kind === '추가' ? 'gluck-badge--success' : kind === '삭제' ? 'gluck-badge--danger' : 'gluck-badge--info';
        return `<div class="gluck-change"><span class="gluck-badge gluck-badge--no-dot ${cls}">${kind}</span><span class="nm">${LABEL[k]}</span><span class="sz t-num">${esc(detail)}</span></div>`;
      }).join('') : '<div class="gluck-change gluck-text-tertiary">저장된 값과 같습니다.</div>';
    }
    function setState(s, text) {
      window.gluckSaveState(bar, s, text);
      const dirty = s === 'dirty';
      saveBtns.forEach(b => b.disabled = !dirty); resetBtn.disabled = !dirty;
    }
    function refresh() {
      const d = collect(); const dirty = JSON.stringify(d) !== baseJson; const issues = validate(d);
      renderPreview(d, issues); renderChanges(d);
      setState(dirty ? 'dirty' : 'clean', dirty ? '저장되지 않은 변경' : `저장됨 · ${savedAt}`);
      $('#edTitle').textContent = d.name.trim() || '새 소재'; $('#edDeleteName').textContent = d.name.trim() || '이 소재';
      $('#edPropsLimit').hidden = $$('.gluck-rows__row', $('#edProps')).length < 12;
      try { sessionStorage.setItem('gluck-ed-draft', dirty ? JSON.stringify(d) : ''); } catch (e) {}
      return { d, dirty, issues };
    }
    form.addEventListener('input', refresh);
    form.addEventListener('gluck:change', refresh);
    form.addEventListener('gluck:limit', () => { $('#edPropsLimit').hidden = false; window.gluckToast('warning', '물성표 12행 초과', '더 필요하면 브랜드팀에 TDS 양식 확장을 요청하세요.'); });
    form.addEventListener('submit', e => { e.preventDefault(); save(); });
    $('#edSave').addEventListener('click', save);
    ed.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } });

    function stepRun(name, note, done) { const s = $(`[data-step="${name}"]`, ed); s.className = 'gluck-step is-doing'; $('.gluck-step__note', s).textContent = note; return new Promise(r => setTimeout(() => { s.className = 'gluck-step is-done'; $('.gluck-step__ic', s).innerHTML = '<svg class="gluck-icon" aria-hidden="true"><use href="#i-check"/></svg>'; $('.gluck-step__note', s).textContent = done; r(); }, 550)); }
    function stepReset() { [['save', '2'], ['pdf', '3']].forEach(([n, num]) => { const s = $(`[data-step="${n}"]`, ed); s.className = 'gluck-step'; $('.gluck-step__ic', s).textContent = num; $('.gluck-step__note', s).textContent = '—'; }); }
    let saving = false;
    async function save() {
      if (saving) return;
      const { dirty, issues, d } = refresh();
      if (!dirty) { window.gluckToast('info', '변경 없음', '저장할 변경이 없습니다.'); return; }
      const errs = issues.filter(i => i[0] === '오류');
      if (errs.length) { window.gluckToast('warning', `오류 ${errs.length}건을 먼저 고쳐주세요`, errs[0][1]); const f = $('.is-invalid input', form) || $('.gluck-rows__row input', form); if (f) f.focus(); return; }
      if (conflict) { window.gluckToast('danger', '저장할 수 없습니다', '다른 사용자가 먼저 저장했습니다 — 위 안내에서 선택하세요.'); return; }
      saving = true; setState('saving', '저장 중…'); saveBtns.forEach(b => b.disabled = true);
      await stepRun('save', 'NAS에 쓰는 중…', 'materials/' + d.code.trim() + '.json');
      await stepRun('pdf', '렌더링 중…', 'TDS_' + d.code.trim() + '.pdf · 184KB');
      base = collect(); baseJson = JSON.stringify(base); savedAt = now(); saving = false;
      $('#edMode').textContent = '수정'; $('#edNasDetail').textContent = `마지막 동기화 ${savedAt} · 12개 파일`;
      refresh(); window.gluckToast('success', '저장되었습니다', `${d.name.trim()} — TDS PDF가 다시 생성되었습니다.`);
      setTimeout(stepReset, 2500);
    }
    resetBtn.addEventListener('click', () => { fill(base); refresh(); window.gluckToast('info', '변경을 취소했습니다', `${savedAt}에 저장된 값으로 되돌렸습니다.`); });

    // 목록 전환 · 새 소재 · 복제
    function load(item, mode) {
      const d = Object.assign({ status: '게시', fit: 'cover', credit: 'GLUCK Lab 촬영', memo: '' }, item);
      fill(d); base = collect(); baseJson = JSON.stringify(base); conflict = false; $('#edConflict').hidden = true; $('#edDraft').hidden = true; stepReset();
      $('#edMode').textContent = mode || '수정'; refresh();
    }
    $('#edLib').addEventListener('click', e => {
      const b = e.target.closest('.gluck-editor__item'); if (!b) return;
      if (refresh().dirty) { window.gluckToast('warning', '저장되지 않은 변경이 있습니다', '먼저 저장하거나 "변경 취소"를 눌러주세요.'); return; }
      $$('.gluck-editor__item', $('#edLib')).forEach(x => x.setAttribute('aria-current', String(x === b)));
      load(ITEMS[b.dataset.item]);
    });
    $('#edNew').addEventListener('click', () => {
      if (refresh().dirty) { window.gluckToast('warning', '저장되지 않은 변경이 있습니다', '먼저 저장하거나 "변경 취소"를 눌러주세요.'); return; }
      $$('.gluck-editor__item', $('#edLib')).forEach(x => x.setAttribute('aria-current', 'false'));
      load({ name: '', code: '', process: 'SLS', desc: '', tags: [], props: [['', '', '']] }, '새 소재'); base = { name: '__new__' }; baseJson = ''; refresh(); $('#edName').focus();
    });
    $('#edDup').addEventListener('click', () => {
      const d = collect(); const cur = ITEMS[($('.gluck-editor__item[aria-current="true"]', ed) || {}).dataset?.item];
      $$('.gluck-editor__item', $('#edLib')).forEach(x => x.setAttribute('aria-current', 'false'));
      load(Object.assign({}, cur || d, { name: d.name + ' (복제)', code: d.code + '-COPY' }), '새 소재 · 복제');
      base = { name: '__new__' }; baseJson = ''; refresh();
      window.gluckToast('info', '복제했습니다', '이름과 코드를 고친 뒤 저장하세요. 저장 전까지는 원본에 영향이 없습니다.'); $('#edName').focus(); $('#edName').select();
    });

    // 드롭존: 파일명 → 소재명 자동 채움 (비어 있을 때) · 미리보기 반영
    const drop = $('#edDrop'), dropInput = $('input', drop);
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-dragover'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('is-dragover')));
    drop.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); });
    dropInput.addEventListener('change', () => { if (dropInput.files[0]) pick(dropInput.files[0]); });
    function pick(file) {
      if (!/^image\//.test(file.type)) { drop.classList.add('is-error'); window.gluckToast('danger', '이미지 파일만 올릴 수 있습니다', file.name); return; }
      if (file.size > 2 * 1024 * 1024) { drop.classList.add('is-error'); window.gluckToast('danger', '2MB를 넘습니다', `${file.name} · ${(file.size / 1048576).toFixed(1)}MB`); return; }
      drop.classList.remove('is-error');
      const url = URL.createObjectURL(file); $('#edPvImg').innerHTML = ''; const img = new Image(); img.alt = ''; img.src = url; $('#edPvImg').appendChild(img);
      const nm = $('#edName'); if (!nm.value.trim()) { nm.value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '); }
      $('span', drop).innerHTML = `<strong>${esc(file.name)}</strong> · ${(file.size / 1024).toFixed(0)}KB — 다른 파일을 놓으면 교체`;
      refresh();
    }

    // 예외 상황 재현
    $('#edSimConflict').addEventListener('click', () => { conflict = true; const a = $('#edConflict'); a.hidden = false; a.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    ed.addEventListener('click', e => {
      const c = e.target.closest('[data-conflict]'); if (c) { conflict = false; $('#edConflict').hidden = true; if (c.dataset.conflict === 'reload') { fill(Object.assign({}, base, { desc: base.desc + ' · 식품 접촉 등급 확인' })); base = collect(); baseJson = JSON.stringify(base); savedAt = '14:05'; refresh(); window.gluckToast('info', '최신 내용을 불러왔습니다', '이수민 님이 14:05에 저장한 버전입니다.'); } else { window.gluckToast('warning', '내 변경으로 덮어씁니다', '저장을 누르면 이수민 님의 변경이 사라집니다.'); } }
      const d = e.target.closest('[data-draft]'); if (d) { $('#edDraft').hidden = true; if (d.dataset.draft === 'restore') { let draft = null; try { draft = JSON.parse(sessionStorage.getItem('gluck-ed-draft') || 'null'); } catch (x) {} fill(draft || Object.assign({}, base, { desc: base.desc + ' — 식품 접촉 등급', tags: base.tags.concat(['식품 접촉']) })); refresh(); window.gluckToast('success', '초안을 복원했습니다', '저장되지 않은 상태입니다 — 확인 후 저장하세요.'); } else { try { sessionStorage.removeItem('gluck-ed-draft'); } catch (x) {} } }
    });
    $('#edSimDraft').addEventListener('click', () => { const a = $('#edDraft'); a.hidden = false; a.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    let nasDown = false;
    $('#edSimNas').addEventListener('click', () => {
      nasDown = !nasDown; const dot = $('#edNasDot'), row = dot.parentElement, det = $('#edNasDetail');
      dot.className = 'gluck-status-dot ' + (nasDown ? 'is-bad' : 'is-ok'); row.lastChild.textContent = nasDown ? 'NAS 연결 끊김' : 'NAS 연결됨';
      det.textContent = nasDown ? '재시도 중 (30초 간격) · 저장은 로컬에 보관' : `마지막 동기화 ${savedAt} · 12개 파일`;
      window.gluckToast(nasDown ? 'danger' : 'success', nasDown ? 'NAS에 연결할 수 없습니다' : 'NAS 연결이 복구되었습니다', nasDown ? '변경은 이 브라우저에 보관되고, 연결이 돌아오면 저장할 수 있습니다.' : '보관된 변경을 지금 저장할 수 있습니다.');
    });
    // PDF 미리보기 — 오래 걸리는 작업은 상단 중앙 알약
    $('#edPdf').addEventListener('click', () => {
      const pill = document.createElement('div'); pill.className = 'gluck-busy'; pill.setAttribute('role', 'status'); pill.innerHTML = '<span class="gluck-spinner" aria-hidden="true"></span>TDS PDF 만드는 중…'; ed.appendChild(pill);
      setTimeout(() => { pill.remove(); window.gluckToast('success', 'PDF가 준비되었습니다', `TDS_${collect().code.trim() || 'NEW'}.pdf · 184KB — 새 탭에서 열립니다 (데모에서는 열지 않음).`); }, 1400);
    });
    $('#edDeleteGo').addEventListener('click', () => { window.gluckToast('warning', `${collect().name.trim() || '소재'} 삭제됨`, '휴지통에서 30일 안에 복구할 수 있습니다.'); });

    refresh();
  }

  /* ---------------- 조직도형 모달 폼 → 그룹 목록 반영 ---------------- */
  const orgAdd = $('#orgAdd');
  if (orgAdd) {
    orgAdd.querySelector('form').addEventListener('submit', e => {
      const name = $('#orgName').value.trim(); if (!name) { e.preventDefault(); $('#orgName').closest('.gluck-field').classList.add('is-invalid'); $('#orgName').focus(); return; }
      $('#orgName').closest('.gluck-field').classList.remove('is-invalid');
      const team = $('#orgTeam').value, role = $('#orgRole').value.trim() || '역할 미정', st = $('button[aria-pressed="true"]', $('#orgSt')).textContent.trim();
      const g = $(`.gluck-list-group[data-team="${team}"]`); const empty = $('.gluck-list-group__empty', g); if (empty) empty.remove();
      const ini = name.replace(/\s/g, '').slice(0, 2);
      const row = document.createElement('div'); row.className = 'gluck-list-row';
      row.innerHTML = `<span class="gluck-rows__grip" draggable="true" aria-hidden="true"><svg class="gluck-icon" aria-hidden="true"><use href="#i-grip-vertical"/></svg></span><span class="gluck-avatar" style="width: 28px; height: 28px; font-size: 11px"></span><div class="gluck-list-row__body"><b></b><span></span></div><span class="gluck-list-row__acts"><button type="button" class="gluck-btn gluck-btn--ghost gluck-btn--icon gluck-btn--xs" aria-label="편집" data-modal="orgAdd"><svg class="gluck-icon" aria-hidden="true"><use href="#i-pencil"/></svg></button><button type="button" class="gluck-btn gluck-btn--ghost gluck-btn--icon gluck-btn--xs" aria-label="삭제"><svg class="gluck-icon" aria-hidden="true"><use href="#i-trash-2"/></svg></button></span>`;
      $('.gluck-avatar', row).textContent = ini; $('b', row).textContent = name; $('.gluck-list-row__body span', row).textContent = role + (st !== '재직' ? ` · ${st}` : '');
      g.appendChild(row); $('.gluck-count', g).textContent = $$('.gluck-list-row', g).length;
      window.gluckToast('success', '구성원을 추가했습니다', `${name} · ${team} · ${role}`);
      $('#orgName').value = ''; $('#orgRole').value = '';
    });
    $('#orgGroups').addEventListener('click', e => {
      const del = e.target.closest('[aria-label$="삭제"]'); if (!del) return;
      const row = del.closest('.gluck-list-row'), g = row.closest('.gluck-list-group'), nm = $('b', row).textContent;
      row.remove(); const n = $$('.gluck-list-row', g).length; $('.gluck-count', g).textContent = n;
      if (!n) { const em = document.createElement('div'); em.className = 'gluck-list-group__empty'; em.textContent = '구성원이 없습니다.'; g.appendChild(em); }
      window.gluckToast('warning', `${nm} 삭제됨`, '실수라면 조직도 이력에서 되돌릴 수 있습니다.');
    });
  }

  /* ---------------- initial theme (모든 렌더 함수 정의 후) ---------------- */
  let saved = null; try { saved = localStorage.getItem('gluck-theme'); } catch (e) {}
  const qsTheme = new URLSearchParams(location.search).get('theme');   // ?theme=dark 공유 링크
  applyTheme(qsTheme === 'dark' || (!qsTheme && saved === 'dark') ? 'dark' : 'light');
})();

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

  /* ---------------- header drawer demo ---------------- */
  const dh = $('#demoHeader'); const dt = dh && $('.gluck-header__toggle', dh);
  if (dt) dt.addEventListener('click', () => { const o = dh.classList.toggle('is-open'); dt.setAttribute('aria-expanded', String(o)); dt.setAttribute('aria-label', o ? '메뉴 닫기' : '메뉴 열기'); });

  /* ---------------- toast ---------------- */
  let region = $('#toastRegion');
  if (!region) { region = document.createElement('div'); region.className = 'gluck-toast-region'; region.id = 'toastRegion'; document.body.appendChild(region); } const ICON = { success: 'circle-check', info: 'info', warning: 'triangle-alert', danger: 'circle-alert' };
  const TITLE = { success: '저장되었습니다', info: '안내', warning: '확인이 필요합니다', danger: '실패했습니다' };
  const MSG = { success: '견적 Q-2026-0918-031이 발송 대기로 이동했습니다.', info: '새 견적 요청 2건이 접수되었습니다.', warning: '유효기간이 2일 남은 견적이 있습니다.', danger: '서버 오류로 발송하지 못했습니다. 다시 시도하세요.' };
  function toast(status, title, msg) {
    const el = document.createElement('div');
    el.className = 'gluck-toast gluck-toast--' + status; el.setAttribute('role', status === 'danger' ? 'alert' : 'status');
    el.innerHTML = `<svg class="gluck-icon" aria-hidden="true"><use href="#i-${ICON[status]}"/></svg><div><div class="gluck-toast__title">${title || TITLE[status]}</div><div class="gluck-toast__msg">${msg || MSG[status]}</div></div><button class="gluck-btn gluck-btn--ghost gluck-btn--icon gluck-btn--xs gluck-toast__close" aria-label="닫기"><svg class="gluck-icon" aria-hidden="true"><use href="#i-x"/></svg></button>`;
    el.querySelector('button').addEventListener('click', () => el.remove());
    region.appendChild(el);
    if (status !== 'danger') setTimeout(() => el.remove(), 4000);
    while (region.children.length > 3) region.firstChild.remove();
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-toast]'); if (b) toast(b.dataset.toast, b.dataset.toastTitle || null, b.dataset.toastMsg || null); });

  /* ---------------- modal ---------------- */
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-modal]'); if (o) { const d = document.getElementById(o.dataset.modal); if (d && !d.open) d.showModal(); }
    const c = e.target.closest('[data-close]'); if (c) { c.closest('dialog').close(); }
  });
  $$('dialog.gluck-modal').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  /* ---------------- tooltip: ESC 닫기 (WCAG 2.2 · 1.4.13) ---------------- */
  $$('.gluck-tooltip').forEach(t => { ['mouseleave', 'focusout'].forEach(ev => t.addEventListener(ev, () => t.classList.remove('is-dismissed'))); });

  /* ---------------- details 메뉴: 하나만 열림 · 바깥 클릭/ESC 닫기 · overflow 컨테이너 안에서는 fixed 배치 ---------------- */
  function closeMenus(except) { $$('details.gluck-menu[open]').forEach(o => { if (o !== except) o.open = false; }); }
  document.addEventListener('toggle', e => {
    const d = e.target; if (!(d instanceof HTMLDetailsElement) || !d.classList.contains('gluck-menu')) return;
    const list = d.querySelector('.gluck-menu__list'); if (!list) return;
    if (d.open) {
      closeMenus(d);
      if (d.closest('.gluck-table-wrap, .gluck-card--flush')) {
        const r = d.querySelector('summary').getBoundingClientRect();
        list.classList.add('is-fixed');
        const w = list.offsetWidth, h = list.offsetHeight;
        const y = r.bottom + h + 8 > innerHeight ? r.top - h - 4 : r.bottom + 4;
        list.style.setProperty('--menu-y', y + 'px');
        list.style.setProperty('--menu-x', Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px');
      }
    } else { list.classList.remove('is-fixed'); }
  }, true);
  document.addEventListener('click', e => { if (e.target.closest('.gluck-menu__item')) { closeMenus(); return; } if (!e.target.closest('details.gluck-menu')) closeMenus(); });
  document.addEventListener('scroll', e => { if (e.target !== document) closeMenus(); }, true);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeMenus();
    $$('.gluck-tooltip').forEach(t => { if (t.matches(':hover, :focus-within')) t.classList.add('is-dismissed'); });
    const sh = document.querySelector('.gluck-shell.is-drawer-open'); if (sh) { sh.classList.remove('is-drawer-open'); const b = sh.querySelector('#shellToggle'); if (b) b.setAttribute('aria-expanded', 'false'); }
  });

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

  const shell = $('#shell'), shellToggle = $('#shellToggle');
  const mqShell = window.matchMedia('(max-width: 1023px)');
  shellToggle.addEventListener('click', () => {
    if (mqShell.matches) { const o = shell.classList.toggle('is-drawer-open'); shellToggle.setAttribute('aria-expanded', String(o)); return; }
    const c = shell.classList.toggle('is-collapsed'); shellToggle.setAttribute('aria-expanded', String(!c)); shellToggle.setAttribute('aria-label', c ? '사이드바 펼치기' : '사이드바 접기');
  });
  shell.addEventListener('click', e => { if (e.target === shell && shell.classList.contains('is-drawer-open')) { shell.classList.remove('is-drawer-open'); shellToggle.setAttribute('aria-expanded', 'false'); } });
  mqShell.addEventListener('change', () => { shell.classList.remove('is-drawer-open', 'is-collapsed'); shellToggle.setAttribute('aria-expanded', String(!mqShell.matches)); });
  }   /* end: data table · shell */

  /* ---------------- initial theme (모든 렌더 함수 정의 후) ---------------- */
  let saved = null; try { saved = localStorage.getItem('gluck-theme'); } catch (e) {}
  const qsTheme = new URLSearchParams(location.search).get('theme');   // ?theme=dark 공유 링크
  applyTheme(qsTheme === 'dark' || (!qsTheme && saved === 'dark') ? 'dark' : 'light');
})();

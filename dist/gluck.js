/* ==========================================================================
   GLUCK UI · dist/gluck.js (선택) — 컴포넌트 공통 동작. 프레임워크 없이 <script src=".../dist/gluck.js" defer>
   포함 동작: details 드롭다운(하나만 열림·바깥 클릭/ESC 닫기·테이블 안 fixed 배치) · 툴팁 ESC 닫기(WCAG 1.4.13)
            · 헤더 모바일 드로어 · 관리자 셸 사이드바 접기/드로어 · 모달 [data-modal]/[data-close] · window.gluckToast()
            · 등록·편집 화면: 세그먼트(.gluck-seg) · 동적 행(.gluck-rows: 추가/삭제/이동/그립 드래그) · 칩 입력(.gluck-chips) · window.gluckSaveState()
   React/Vue 등에서는 같은 규칙을 컴포넌트 안에서 구현해도 됨. 규칙: HEX 리터럴 없음, DOM 계약은 llms.txt 참조.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__gluckUI) return; window.__gluckUI = true;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- details 드롭다운 (.gluck-menu) ---- */
  function closeMenus(except) { $$('details.gluck-menu[open]').forEach(o => { if (o !== except) o.open = false; }); }
  document.addEventListener('toggle', e => {
    const d = e.target; if (!(d instanceof HTMLDetailsElement) || !d.classList.contains('gluck-menu')) return;
    const list = d.querySelector('.gluck-menu__list'); if (!list) return;
    if (d.open) {
      closeMenus(d);
      if (d.closest('.gluck-table-wrap, .gluck-card--flush')) {           // overflow 컨테이너 안 → 화면 좌표로 고정
        const r = d.querySelector('summary').getBoundingClientRect();
        list.classList.add('is-fixed');
        const w = list.offsetWidth, h = list.offsetHeight;
        const y = r.bottom + h + 8 > innerHeight ? r.top - h - 4 : r.bottom + 4;
        list.style.setProperty('--menu-y', y + 'px');
        list.style.setProperty('--menu-x', Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px');
      }
    } else { list.classList.remove('is-fixed'); }
  }, true);
  document.addEventListener('click', e => {
    if (e.target.closest('.gluck-menu__item')) { closeMenus(); return; }
    if (!e.target.closest('details.gluck-menu')) closeMenus();
  });
  document.addEventListener('scroll', e => { if (e.target !== document) closeMenus(); }, true);

  /* ---- 툴팁 ESC ---- */
  $$('.gluck-tooltip').forEach(t => ['mouseleave', 'focusout'].forEach(ev => t.addEventListener(ev, () => t.classList.remove('is-dismissed'))));

  /* ---- ESC 공통 ---- */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeMenus();
    $$('.gluck-tooltip').forEach(t => { if (t.matches(':hover, :focus-within')) t.classList.add('is-dismissed'); });
    $$('.gluck-shell.is-drawer-open').forEach(sh => { sh.classList.remove('is-drawer-open'); const b = $('[data-shell-toggle]', sh); if (b) b.setAttribute('aria-expanded', 'false'); });
    $$('.gluck-header.is-open').forEach(h => { h.classList.remove('is-open'); const b = $('.gluck-header__toggle', h); if (b) b.setAttribute('aria-expanded', 'false'); });
  });

  /* ---- 헤더 모바일 드로어: <button class="gluck-header__toggle" aria-expanded> ---- */
  document.addEventListener('click', e => {
    const t = e.target.closest('.gluck-header__toggle'); if (!t) return;
    const h = t.closest('.gluck-header'); const o = h.classList.toggle('is-open');
    t.setAttribute('aria-expanded', String(o)); t.setAttribute('aria-label', o ? '메뉴 닫기' : '메뉴 열기');
  });

  /* ---- 관리자 셸: <button data-shell-toggle aria-expanded="true"> ---- */
  const mq = window.matchMedia('(max-width: 1023px)');
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-shell-toggle]');
    if (t) {
      const sh = t.closest('.gluck-shell'); if (!sh) return;
      if (mq.matches) { const o = sh.classList.toggle('is-drawer-open'); t.setAttribute('aria-expanded', String(o)); return; }
      const c = sh.classList.toggle('is-collapsed'); t.setAttribute('aria-expanded', String(!c)); t.setAttribute('aria-label', c ? '사이드바 펼치기' : '사이드바 접기');
      return;
    }
    const sh = e.target.classList && e.target.classList.contains('gluck-shell') ? e.target : null;   // 백드롭(::before) 클릭 → 셸 자신이 타깃
    if (sh && sh.classList.contains('is-drawer-open')) { sh.classList.remove('is-drawer-open'); const b = $('[data-shell-toggle]', sh); if (b) b.setAttribute('aria-expanded', 'false'); }
  });
  mq.addEventListener('change', () => $$('.gluck-shell').forEach(sh => { sh.classList.remove('is-drawer-open', 'is-collapsed'); const b = $('[data-shell-toggle]', sh); if (b) b.setAttribute('aria-expanded', String(!mq.matches)); }));

  /* ---- 모달: <button data-modal="id"> · <button data-close> ---- */
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-modal]'); if (o) { const d = document.getElementById(o.dataset.modal); if (d && !d.open) d.showModal(); }
    const c = e.target.closest('[data-close]'); if (c) { const d = c.closest('dialog'); if (d) d.close(); }
  });
  $$('dialog.gluck-modal').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  /* ---- 세그먼트: .gluck-seg > button[aria-pressed] (상호배타) ---- */
  document.addEventListener('click', e => {
    const b = e.target.closest('.gluck-seg > button'); if (!b || b.disabled) return;
    $$(':scope > button', b.parentElement).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    b.parentElement.dispatchEvent(new CustomEvent('gluck:change', { bubbles: true, detail: { value: b.dataset.value ?? b.textContent.trim() } }));
  });

  /* ---- 동적 행(.gluck-rows): [data-row-add] 추가 · [data-row-remove] 삭제 · [data-row-up|down] 이동 · grip 드래그 ---- */
  function rowsOf(el) { return el.closest('.gluck-rows'); }
  function rowsChanged(rows) { rows.dispatchEvent(new CustomEvent('gluck:change', { bubbles: true })); }
  document.addEventListener('click', e => {
    const add = e.target.closest('[data-row-add]');
    if (add) { const rows = rowsOf(add); const tpl = rows && rows.querySelector('template'); if (!tpl) return;
      const max = parseInt(rows.dataset.max || '0', 10); const count = $$('.gluck-rows__row', rows).length;
      if (max && count >= max) { rows.dispatchEvent(new CustomEvent('gluck:limit', { bubbles: true, detail: { max } })); return; }
      const node = tpl.content.firstElementChild.cloneNode(true); const body = rows.querySelector('.gluck-rows__body'); if (body) body.appendChild(node); else rows.insertBefore(node, tpl);
      const first = node.querySelector('input,select,textarea'); if (first) first.focus(); rowsChanged(rows); return; }
    const rm = e.target.closest('[data-row-remove]'); if (rm) { const row = rm.closest('.gluck-rows__row'); const rows = rowsOf(rm); row.remove(); rowsChanged(rows); return; }
    const up = e.target.closest('[data-row-up]'); if (up) { const row = up.closest('.gluck-rows__row'); const prev = row.previousElementSibling; if (prev && prev.classList.contains('gluck-rows__row')) { row.parentElement.insertBefore(row, prev); rowsChanged(rowsOf(up)); } return; }
    const dn = e.target.closest('[data-row-down]'); if (dn) { const row = dn.closest('.gluck-rows__row'); const next = row.nextElementSibling; if (next && next.classList.contains('gluck-rows__row')) { row.parentElement.insertBefore(next, row); rowsChanged(rowsOf(dn)); } return; }
  });
  let dragRow = null;
  document.addEventListener('dragstart', e => { if (!(e.target instanceof Element)) return; const grip = e.target.closest('.gluck-rows__grip'); const row = grip ? grip.closest('.gluck-rows__row, .gluck-list-row') : e.target.closest('.gluck-rows__row[draggable="true"], .gluck-list-row[draggable="true"]'); if (!row) return; dragRow = row; row.classList.add('is-dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'row'); } catch (x) {} });
  document.addEventListener('dragover', e => { if (!dragRow) return; const row = e.target.closest && e.target.closest('.gluck-rows__row, .gluck-list-row'); if (!row || row === dragRow || row.parentElement !== dragRow.parentElement) return; e.preventDefault(); $$('.is-over, .is-over-before', row.parentElement).forEach(x => x.classList.remove('is-over', 'is-over-before')); row.classList.add(row.classList.contains('gluck-list-row') ? 'is-over-before' : 'is-over'); });
  document.addEventListener('drop', e => { if (!dragRow) return; const row = e.target.closest && e.target.closest('.gluck-rows__row, .gluck-list-row'); if (row && row !== dragRow && row.parentElement === dragRow.parentElement) { e.preventDefault(); row.parentElement.insertBefore(dragRow, row); const rows = dragRow.closest('.gluck-rows, .gluck-list-group'); if (rows) rows.dispatchEvent(new CustomEvent('gluck:change', { bubbles: true })); } });
  document.addEventListener('dragend', () => { if (!dragRow) return; dragRow.classList.remove('is-dragging'); $$('.is-over, .is-over-before').forEach(x => x.classList.remove('is-over', 'is-over-before')); dragRow = null; });

  /* ---- 칩 입력(.gluck-chips): Enter/쉼표로 추가 · Backspace/× 삭제 · data-max ---- */
  function chipsSync(box) { const max = parseInt(box.dataset.max || '0', 10); const n = $$('.gluck-tag', box).length; box.classList.toggle('is-full', !!max && n >= max); box.dispatchEvent(new CustomEvent('gluck:change', { bubbles: true, detail: { values: $$('.gluck-tag', box).map(t => t.dataset.value) } })); }
  window.gluckChipAdd = function (box, value) { value = String(value || '').trim(); if (!value) return false; if ($$('.gluck-tag', box).some(t => t.dataset.value === value)) return false;
    const max = parseInt(box.dataset.max || '0', 10); if (max && $$('.gluck-tag', box).length >= max) return false;
    const tag = document.createElement('span'); tag.className = 'gluck-tag gluck-tag--pill'; tag.dataset.value = value; tag.innerHTML = '<span></span><button type="button" class="gluck-tag__remove" aria-label="제거"><svg class="gluck-icon" aria-hidden="true"><use href="#i-x"/></svg></button>'; tag.firstChild.textContent = value;
    const input = box.querySelector('input'); box.insertBefore(tag, input); chipsSync(box); return true; };
  document.addEventListener('keydown', e => { const input = e.target.closest && e.target.closest('.gluck-chips input'); if (!input) return; const box = input.closest('.gluck-chips');
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (window.gluckChipAdd(box, input.value)) input.value = ''; }
    else if (e.key === 'Backspace' && !input.value) { const last = $$('.gluck-tag', box).pop(); if (last) { last.remove(); chipsSync(box); } } });
  document.addEventListener('click', e => { const box = e.target.closest && e.target.closest('.gluck-chips'); if (!box) return; const rm = e.target.closest('.gluck-tag__remove'); if (rm) { rm.closest('.gluck-tag').remove(); chipsSync(box); return; } if (e.target === box) { const i = box.querySelector('input'); if (i) i.focus(); } });
  document.addEventListener('focusout', e => { const input = e.target.closest && e.target.closest('.gluck-chips input'); if (input && input.value.trim()) { if (window.gluckChipAdd(input.closest('.gluck-chips'), input.value)) input.value = ''; } });

  /* ---- 저장 바 상태 도우미: window.gluckSaveState(bar, 'clean'|'dirty'|'saving', text) ---- */
  window.gluckSaveState = function (bar, state, text) { const s = bar.querySelector('.gluck-savebar__state'); if (!s) return; s.classList.toggle('is-dirty', state === 'dirty'); s.classList.toggle('is-saving', state === 'saving'); if (text != null) { if (s.lastChild && s.lastChild.nodeType === 3) s.lastChild.textContent = text; else s.append(text); } };

  /* ---- 토스트: window.gluckToast(status, title, msg) · status = success|info|warning|danger ---- */
  const ICON = { success: 'circle-check', info: 'info', warning: 'triangle-alert', danger: 'circle-alert' };
  window.gluckToast = function (status, title, msg, opts) {
    status = ICON[status] ? status : 'info';
    let region = $('.gluck-toast-region');
    if (!region) { region = document.createElement('div'); region.className = 'gluck-toast-region' + (document.documentElement.dataset.theme === 'admin' ? ' gluck-toast-region--admin' : ''); document.body.appendChild(region); }
    const el = document.createElement('div');
    el.className = 'gluck-toast gluck-toast--' + status; el.setAttribute('role', status === 'danger' ? 'alert' : 'status');
    el.innerHTML = '<svg class="gluck-icon" aria-hidden="true"><use href="#i-' + ICON[status] + '"/></svg><div>' + (title ? '<div class="gluck-toast__title"></div>' : '') + '<div class="gluck-toast__msg"></div></div><button class="gluck-btn gluck-btn--ghost gluck-btn--icon gluck-btn--xs gluck-toast__close" aria-label="닫기"><svg class="gluck-icon" aria-hidden="true"><use href="#i-x"/></svg></button>';
    if (title) el.querySelector('.gluck-toast__title').textContent = title;
    el.querySelector('.gluck-toast__msg').textContent = msg || '';
    el.querySelector('button').addEventListener('click', () => el.remove());
    region.appendChild(el);
    const ms = (opts && opts.duration) || (status === 'danger' ? 0 : 4000);
    if (ms) setTimeout(() => el.remove(), ms);
    while (region.children.length > 3) region.firstChild.remove();
    return el;
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-toast]'); if (b) window.gluckToast(b.dataset.toast, b.dataset.toastTitle || '', b.dataset.toastMsg || ''); });
})();

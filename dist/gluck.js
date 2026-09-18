/* ==========================================================================
   GLUCK UI · dist/gluck.js (선택) — 컴포넌트 공통 동작. 프레임워크 없이 <script src=".../dist/gluck.js" defer>
   포함 동작: details 드롭다운(하나만 열림·바깥 클릭/ESC 닫기·테이블 안 fixed 배치) · 툴팁 ESC 닫기(WCAG 1.4.13)
            · 헤더 모바일 드로어 · 관리자 셸 사이드바 접기/드로어 · 모달 [data-modal]/[data-close] · window.gluckToast()
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

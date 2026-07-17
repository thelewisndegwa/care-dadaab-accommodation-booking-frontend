/** Shared UI chrome for public and admin pages. */

import { getUser, clearSession, isSuperAdmin } from '../auth/session.js';

export function initPublicNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

export function initAdminShell() {
  const user = getUser();
  const nameEl = document.querySelector('[data-admin-name]');
  const roleEl = document.querySelector('[data-admin-role]');
  const toggle = document.querySelector('[data-admin-menu-toggle]');
  const sidebar = document.querySelector('[data-admin-sidebar]');

  if (nameEl && user) {
    nameEl.textContent = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  }
  if (roleEl && user) {
    roleEl.textContent = user.role || '';
  }

  // Hide Super Admin-only links for Accommodation Officers
  document.querySelectorAll('[data-super-admin-only]').forEach((el) => {
    if (!isSuperAdmin(user)) {
      el.hidden = true;
    }
  });

  toggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('is-open');
  });

  document.querySelector('[data-logout]')?.addEventListener('click', (event) => {
    event.preventDefault();
    clearSession();
    window.location.href = '/admin/login.html';
  });
}

export function setActiveNav(path) {
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href === path || window.location.pathname.endsWith(href.replace(/^\.\//, ''))) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ============================================================
   Darrock Research v3 — Application JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initPanelToggle();
  initMobileSheet();
  initAccordions();
  initSubtabs();
  initYearRows();
  initSlideOver();
  initPortfolioActions();
  initFilterForm();
});

/* --- Panel Toggle (desktop: collapse/expand left panel) --- */
function initPanelToggle() {
  const toggle = document.querySelector('.panel-toggle');
  const panel = document.querySelector('.panel-left');
  const fab = document.getElementById('fab-filters');
  const backdrop = document.getElementById('sheet-backdrop');
  if (!panel) return;

  function openMobileSheet() {
    panel.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('open');
  }

  function closeMobileSheet() {
    panel.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('open');
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        if (panel.classList.contains('mobile-open')) closeMobileSheet();
        else openMobileSheet();
      } else {
        panel.classList.toggle('collapsed');
      }
    });
  }

  // FAB button opens the sheet on mobile
  if (fab) {
    fab.addEventListener('click', openMobileSheet);
  }

  // Backdrop click closes the sheet
  if (backdrop) {
    backdrop.addEventListener('click', closeMobileSheet);
  }

  // Clicking the collapsed label also opens (desktop)
  const collapseLabel = panel.querySelector('.panel-collapse-label');
  if (collapseLabel) {
    collapseLabel.addEventListener('click', () => {
      panel.classList.remove('collapsed');
    });
  }
}

/* --- Mobile: swipe-down to close bottom sheet --- */
function initMobileSheet() {
  const panel = document.querySelector('.panel-left');
  const backdrop = document.getElementById('sheet-backdrop');
  if (!panel) return;

  let startY = 0;
  panel.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  panel.addEventListener('touchend', (e) => {
    const dy = e.changedTouches[0].clientY - startY;
    if (dy > 60) {
      panel.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('open');
    }
  }, { passive: true });
}

/* --- Accordions --- */
function initAccordions() {
  document.querySelectorAll('.acc-head').forEach(head => {
    head.addEventListener('click', () => {
      head.closest('.acc').classList.toggle('closed');
    });
  });
}

/* --- Sub-tabs (Rule1 / Rule2 within Screening accordion) --- */
function initSubtabs() {
  document.querySelectorAll('.subtabs').forEach(tabBar => {
    const tabs = tabBar.querySelectorAll('.subtab');
    const container = tabBar.closest('.acc-body') || tabBar.parentElement;
    const panels = container.querySelectorAll('.subtab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = container.querySelector(`#${tab.dataset.target}`);
        if (target) target.classList.add('active');
      });
    });
  });
}

/* --- Year Rows: click to expand detail below --- */
function initYearRows() {
  document.querySelectorAll('.year-row').forEach(row => {
    row.addEventListener('click', () => {
      const year = row.dataset.year;
      const detail = document.getElementById(`detail-${year}`);
      if (!detail) return;

      // Close other open details
      document.querySelectorAll('.year-detail.open').forEach(d => {
        if (d !== detail) d.classList.remove('open');
      });
      document.querySelectorAll('.year-row.active').forEach(r => {
        if (r !== row) r.classList.remove('active');
      });

      detail.classList.toggle('open');
      row.classList.toggle('active');
    });
  });
}

/* --- Slide-Over Panel (Stock Detail) --- */
function initSlideOver() {
  // Clicking a stock link opens the slide-over
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-stock]');
    if (!link) return;
    e.preventDefault();
    openSlideOver(link.dataset.stock);
  });

  // Close button
  document.addEventListener('click', (e) => {
    if (e.target.closest('.slide-close')) {
      closeSlideOver();
    }
    if (e.target.classList.contains('slide-over-backdrop')) {
      closeSlideOver();
    }
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSlideOver();
  });
}

async function openSlideOver(ticker) {
  const panel = document.getElementById('slide-over');
  const backdrop = document.getElementById('slide-over-backdrop');
  const content = document.getElementById('slide-over-content');
  if (!panel || !content) return;

  content.innerHTML = '<div class="text-center p-2"><span class="spinner"></span></div>';
  panel.classList.add('open');
  if (backdrop) backdrop.classList.add('open');

  try {
    const res = await fetch(`/v3/stock/${ticker}?partial=1`);
    if (res.ok) {
      content.innerHTML = await res.text();
    } else {
      content.innerHTML = `<p class="text-muted p-2">Failed to load ${ticker}</p>`;
    }
  } catch (err) {
    content.innerHTML = `<p class="text-muted p-2">Network error</p>`;
  }
}

function closeSlideOver() {
  const panel = document.getElementById('slide-over');
  const backdrop = document.getElementById('slide-over-backdrop');
  if (panel) panel.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
}

/* --- Portfolio CRUD --- */
function initPortfolioActions() {
  // Save
  const saveBtn = document.getElementById('save-portfolio-btn');
  const saveContainer = document.getElementById('save-portfolio-form');
  if (saveBtn && saveContainer) {
    saveBtn.addEventListener('click', async () => {
      const nameInput = saveContainer.querySelector('[name="portfolio_name"]');
      if (!nameInput || !nameInput.value.trim()) {
        toast('Enter a portfolio name', 'err');
        return;
      }
      const formData = new FormData();
      saveContainer.querySelectorAll('input[name]').forEach(el => {
        formData.append(el.name, el.value);
      });
      try {
        const res = await fetch('/save_portfolio', { method: 'POST', body: formData });
        const data = await res.json();
        toast(data.message || 'Saved', data.success ? 'ok' : 'err');
        if (data.success) setTimeout(() => location.reload(), 500);
      } catch { toast('Save failed', 'err'); }
    });
  }

  // Delete
  document.querySelectorAll('[data-delete-portfolio]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this portfolio?')) return;
      try {
        const res = await fetch(`/delete_portfolio/${btn.dataset.deletePortfolio}`, { method: 'POST' });
        const data = await res.json();
        toast(data.message || 'Deleted', data.success ? 'ok' : 'err');
        if (data.success) btn.closest('.portfolio-row')?.remove();
      } catch { toast('Delete failed', 'err'); }
    });
  });

  // Load
  document.querySelectorAll('[data-load-portfolio]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        const res = await fetch(`/get_portfolio/${btn.dataset.loadPortfolio}`);
        const data = await res.json();
        if (data.success && data.portfolio?.parameters) {
          applyParams(data.portfolio.parameters);
          toast('Parameters loaded', 'ok');
        }
      } catch { toast('Load failed', 'err'); }
    });
  });
}

function applyParams(params) {
  const flat = { ...params, ...params.rule1_params, ...params.rule2_params, ...params.filter_params };
  Object.entries(flat).forEach(([k, v]) => {
    const el = document.querySelector(`[name="${k}"]`);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v;
  });
}

/* --- Filter Form Submit --- */
function initFilterForm() {
  const form = document.getElementById('filter-form');
  if (!form) return;
  form.addEventListener('submit', () => {
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> running...'; }
  });
}

/* --- Toast Notifications --- */
function toast(msg, type = 'ok') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

/* ============================================================
   Darrock Research v3 — Application JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initPanelToggle();
  initMobileSheet();
  initAccordions();
  initSubtabs();
  initMetricRows();
  initRecentPricePresets();
  initYearRows();
  initSlideOver();
  initPortfolioActions();
  initFilterForm();
  initSkipToggles();
  initLogout();
});

/* --- Skip-all / Include-all toggles for omit checkboxes ---
   Buttons mark themselves with data-skip-scope ("rule1" | "rule2") and
   data-skip-mode ("all" | "none"). They flip every matching omit checkbox
   client-side without submitting the form. */
function initSkipToggles() {
  document.querySelectorAll('.skip-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const scope = btn.dataset.skipScope;
      const mode = btn.dataset.skipMode;
      const selector = scope === 'rule2'
        ? '#tab-2yr input[type="checkbox"][name$="_cagr_2y_omit"]'
        : '#tab-5yr input[type="checkbox"][name$="_cagr_omit"]';
      document.querySelectorAll(selector).forEach(cb => {
        cb.checked = (mode === 'all');
      });
    });
  });
}

/* --- Logout --- */
function initLogout() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    await fetch('/v3/logout', { method: 'POST' });
    window.location.href = '/v3/';
  });
}

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

/* --- Per-metric filter rows (method select, posrate visibility, omit dimming) --- */
function initMetricRows() {
  document.querySelectorAll('.metric-filter-row').forEach(row => {
    const method = row.querySelector('.metric-filter-method');
    const posrate = row.querySelector('.metric-filter-posrate');
    const omitCb = row.querySelector('.metric-filter-omit input[type="checkbox"]');

    function updatePosrate() {
      if (!method || !posrate) return;
      if (method.value === 'consistency') {
        posrate.classList.remove('hidden');
      } else {
        posrate.classList.add('hidden');
      }
    }

    function updateOmitted() {
      if (!omitCb) return;
      if (omitCb.checked) {
        row.classList.add('omitted');
      } else {
        row.classList.remove('omitted');
      }
    }

    if (method) method.addEventListener('change', updatePosrate);
    if (omitCb) omitCb.addEventListener('change', updateOmitted);

    // Set initial state
    updatePosrate();
    updateOmitted();
  });
}

/* --- Recent price presets (mean reversion helpers) --- */
function initRecentPricePresets() {
  const modeField = document.querySelector('[name="recent_price_filter"]');
  const thresholdField = document.querySelector('[name="recent_price_threshold"]');
  const directionField = document.querySelector('[name="recent_price_direction"]');

  if (!modeField || !thresholdField || !directionField) return;

  document.querySelectorAll('.recent-price-preset').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.mode) modeField.value = button.dataset.mode;
      if (button.dataset.threshold) thresholdField.value = button.dataset.threshold;
      if (button.dataset.direction) directionField.value = button.dataset.direction;
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
  // Save — must include the WHOLE filter form so saved configs round-trip,
  // not just the inputs inside #save-portfolio-form (which only holds the
  // name/year/tickers). Without this the backend reconstructs DefaultParams
  // for every missing field and the saved record bears no resemblance to
  // what the user actually had on screen.
  const saveBtn = document.getElementById('save-portfolio-btn');
  const saveContainer = document.getElementById('save-portfolio-form');
  const filterForm = document.getElementById('filter-form');
  if (saveBtn && saveContainer && filterForm) {
    saveBtn.addEventListener('click', async () => {
      const nameInput = saveContainer.querySelector('[name="portfolio_name"]');
      if (!nameInput || !nameInput.value.trim()) {
        toast('Enter a portfolio name', 'err');
        return;
      }
      // FormData(form) handles inputs/selects/checkboxes correctly:
      // unchecked checkboxes are omitted (matching standard form-submit semantics
      // that the backend's _parse_form already expects).
      const formData = new FormData(filterForm);
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

  // Default toggle (★/☆) — set or clear the user's default saved research.
  // The backend enforces uniqueness (partial unique index on user_id where is_default=1)
  // so we don't have to optimistically clear other rows in the DOM.
  document.querySelectorAll('[data-default-portfolio]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.defaultPortfolio;
      const isDefault = btn.dataset.isDefault === '1';
      try {
        const url = isDefault
          ? '/clear_default_portfolio'
          : `/set_default_portfolio/${id}`;
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          toast(isDefault ? 'Default cleared' : 'Default set', 'ok');
          setTimeout(() => location.reload(), 400);
        } else {
          toast(data.message || 'Failed', 'err');
        }
      } catch { toast('Default toggle failed', 'err'); }
    });
  });

  // Share toggle
  document.querySelectorAll('[data-share-portfolio]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.sharePortfolio;
      const currentlyShared = btn.dataset.shared === '1';
      const newState = !currentlyShared;
      try {
        const res = await fetch(`/share_portfolio/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shared: newState }),
        });
        const data = await res.json();
        if (data.success) {
          btn.dataset.shared = newState ? '1' : '0';
          btn.textContent = newState ? '🔗' : '🔒';
          btn.title = newState ? 'Unshare' : 'Share publicly';
          toast(newState ? 'Portfolio shared' : 'Portfolio unshared', 'ok');
          // Toggle badge
          const row = btn.closest('.portfolio-row');
          const badge = row?.querySelector('.badge-pos');
          if (newState && !badge) {
            const nameEl = row?.querySelector('strong');
            if (nameEl) {
              const a = document.createElement('a');
              a.href = `/v3/p/${id}`;
              a.target = '_blank';
              a.className = 'badge badge-pos';
              a.style.cssText = 'font-size:0.5rem;margin-left:0.3rem;';
              a.textContent = 'shared';
              nameEl.parentNode.appendChild(a);
            }
          } else if (!newState && badge) {
            badge.remove();
          }
        } else {
          toast(data.message || 'Failed', 'err');
        }
      } catch { toast('Share failed', 'err'); }
    });
  });
}

function applyParams(params) {
  const r1 = params.rule1_params || {};
  const r2 = params.rule2_params || {};
  const fp = params.filter_params || {};
  const flat = { ...params, ...r1, ...r2, ...fp };

  // Score weights live as a nested object {sales:0.5,fcf:0.5,...} but the
  // form has individual weight_<key> inputs — flatten them out.
  const weights = fp.score_weights || flat.score_weights;
  if (weights && typeof weights === 'object') {
    Object.entries(weights).forEach(([k, v]) => { flat[`weight_${k}`] = v; });
  }
  delete flat.score_weights;

  // Reset all _cagr_omit / _cagr_2y_omit checkboxes first so a saved with
  // omit=false properly unchecks any that are currently checked.
  document.querySelectorAll('#filter-form input[type="checkbox"][name$="_omit"]').forEach(el => {
    el.checked = false;
  });

  Object.entries(flat).forEach(([k, v]) => {
    const el = document.querySelector(`#filter-form [name="${k}"]`);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!v;
    else if (el.tagName === 'SELECT') el.value = v;
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

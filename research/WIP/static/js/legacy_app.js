/* ============================================================
   Darrock Research — Main JavaScript (vanilla, no frameworks)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCollapsibles();
  initYearCards();
  initPortfolioActions();
  initFormSubmit();
  initTooltips();
});

/* --- Collapsible Sections --- */
function initCollapsibles() {
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.section').classList.toggle('collapsed');
    });
  });
}

/* --- Year Cards (expand/collapse) --- */
function initYearCards() {
  document.querySelectorAll('.year-card-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.year-card').classList.toggle('open');
    });
  });
}

/* --- Portfolio CRUD --- */
function initPortfolioActions() {
  // Save portfolio
  const saveForm = document.getElementById('save-portfolio-form');
  if (saveForm) {
    saveForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(saveForm);
      try {
        const res = await fetch('/save_portfolio', { method: 'POST', body: formData });
        const data = await res.json();
        showNotification(data.message || 'Portfolio saved', data.success ? 'success' : 'error');
        if (data.success) setTimeout(() => location.reload(), 600);
      } catch (err) {
        showNotification('Failed to save portfolio', 'error');
      }
    });
  }

  // Delete portfolio
  document.querySelectorAll('[data-delete-portfolio]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deletePortfolio;
      if (!confirm('Delete this portfolio?')) return;
      try {
        const res = await fetch(`/delete_portfolio/${id}`, { method: 'POST' });
        const data = await res.json();
        showNotification(data.message || 'Deleted', data.success ? 'success' : 'error');
        if (data.success) btn.closest('.portfolio-item')?.remove();
      } catch (err) {
        showNotification('Failed to delete', 'error');
      }
    });
  });

  // Load portfolio parameters
  document.querySelectorAll('[data-load-portfolio]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.loadPortfolio;
      try {
        const res = await fetch(`/get_portfolio/${id}`);
        const data = await res.json();
        if (data.success && data.portfolio?.parameters) {
          applyParameters(data.portfolio.parameters);
          showNotification('Parameters loaded', 'success');
        }
      } catch (err) {
        showNotification('Failed to load portfolio', 'error');
      }
    });
  });
}

function applyParameters(params) {
  // Flatten nested params (rule1_params, rule2_params, filter_params)
  const flat = { ...params, ...params.rule1_params, ...params.rule2_params, ...params.filter_params };
  Object.entries(flat).forEach(([key, value]) => {
    const el = document.querySelector(`[name="${key}"]`);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!value;
    else el.value = value;
  });
}

/* --- Form Submit with Loading --- */
function initFormSubmit() {
  const form = document.getElementById('filter-form');
  if (!form) return;
  form.addEventListener('submit', () => {
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> running analysis...';
    }
  });
}

/* --- Tooltips (touch + hover) --- */
function initTooltips() {
  document.querySelectorAll('.has-tooltip').forEach(el => {
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      // Close other tooltips
      document.querySelectorAll('.tooltip-content').forEach(t => t.style.display = 'none');
      const tip = el.querySelector('.tooltip-content');
      if (tip) tip.style.display = 'block';
    });
  });
  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.has-tooltip')) {
      document.querySelectorAll('.tooltip-content').forEach(t => t.style.display = '');
    }
  });
}

/* --- Notifications --- */
function showNotification(message, type = 'success') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = `notification notification-${type}`;
  el.textContent = message;
  el.style.cssText = `
    position: fixed; top: 1rem; right: 1rem; z-index: 9999;
    font-family: var(--font-ui); font-size: 0.82rem;
    padding: 0.65rem 1.25rem; border-radius: var(--radius);
    background: ${type === 'success' ? 'var(--positive)' : 'var(--negative)'};
    color: white; box-shadow: var(--shadow-lg);
    animation: slideIn 0.25s ease-out;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* --- Utility: format numbers --- */
function fmt(n, decimals = 0) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(n, decimals = 1) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toFixed(decimals) + '%';
}

function fmtMoney(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + fmt(n, 2);
}

/* --- Spinner keyframe (inline for notification) --- */
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  .spinner {
    display: inline-block;
    width: 0.8rem; height: 0.8rem;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

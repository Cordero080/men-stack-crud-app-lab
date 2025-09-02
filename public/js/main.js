// public/js/main.js
// Global client behaviors + chart render + right-panel height sync

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------- Belt label tint (on /forms/new) ---------------- */
  const beltColors = {
    white: '#ffffff',
    orange: '#c47e14ff',
    green:  '#28a745',
    purple: '#7e4bdcff',
    brown:  '#855830ff',
    black:  '#050505ff',
  };
  const beltSelect = document.getElementById('beltColor');
  const beltLabel  = document.getElementById('beltLabel');
  if (beltSelect && beltLabel) {
    const tint = v => { beltLabel.style.color = beltColors[v] || '#222'; };
    tint(beltSelect.value);
    beltSelect.addEventListener('change', () => tint(beltSelect.value));
  }

  /* -------- Copy existing-name dropdown into the Name input -------- */
  const nameSelect = document.getElementById('nameSelect');
  const nameInput  = document.getElementById('name');
  if (nameSelect && nameInput) {
    nameSelect.addEventListener('change', (e) => {
      nameInput.value = e.target.value || '';
    });
  }

  /* -------------------------- Delete overlay ----------------------- */
  const overlay    = document.getElementById('delete-overlay');
  const cancelBtn  = document.getElementById('cancel-delete-btn');
  const confirmBtn = document.getElementById('confirm-delete-btn');
  if (overlay && cancelBtn && confirmBtn) {
    let deleteFormId = null;
    document.querySelectorAll('.delete-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        deleteFormId = link.getAttribute('data-id');
        overlay.style.display = 'flex';
      });
    });
    cancelBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
      deleteFormId = null;
    });
    confirmBtn.addEventListener('click', () => {
      if (!deleteFormId) return;
      const form = document.getElementById('del-' + deleteFormId);
      if (form) form.submit();
    });
  }

  /* ----------------------- Hard delete overlay --------------------- */
  let hardDeleteFormId = null;
  const hardLinks   = document.querySelectorAll('.hard-delete-link');
  const hardOverlay = document.getElementById('hard-delete-overlay');
  const hardYes     = document.getElementById('confirm-hard-delete-btn');
  const hardNo      = document.getElementById('cancel-hard-delete-btn');
  if (hardLinks.length && hardOverlay && hardYes && hardNo) {
    hardLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        hardDeleteFormId = link.getAttribute('data-id');
        hardOverlay.style.display = 'flex';
      });
    });
    hardNo.addEventListener('click', () => {
      hardOverlay.style.display = 'none';
      hardDeleteFormId = null;
    });
    hardYes.addEventListener('click', () => {
      if (!hardDeleteFormId) return;
      const form = document.getElementById('hard-del-' + hardDeleteFormId);
      if (form) form.submit();
    });
  }

  /* ------------------------- Chart rendering ----------------------- */
  function renderBarChart(canvasId, datasetLabel) {
    const el = document.getElementById(canvasId);
    if (!el || !window.Chart) return;
    try {
      const labels = JSON.parse(el.dataset.labels || '[]');
      const counts = JSON.parse(el.dataset.counts || '[]');
      const ctx = el.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: datasetLabel, data: counts }] },
        options: {
          responsive: true,
          maintainAspectRatio: false, // let the parent control height
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Rank (KYU/DAN)' } },
            y: { beginAtZero: true, title: { display: true, text: 'Count' }, ticks: { precision: 0 } }
          }
        }
      });
    } catch (err) {
      console.error('Chart init failed:', err);
    }
  }
  renderBarChart('rankChart', 'Forms Available');        // /forms/new
  renderBarChart('formsByRankChart', 'Forms per Rank');  // (optional) index page

  /* ----- Make right reference panel scroll to match form height ---- */
  const leftForm   = document.querySelector('.new-left');
  const rightPanel = document.querySelector('.new-right');
  let refScroll    = null;

  if (leftForm && rightPanel) {
    // Wrap the chart + req tables in a scrolling div if not present
    refScroll = rightPanel.querySelector('.ref-scroll');
    if (!refScroll) {
      const children = Array.from(rightPanel.children);
      // create wrapper
      refScroll = document.createElement('div');
      refScroll.className = 'ref-scroll';
      // move all existing children into wrapper EXCEPT the first heading, keep H2 on top
      const heading = rightPanel.querySelector('h2');
      rightPanel.innerHTML = '';
      if (heading) rightPanel.appendChild(heading);
      children.forEach(ch => { if (ch !== heading) refScroll.appendChild(ch); });
      rightPanel.appendChild(refScroll);
    }

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const syncHeights = () => {
      const leftRect  = leftForm.getBoundingClientRect();
      const rightRect = rightPanel.getBoundingClientRect();
      // Available height inside right panel (account for its own padding)
      const panelStyle = getComputedStyle(rightPanel);
      const padY = parseFloat(panelStyle.paddingTop) + parseFloat(panelStyle.paddingBottom);
      // Try to match left column visual height
      const target = clamp(leftRect.height - padY, 300, 2000);
      refScroll.style.maxHeight = `${target}px`;
    };

    // Initial + on resize
    syncHeights();
    let rAF = null;
    window.addEventListener('resize', () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(syncHeights);
    });
  }
});

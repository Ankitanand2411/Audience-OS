import { CALENDAR_ITEMS as DEMO_ITEMS } from '../data/demo.js';

export function renderCalendar(apiData) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDate();

  const events = apiData?.events || DEMO_ITEMS;

  const startDow = 5; // Aug 1 2026 is Saturday
  const daysInMonth = 31;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, items: events.filter(ci => ci.day === d) });
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) for (let i = 0; i < remaining; i++) cells.push({ day: null });

  return `
    <div class="page-header">
      <h1 class="page-title">Calendar</h1>
      <p class="page-desc">Plan and schedule your content pipeline.</p>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm active">Month</button>
        <button class="btn btn-ghost btn-sm">Week</button>
      </div>
    </div>

    <section class="section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
        <h2 style="font-size:var(--font-size-xl);font-weight:var(--font-weight-semibold)">August 2026</h2>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn-ghost btn-sm"><i data-lucide="chevron-left"></i></button>
          <button class="btn btn-ghost btn-sm"><i data-lucide="chevron-right"></i></button>
        </div>
      </div>
      <div class="cal-grid">
        ${days.map(d => `<div class="cal-header">${d}</div>`).join('')}
        ${cells.map(c => {
          if (!c.day) return '<div class="cal-cell" style="background:var(--bg-primary)"></div>';
          const isToday = c.day === today;
          return `<div class="cal-cell ${isToday ? 'today' : ''}">
            <div class="cal-cell-date">${c.day}</div>
            ${(c.items || []).map(it => `
              <div class="cal-item ${it.event_type || it.type}">
                <span class="cal-item-platform">${it.platform}</span>
                <span>${it.title}</span>
              </div>
            `).join('')}
          </div>`;
        }).join('')}
      </div>
    </section>
  `;
}

import { api } from '../api/client.js';

let visibleMonth = new Date();

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateTimeInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nextMorning() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return toDateTimeInputValue(date);
}

function eventMatchesDay(event, year, month, day) {
  if (!event.scheduled_date) return event.day === day && month === new Date().getMonth() && year === new Date().getFullYear();
  const date = new Date(event.scheduled_date);
  return !Number.isNaN(date.valueOf()) && date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

function formatEventTime(event) {
  if (!event.scheduled_date) return '';
  const date = new Date(event.scheduled_date);
  return Number.isNaN(date.valueOf()) ? '' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function renderCalendar(apiData) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthName = visibleMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const events = apiData?.events || [];
  const suggestedTitle = apiData?.latest_content?.title || '';
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = [];

  for (let index = 0; index < startDow; index += 1) cells.push({ day: null });
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, items: events.filter(event => eventMatchesDay(event, year, month, day)) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null });

  window._calendarShift = function(delta) {
    visibleMonth = new Date(year, month + delta, 1);
    window._navigate('calendar');
  };

  window._scheduleYouTubeVideo = async function(auto = false) {
    const title = document.getElementById('calendar-video-title')?.value.trim();
    const date = document.getElementById('calendar-date-time')?.value;
    if (!title) {
      _showToast('Add a YouTube video title first.');
      return;
    }
    const result = auto
      ? await api.autoScheduleYouTubeVideo({ title })
      : await api.scheduleYouTubeVideo({ title, scheduled_date: date });
    if (!result) {
      _showToast('Could not schedule the video. Check the backend.');
      return;
    }
    visibleMonth = new Date(result.scheduled_date);
    _showToast(auto ? 'Scheduled into the next free weekday at 10:00 AM.' : 'YouTube video scheduled.');
    await window._navigate('calendar');
  };

  return `
    <div class="page-header">
      <h1 class="page-title">Content Calendar</h1>
      <p class="page-desc">Schedule your YouTube video plan. Auto-scheduling chooses the next free weekday at 10:00 AM.</p>
    </div>

    <section class="card section" style="max-width:900px">
      <div class="card-header"><div><h2 class="card-title">Schedule a YouTube Video</h2><p class="card-subtitle">This saves a publishing plan in AudienceOS; it does not upload the video to YouTube.</p></div><i data-lucide="calendar-plus" style="color:var(--accent-secondary)"></i></div>
      <div class="calendar-scheduler">
        <div class="input-group"><label class="input-label" for="calendar-video-title">Video title</label><input class="input" id="calendar-video-title" value="${suggestedTitle}" placeholder="Generate content first, or enter a title" /></div>
        <div class="input-group"><label class="input-label" for="calendar-date-time">Publish date and time</label><input class="input" id="calendar-date-time" type="datetime-local" value="${nextMorning()}" /></div>
        <div class="calendar-scheduler-actions"><button class="btn btn-primary" onclick="_scheduleYouTubeVideo(false)"><i data-lucide="calendar-check"></i>Schedule video</button><button class="btn btn-secondary" onclick="_scheduleYouTubeVideo(true)"><i data-lucide="sparkles"></i>Auto-schedule next slot</button></div>
      </div>
    </section>

    <section class="section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
        <h2 style="font-size:var(--font-size-xl);font-weight:var(--font-weight-semibold)">${monthName}</h2>
        <div style="display:flex;gap:var(--space-2)"><button class="btn btn-ghost btn-sm" onclick="_calendarShift(-1)" aria-label="Previous month"><i data-lucide="chevron-left"></i></button><button class="btn btn-ghost btn-sm" onclick="_calendarShift(1)" aria-label="Next month"><i data-lucide="chevron-right"></i></button></div>
      </div>
      <div class="cal-grid">
        ${days.map(day => `<div class="cal-header">${day}</div>`).join('')}
        ${cells.map(cell => {
          if (!cell.day) return '<div class="cal-cell" style="background:var(--bg-primary)"></div>';
          const isToday = cell.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return `<div class="cal-cell ${isToday ? 'today' : ''}"><div class="cal-cell-date">${cell.day}</div>${cell.items.map(event => `<div class="cal-item yt"><span class="cal-item-platform">${event.platform || 'YouTube'}${formatEventTime(event) ? ` · ${formatEventTime(event)}` : ''}</span><span>${event.title}</span></div>`).join('')}</div>`;
        }).join('')}
      </div>
    </section>
  `;
}

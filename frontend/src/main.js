import './styles/design-system.css';
import './styles/reset.css';
import './styles/layout.css';
import './styles/components.css';
import { renderDashboard } from './pages/dashboard.js';
import { renderAudience } from './pages/audience.js';
import { renderOpportunities } from './pages/opportunities.js';
import { renderOpportunityDetail } from './pages/opportunity-detail.js';
import { renderContentStudio } from './pages/content-studio.js';
import { renderCalendar } from './pages/calendar.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderSettings } from './pages/settings.js';
import { renderOnboarding } from './pages/onboarding.js';
import { DEMO_CHANNEL } from './data/demo.js';
import { api } from './api/client.js';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'audience', label: 'Audience', icon: 'users' },
  { id: 'opportunities', label: 'Opportunities', icon: 'lightbulb' },
  { id: 'content-studio', label: 'Content Studio', icon: 'pen-tool' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-3' },
];
const BOTTOM_NAV = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'help', label: 'Help', icon: 'help-circle' },
];

let currentPage = 'dashboard';
let detailId = null;
let isOnboarded = localStorage.getItem('aos_onboarded') === 'true';
let sidebarOpen = false;
let pageStateData = null;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

async function navigateTo(page, id) {
  currentPage = page;
  detailId = id || null;
  sidebarOpen = false;

  // Load async backend data if needed
  pageStateData = await loadPageData(page, id);
  render();
  window.scrollTo(0, 0);
}
window._navigate = navigateTo;

async function loadPageData(page, id) {
  switch (page) {
    case 'dashboard':
      return await api.getDashboard();
    case 'audience':
      return await api.getAudience();
    case 'opportunities':
      return await api.getOpportunities();
    case 'opportunity-detail':
      return await api.getOpportunityDetail(id || 1);
    case 'content-studio':
      return await api.getContentStudio();
    case 'calendar':
      return await api.getCalendar();
    case 'analytics':
      return await api.getAnalytics();
    default:
      return null;
  }
}

function renderSidebar() {
  return `
  <aside class="sidebar ${sidebarOpen ? 'open' : ''}" id="sidebar">
    <div class="sidebar-brand">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
      <span class="sidebar-brand-name">AudienceOS</span>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-nav-section">
        ${NAV_ITEMS.map(n => `
          <button class="sidebar-nav-item ${currentPage === n.id ? 'active' : ''}" onclick="_navigate('${n.id}')" id="nav-${n.id}">
            <i data-lucide="${n.icon}"></i>
            ${n.label}
          </button>
        `).join('')}
      </div>
    </nav>
    <div class="sidebar-bottom">
      ${BOTTOM_NAV.map(n => `
        <button class="sidebar-nav-item ${currentPage === n.id ? 'active' : ''}" onclick="_navigate('${n.id}')" id="nav-${n.id}">
          <i data-lucide="${n.icon}"></i>
          ${n.label}
        </button>
      `).join('')}
      <div class="sidebar-profile" onclick="_navigate('settings')">
        <div class="sidebar-profile-avatar">${DEMO_CHANNEL.avatar}</div>
        <div class="sidebar-profile-info">
          <div class="sidebar-profile-name">${DEMO_CHANNEL.name}</div>
          <div class="sidebar-profile-channel">${DEMO_CHANNEL.channelName}</div>
        </div>
      </div>
    </div>
  </aside>
  <div class="sidebar-overlay ${sidebarOpen ? 'active' : ''}" id="sidebar-overlay"></div>`;
}

function getPageTitle() {
  if (currentPage === 'opportunity-detail') return 'Opportunities';
  const item = NAV_ITEMS.find(n => n.id === currentPage) || BOTTOM_NAV.find(n => n.id === currentPage);
  return item ? item.label : 'AudienceOS';
}

function renderTopbar() {
  return `
  <header class="topbar">
    <div class="topbar-left">
      <button class="mobile-menu-btn" id="mobile-menu-btn"><i data-lucide="menu"></i></button>
      <span class="topbar-title">${getPageTitle()}</span>
    </div>
    <div class="topbar-right">
      <div class="topbar-yt-status">
        <span class="topbar-yt-dot"></span>
        <span>YouTube Connected</span>
      </div>
      <button class="topbar-icon-btn" aria-label="Notifications" id="btn-notifs">
        <i data-lucide="bell"></i>
        <span class="topbar-notif-dot"></span>
      </button>
      <div class="topbar-avatar" title="${DEMO_CHANNEL.name}">${DEMO_CHANNEL.avatar}</div>
    </div>
  </header>`;
}

function renderPageContent() {
  switch (currentPage) {
    case 'dashboard': return renderDashboard(getGreeting(), DEMO_CHANNEL, pageStateData);
    case 'audience': return renderAudience(pageStateData);
    case 'opportunities': return renderOpportunities(pageStateData);
    case 'opportunity-detail': return renderOpportunityDetail(detailId, pageStateData);
    case 'content-studio': return renderContentStudio(pageStateData);
    case 'calendar': return renderCalendar(pageStateData);
    case 'analytics': return renderAnalytics(pageStateData);
    case 'settings': return renderSettings(DEMO_CHANNEL);
    default: return renderDashboard(getGreeting(), DEMO_CHANNEL, pageStateData);
  }
}

function render() {
  const app = document.getElementById('app');

  if (!isOnboarded) {
    app.innerHTML = renderOnboarding();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    attachOnboardingEvents();
    return;
  }

  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      <div class="main-area">
        ${renderTopbar()}
        <main class="page-content">
          ${renderPageContent()}
        </main>
      </div>
    </div>
    <div class="toast-container" id="toast-container"></div>
    <div class="generating-overlay" id="generating-overlay">
      <div class="generating-card">
        <div class="generating-title">Generating your content package</div>
        <div class="progress-steps" id="gen-steps"></div>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();
  attachEvents();
}

function attachOnboardingEvents() {
  document.querySelectorAll('.onboarding-option').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.closest('.onboarding-options').querySelectorAll('.onboarding-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  const demoBtn = document.getElementById('onboard-demo');
  if (demoBtn) demoBtn.addEventListener('click', () => { isOnboarded = true; localStorage.setItem('aos_onboarded', 'true'); navigateTo('dashboard'); });

  const connectBtn = document.getElementById('onboard-connect');
  if (connectBtn) connectBtn.addEventListener('click', () => {
    const step1 = document.getElementById('onboard-step-1');
    const step2 = document.getElementById('onboard-step-2');
    if (step1 && step2) { step1.classList.remove('active'); step2.classList.add('active'); }
  });

  const analyzeBtn = document.getElementById('onboard-analyze');
  if (analyzeBtn) analyzeBtn.addEventListener('click', async () => {
    const step2 = document.getElementById('onboard-step-2');
    const step3 = document.getElementById('onboard-step-3');
    if (step2 && step3) {
      step2.classList.remove('active');
      step3.classList.add('active');
      await api.runAnalysis("Last 30 days");
      simulateAnalysis();
    }
  });
}

function simulateAnalysis() {
  const steps = document.querySelectorAll('#onboard-step-3 .progress-step');
  let i = 0;
  const interval = setInterval(() => {
    if (i < steps.length) {
      if (i > 0) { steps[i-1].classList.remove('active'); steps[i-1].classList.add('done'); steps[i-1].querySelector('.progress-step-icon').textContent = '✓'; }
      steps[i].classList.remove('pending'); steps[i].classList.add('active'); steps[i].querySelector('.progress-step-icon').textContent = '●';
      i++;
    } else {
      steps[steps.length-1].classList.remove('active'); steps[steps.length-1].classList.add('done'); steps[steps.length-1].querySelector('.progress-step-icon').textContent = '✓';
      clearInterval(interval);
      setTimeout(() => { isOnboarded = true; localStorage.setItem('aos_onboarded', 'true'); navigateTo('dashboard'); }, 800);
    }
  }, 600);
}

function attachEvents() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const overlay = document.getElementById('sidebar-overlay');
  if (menuBtn) menuBtn.addEventListener('click', () => { sidebarOpen = !sidebarOpen; document.getElementById('sidebar').classList.toggle('open', sidebarOpen); overlay.classList.toggle('active', sidebarOpen); });
  if (overlay) overlay.addEventListener('click', () => { sidebarOpen = false; document.getElementById('sidebar').classList.remove('open'); overlay.classList.remove('active'); });
}

// Content generation simulation calling FastAPI ContentStudioAgent
window._generateContent = async function(oppId) {
  const overlay = document.getElementById('generating-overlay');
  const stepsEl = document.getElementById('gen-steps');
  const genSteps = ['Analyzing audience intent', 'Selecting content angle', 'Writing the script', 'Creating platform variants', 'Preparing metadata'];
  stepsEl.innerHTML = genSteps.map((s, i) => `<div class="progress-step ${i === 0 ? 'active' : 'pending'}"><span class="progress-step-icon">${i === 0 ? '●' : '○'}</span><span class="progress-step-text">${s}</span></div>`).join('');
  overlay.classList.add('active');
  
  // Call backend generation agent in parallel
  const genPromise = api.generateContentPackage(oppId);

  let i = 1;
  const interval = setInterval(async () => {
    const allSteps = stepsEl.querySelectorAll('.progress-step');
    if (i <= genSteps.length) {
      allSteps[i-1].classList.remove('active'); allSteps[i-1].classList.add('done'); allSteps[i-1].querySelector('.progress-step-icon').textContent = '✓';
      if (i < genSteps.length) { allSteps[i].classList.remove('pending'); allSteps[i].classList.add('active'); allSteps[i].querySelector('.progress-step-icon').textContent = '●'; }
      i++;
    } else {
      clearInterval(interval);
      await genPromise;
      setTimeout(() => { overlay.classList.remove('active'); navigateTo('content-studio'); showToast('Content package generated by AI Agent!'); }, 600);
    }
  }, 600);
};

window._showToast = showToast;
function showToast(msg) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<i data-lucide="check-circle" style="width:16px;height:16px;color:var(--color-success)"></i>${msg}`;
  c.appendChild(t);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  setTimeout(() => t.remove(), 3000);
}

// Initial load
(async () => {
  if (isOnboarded) {
    pageStateData = await loadPageData(currentPage);
  }
  render();
})();

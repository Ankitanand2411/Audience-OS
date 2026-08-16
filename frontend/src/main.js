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
];

let currentPage = 'dashboard';
let detailId = null;
let isOnboarded = localStorage.getItem('aos_onboarded') === 'true';
let sidebarOpen = false;
let pageStateData = null;

// Live channel state — populated from API, replaces all DEMO_CHANNEL usage
let currentChannel = {
  name: localStorage.getItem('aos_channel_name') || 'Creator',
  channelName: localStorage.getItem('aos_channel_handle') || '',
  avatar: localStorage.getItem('aos_channel_avatar') || 'C',
};

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
  pageStateData = await loadPageData(page, id);
  render();
  window.scrollTo(0, 0);
}
window._navigate = navigateTo;

async function loadPageData(page, id) {
  switch (page) {
    case 'dashboard': {
      const data = await api.getDashboard();
      // Sync live channel from API into local state
      if (data?.channel?.name) {
        currentChannel = {
          name: data.channel.name,
          channelName: data.channel.channel_name || '',
          avatar: data.channel.avatar || data.channel.name[0] || 'C',
        };
        localStorage.setItem('aos_channel_name', currentChannel.name);
        localStorage.setItem('aos_channel_handle', currentChannel.channelName);
        localStorage.setItem('aos_channel_avatar', currentChannel.avatar);
      }
      return data;
    }
    case 'audience':      return await api.getAudience();
    case 'opportunities': return await api.getOpportunities();
    case 'opportunity-detail': return await api.getOpportunityDetail(id || 1);
    case 'content-studio': return await api.getContentStudio();
    case 'calendar':      return await api.getCalendar();
    case 'analytics':     return await api.getAnalytics();
    default: return null;
  }
}

function renderSidebar() {
  const ch = currentChannel;
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
        <div class="sidebar-profile-avatar">${ch.avatar}</div>
        <div class="sidebar-profile-info">
          <div class="sidebar-profile-name">${ch.name}</div>
          <div class="sidebar-profile-channel">${ch.channelName || 'No channel connected'}</div>
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
  const ch = currentChannel;
  const isConnected = !!ch.channelName;
  return `
  <header class="topbar">
    <div class="topbar-left">
      <button class="mobile-menu-btn" id="mobile-menu-btn"><i data-lucide="menu"></i></button>
      <span class="topbar-title">${getPageTitle()}</span>
    </div>
    <div class="topbar-right">
      <div class="topbar-yt-status" style="opacity:${isConnected ? 1 : 0.4}">
        <span class="topbar-yt-dot" style="background:${isConnected ? 'var(--color-success)' : 'var(--color-error)'}"></span>
        <span>${isConnected ? ch.channelName + ' Connected' : 'No Channel Connected'}</span>
      </div>
      <button class="topbar-icon-btn" aria-label="Notifications" id="btn-notifs">
        <i data-lucide="bell"></i>
        ${isConnected ? '<span class="topbar-notif-dot"></span>' : ''}
      </button>
      <div class="topbar-avatar" title="${ch.name}">${ch.avatar}</div>
    </div>
  </header>`;
}

function renderPageContent() {
  switch (currentPage) {
    case 'dashboard':          return renderDashboard(getGreeting(), currentChannel, pageStateData);
    case 'audience':           return renderAudience(pageStateData);
    case 'opportunities':      return renderOpportunities(pageStateData);
    case 'opportunity-detail': return renderOpportunityDetail(detailId, pageStateData);
    case 'content-studio':     return renderContentStudio(pageStateData);
    case 'calendar':           return renderCalendar(pageStateData);
    case 'analytics':          return renderAnalytics(pageStateData);
    case 'settings':           return renderSettings(currentChannel);
    default:                   return renderDashboard(getGreeting(), currentChannel, pageStateData);
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
        <div class="generating-title">Generating content with Groq AI Agent</div>
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
  if (demoBtn) demoBtn.addEventListener('click', () => {
    isOnboarded = true;
    localStorage.setItem('aos_onboarded', 'true');
    navigateTo('dashboard');
  });

  const connectBtn = document.getElementById('onboard-connect');
  if (connectBtn) connectBtn.addEventListener('click', () => {
    const step1 = document.getElementById('onboard-step-1');
    const step2 = document.getElementById('onboard-step-2');
    if (step1 && step2) { step1.classList.remove('active'); step2.classList.add('active'); }
  });

  const analyzeBtn = document.getElementById('onboard-analyze');
  if (analyzeBtn) analyzeBtn.addEventListener('click', async () => {
    const channelInput = document.getElementById('onboard-channel-input');
    const channelHandle = channelInput ? channelInput.value.trim() : '';

    if (!channelHandle) {
      channelInput.style.border = '1px solid var(--color-error)';
      channelInput.placeholder = 'Please enter a channel handle (e.g. @MKBHD)';
      return;
    }

    const step2 = document.getElementById('onboard-step-2');
    const step3 = document.getElementById('onboard-step-3');
    if (!step2 || !step3) return;

    step2.classList.remove('active');
    step3.classList.add('active');

    // Run the actual analysis — this populates the DB with real YouTube data
    const analysisPromise = api.runAnalysis('Last 30 days', channelHandle);

    // Animate progress steps in parallel while we wait for API
    animateSteps('#onboard-step-3 .progress-step', async () => {
      await analysisPromise;
      isOnboarded = true;
      localStorage.setItem('aos_onboarded', 'true');
      // Load real data then render — currentChannel will be set from API
      pageStateData = await loadPageData('dashboard');
      render();
    });
  });
}

function animateSteps(selector, onComplete) {
  const steps = document.querySelectorAll(selector);
  let i = 0;
  const interval = setInterval(() => {
    if (i < steps.length) {
      if (i > 0) {
        steps[i-1].classList.remove('active');
        steps[i-1].classList.add('done');
        steps[i-1].querySelector('.progress-step-icon').textContent = '✓';
      }
      steps[i].classList.remove('pending');
      steps[i].classList.add('active');
      steps[i].querySelector('.progress-step-icon').textContent = '●';
      i++;
    } else {
      steps[steps.length-1].classList.remove('active');
      steps[steps.length-1].classList.add('done');
      steps[steps.length-1].querySelector('.progress-step-icon').textContent = '✓';
      clearInterval(interval);
      setTimeout(onComplete, 500);
    }
  }, 700);
}

function attachEvents() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const overlay = document.getElementById('sidebar-overlay');
  if (menuBtn) menuBtn.addEventListener('click', () => {
    sidebarOpen = !sidebarOpen;
    document.getElementById('sidebar').classList.toggle('open', sidebarOpen);
    overlay.classList.toggle('active', sidebarOpen);
  });
  if (overlay) overlay.addEventListener('click', () => {
    sidebarOpen = false;
    document.getElementById('sidebar').classList.remove('open');
    overlay.classList.remove('active');
  });

  // Audience filter tabs and search
  const audienceSearch = document.getElementById("audience-search");
  const audienceTabs = document.querySelectorAll("[data-audience-filter]");
  const audienceRows = document.querySelectorAll(".audience-comment");
  const audienceEmpty = document.getElementById("audience-empty");
  if (audienceRows.length) {
    let activeAudienceFilter = "all";
    const applyAudienceFilters = () => {
      const query = (audienceSearch?.value || "").trim().toLowerCase();
      let visible = 0;
      audienceRows.forEach((row) => {
        const matchesType = activeAudienceFilter === "all" || row.dataset.commentType === activeAudienceFilter;
        const matchesQuery = !query || row.dataset.commentSearch.includes(query);
        const show = matchesType && matchesQuery;
        row.hidden = !show;
        if (show) visible += 1;
      });
      if (audienceEmpty) audienceEmpty.hidden = visible > 0;
    };
    audienceTabs.forEach((tab) => tab.addEventListener("click", () => {
      activeAudienceFilter = tab.dataset.audienceFilter;
      audienceTabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      applyAudienceFilters();
    }));
    audienceSearch?.addEventListener("input", applyAudienceFilters);
  }

  // Dashboard "Run Live Analysis" button
  const runLiveBtn = document.getElementById('btn-run-live-analysis');
  if (runLiveBtn) {
    runLiveBtn.addEventListener('click', async () => {
      const handleInput = document.getElementById('live-channel-input');
      const channelHandle = handleInput ? handleInput.value.trim() : '';

      if (!channelHandle) {
        showToast('Please enter a YouTube channel handle first.');
        return;
      }

      runLiveBtn.disabled = true;
      runLiveBtn.innerHTML = '<i data-lucide="loader-2"></i> Fetching Live Comments...';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      showToast(`Connecting to YouTube API for ${channelHandle}...`);

      const result = await api.runAnalysis('Last 30 days', channelHandle);

      if (result) {
        showToast(`Analyzed ${result.processed_comments || 0} real comments · ${result.new_opportunities || 0} opportunities found`);
      } else {
        showToast('Analysis failed — check the backend logs.');
      }

      // Reload dashboard with fresh live data (this also syncs currentChannel)
      pageStateData = await loadPageData('dashboard');
      render();
    });
  }

  // Settings "Re-analyze" button
  const reanalyzeBtn = document.getElementById('btn-reanalyze-channel');
  if (reanalyzeBtn) {
    reanalyzeBtn.addEventListener('click', async () => {
      const input = document.getElementById('settings-channel-input');
      const handle = input ? input.value.trim() : currentChannel.channelName;
      if (!handle) return;
      reanalyzeBtn.disabled = true;
      reanalyzeBtn.textContent = 'Analyzing...';
      await api.runAnalysis('Last 30 days', handle);
      pageStateData = await loadPageData('dashboard');
      showToast(`Channel switched to ${handle} — dashboard updated!`);
      await navigateTo('dashboard');
    });
  }
}

// Content generation — calls Groq ContentStudioAgent
window._generateContent = async function(oppId) {
  const overlay = document.getElementById('generating-overlay');
  const stepsEl = document.getElementById('gen-steps');
  const genSteps = [
    'Analyzing audience intent',
    'Selecting content angle',
    'Writing the script',
    'Creating platform variants',
    'Preparing metadata',
  ];
  stepsEl.innerHTML = genSteps.map((s, i) => `
    <div class="progress-step ${i === 0 ? 'active' : 'pending'}">
      <span class="progress-step-icon">${i === 0 ? '●' : '○'}</span>
      <span class="progress-step-text">${s}</span>
    </div>
  `).join('');
  overlay.classList.add('active');

  const genPromise = api.generateContentPackage(oppId);

  let i = 1;
  const interval = setInterval(async () => {
    const allSteps = stepsEl.querySelectorAll('.progress-step');
    if (i <= genSteps.length) {
      allSteps[i-1].classList.remove('active');
      allSteps[i-1].classList.add('done');
      allSteps[i-1].querySelector('.progress-step-icon').textContent = '✓';
      if (i < genSteps.length) {
        allSteps[i].classList.remove('pending');
        allSteps[i].classList.add('active');
        allSteps[i].querySelector('.progress-step-icon').textContent = '●';
      }
      i++;
    } else {
      clearInterval(interval);
      await genPromise;
      setTimeout(async () => {
        overlay.classList.remove('active');
        await navigateTo('content-studio');
        showToast('Script generated by Groq AI Agent!');
      }, 500);
    }
  }, 700);
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
  setTimeout(() => t.remove(), 4000);
}

// Initial load
(async () => {
  if (isOnboarded) {
    pageStateData = await loadPageData(currentPage);
  }
  render();
})();

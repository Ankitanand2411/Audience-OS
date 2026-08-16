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
let isPageLoading = false;
let shellRendered = false;

// Live channel state — populated from API, replaces all DEMO_CHANNEL usage
let currentChannel = {
  name: localStorage.getItem('aos_channel_name') || 'Creator',
  channelName: localStorage.getItem('aos_channel_handle') || '',
  avatar: localStorage.getItem('aos_channel_avatar') || 'C',
};

// ── Simple API cache with TTL ──────────────────────────────
const _apiCache = {};
const CACHE_TTL = 30_000; // 30 seconds

function getCached(key) {
  const entry = _apiCache[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  _apiCache[key] = { data, ts: Date.now() };
}

function invalidateCache(key) {
  if (key) delete _apiCache[key];
  else Object.keys(_apiCache).forEach(k => delete _apiCache[k]);
}

// ── Scoped Lucide icon replacement ─────────────────────────
// Only replaces icons within a given container instead of scanning the whole DOM
function replaceIcons(container) {
  if (typeof lucide === 'undefined') return;
  if (!container) { lucide.createIcons(); return; }
  lucide.createIcons({ root: container });
}

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

  // If shell doesn't exist yet (e.g., coming from onboarding), do a full render
  if (!shellRendered) {
    render();
    return;
  }

  // Close mobile sidebar without full re-render
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');

  // Update active nav item without full re-render
  updateActiveNav();

  // Try cache first
  const cacheKey = page + (id ? ':' + id : '');
  const cached = getCached(cacheKey);

  // Show loading skeleton in content area only if not cached
  const contentEl = document.getElementById('page-content');
  if (contentEl && !cached) {
    contentEl.innerHTML = renderPageLoading();
    replaceIcons(contentEl);
  }

  window.scrollTo({ top: 0, behavior: 'instant' });

  if (cached) {
    pageStateData = cached;
  } else {
    pageStateData = await loadPageData(page, id);
    if (pageStateData) setCache(cacheKey, pageStateData);
  }

  // Sync channel info if dashboard data
  if (page === 'dashboard' && pageStateData?.channel?.name) {
    updateChannelState(pageStateData.channel);
  }

  // Render only the content area
  isPageLoading = false;
  if (contentEl) {
    contentEl.innerHTML = renderPageContent();
    replaceIcons(contentEl);
    attachPageEvents();
  }
}
window._navigate = navigateTo;

function updateChannelState(channelData) {
  const prev = currentChannel.channelName;
  currentChannel = {
    name: channelData.name,
    channelName: channelData.channel_name || '',
    avatar: channelData.avatar || channelData.name[0] || 'C',
  };
  localStorage.setItem('aos_channel_name', currentChannel.name);
  localStorage.setItem('aos_channel_handle', currentChannel.channelName);
  localStorage.setItem('aos_channel_avatar', currentChannel.avatar);

  // Update topbar and sidebar profile in-place if channel changed
  if (prev !== currentChannel.channelName) {
    updateShellChannel();
  }
}

function updateShellChannel() {
  const ch = currentChannel;
  const isConnected = !!ch.channelName;

  // Update topbar status
  const ytStatus = document.querySelector('.topbar-yt-status span:last-child');
  if (ytStatus) ytStatus.textContent = isConnected ? ch.channelName + ' Connected' : 'No Channel Connected';
  const ytDot = document.querySelector('.topbar-yt-dot');
  if (ytDot) ytDot.style.background = isConnected ? 'var(--color-success)' : 'var(--color-error)';
  const statusWrap = document.querySelector('.topbar-yt-status');
  if (statusWrap) statusWrap.style.opacity = isConnected ? 1 : 0.4;

  // Update topbar avatar
  const topAvatar = document.querySelector('.topbar-avatar');
  if (topAvatar) { topAvatar.textContent = ch.avatar; topAvatar.title = ch.name; }

  // Update sidebar profile
  const profileAvatar = document.querySelector('.sidebar-profile-avatar');
  if (profileAvatar) profileAvatar.textContent = ch.avatar;
  const profileName = document.querySelector('.sidebar-profile-name');
  if (profileName) profileName.textContent = ch.name;
  const profileChannel = document.querySelector('.sidebar-profile-channel');
  if (profileChannel) profileChannel.textContent = ch.channelName || 'No channel connected';
}

function updateActiveNav() {
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    const navId = item.id.replace('nav-', '');
    item.classList.toggle('active', navId === currentPage);
  });

  // Update topbar title
  const titleEl = document.querySelector('.topbar-title');
  if (titleEl) titleEl.textContent = getPageTitle();
}

async function loadPageData(page, id) {
  switch (page) {
    case 'dashboard':    return await api.getDashboard();
    case 'audience':     return await api.getAudience();
    case 'opportunities': return await api.getOpportunities();
    case 'opportunity-detail': return await api.getOpportunityDetail(id || 1);
    case 'content-studio': return await api.getContentStudio();
    case 'calendar':     return await api.getCalendar();
    case 'analytics':    return await api.getAnalytics();
    default: return null;
  }
}

function renderSidebar() {
  const ch = currentChannel;
  return `
  <aside class="sidebar ${sidebarOpen ? 'open' : ''}" id="sidebar">
    <div class="sidebar-brand">
      <img src="/logo.png" alt="AudienceOS Logo" width="24" height="24" style="border-radius: 4px; margin-right: var(--space-2);" />
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

function renderPageLoading() {
  return `<div class="page-header"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-line" style="width:38%"></div></div><div class="grid-4 section"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div><div class="skeleton skeleton-card" style="height:240px"></div>`;
}

function renderPageContent() {
  if (isPageLoading) return renderPageLoading();
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

// Render the full app shell once, then only swap page content
function renderShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      <div class="main-area">
        ${renderTopbar()}
        <main class="page-content" id="page-content">
          ${renderPageContent()}
        </main>
      </div>
    </div>
    <div class="toast-container" id="toast-container"></div>
    <div class="generating-overlay" id="generating-overlay">
      <div class="generating-card">
        <div class="generating-title">Preparing your content</div>
        <div class="progress-steps" id="gen-steps"></div>
      </div>
    </div>
  `;
  replaceIcons(app);
  attachShellEvents();
  attachPageEvents();
  shellRendered = true;
}

function render() {
  const app = document.getElementById('app');

  if (!isOnboarded) {
    app.innerHTML = renderOnboarding();
    replaceIcons(app);
    attachOnboardingEvents();
    shellRendered = false;
    return;
  }

  if (!shellRendered) {
    renderShell();
    return;
  }

  // Shell already exists — only update the content area
  const contentEl = document.getElementById('page-content');
  if (contentEl) {
    contentEl.innerHTML = renderPageContent();
    replaceIcons(contentEl);
    attachPageEvents();
  }
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
      invalidateCache();
      isOnboarded = true;
      localStorage.setItem('aos_onboarded', 'true');
      // Load real data then render — currentChannel will be set from API
      pageStateData = await loadPageData('dashboard');
      if (pageStateData?.channel?.name) updateChannelState(pageStateData.channel);
      shellRendered = false;
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

// Shell-level events (sidebar toggle, overlay click) — attached once
function attachShellEvents() {
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
}

// Page-level events — reattached only when page content changes
function attachPageEvents() {
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
    // Debounced search
    let searchTimer;
    audienceSearch?.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyAudienceFilters, 150);
    });
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
      replaceIcons(runLiveBtn);
      showToast(`Analyzing ${channelHandle}...`);

      const result = await api.runAnalysis('Last 30 days', channelHandle);
      invalidateCache(); // Clear cache after fresh analysis

      if (result) {
        showToast(`Analyzed ${result.processed_comments || 0} real comments · ${result.new_opportunities || 0} opportunities found`);
      } else {
        showToast('Analysis failed — check the backend logs.');
      }

      // Reload dashboard with fresh live data (this also syncs currentChannel)
      pageStateData = await loadPageData('dashboard');
      if (pageStateData?.channel?.name) updateChannelState(pageStateData.channel);
      setCache('dashboard', pageStateData);
      const contentEl = document.getElementById('page-content');
      if (contentEl) {
        contentEl.innerHTML = renderPageContent();
        replaceIcons(contentEl);
        attachPageEvents();
      }
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
      invalidateCache();
      pageStateData = await loadPageData('dashboard');
      if (pageStateData?.channel?.name) updateChannelState(pageStateData.channel);
      showToast(`Channel switched to ${handle} — dashboard updated!`);
      await navigateTo('dashboard');
    });
  }
}

// Content generation
window._generateContent = async function(oppId) {
  const overlay = document.getElementById('generating-overlay');
  const stepsEl = document.getElementById('gen-steps');
  const genSteps = [
    'Reviewing audience intent',
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
      invalidateCache('content-studio');
      setTimeout(async () => {
        overlay.classList.remove('active');
        await navigateTo('content-studio');
        showToast('Your content is ready!');
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
  t.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// Initial load
(async () => {
  render();
  if (isOnboarded) {
    isPageLoading = true;
    const contentEl = document.getElementById('page-content');
    if (contentEl) {
      contentEl.innerHTML = renderPageLoading();
    }
    pageStateData = await loadPageData(currentPage);
    if (pageStateData?.channel?.name) updateChannelState(pageStateData.channel);
    setCache(currentPage, pageStateData);
    isPageLoading = false;
    if (contentEl) {
      contentEl.innerHTML = renderPageContent();
      replaceIcons(contentEl);
      attachPageEvents();
    }
  }
})();

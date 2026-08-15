export function renderOnboarding() {
  return `
    <div class="onboarding-overlay">
      <div class="onboarding-card">
        <div class="onboarding-step active" id="onboard-step-1">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
          </div>
          <h1 class="onboarding-title">Welcome to AudienceOS</h1>
          <p class="onboarding-desc">Your audience already tells you what to create. Connect your YouTube channel to discover content opportunities.</p>
          <div style="display:flex;flex-direction:column;gap:var(--space-3);width:100%">
            <button class="btn btn-primary btn-lg" style="width:100%" id="onboard-connect"><i data-lucide="video"></i>Connect YouTube</button>
            <button class="btn btn-secondary" style="width:100%" id="onboard-demo"><i data-lucide="play"></i>Try Demo</button>
          </div>
        </div>

        <div class="onboarding-step" id="onboard-step-2">
          <h1 class="onboarding-title">Choose Analysis Range</h1>
          <p class="onboarding-desc">How much of your channel should we analyze?</p>
          <div class="onboarding-options">
            <div class="onboarding-option" id="opt-all"><div class="onboarding-option-radio"></div><div><div style="font-weight:var(--font-weight-medium)">Entire channel</div><div style="font-size:var(--font-size-sm);color:var(--text-secondary)">Full historical analysis</div></div></div>
            <div class="onboarding-option selected" id="opt-10"><div class="onboarding-option-radio"></div><div><div style="font-weight:var(--font-weight-medium)">Last 10 videos</div><div style="font-size:var(--font-size-sm);color:var(--text-secondary)">Quick recent analysis</div></div></div>
            <div class="onboarding-option" id="opt-30"><div class="onboarding-option-radio"></div><div><div style="font-weight:var(--font-weight-medium)">Last 30 days</div><div style="font-size:var(--font-size-sm);color:var(--text-secondary)">Recent trends focus</div></div></div>
          </div>
          <button class="btn btn-primary btn-lg" style="width:100%" id="onboard-analyze"><i data-lucide="sparkles"></i>Start Analysis</button>
        </div>

        <div class="onboarding-step" id="onboard-step-3">
          <h1 class="onboarding-title">Analyzing your audience</h1>
          <p class="onboarding-desc">This usually takes a moment...</p>
          <div class="progress-steps" style="text-align:left;width:100%">
            <div class="progress-step pending"><span class="progress-step-icon">○</span><span class="progress-step-text">Connected to YouTube</span></div>
            <div class="progress-step pending"><span class="progress-step-icon">○</span><span class="progress-step-text">Imported 50 videos</span></div>
            <div class="progress-step pending"><span class="progress-step-icon">○</span><span class="progress-step-text">Imported 8,421 comments</span></div>
            <div class="progress-step pending"><span class="progress-step-icon">○</span><span class="progress-step-text">Filtered spam</span></div>
            <div class="progress-step pending"><span class="progress-step-icon">○</span><span class="progress-step-text">Classified audience feedback</span></div>
            <div class="progress-step pending"><span class="progress-step-icon">○</span><span class="progress-step-text">Detecting content gaps</span></div>
            <div class="progress-step pending"><span class="progress-step-icon">○</span><span class="progress-step-text">Ranking opportunities</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

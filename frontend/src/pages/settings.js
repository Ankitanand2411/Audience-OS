import { api } from '../api/client.js';

export function renderSettings(channel) {
  window._saveChannelSettings = async function() {
    const nameVal = document.getElementById('settings-name-input').value;
    const channelVal = document.getElementById('settings-channel-input').value;
    await api.saveSettings({ name: nameVal, channel_name: channelVal });
    window._showToast('Settings saved!');
  };

  return `
    <div class="page-header">
      <h1 class="page-title">Settings</h1>
      <p class="page-desc">Manage your YouTube channel connection and analysis preferences.</p>
    </div>

    <section class="section">
      <div class="card">
        <h3 class="card-title" style="margin-bottom:var(--space-5)">Connected YouTube Channel</h3>
        <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-5)">
          <div style="width:48px;height:48px;border-radius:var(--radius-lg);background:var(--color-error-muted);display:flex;align-items:center;justify-content:center">
            <i data-lucide="youtube" style="width:24px;height:24px;color:var(--color-error)"></i>
          </div>
          <div style="flex:1">
            <div style="font-weight:var(--font-weight-semibold);margin-bottom:2px">${channel.channelName || 'No channel connected'}</div>
            <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">${channel.channelName ? 'Connected · Ready to analyze' : 'Enter a channel handle below to connect'}</div>
          </div>
          <span class="badge ${channel.channelName ? 'badge-success' : 'badge-warning'}">${channel.channelName ? 'Connected' : 'Not Connected'}</span>
        </div>

        <div class="input-group" style="max-width:460px;margin-bottom:var(--space-4)">
          <label class="input-label">YouTube Channel Handle or URL</label>
          <input class="input" id="settings-channel-input" value="${channel.channelName || ''}" placeholder="e.g. @MKBHD or https://youtube.com/@mkbhd" />
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-top:4px">Changing this and clicking Re-Analyze will fetch fresh live comments.</div>
        </div>

        <div class="input-group" style="max-width:460px;margin-bottom:var(--space-5)">
          <label class="input-label">Creator / Display Name</label>
          <input class="input" id="settings-name-input" value="${channel.name || ''}" placeholder="Your name" />
        </div>

        <div style="display:flex;gap:var(--space-3)">
          <button class="btn btn-primary btn-sm" id="btn-reanalyze-channel">
            <i data-lucide="sparkles"></i>Re-Analyze Channel
          </button>
          <button class="btn btn-secondary btn-sm" onclick="_saveChannelSettings()">
            <i data-lucide="save"></i>Save Name Only
          </button>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="card">
        <h3 class="card-title" style="margin-bottom:var(--space-5)">Analysis Preferences</h3>
        <div class="input-group" style="max-width:400px;margin-bottom:var(--space-5)">
          <label class="input-label">Default Analysis Range</label>
          <select class="input" style="padding:var(--space-2) var(--space-3)">
            <option>Entire channel</option>
            <option>Last 10 videos</option>
            <option selected>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        <div class="input-group" style="max-width:400px">
          <label class="input-label">Content Language</label>
          <select class="input" style="padding:var(--space-2) var(--space-3)">
            <option selected>English</option>
            <option>Hindi</option>
            <option>Spanish</option>
          </select>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="card" style="border-color:var(--color-error)">
        <h3 class="card-title" style="color:var(--color-error);margin-bottom:var(--space-3)">Danger Zone</h3>
        <p style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">Reset all analysis data and disconnect your channel.</p>
        <div style="display:flex;gap:var(--space-3)">
          <button class="btn btn-danger btn-sm" onclick="localStorage.clear();location.reload()">Reset Everything</button>
        </div>
      </div>
    </section>
  `;
}

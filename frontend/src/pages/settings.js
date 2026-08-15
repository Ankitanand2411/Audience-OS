export function renderSettings(channel) {
  return `
    <div class="page-header">
      <h1 class="page-title">Settings</h1>
      <p class="page-desc">Manage your account and channel connection.</p>
    </div>

    <section class="section">
      <div class="card">
        <h3 class="card-title" style="margin-bottom:var(--space-5)">YouTube Connection</h3>
        <div style="display:flex;align-items:center;gap:var(--space-4)">
          <div style="width:48px;height:48px;border-radius:var(--radius-lg);background:var(--color-error-muted);display:flex;align-items:center;justify-content:center">
            <i data-lucide="video" style="width:24px;height:24px;color:var(--color-error)"></i>
          </div>
          <div style="flex:1">
            <div style="font-weight:var(--font-weight-semibold);margin-bottom:2px">${channel.channelName}</div>
            <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">Connected · Last synced 2 hours ago</div>
          </div>
          <span class="badge badge-success">Connected</span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="card">
        <h3 class="card-title" style="margin-bottom:var(--space-5)">Analysis Preferences</h3>
        <div class="input-group" style="max-width:400px;margin-bottom:var(--space-5)">
          <label class="input-label">Analysis Range</label>
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
      <div class="card">
        <h3 class="card-title" style="margin-bottom:var(--space-5)">Profile</h3>
        <div class="input-group" style="max-width:400px;margin-bottom:var(--space-4)">
          <label class="input-label">Name</label>
          <input class="input" value="${channel.name}" />
        </div>
        <div class="input-group" style="max-width:400px;margin-bottom:var(--space-5)">
          <label class="input-label">Email</label>
          <input class="input" value="ankit@aiengineering.daily" />
        </div>
        <button class="btn btn-primary btn-sm" onclick="_showToast('Settings saved')">Save Changes</button>
      </div>
    </section>

    <section class="section">
      <div class="card" style="border-color:var(--color-error)">
        <h3 class="card-title" style="color:var(--color-error);margin-bottom:var(--space-3)">Danger Zone</h3>
        <p style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">Disconnect your YouTube channel or reset all analysis data.</p>
        <div style="display:flex;gap:var(--space-3)">
          <button class="btn btn-secondary btn-sm">Disconnect YouTube</button>
          <button class="btn btn-danger btn-sm">Reset Data</button>
        </div>
      </div>
    </section>
  `;
}

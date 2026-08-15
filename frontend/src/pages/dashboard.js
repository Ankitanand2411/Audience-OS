import { TREND_DATA } from '../data/demo.js';

function scoreClass(s) { return s >= 80 ? 'score-high' : s >= 60 ? 'score-medium' : 'score-low'; }

function renderSVGChart(datasets, w = 500, h = 160) {
  const colors = ['#6c5ce7', '#00c48c', '#f0a500'];
  let paths = '';
  Object.keys(datasets).forEach((key, idx) => {
    const data = datasets[key];
    const maxVal = 100;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / maxVal) * (h - 20)}`).join(' ');
    paths += `<polyline points="${points}" fill="none" stroke="${colors[idx]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;
  });
  const legend = Object.keys(datasets).map((k, i) => `<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--text-secondary)"><span style="width:10px;height:3px;background:${colors[i]};border-radius:2px;display:inline-block"></span>${k}</span>`).join('&nbsp;&nbsp;&nbsp;');
  return `<div style="margin-bottom:8px">${legend}</div><div class="chart-area"><svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${paths}</svg></div>`;
}

export function renderDashboard(greeting, channel, apiData) {
  const hasData = !!(apiData?.opportunities?.length);
  const kpis = apiData?.kpi || [];
  const opps = apiData?.opportunities || [];
  const comments = apiData?.recent_comments || [];
  const channelHandle = channel.channelName || '';

  // No channel connected yet — show a prominent call-to-action
  if (!channelHandle && !hasData) {
    return `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:var(--space-6)">
        <div style="width:80px;height:80px;border-radius:50%;background:var(--surface-elevated);display:flex;align-items:center;justify-content:center;margin-bottom:var(--space-2)">
          <i data-lucide="youtube" style="width:40px;height:40px;color:var(--color-error)"></i>
        </div>
        <div>
          <h1 style="font-size:var(--font-size-2xl);font-weight:var(--font-weight-bold);margin-bottom:var(--space-2)">Connect Your YouTube Channel</h1>
          <p style="color:var(--text-secondary);max-width:420px;line-height:1.6">Enter your channel handle below and run a live analysis. AudienceOS will fetch real comments and surface your best content opportunities.</p>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2);background:var(--surface-elevated);padding:12px 16px;border-radius:var(--radius-lg);border:1px solid var(--border-color);width:100%;max-width:500px">
          <input type="text" id="live-channel-input" class="input" placeholder="Enter YouTube handle (e.g. @MKBHD)" style="flex:1;padding:8px 12px;font-size:14px;border:none;background:transparent;outline:none" />
          <button class="btn btn-primary" id="btn-run-live-analysis"><i data-lucide="sparkles"></i>Analyze Channel</button>
        </div>
        <p style="font-size:var(--font-size-sm);color:var(--text-muted)">Powered by YouTube Data API v3 + Groq LLM Agents</p>
      </div>
    `;
  }

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">${greeting}, ${channel.name}</h1>
        <p class="page-desc">Showing live analysis for <strong>${channelHandle}</strong> — powered by YouTube Data API &amp; Groq AI Agents.</p>
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-2);background:var(--surface-elevated);padding:8px 12px;border-radius:var(--radius-lg);border:1px solid var(--border-color)">
        <input type="text" id="live-channel-input" class="input" placeholder="Switch channel handle..." style="width:210px;padding:6px 12px;font-size:13px" value="${channelHandle}" />
        <button class="btn btn-primary btn-sm" id="btn-run-live-analysis"><i data-lucide="sparkles"></i>Re-Analyze</button>
      </div>
    </div>

    <section class="section">
      <div class="grid-4">
        ${kpis.map(k => `
          <div class="card card-sm metric-card">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span class="metric-card-label">${k.label}</span>
              <i data-lucide="${k.icon || 'bar-chart-2'}" style="width:16px;height:16px;color:var(--text-muted)"></i>
            </div>
            <span class="metric-card-value">${k.value}</span>
            <span class="metric-card-trend ${k.up === true ? 'up' : k.up === false ? 'down' : 'neutral'}">${k.up === true ? '↑' : k.up === false ? '↓' : '●'} ${k.trend}</span>
          </div>
        `).join('')}
      </div>
    </section>

    ${opps.length ? `
    <section class="section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Top Content Opportunities</h2>
          <p class="section-subtitle">Ranked by live audience demand · Groq OpportunityScorer Agent</p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="_navigate('opportunities')">View all <i data-lucide="arrow-right"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        ${opps.slice(0, 3).map(o => `
          <div class="card opp-card" id="opp-${o.id}">
            <div class="opp-card-top">
              <div class="opp-card-info">
                <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-1)">
                  <h3 class="opp-card-title">${o.title}</h3>
                  ${o.trending ? '<span class="badge badge-accent">Trending</span>' : ''}
                </div>
                <p class="opp-card-desc">${o.description || o.desc || ''}</p>
                <div class="opp-card-meta">
                  <span class="opp-card-meta-item"><strong>${o.questions}</strong> audience questions</span>
                  <span class="opp-card-meta-item"><strong>${o.growth}</strong> mention growth</span>
                  <span class="opp-card-meta-item"><strong>${o.coverage}</strong> coverage</span>
                  <span class="opp-card-meta-item">Format: <strong>${o.format}</strong></span>
                </div>
              </div>
              <div class="score ${scoreClass(o.score)}">${o.score}</div>
            </div>
            <div class="opp-card-actions">
              <button class="btn btn-primary btn-sm" onclick="_generateContent(${o.id})"><i data-lucide="sparkles"></i>Generate Content</button>
              <button class="btn btn-secondary btn-sm" onclick="_navigate('opportunity-detail',${o.id})">View Details</button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
    ` : ''}

    ${comments.length ? `
    <section class="section">
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Audience Trends</h3></div>
          ${renderSVGChart(TREND_DATA)}
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Live Audience Signals</h3>
            <button class="btn btn-ghost btn-sm" onclick="_navigate('audience')">View all</button>
          </div>
          <div style="display:flex;flex-direction:column">
            ${comments.slice(0, 5).map(c => `
              <div class="comment-row">
                <div class="comment-avatar">${c.author_avatar || c.avatar || 'YT'}</div>
                <div class="comment-body">
                  <p class="comment-text">"${c.text}"</p>
                  <div class="comment-meta">
                    <span class="badge badge-${
                      (c.comment_type || c.type) === 'REQUEST' ? 'accent' :
                      (c.comment_type || c.type) === 'CONFUSION' ? 'warning' :
                      (c.comment_type || c.type) === 'QUESTION' ? 'info' : 'default'
                    }">${c.comment_type || c.type || 'COMMENT'}</span>
                    <span>${c.topic || ''}</span>
                    <span>${c.time_ago || c.time || ''}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
    ` : ''}
  `;
}

import { KPI as DEMO_KPI, OPPORTUNITIES as DEMO_OPPS, TREND_DATA, COMMENTS as DEMO_COMMENTS } from '../data/demo.js';

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
  const kpis = apiData?.kpi || DEMO_KPI;
  const opps = apiData?.opportunities || DEMO_OPPS;
  const comments = apiData?.recent_comments || DEMO_COMMENTS;
  const channelName = apiData?.channel?.channel_name || channel.channelName || '@MKBHD';

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">${greeting}, ${apiData?.channel?.name || channel.name}</h1>
        <p class="page-desc">Your audience has spoken. Live analysis connected to YouTube Data API & Groq LLM Agents.</p>
      </div>
      <div class="page-actions" style="display:flex;align-items:center;gap:var(--space-2);background:var(--surface-elevated);padding:8px 12px;border-radius:var(--radius-lg);border:1px solid var(--border-color)">
        <input type="text" id="live-channel-input" class="input" placeholder="YouTube Handle (e.g. @MKBHD)" style="width:220px;padding:6px 12px;font-size:13px" value="${channelName}" />
        <button class="btn btn-primary btn-sm" id="btn-run-live-analysis"><i data-lucide="sparkles"></i>Run Live Analysis</button>
      </div>
    </div>

    <section class="section">
      <div class="grid-4">
        ${kpis.map(k => `
          <div class="card card-sm metric-card">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span class="metric-card-label">${k.label}</span>
              <i data-lucide="${k.icon || 'message-square'}" style="width:16px;height:16px;color:var(--text-muted)"></i>
            </div>
            <span class="metric-card-value">${k.value}</span>
            <span class="metric-card-trend ${k.up === true ? 'up' : k.up === false ? 'down' : 'neutral'}">${k.up === true ? '↑' : k.up === false ? '↓' : '●'} ${k.trend}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Top Content Opportunities</h2>
          <p class="section-subtitle">Ranked by audience demand and content gap analysis (Powered by FastAPI + Groq LLM Agents)</p>
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
                <p class="opp-card-desc">${o.description || o.desc}</p>
                <div class="opp-card-meta">
                  <span class="opp-card-meta-item"><strong>${o.questions}</strong> audience questions</span>
                  <span class="opp-card-meta-item"><strong>${o.growth}</strong> mention growth</span>
                  <span class="opp-card-meta-item"><strong>${o.coverage}</strong> existing coverage</span>
                  <span class="opp-card-meta-item">Recommended: <strong>${o.format}</strong></span>
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

    <section class="section">
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Audience Trends</h3></div>
          ${renderSVGChart(TREND_DATA)}
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Audience Signals</h3>
            <button class="btn btn-ghost btn-sm" onclick="_navigate('audience')">View all</button>
          </div>
          <div style="display:flex;flex-direction:column">
            ${comments.slice(0, 4).map(c => `
              <div class="comment-row">
                <div class="comment-avatar">${c.author_avatar || c.avatar || 'VW'}</div>
                <div class="comment-body">
                  <p class="comment-text">"${c.text}"</p>
                  <div class="comment-meta">
                    <span class="badge badge-${(c.comment_type || c.type) === 'REQUEST' ? 'accent' : (c.comment_type || c.type) === 'CONFUSION' ? 'warning' : (c.comment_type || c.type) === 'QUESTION' ? 'info' : 'default'}">${c.comment_type || c.type}</span>
                    <span>${c.topic}</span>
                    <span>${c.time_ago || c.time || 'recent'}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}

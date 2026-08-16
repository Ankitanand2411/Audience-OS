function scoreClass(s) { return s >= 80 ? 'score-high' : s >= 60 ? 'score-medium' : 'score-low'; }

function renderTopicDemandChart(topics) {
  const chartTopics = topics.slice(0, 5);
  if (!chartTopics.length) return '<div class="empty-state"><div class="empty-state-title">No topic data yet</div><div class="empty-state-desc">Run an analysis to see demand by topic.</div></div>';
  const maxDemand = Math.max(...chartTopics.map(topic => Number(topic.demand || topic.opportunity || 0)), 1);
  return `<div class="topic-demand-chart" role="img" aria-label="Top topics ranked by audience demand">
    ${chartTopics.map(topic => {
      const demand = Number(topic.demand || topic.opportunity || 0);
      const width = Math.max(4, Math.round((demand / maxDemand) * 100));
      return `<div class="topic-demand-row">
        <div class="topic-demand-label" title="${topic.name}">${topic.name}</div>
        <div class="topic-demand-track"><div class="topic-demand-bar" style="width:${width}%"></div></div>
        <div class="topic-demand-value">${demand}</div>
      </div>`;
    }).join('')}
  </div>`;
}

export function renderDashboard(greeting, channel, apiData) {
  const hasData = !!(apiData?.opportunities?.length);
  const kpis = apiData?.kpi || [];
  const opps = apiData?.opportunities || [];
  const comments = apiData?.recent_comments || [];
  const topics = apiData?.top_topics || [];
  const channelHandle = channel.channelName || '';

  if (!channelHandle && !hasData) {
    return `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:var(--space-6)">
        <div style="width:80px;height:80px;border-radius:50%;background:var(--surface-elevated);display:flex;align-items:center;justify-content:center;margin-bottom:var(--space-2)"><i data-lucide="youtube" style="width:40px;height:40px;color:var(--color-error)"></i></div>
        <div><h1 style="font-size:var(--font-size-2xl);font-weight:var(--font-weight-bold);margin-bottom:var(--space-2)">Connect Your YouTube Channel</h1><p style="color:var(--text-secondary);max-width:420px;line-height:1.6">Enter your channel handle below and run a live analysis. AudienceOS will fetch comments and surface your best content opportunities.</p></div>
        <div style="display:flex;align-items:center;gap:var(--space-2);background:var(--surface-elevated);padding:12px 16px;border-radius:var(--radius-lg);border:1px solid var(--border-primary);width:100%;max-width:500px"><input type="text" id="live-channel-input" class="input" placeholder="Enter YouTube handle (e.g. @MKBHD)" style="flex:1;padding:8px 12px;font-size:14px;border:none;background:transparent;outline:none" /><button class="btn btn-primary" id="btn-run-live-analysis"><i data-lucide="sparkles"></i>Analyze Channel</button></div>
        <p style="font-size:var(--font-size-sm);color:var(--text-muted)">Powered by YouTube Data API v3 + Groq LLM Agents</p>
      </div>`;
  }

  return `
    <div class="page-header"><div><h1 class="page-title">${greeting}, ${channel.name}</h1><p class="page-desc">Showing analysis for <strong>${channelHandle}</strong> — powered by YouTube Data API &amp; Groq AI Agents.</p></div><div style="display:flex;align-items:center;gap:var(--space-2);background:var(--surface-elevated);padding:8px 12px;border-radius:var(--radius-lg);border:1px solid var(--border-primary)"><input type="text" id="live-channel-input" class="input" placeholder="Switch channel handle..." style="width:210px;padding:6px 12px;font-size:13px" value="${channelHandle}" /><button class="btn btn-primary btn-sm" id="btn-run-live-analysis"><i data-lucide="sparkles"></i>Re-Analyze</button></div></div>
    <section class="section"><div class="grid-4">${kpis.map(k => `<div class="card card-sm metric-card"><div style="display:flex;align-items:center;justify-content:space-between"><span class="metric-card-label">${k.label}</span><i data-lucide="${k.icon || 'bar-chart-2'}" style="width:16px;height:16px;color:var(--text-muted)"></i></div><span class="metric-card-value">${k.value}</span><span class="metric-card-trend ${k.up === true ? 'up' : k.up === false ? 'down' : 'neutral'}">${k.up === true ? '↑' : k.up === false ? '↓' : '●'} ${k.trend}</span></div>`).join('')}</div></section>
    ${opps.length ? `<section class="section"><div class="section-header"><div><h2 class="section-title">Top Content Opportunities</h2><p class="section-subtitle">Ranked by audience demand · OpportunityScorer Agent</p></div><button class="btn btn-ghost btn-sm" onclick="_navigate('opportunities')">View all <i data-lucide="arrow-right"></i></button></div><div style="display:flex;flex-direction:column;gap:var(--space-4)">${opps.slice(0, 3).map(o => `<div class="card opp-card" id="opp-${o.id}"><div class="opp-card-top"><div class="opp-card-info"><div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-1)"><h3 class="opp-card-title">${o.title}</h3>${o.trending ? '<span class="badge badge-accent">Trending</span>' : ''}</div><p class="opp-card-desc">${o.description || o.desc || ''}</p><div class="opp-card-meta"><span class="opp-card-meta-item"><strong>${o.questions}</strong> audience questions</span><span class="opp-card-meta-item"><strong>${o.growth}</strong> mention growth</span><span class="opp-card-meta-item"><strong>${o.coverage}</strong> coverage</span><span class="opp-card-meta-item">Format: <strong>${o.format}</strong></span></div></div><div class="score ${scoreClass(o.score)}">${o.score}</div></div><div class="opp-card-actions"><button class="btn btn-primary btn-sm" onclick="_generateContent(${o.id})"><i data-lucide="sparkles"></i>Generate Content</button><button class="btn btn-secondary btn-sm" onclick="_navigate('opportunity-detail',${o.id})">View Details</button></div></div>`).join('')}</div></section>` : ''}
    ${comments.length ? `<section class="section"><div class="grid-2"><div class="card"><div class="card-header"><div><h3 class="card-title">Topic Demand</h3><p class="card-subtitle">Demand score from the latest analysis</p></div></div>${renderTopicDemandChart(topics)}</div><div class="card"><div class="card-header"><h3 class="card-title">Live Audience Signals</h3><button class="btn btn-ghost btn-sm" onclick="_navigate('audience')">View all</button></div><div style="display:flex;flex-direction:column">${comments.slice(0, 5).map(c => `<div class="comment-row"><div class="comment-avatar">${c.author_avatar || c.avatar || 'YT'}</div><div class="comment-body"><p class="comment-text">"${c.text}"</p><div class="comment-meta"><span class="badge badge-${(c.comment_type || c.type) === 'REQUEST' ? 'accent' : (c.comment_type || c.type) === 'CONFUSION' ? 'warning' : (c.comment_type || c.type) === 'QUESTION' ? 'info' : 'default'}">${c.comment_type || c.type || 'COMMENT'}</span><span>${c.topic || ''}</span><span>${c.time_ago || c.time || ''}</span></div></div></div>`).join('')}</div></div></div></section>` : ''}
  `;
}

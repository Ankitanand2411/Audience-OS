import { OPPORTUNITIES as DEMO_OPPS, COMMENTS as DEMO_COMMENTS } from '../data/demo.js';

function scoreClass(s) { return s >= 80 ? 'score-high' : s >= 60 ? 'score-medium' : 'score-low'; }

export function renderOpportunityDetail(id, apiData) {
  const opp = apiData?.opportunity || DEMO_OPPS.find(o => o.id === Number(id)) || DEMO_OPPS[0];
  const relatedComments = apiData?.comments || DEMO_COMMENTS.slice(0, 4);

  return `
    <div style="margin-bottom:var(--space-4)">
      <button class="btn btn-ghost btn-sm" onclick="_navigate('opportunities')"><i data-lucide="arrow-left"></i>Back to Opportunities</button>
    </div>

    <div class="page-header">
      <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap">
        <h1 class="page-title">${opp.title}</h1>
        <span class="badge badge-accent">High Opportunity</span>
        ${opp.trending ? '<span class="badge badge-success">Trending</span>' : ''}
      </div>
      <p class="page-desc">${opp.description || opp.desc}</p>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="_generateContent(${opp.id})"><i data-lucide="sparkles"></i>Generate Content</button>
        <button class="btn btn-secondary" onclick="_showToast('Opportunity saved')"><i data-lucide="bookmark"></i>Save Opportunity</button>
      </div>
    </div>

    <section class="section" style="display:flex;align-items:center;gap:var(--space-6);flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:var(--space-3)">
        <div class="score ${scoreClass(opp.score)}" style="width:64px;height:64px;font-size:var(--font-size-3xl)">${opp.score}</div>
        <div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary)">Opportunity Score</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">out of 100</div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title" style="margin-bottom:var(--space-5)">Why this opportunity?</h2>
      <div class="evidence-grid">
        <div class="evidence-item"><div class="evidence-value">${opp.questions}</div><div class="evidence-label">Audience questions</div></div>
        <div class="evidence-item"><div class="evidence-value" style="color:var(--color-success)">${opp.growth}</div><div class="evidence-label">Mention growth</div></div>
        <div class="evidence-item"><div class="evidence-value">17</div><div class="evidence-label">Related videos</div></div>
        <div class="evidence-item"><div class="evidence-value" style="color:var(--color-error)">${opp.coverage}</div><div class="evidence-label">Existing coverage</div></div>
      </div>
    </section>

    <section class="section">
      <div class="gap-panel">
        <div class="gap-panel-label">Content Gap</div>
        <p class="gap-panel-text">Your audience repeatedly asks about ${opp.title}, but your channel does not have a dedicated beginner tutorial covering this topic.</p>
        <div class="gap-panel-meta">
          <span>Audience demand: <strong>HIGH</strong></span>
          <span>Existing coverage: <strong>${opp.coverage.toUpperCase()}</strong></span>
        </div>
        <button class="btn btn-primary btn-sm" style="align-self:flex-start" onclick="_generateContent(${opp.id})"><i data-lucide="sparkles"></i>Create Content</button>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title" style="margin-bottom:var(--space-5)">Audience Evidence</h2>
      <div class="card" style="padding:0;overflow:hidden">
        ${relatedComments.map(c => `
          <div class="comment-row" style="border-bottom:1px solid var(--border-primary)">
            <div class="comment-avatar">${c.author_avatar || c.avatar || 'VW'}</div>
            <div class="comment-body">
              <p class="comment-text">"${c.text}"</p>
              <div class="comment-meta">
                <span class="badge badge-${(c.comment_type || c.type) === 'REQUEST' ? 'accent' : (c.comment_type || c.type) === 'CONFUSION' ? 'warning' : 'info'}">${c.comment_type || c.type}</span>
                <span>${c.time_ago || c.time}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="section">
      <div class="ai-insight">
        <div class="ai-insight-label"><i data-lucide="sparkles" style="width:14px;height:14px"></i>AI Recommendation</div>
        <div style="margin-bottom:var(--space-3)">
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:var(--space-1)">Recommended Content</div>
          <div style="font-size:var(--font-size-md);font-weight:var(--font-weight-semibold);color:var(--text-primary)">Beginner-friendly 7–10 minute tutorial</div>
        </div>
        <div style="margin-bottom:var(--space-3)">
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:var(--space-1)">Suggested angle</div>
          <p class="ai-insight-text">Explain the core concepts of ${opp.title} with a hands-on tutorial and architectural breakdown.</p>
        </div>
        <div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:var(--space-1)">Suggested hook</div>
          <p class="ai-insight-text" style="font-style:italic">"If you think ${opp.title} is just hype, here's what you're missing."</p>
        </div>
      </div>
    </section>
  `;
}

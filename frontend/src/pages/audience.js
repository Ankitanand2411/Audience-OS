import { COMMENTS as DEMO_COMMENTS, AUDIENCE_STATS as DEMO_STATS } from '../data/demo.js';

export function renderAudience(apiData) {
  const comments = apiData?.comments || DEMO_COMMENTS;
  const stats = apiData?.stats || DEMO_STATS;

  return `
    <div class="page-header">
      <h1 class="page-title">Audience Intelligence</h1>
      <p class="page-desc">Understand what your audience is asking, requesting, and struggling with (Categorized by Comment Classifier Agent).</p>
    </div>

    <section class="section">
      <div style="display:flex;gap:var(--space-6);flex-wrap:wrap">
        ${stats.map(s => `
          <div style="display:flex;align-items:baseline;gap:var(--space-2)">
            <span style="font-size:var(--font-size-2xl);font-weight:var(--font-weight-bold);color:var(--text-primary)">${s.count}</span>
            <span style="font-size:var(--font-size-sm);color:var(--text-secondary)">${s.label}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="section">
      <div class="filters-bar">
        <div class="tabs" style="border:none;margin:0">
          <button class="tab active" id="tab-all">All</button>
          <button class="tab" id="tab-questions">Questions</button>
          <button class="tab" id="tab-requests">Requests</button>
          <button class="tab" id="tab-confusion">Confusion</button>
          <button class="tab" id="tab-feedback">Feedback</button>
          <button class="tab" id="tab-ideas">Ideas</button>
        </div>
        <div class="search-input-wrap">
          <i data-lucide="search"></i>
          <input class="input" type="text" placeholder="Search audience conversations..." id="audience-search" />
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        ${comments.map(c => `
          <div class="comment-row" style="border-bottom:1px solid var(--border-primary)">
            <div class="comment-avatar">${c.author_avatar || c.avatar || 'VW'}</div>
            <div class="comment-body">
              <p class="comment-text">"${c.text}"</p>
              <div class="comment-meta">
                <span class="badge badge-${(c.comment_type || c.type) === 'REQUEST' ? 'accent' : (c.comment_type || c.type) === 'CONFUSION' ? 'warning' : (c.comment_type || c.type) === 'QUESTION' ? 'info' : (c.comment_type || c.type) === 'IDEA' ? 'success' : 'default'}">${c.comment_type || c.type}</span>
                <span class="badge badge-default">${c.topic}</span>
                <span class="badge badge-${c.priority === 'High' ? 'error' : c.priority === 'Medium' ? 'warning' : 'default'}">${c.priority} priority</span>
                <span>${c.time_ago || c.time}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

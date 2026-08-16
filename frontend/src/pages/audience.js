import { COMMENTS as DEMO_COMMENTS, AUDIENCE_STATS as DEMO_STATS } from '../data/demo.js';

const FILTERS = [
  ['all', 'All'],
  ['question', 'Questions'],
  ['request', 'Requests'],
  ['confusion', 'Confusion'],
  ['feedback', 'Feedback'],
  ['idea', 'Ideas'],
];

function commentType(comment) {
  return (comment.comment_type || comment.type || 'FEEDBACK').toUpperCase();
}

function badgeClass(type) {
  if (type === 'REQUEST') return 'accent';
  if (type === 'CONFUSION') return 'warning';
  if (type === 'QUESTION') return 'info';
  if (type === 'IDEA') return 'success';
  return 'default';
}

export function renderAudience(apiData) {
  const comments = apiData?.comments || DEMO_COMMENTS;
  const stats = apiData?.stats || DEMO_STATS;

  return `
    <div class="page-header">
      <h1 class="page-title">Audience Intelligence</h1>
      <p class="page-desc">Understand what your audience is asking, requesting, and struggling with.</p>
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
        <div class="tabs" style="border:none;margin:0" role="tablist" aria-label="Filter audience comments">
          ${FILTERS.map(([filter, label], index) => `<button class="tab ${index === 0 ? 'active' : ''}" data-audience-filter="${filter}" role="tab" aria-selected="${index === 0}">${label}</button>`).join('')}
        </div>
        <div class="search-input-wrap">
          <i data-lucide="search"></i>
          <input class="input" type="search" placeholder="Search audience conversations..." id="audience-search" aria-label="Search audience conversations" />
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden" id="audience-comment-list">
        ${comments.map(c => {
          const type = commentType(c);
          const searchText = `${c.text || ''} ${c.topic || ''} ${type} ${c.priority || ''}`.toLowerCase();
          return `
            <div class="comment-row audience-comment" data-comment-type="${type.toLowerCase()}" data-comment-search="${searchText.replaceAll('"', '&quot;')}" style="border-bottom:1px solid var(--border-primary)">
              <div class="comment-avatar">${c.author_avatar || c.avatar || 'VW'}</div>
              <div class="comment-body">
                <p class="comment-text">"${c.text}"</p>
                <div class="comment-meta">
                  <span class="badge badge-${badgeClass(type)}">${type}</span>
                  <span class="badge badge-default">${c.topic}</span>
                  <span class="badge badge-${c.priority === 'High' ? 'error' : c.priority === 'Medium' ? 'warning' : 'default'}">${c.priority} priority</span>
                  <span>${c.time_ago || c.time}</span>
                </div>
              </div>
            </div>`;
        }).join('')}
        <div id="audience-empty" class="empty-state" hidden>
          <i data-lucide="search-x" class="empty-state-icon"></i>
          <div class="empty-state-title">No conversations found</div>
          <div class="empty-state-desc">Try another category or a different search term.</div>
        </div>
      </div>
    </section>
  `;
}

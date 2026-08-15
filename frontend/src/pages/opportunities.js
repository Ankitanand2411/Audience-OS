import { OPPORTUNITIES as DEMO_OPPS, TOPICS as DEMO_TOPICS } from '../data/demo.js';

function scoreClass(s) { return s >= 80 ? 'score-high' : s >= 60 ? 'score-medium' : 'score-low'; }

export function renderOpportunities(apiData) {
  const opps = apiData?.opportunities || DEMO_OPPS;
  const topics = apiData?.topics || DEMO_TOPICS;

  return `
    <div class="page-header">
      <h1 class="page-title">Content Opportunities</h1>
      <p class="page-desc">Turn audience demand into your next piece of content (Analyzed & Ranked by Opportunity Scorer Agent).</p>
      <div class="page-actions"><button class="btn btn-primary" onclick="_navigate('dashboard')"><i data-lucide="refresh-cw"></i>Re-Analyze Channel</button></div>
    </div>

    <section class="section">
      <div class="filters-bar">
        <div class="tabs" style="border:none;margin:0">
          <button class="tab active">All</button>
          <button class="tab">Trending</button>
          <button class="tab">High Demand</button>
          <button class="tab">Content Gaps</button>
          <button class="tab">Questions</button>
          <button class="tab">Requests</button>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        ${opps.map(o => `
          <div class="card opp-card" id="opp-list-${o.id}">
            <div class="opp-card-top">
              <div class="opp-card-info">
                <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-1)">
                  <h3 class="opp-card-title">${o.title}</h3>
                  ${o.trending ? '<span class="badge badge-accent">Trending</span>' : ''}
                </div>
                <p class="opp-card-desc">${o.description || o.desc}</p>
                <div class="opp-card-meta">
                  <span class="opp-card-meta-item"><strong>${o.questions}</strong> questions</span>
                  <span class="opp-card-meta-item"><strong>${o.growth}</strong> growth</span>
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

    <section class="section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Topics</h2>
          <p class="section-subtitle">All discovered topics ranked by opportunity score</p>
        </div>
      </div>
      <div class="card" style="padding:0;overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Interactions</th>
              <th>Growth</th>
              <th>Demand</th>
              <th>Coverage</th>
              <th>Opportunity</th>
            </tr>
          </thead>
          <tbody>
            ${topics.map(t => `
              <tr>
                <td><strong>${t.name}</strong></td>
                <td class="td-number">${t.interactions}</td>
                <td class="td-number" style="color:var(--color-success)">${t.growth}</td>
                <td class="td-number">${t.demand}</td>
                <td><span class="badge badge-${t.coverage === 'Low' ? 'error' : t.coverage === 'Medium' ? 'warning' : 'success'}">${t.coverage}</span></td>
                <td><span class="score ${scoreClass(t.opportunity)}" style="width:36px;height:36px;font-size:var(--font-size-sm)">${t.opportunity}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

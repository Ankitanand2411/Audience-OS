export function renderAnalytics(apiData) {
  const reason = apiData?.reason || "Connect YouTube Analytics to display verified channel performance.";

  return `
    <div class="page-header">
      <h1 class="page-title">Performance</h1>
      <p class="page-desc">Verified channel analytics will appear here once an analytics source is connected.</p>
    </div>

    <section class="section">
      <div class="card analytics-empty-state">
        <div class="analytics-empty-kicker">Verified data only</div>
        <h2 class="analytics-empty-title">No analytics connected.</h2>
        <p class="analytics-empty-copy">${reason}</p>
        <p class="analytics-empty-note">AudienceOS currently uses public YouTube comments for audience research. Views, watch time, and engagement rates are not displayed until they can be verified through YouTube Analytics.</p>
        <button class="btn btn-primary" onclick="_navigate(\x27settings\x27)">Open settings <i data-lucide="arrow-right"></i></button>
      </div>
    </section>
  `;
}

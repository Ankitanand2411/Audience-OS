import { CONTENT_TITLES as DEMO_TITLES, CONTENT_HOOK as DEMO_HOOK, CONTENT_SCRIPT as DEMO_SCRIPT, CONTENT_DESCRIPTION as DEMO_DESC, CONTENT_TAGS as DEMO_TAGS } from '../data/demo.js';
import { api } from '../api/client.js';

export function renderContentStudio(apiData) {
  const pkg = apiData?.package;
  const titles = pkg?.titles || DEMO_TITLES;
  const hook = pkg?.hook || DEMO_HOOK;
  const script = pkg?.script || DEMO_SCRIPT;
  const description = pkg?.description || DEMO_DESC;
  const tags = pkg?.tags || DEMO_TAGS;
  let selectedTitleIndex = Number(pkg?.selected_title_index) || 0;

  window._selectStudioTitle = function(index) {
    selectedTitleIndex = index;
    document.querySelectorAll('.title-option').forEach((option, optionIndex) => {
      const selected = optionIndex === index;
      option.classList.toggle('selected', selected);
      option.setAttribute('aria-checked', String(selected));
    });
  };

  window._saveStudioContent = async function() {
    const hookVal = document.getElementById('hook-editor').value;
    const scriptVal = document.getElementById('script-editor').value;
    const descVal = document.getElementById('desc-editor').value;
    const result = await api.saveContentStudio({
      titles,
      selected_title_index: selectedTitleIndex,
      hook: hookVal,
      script: scriptVal,
      description: descVal,
      tags,
    });
    _showToast(result ? 'YouTube content saved.' : 'Could not save content. Check the backend.');
  };

  return `
    <div class="page-header">
      <h1 class="page-title">YouTube Content Studio</h1>
      <p class="page-desc">Create and edit the YouTube video package generated for the selected opportunity.</p>
    </div>

    <section class="card" style="max-width:900px">
      <div class="card-header" style="margin-bottom:var(--space-6)">
        <div>
          <h2 class="card-title">YouTube Video</h2>
          <p class="card-subtitle">Title, hook, script, description, and tags</p>
        </div>
        <span class="badge badge-success">Ready to edit</span>
      </div>

      <div class="studio-section">
        <h2 class="studio-section-title">Title</h2>
        ${titles.map((title, index) => `
          <button class="title-option ${index === selectedTitleIndex ? 'selected' : ''}" type="button" role="radio" aria-checked="${index === selectedTitleIndex}" onclick="_selectStudioTitle(${index})">
            <span class="title-option-radio"></span>
            <span style="font-size:var(--font-size-base);font-weight:var(--font-weight-medium)">${title}</span>
          </button>
        `).join('')}
      </div>

      <div class="studio-section">
        <label class="studio-section-title" for="hook-editor">Hook</label>
        <textarea class="studio-editor" style="min-height:80px" id="hook-editor">${hook}</textarea>
      </div>

      <div class="studio-section">
        <label class="studio-section-title" for="script-editor">Script</label>
        <textarea class="studio-editor" id="script-editor">${script}</textarea>
      </div>

      <div class="studio-section">
        <label class="studio-section-title" for="desc-editor">YouTube Description</label>
        <textarea class="studio-editor" style="min-height:120px" id="desc-editor">${description}</textarea>
      </div>

      <div class="studio-section">
        <h2 class="studio-section-title">Tags</h2>
        <div class="tag-input-wrap">${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
      </div>

      <div style="display:flex;gap:var(--space-3);padding-top:var(--space-4);border-top:1px solid var(--border-primary)">
        <button class="btn btn-primary" onclick="_saveStudioContent()"><i data-lucide="save"></i>Save YouTube Content</button>
      </div>
    </section>
  `;
}

(function () {
  const editor = document.getElementById('editor');
  const iframe = document.getElementById('preview');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');
  const shareBtn = document.getElementById('shareBtn');
  const slugInput = document.getElementById('slug');
  const status = document.getElementById('status');
  const dragbar = document.getElementById('dragbar');
  const split = document.getElementById('split');

  const qs = new URLSearchParams(location.search);
  const initialSlug = qs.get('s') || '';
  if (initialSlug) slugInput.value = initialSlug;

  // default template
  const starter = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>directml</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body{font:16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;padding:24px;line-height:1.5}</style>
</head>
<body>
  <h1>hello, directml</h1>
  <p>start typing HTML on the left. it renders here.</p>
</body>
</html>`;

  // load from localStorage or set starter
  editor.value = localStorage.getItem('directml_current') || starter;
  render();

  // debounced render
  let t;
  editor.addEventListener('input', () => {
    localStorage.setItem('directml_current', editor.value);
    clearTimeout(t);
    t = setTimeout(render, 120);
  });

  function render() {
    const blob = new Blob([editor.value], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
    iframe.onload = () => URL.revokeObjectURL(url);
  }

  // resizer
  let resizing = false;
  dragbar.addEventListener('mousedown', (e) => {
    e.preventDefault();
    resizing = true;
    document.body.style.cursor = 'col-resize';
  });
  window.addEventListener('mousemove', (e) => {
    if (!resizing) return;
    const rect = split.getBoundingClientRect();
    const leftWidth = Math.min(Math.max(e.clientX - rect.left, 200), rect.width - 200);
    split.style.gridTemplateColumns = `${leftWidth}px 1fr`;
  });
  window.addEventListener('mouseup', () => {
    if (!resizing) return;
    resizing = false;
    document.body.style.cursor = 'default';
  });

  // keyboard save
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      doSave();
    }
  });

  saveBtn.addEventListener('click', doSave);
  loadBtn.addEventListener('click', doLoad);
  shareBtn.addEventListener('click', () => {
    const s = slugInput.value.trim();
    if (!s) return flash('set a slug first');
    const url = new URL(location.href);
    url.searchParams.set('s', s);
    history.replaceState(null, '', url.toString());
    navigator.clipboard.writeText(url.toString()).catch(() => {});
    flash('link copied');
  });

  function flash(msg) {
    status.textContent = msg;
    setTimeout(() => { status.textContent = ''; }, 1500);
  }

  async function doSave() {
    const slug = slugInput.value.trim();
    if (!slug) return flash('enter a slug');
    // save locally always
    localStorage.setItem(`directml:${slug}`, editor.value);
    flash('saved locally');
    // try cloud save if functions exist
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, content: editor.value })
      });
      if (res.ok) flash('saved to cloud');
    } catch (_) { /* offline or no functions */ }
  }

  async function doLoad() {
    const slug = slugInput.value.trim();
    if (!slug) return flash('enter a slug');
    // try cloud first
    try {
      const res = await fetch(`/api/load?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const { content } = await res.json();
        if (typeof content === 'string') {
          editor.value = content;
          localStorage.setItem('directml_current', content);
          render();
          flash('loaded from cloud');
          return;
        }
      }
    } catch (_) { /* fall back to local */ }
    // local fallback
    const local = localStorage.getItem(`directml:${slug}`);
    if (local) {
      editor.value = local;
      localStorage.setItem('directml_current', local);
      render();
      flash('loaded locally');
    } else {
      flash('not found');
    }
  }

  // auto-load if ?s= present and there is cloud/local content
  if (initialSlug) doLoad();
})();
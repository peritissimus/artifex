import { sampleNotes } from './samples';
const root = document.querySelector<HTMLElement>('#search-lab')!;
const start = root.querySelector<HTMLButtonElement>('#start-lab')!;
const form = root.querySelector<HTMLFormElement>('form')!;
const query = root.querySelector<HTMLInputElement>('#note-query')!;
const phrase = root.querySelector<HTMLInputElement>('#phrase')!;
const files = root.querySelector<HTMLInputElement>('#note-files')!;
const status = root.querySelector<HTMLElement>('#lab-status')!;
const results = root.querySelector<HTMLElement>('#lab-results')!;
const count = root.querySelector<HTMLElement>('#note-count')!;
const controls = root.querySelector<HTMLFieldSetElement>('fieldset')!;
let worker: Worker | undefined;
let request = 0;
let ready = false;
let watchdog: ReturnType<typeof setTimeout>;

function clearResults() {
  results.replaceChildren();
}
function error(message: string) {
  clearTimeout(watchdog);
  status.textContent = message;
  root.removeAttribute('aria-busy');
}
function search() {
  if (!ready) return;
  clearResults();
  if (!query.value.trim()) {
    status.textContent = 'Enter a word or phrase to search your notes.';
    ++request;
    return;
  }
  status.textContent = 'Searching…';
  worker!.postMessage({
    type: 'search',
    id: ++request,
    query: query.value.slice(0, 200),
    phrase: phrase.checked,
  });
}
function load(notes: typeof sampleNotes) {
  ready = false;
  controls.disabled = true;
  clearResults();
  root.setAttribute('aria-busy', 'true');
  status.textContent = 'Building the local index…';
  worker!.postMessage({ type: 'load', id: ++request, notes });
  clearTimeout(watchdog);
  watchdog = setTimeout(() => {
    worker?.terminate();
    worker = undefined;
    start.hidden = false;
    error('The search engine did not start. Check your connection, then try Start search again.');
  }, 30000);
}
start.addEventListener('click', () => {
  start.hidden = true;
  worker = new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' });
  worker.onerror = () => {
    worker?.terminate();
    worker = undefined;
    ready = false;
    controls.disabled = true;
    start.hidden = false;
    error('The search engine could not load. Try Start search again.');
  };
  worker.onmessage = ({ data }) => {
    if (data.id !== request) return;
    if (data.type === 'ready') {
      clearTimeout(watchdog);
      root.removeAttribute('aria-busy');
      controls.disabled = false;
      ready = true;
      count.textContent = `${data.count} notes · SQLite ${data.version} · memory only`;
      search();
    } else if (data.type === 'results') {
      status.textContent = `${data.count} ${data.count === 1 ? 'match' : 'matches'} · ${data.ms.toFixed(2)} ms in this browser${data.count > 20 ? ' · showing the first 20' : ''}`;
      clearResults();
      for (const row of data.rows) {
        const item = document.createElement('li');
        const title = document.createElement('h3');
        title.textContent = row.title;
        const excerpt = document.createElement('p');
        excerpt.textContent = row.excerpt;
        item.append(title, excerpt);
        results.append(item);
      }
      if (!data.count)
        status.textContent += '. Try a different word; this searches tokens, not meaning.';
    } else if (data.type === 'error') {
      controls.disabled = !ready;
      if (!ready) {
        worker?.terminate();
        worker = undefined;
        start.hidden = false;
      }
      error(data.message);
    }
  };
  load(sampleNotes);
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  search();
});
root.querySelectorAll<HTMLButtonElement>('[data-query]').forEach((button) =>
  button.addEventListener('click', () => {
    query.value = button.dataset.query!;
    search();
  })
);
root.querySelector('#reset-notes')!.addEventListener('click', () => {
  files.value = '';
  query.value = 'sqlite';
  phrase.checked = false;
  load(sampleNotes);
});
files.addEventListener('change', async () => {
  const selected = [...(files.files || [])];
  if (!selected.length) return;
  if (
    selected.length > 100 ||
    selected.some((file) => !/\.(md|txt)$/i.test(file.name)) ||
    selected.reduce((sum, file) => sum + file.size, 0) > 2 * 1024 * 1024
  ) {
    files.value = '';
    error(
      'Choose up to 100 .md or .txt files, totalling no more than 2 MB. Your current index is unchanged.'
    );
    return;
  }
  controls.disabled = true;
  try {
    const notes = await Promise.all(
      selected.map(async (file) => ({ title: file.name, body: await file.text() }))
    );
    query.value = '';
    load(notes);
  } catch {
    controls.disabled = false;
    error('A file could not be read. Your current index is unchanged.');
  }
});
window.addEventListener('pagehide', () => {
  clearTimeout(watchdog);
  worker?.terminate();
  worker = undefined;
  ready = false;
  controls.disabled = true;
  start.hidden = false;
  files.value = '';
  clearResults();
  count.textContent = 'Six sample notes ready';
  status.textContent = 'Start to load the SQLite engine. No account needed.';
});

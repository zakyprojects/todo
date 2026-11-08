// Todo — plain JavaScript, no libraries. Tasks live only in this browser (localStorage).
(function () {
  'use strict';

  var KEY = 'todo_tasks';
  var OLD_KEY = 'nova_todo_tasks_v2';   // the previous version of this app
  var THEME_KEY = 'todo_theme';
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;

  var tasks = load();
  var filter = 'all';
  var editingId = null;
  var lastRemoved = null;               // { items: [{task, index}] } for Undo
  var toastTimer = 0;

  // ---------- Storage ----------
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw !== null) return JSON.parse(raw).filter(valid);
      // First visit after the redesign: keep the visitor's own tasks, skip the old demo tasks.
      var old = JSON.parse(localStorage.getItem(OLD_KEY) || '[]');
      return old.filter(function (t) { return t && typeof t.text === 'string' && !/^task-\d+$/.test(t.id); })
        .map(function (t) { return { id: uid(), text: t.text.slice(0, 200), done: !!t.completed, due: /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : '' }; });
    } catch (e) { return []; }
  }
  function valid(t) { return t && typeof t.id === 'string' && typeof t.text === 'string'; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {}
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // ---------- Dates (local calendar days) ----------
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function daysFromToday(iso) {
    var p = iso.split('-'), t = todayISO().split('-');
    return Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - Date.UTC(+t[0], +t[1] - 1, +t[2])) / 86400000);
  }
  function dueLabel(iso) {
    var n = daysFromToday(iso);
    if (n === 0) return { text: 'Due today', cls: 'is-today' };
    if (n === 1) return { text: 'Due tomorrow', cls: '' };
    if (n === -1) return { text: 'Overdue, was due yesterday', cls: 'is-late' };
    if (n < 0) return { text: 'Overdue by ' + (-n) + ' days', cls: 'is-late' };
    var p = iso.split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    return { text: 'Due ' + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }), cls: '' };
  }

  // ---------- Theme: follows the device/browser until the visitor picks one ----------
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function setThemeColor() { themeMeta.content = root.dataset.theme === 'dark' ? '#161413' : '#fbfaf9'; }
  setThemeColor();
  $('theme-btn').addEventListener('click', function () {
    if (root.dataset.theme === 'dark') delete root.dataset.theme; else root.dataset.theme = 'dark';
    try { localStorage.setItem(THEME_KEY, root.dataset.theme === 'dark' ? 'dark' : 'light'); } catch (e) {}
    setThemeColor();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) {}
    if (saved === 'dark' || saved === 'light') return;
    if (e.matches) root.dataset.theme = 'dark'; else delete root.dataset.theme;
    setThemeColor();
  });

  // ---------- Add ----------
  $('add').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = $('new-text').value.trim();
    if (!text) return;
    tasks.unshift({ id: uid(), text: text, done: false, due: $('new-due').value || '' });
    save();
    $('new-text').value = '';
    $('new-due').value = '';
    if (filter === 'done') setFilter('all'); else render();
    $('new-text').focus();
  });

  // ---------- Filter ----------
  var tabButtons = document.querySelectorAll('[data-filter]');
  tabButtons.forEach(function (b) { b.addEventListener('click', function () { setFilter(b.dataset.filter); }); });
  function setFilter(f) {
    filter = f;
    tabButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === f)); });
    render();
  }

  // ---------- List actions (one listener for every row) ----------
  var list = $('list');
  list.addEventListener('change', function (e) {
    if (!e.target.classList.contains('check')) return;
    var t = find(e.target.closest('.item').dataset.id);
    if (!t) return;
    t.done = e.target.checked;
    save();
    render();
  });
  list.addEventListener('click', function (e) {
    var btn = e.target.closest('.act');
    if (!btn) return;
    var id = btn.closest('.item').dataset.id;
    if (btn.dataset.act === 'edit') { editingId = id; render(); focusEdit(); }
    if (btn.dataset.act === 'delete') removeTasks(function (t) { return t.id === id; }, 'Task deleted.');
  });
  list.addEventListener('dblclick', function (e) {
    var row = e.target.closest('.item');
    if (row && e.target.closest('.text')) { editingId = row.dataset.id; render(); focusEdit(); }
  });
  list.addEventListener('keydown', function (e) {
    if (!e.target.classList.contains('edit-input')) return;
    if (e.key === 'Enter') { e.preventDefault(); finishEdit(e.target, true); }
    if (e.key === 'Escape') { e.preventDefault(); finishEdit(e.target, false); }
  });
  list.addEventListener('focusout', function (e) {
    if (e.target.classList.contains('edit-input')) finishEdit(e.target, true);
  });

  function focusEdit() {
    var input = list.querySelector('.edit-input');
    if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  }
  function finishEdit(input, keep) {
    if (editingId === null) return;
    var t = find(editingId);
    editingId = null;
    var text = input.value.trim();
    if (keep && t && text) { t.text = text.slice(0, 200); save(); }
    render();
  }

  $('clear-done').addEventListener('click', function () {
    var n = tasks.filter(function (t) { return t.done; }).length;
    removeTasks(function (t) { return t.done; }, n === 1 ? '1 done task cleared.' : n + ' done tasks cleared.');
  });

  function removeTasks(match, message) {
    var removed = [];
    tasks = tasks.filter(function (t, i) {
      if (match(t)) { removed.push({ task: t, index: i }); return false; }
      return true;
    });
    if (!removed.length) return;
    lastRemoved = removed;
    save();
    render();
    showToast(message);
  }

  // ---------- Undo toast ----------
  $('toast-undo').addEventListener('click', function () {
    if (!lastRemoved) return;
    lastRemoved.forEach(function (r) { tasks.splice(Math.min(r.index, tasks.length), 0, r.task); });
    lastRemoved = null;
    save();
    render();
    hideToast();
  });
  function showToast(text) {
    $('toast-text').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 6000);
  }
  function hideToast() { $('toast').hidden = true; lastRemoved = null; }

  function find(id) { for (var i = 0; i < tasks.length; i++) if (tasks[i].id === id) return tasks[i]; return null; }

  // ---------- Render ----------
  var ICON_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';
  var ICON_DELETE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function render() {
    var shown = tasks.filter(function (t) { return filter === 'all' || (filter === 'done' ? t.done : !t.done); });
    list.innerHTML = '';
    shown.forEach(function (t) {
      var li = document.createElement('li');
      li.className = 'item' + (t.done ? ' is-done' : '');
      li.dataset.id = t.id;

      var check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'check';
      check.checked = t.done;
      check.setAttribute('aria-label', (t.done ? 'Mark as not done: ' : 'Mark as done: ') + t.text);

      var body = document.createElement('div');
      body.className = 'body';
      if (editingId === t.id) {
        var input = document.createElement('input');
        input.className = 'edit-input';
        input.value = t.text;
        input.maxLength = 200;
        input.setAttribute('aria-label', 'Edit task');
        body.appendChild(input);
      } else {
        var text = document.createElement('div');
        text.className = 'text';
        text.textContent = t.text;
        body.appendChild(text);
        if (t.due) {
          var d = dueLabel(t.due);
          var due = document.createElement('span');
          due.className = 'due ' + d.cls;
          due.textContent = d.text;
          body.appendChild(due);
        }
      }

      var actions = document.createElement('div');
      actions.className = 'actions';
      actions.innerHTML =
        '<button type="button" class="act" data-act="edit" aria-label="Edit task">' + ICON_EDIT + '</button>' +
        '<button type="button" class="act" data-act="delete" aria-label="Delete task">' + ICON_DELETE + '</button>';

      li.appendChild(check);
      li.appendChild(body);
      li.appendChild(actions);
      list.appendChild(li);
    });

    var left = tasks.filter(function (t) { return !t.done; }).length;
    var doneCount = tasks.length - left;
    $('count').textContent = tasks.length ? (left === 0 ? 'All done' : left + (left === 1 ? ' task left' : ' tasks left')) : '';

    var empty = $('empty');
    empty.hidden = shown.length > 0;
    empty.textContent = !tasks.length ? 'No tasks yet. Add your first one above.'
      : filter === 'done' ? 'Nothing done yet.'
      : 'Nothing left to do. Nice work.';

    $('list-foot').hidden = doneCount === 0;
  }

  // ---------- Header date ----------
  $('today').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  render();
})();

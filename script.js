// Todo — plain JavaScript, no libraries. Lists and tasks live only in this browser (localStorage).
(function () {
  'use strict';

  var KEYS = { lists: 'todo_lists', tasks: 'todo_tasks', current: 'todo_current_list', theme: 'todo_theme' };
  var OLD_TASKS = 'nova_todo_tasks_v2';   // the previous version of this app
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var sheetQuery = matchMedia('(max-width: 1099px)');   // details show as a sheet below this width

  var state = load();
  var filter = 'all';
  var selectedId = null;
  var undo = null;          // function that restores the last delete
  var toastTimer = 0;

  // ---------- Storage ----------
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function load() {
    var lists = read(KEYS.lists);
    var tasks = read(KEYS.tasks);
    if (!Array.isArray(lists) || !lists.length) lists = [{ id: uid(), name: 'My tasks' }];
    if (!Array.isArray(tasks)) {
      // First visit after the redesign: keep the visitor's own tasks, skip the old demo tasks.
      var old = read(OLD_TASKS);
      tasks = (Array.isArray(old) ? old : [])
        .filter(function (t) { return t && typeof t.text === 'string' && !/^task-\d+$/.test(t.id); })
        .map(function (t) {
          return { id: uid(), text: t.text.slice(0, 200), done: !!t.completed, due: isISO(t.dueDate) ? t.dueDate : '',
                   notes: typeof t.notes === 'string' ? t.notes.slice(0, 4000) : '', created: +t.createdAt || Date.now() };
        });
    }
    var ids = lists.map(function (l) { return l.id; });
    tasks = tasks.filter(function (t) { return t && typeof t.id === 'string' && typeof t.text === 'string'; });
    tasks.forEach(function (t) { if (ids.indexOf(t.listId) < 0) t.listId = ids[0]; if (typeof t.notes !== 'string') t.notes = ''; if (!(+t.created > 0)) t.created = Date.now(); });
    var current = localStorage.getItem(KEYS.current);
    return { lists: lists, tasks: tasks, current: ids.indexOf(current) >= 0 ? current : ids[0] };
  }
  function save() {
    try {
      localStorage.setItem(KEYS.lists, JSON.stringify(state.lists));
      localStorage.setItem(KEYS.tasks, JSON.stringify(state.tasks));
      localStorage.setItem(KEYS.current, state.current);
    } catch (e) {}
  }
  function isISO(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v); }
  function findTask(id) { for (var i = 0; i < state.tasks.length; i++) if (state.tasks[i].id === id) return state.tasks[i]; return null; }
  function findList(id) { for (var i = 0; i < state.lists.length; i++) if (state.lists[i].id === id) return state.lists[i]; return null; }

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
    return { text: 'Due ' + new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }), cls: '' };
  }

  // ---------- Theme: follows the device/browser until the visitor picks one ----------
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function setThemeColor() { themeMeta.content = root.dataset.theme === 'dark' ? '#161413' : '#fbfaf9'; }
  setThemeColor();
  $('theme-btn').addEventListener('click', function () {
    if (root.dataset.theme === 'dark') delete root.dataset.theme; else root.dataset.theme = 'dark';
    try { localStorage.setItem(KEYS.theme, root.dataset.theme === 'dark' ? 'dark' : 'light'); } catch (e) {}
    setThemeColor();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    var saved = null;
    try { saved = localStorage.getItem(KEYS.theme); } catch (err) {}
    if (saved === 'dark' || saved === 'light') return;
    if (e.matches) root.dataset.theme = 'dark'; else delete root.dataset.theme;
    setThemeColor();
  });

  // ---------- Lists ----------
  function openNewList() {
    $('new-list-form').hidden = false;
    $('new-list-name').value = '';
    $('new-list-name').focus();
  }
  $('new-list-btn').addEventListener('click', openNewList);
  $('new-list-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('new-list-name').value.trim();
    if (name) {
      var list = { id: uid(), name: name.slice(0, 40) };
      state.lists.push(list);
      state.current = list.id;
      selectedId = null;
      save();
    }
    $('new-list-form').hidden = true;
    render();
    if (name) $('new-text').focus();
  });
  $('new-list-name').addEventListener('keydown', function (e) { if (e.key === 'Escape') { $('new-list-form').hidden = true; } });
  $('new-list-name').addEventListener('blur', function () { if (!$('new-list-name').value.trim()) $('new-list-form').hidden = true; });

  $('list-nav').addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.newList) { openNewList(); return; }
    state.current = btn.dataset.id;
    selectedId = null;
    save();
    render();
  });

  // Rename by editing the title.
  var titleInput = $('list-title');
  titleInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); titleInput.blur(); }
    if (e.key === 'Escape') { titleInput.value = findList(state.current).name; titleInput.blur(); }
  });
  titleInput.addEventListener('blur', function () {
    var list = findList(state.current);
    var name = titleInput.value.trim();
    if (name && name !== list.name) { list.name = name.slice(0, 40); save(); }
    render();
  });

  $('delete-list-btn').addEventListener('click', function () {
    var list = findList(state.current);
    var inList = state.tasks.filter(function (t) { return t.listId === list.id; });
    var msg = 'Delete the list "' + list.name + '"' + (inList.length ? ' and its ' + inList.length + (inList.length === 1 ? ' task' : ' tasks') : '') + '?';
    if (!confirm(msg)) return;
    var listIndex = state.lists.indexOf(list);
    var before = { lists: state.lists.slice(), tasks: state.tasks.slice() };
    state.lists.splice(listIndex, 1);
    state.tasks = state.tasks.filter(function (t) { return t.listId !== list.id; });
    if (!state.lists.length) state.lists.push({ id: uid(), name: 'My tasks' });   // always keep one list
    state.current = state.lists[Math.max(0, listIndex - 1)].id;
    selectedId = null;
    save();
    render();
    showToast('List deleted.', function () {
      state.lists = before.lists;
      state.tasks = before.tasks;
      state.current = list.id;
    });
  });

  // ---------- Add task ----------
  $('add').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = $('new-text').value.trim();
    if (!text) return;
    state.tasks.unshift({ id: uid(), listId: state.current, text: text, done: false, due: $('new-due').value || '', notes: '', created: Date.now() });
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

  // ---------- Task rows ----------
  var listEl = $('list');
  listEl.addEventListener('change', function (e) {
    if (!e.target.classList.contains('check')) return;
    var t = findTask(e.target.closest('.item').dataset.id);
    if (!t) return;
    t.done = e.target.checked;
    save();
    render();
  });
  listEl.addEventListener('click', function (e) {
    var row = e.target.closest('.item');
    if (!row) return;
    if (e.target.closest('.act')) { deleteTask(row.dataset.id); return; }
    if (e.target.closest('.open')) openDetails(row.dataset.id);
  });

  function deleteTask(id) {
    var i = -1;
    for (var k = 0; k < state.tasks.length; k++) if (state.tasks[k].id === id) i = k;
    if (i < 0) return;
    var task = state.tasks.splice(i, 1)[0];
    if (selectedId === id) closeDetails();
    save();
    render();
    showToast('Task deleted.', function () { state.tasks.splice(Math.min(i, state.tasks.length), 0, task); });
  }

  $('clear-done').addEventListener('click', function () {
    var before = state.tasks.slice();
    var n = 0;
    state.tasks = state.tasks.filter(function (t) { var drop = t.listId === state.current && t.done; if (drop) n++; return !drop; });
    if (!n) return;
    if (selectedId && !findTask(selectedId)) closeDetails();
    save();
    render();
    showToast(n === 1 ? '1 done task cleared.' : n + ' done tasks cleared.', function () { state.tasks = before; });
  });

  // ---------- Details ----------
  function openDetails(id) {
    selectedId = id;
    document.body.classList.add('details-open');
    render();
    if (sheetQuery.matches) $('d-text').focus({ preventScroll: true });
  }
  function closeDetails() {
    selectedId = null;
    document.body.classList.remove('details-open');
    render();
  }
  $('details-back').addEventListener('click', closeDetails);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && selectedId && sheetQuery.matches && !e.target.closest('.list-title, #new-list-name')) closeDetails();
  });

  // Every field saves as you type; the list redraws so the row matches.
  function bindField(id, apply) {
    $(id).addEventListener('input', function () {
      var t = findTask(selectedId);
      if (!t) return;
      apply(t, $(id));
      save();
      renderTasks();
      renderLists();
    });
  }
  bindField('d-text', function (t, el) { var v = el.value.replace(/\n/g, ' ').trim(); if (v) t.text = v.slice(0, 200); });
  bindField('d-notes', function (t, el) { t.notes = el.value; });
  bindField('d-due', function (t, el) { t.due = isISO(el.value) ? el.value : ''; });
  $('d-done').addEventListener('change', function () {
    var t = findTask(selectedId);
    if (t) { t.done = $('d-done').checked; save(); render(); }
  });
  $('d-list').addEventListener('change', function () {
    var t = findTask(selectedId);
    if (t) { t.listId = $('d-list').value; save(); render(); }
  });
  $('d-text').addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
  $('d-text').addEventListener('blur', function () { var t = findTask(selectedId); if (t) $('d-text').value = t.text; });
  $('d-delete').addEventListener('click', function () { if (selectedId) deleteTask(selectedId); });

  // ---------- Undo toast ----------
  $('toast-undo').addEventListener('click', function () {
    if (!undo) return;
    undo();
    undo = null;
    save();
    render();
    $('toast').hidden = true;
  });
  function showToast(text, restore) {
    undo = restore;
    $('toast-text').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('toast').hidden = true; undo = null; }, 6000);
  }

  // ---------- Render ----------
  var ICON_DELETE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_NOTE = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>';

  function renderLists() {
    var nav = $('list-nav');
    nav.innerHTML = '';
    state.lists.forEach(function (l) {
      var left = state.tasks.filter(function (t) { return t.listId === l.id && !t.done; }).length;
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.id = l.id;
      b.setAttribute('aria-current', String(l.id === state.current));
      var name = document.createElement('span');
      name.textContent = l.name;
      var n = document.createElement('span');
      n.className = 'n';
      n.textContent = left || '';
      n.setAttribute('aria-label', left + ' to do');
      b.appendChild(name);
      b.appendChild(n);
      li.appendChild(b);
      nav.appendChild(li);
    });
    // Phones only: a "New list" chip at the end of the row (the header button is hidden there).
    var addLi = document.createElement('li');
    addLi.className = 'add-chip';
    addLi.innerHTML = '<button type="button" data-new-list="1">+ New list</button>';
    nav.appendChild(addLi);
  }

  function renderTasks() {
    var inList = state.tasks.filter(function (t) { return t.listId === state.current; });
    var shown = inList.filter(function (t) { return filter === 'all' || (filter === 'done' ? t.done : !t.done); });
    listEl.innerHTML = '';
    shown.forEach(function (t) {
      var li = document.createElement('li');
      li.className = 'item' + (t.done ? ' is-done' : '') + (t.id === selectedId ? ' is-selected' : '');
      li.dataset.id = t.id;

      var check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'check';
      check.checked = t.done;
      check.setAttribute('aria-label', (t.done ? 'Mark as not done: ' : 'Mark as done: ') + t.text);

      var open = document.createElement('button');
      open.type = 'button';
      open.className = 'open';
      open.setAttribute('aria-label', 'Open details: ' + t.text);
      var text = document.createElement('span');
      text.className = 'text';
      text.textContent = t.text;
      var meta = document.createElement('span');
      meta.className = 'meta';
      if (t.due) {
        var d = dueLabel(t.due);
        var due = document.createElement('span');
        due.className = 'due ' + d.cls;
        due.textContent = d.text;
        meta.appendChild(due);
      }
      if (t.notes.trim()) {
        var note = document.createElement('span');
        note.innerHTML = ICON_NOTE;
        note.appendChild(document.createTextNode('Notes'));
        meta.appendChild(note);
      }
      open.appendChild(text);
      open.appendChild(meta);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'act';
      del.setAttribute('aria-label', 'Delete task');
      del.innerHTML = ICON_DELETE;

      li.appendChild(check);
      li.appendChild(open);
      li.appendChild(del);
      listEl.appendChild(li);
    });

    var left = inList.filter(function (t) { return !t.done; }).length;
    $('count').textContent = inList.length ? (left === 0 ? 'All done' : left + (left === 1 ? ' task left' : ' tasks left')) : '';
    var empty = $('empty');
    empty.hidden = shown.length > 0;
    empty.textContent = !inList.length ? 'No tasks in this list yet. Add one above.'
      : filter === 'done' ? 'Nothing done yet.' : 'Nothing left to do. Nice work.';
    $('list-foot').hidden = inList.length === left;
  }

  function renderDetails() {
    var t = selectedId ? findTask(selectedId) : null;
    if (!t) { selectedId = null; document.body.classList.remove('details-open'); }
    $('details-empty').hidden = !!t;
    $('details-body').hidden = !t;
    if (!t) return;
    var active = document.activeElement;
    if (active !== $('d-text')) $('d-text').value = t.text;
    if (active !== $('d-notes')) $('d-notes').value = t.notes;
    if (active !== $('d-due')) $('d-due').value = t.due;
    $('d-done').checked = t.done;
    var sel = $('d-list');
    sel.innerHTML = '';
    state.lists.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l.id;
      o.textContent = l.name;
      sel.appendChild(o);
    });
    sel.value = t.listId;
    $('d-created').textContent = 'Added ' + new Date(t.created).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function render() {
    renderLists();
    var list = findList(state.current);
    if (document.activeElement !== titleInput) titleInput.value = list.name;
    renderTasks();
    renderDetails();
  }

  $('today').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  render();
})();

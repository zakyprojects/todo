/**
 * ============================================================================
 * NOVA TODO &bull; FUTURISTIC SAAS PRODUCTIVITY DASHBOARD (V2 ENGINE)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     ENGINE 1: INTERACTIVE PARTICLE CANVAS (HOMEPAGE V2 SYNC)
     ========================================================================== */
  (function initParticleCanvas() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [], mouse = { x: null, y: null };
    let maxParticles, connectDistance;

    // Compute settings based on current viewport width
    function computeSettings() {
      const w = window.innerWidth;
      if (w <= 480) {         // small phones
        maxParticles = 30;
        connectDistance = 60;
      } else if (w <= 768) {  // tablets / large phones
        maxParticles = 60;
        connectDistance = 80;
      } else {                // desktops
        maxParticles = 100;
        connectDistance = 100;
      }
    }

    function init() {
      computeSettings();
      resize();
      particles = []; // reset array
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          index: i
        });
      }
      animate();
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', () => {
      init();
    });

    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        // move + bounce
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // draw point
        ctx.fillStyle = 'rgba(88,166,255,0.7)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // connect to peers
        for (let j = p.index + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < connectDistance) {
            ctx.strokeStyle = `rgba(88,166,255,${1 - dist / connectDistance})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // connect to mouse
        if (mouse.x !== null) {
          const dxm = p.x - mouse.x, dym = p.y - mouse.y;
          const distM = Math.hypot(dxm, dym);
          if (distM < connectDistance) {
            ctx.strokeStyle = `rgba(88,166,255,${1 - distM / connectDistance})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animate);
    }

    // Initialize particle simulation
    init();
  })();

  /* ==========================================================================
     ENGINE 2: ZERO-LATENCY CUSTOM CURSOR (HOMEPAGE V2 SYNC - 0.45 LERP)
     ========================================================================== */
  (function initCustomCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let isVisible = false;
    const lerpFactor = 0.45;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        ringX = mouseX;
        ringY = mouseY;
      }

      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    window.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
      isVisible = false;
    });

    window.addEventListener('mouseenter', () => {
      if (mouseX > 0 && mouseY > 0) {
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        isVisible = true;
      }
    });

    // Dynamic Hover expansion on interactive elements
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, .task-card, .nav-item, input, textarea, select, [role="button"], .custom-checkbox, .action-icon-btn, .color-chip, .icon-chip, .user-name-wrapper, .notes-indicator')) {
        ring.classList.add('cursor-hover');
        dot.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, .task-card, .nav-item, input, textarea, select, [role="button"], .custom-checkbox, .action-icon-btn, .color-chip, .icon-chip, .user-name-wrapper, .notes-indicator')) {
        ring.classList.remove('cursor-hover');
        dot.classList.remove('cursor-hover');
      }
    });

    // Smooth RAF Lerp loop for trailing ring
    function renderCursor() {
      if (isVisible) {
        ringX += (mouseX - ringX) * lerpFactor;
        ringY += (mouseY - ringY) * lerpFactor;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(renderCursor);
    }

    requestAnimationFrame(renderCursor);
  })();

  /* ==========================================================================
     ENGINE 3: CORE STATE MANAGEMENT & DASHBOARD LOGIC
     ========================================================================== */

  // --- Storage Keys ---
  const STORAGE_KEYS = {
    TASKS: 'nova_todo_tasks_v2',
    LISTS: 'nova_todo_lists_v2',
    USER: 'nova_todo_user_v2',
    USERNAME: 'todo_username',
    LEGACY_TASKS: 'todoTasks',
    LEGACY_USER: 'todoUsername'
  };

  // --- Default Seed Data ---
  const DEFAULT_LISTS = [
    { id: 'inbox', name: 'Inbox', icon: '📥', color: '#58a6ff' },
    { id: 'work', name: 'Work / Architecture', icon: '🚀', color: '#bc8cff' },
    { id: 'design', name: 'Design System', icon: '🎨', color: '#39c5bb' },
    { id: 'personal', name: 'Personal Growth', icon: '💡', color: '#3fb950' }
  ];

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFutureDateString = (daysAhead = 3) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPastDateString = (daysAgo = 2) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const DEFAULT_TASKS = [
    {
      id: 'task-1',
      text: 'Finalize Zero-Latency 0.45 Lerp Cursor Engine and Particle Simulation',
      completed: true,
      important: true,
      dueDate: getTodayString(),
      notes: 'Ensure backdrop-filter blur and fine-pointer detection are calibrated for 120Hz displays.',
      listId: 'work',
      createdAt: Date.now() - 100000
    },
    {
      id: 'task-2',
      text: 'Refactor Glassmorphism Design Tokens to Match V2 System',
      completed: false,
      important: true,
      dueDate: getTodayString(),
      notes: 'Apply rgba(18, 23, 33, 0.65) with 14px blur and custom 1px border highlight gradients.',
      listId: 'design',
      createdAt: Date.now() - 80000
    },
    {
      id: 'task-3',
      text: 'Optimize GraphQL Query Batching and Schema Validation',
      completed: false,
      important: false,
      dueDate: getFutureDateString(4),
      notes: 'Review Apollo Client cache normalization and server latency metrics.',
      listId: 'work',
      createdAt: Date.now() - 60000
    },
    {
      id: 'task-4',
      text: 'Review Cloud Infrastructure Security Audit & IAM Roles',
      completed: false,
      important: false,
      dueDate: getPastDateString(1), // overdue sample
      notes: 'Verify least-privilege policies across all staging and production VPCs.',
      listId: 'work',
      createdAt: Date.now() - 40000
    },
    {
      id: 'task-5',
      text: 'Read Deep Learning Systems Research Paper (Attention Mechanisms)',
      completed: false,
      important: false,
      dueDate: null,
      notes: 'Analyze multi-head self-attention time complexities and matrix factorization.',
      listId: 'personal',
      createdAt: Date.now() - 20000
    }
  ];

  // --- State Variables ---
  let tasks = [];
  let customLists = [];
  let user = { name: 'Guest' };
  let currentFilter = 'all'; // 'all', 'important', 'planned', 'completed', or listId
  let searchQuery = '';
  let sortBy = 'created-desc';

  // --- DOM Elements Cache ---
  const el = {
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    toggleBtn: document.getElementById('toggleBtn'),
    mobileHelpBtn: document.getElementById('mobileHelpBtn'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    userNameDisplay: document.getElementById('userNameDisplay'),
    userNameInput: document.getElementById('userNameInput'),
    editUserNameBtn: document.getElementById('editUserNameBtn'),
    userRoleDisplay: document.getElementById('userRoleDisplay'),
    userRoleInput: document.getElementById('userRoleInput'),
    editUserRoleBtn: document.getElementById('editUserRoleBtn'),
    avatarInitials: document.getElementById('avatarInitials'),
    totalPendingCount: document.getElementById('totalPendingCount'),
    totalCompletedCount: document.getElementById('totalCompletedCount'),
    completionRate: document.getElementById('completionRate'),
    standardFilters: document.getElementById('standardFilters'),
    countAll: document.getElementById('countAll'),
    countImportant: document.getElementById('countImportant'),
    countPlanned: document.getElementById('countPlanned'),
    countCompleted: document.getElementById('countCompleted'),
    listContainer: document.getElementById('listContainer') || document.getElementById('customListsContainer'),
    customListsCount: document.getElementById('customListsCount'),
    newListBtn: document.getElementById('newListBtn') || document.getElementById('addListBtn'),
    helpBtn: document.getElementById('helpBtn'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),

    // Dashboard Header
    viewBadge: document.getElementById('viewBadge'),
    viewBadgeCategory: document.getElementById('viewBadgeCategory'),
    activeListTitle: document.getElementById('activeListTitle'),
    activeListDesc: document.getElementById('activeListDesc'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    sortSelect: document.getElementById('sortSelect'),

    // Progress
    progressSubtitle: document.getElementById('progressSubtitle'),
    progressCount: document.getElementById('progressCount'),
    progressPercentage: document.getElementById('progressPercentage'),
    progressBarFill: document.getElementById('progressBarFill'),

    // Task Stream
    tasksContainer: document.getElementById('tasksContainer'),
    emptyState: document.getElementById('emptyState'),
    completedSection: document.getElementById('completedSection'),
    completedToggle: document.getElementById('completedToggle'),
    completedPill: document.getElementById('completedPill'),
    completedTasksContainer: document.getElementById('completedTasksContainer'),

    // Floating Add Task Bar
    addTaskForm: document.getElementById('addTaskForm'),
    taskInput: document.getElementById('taskInput'),
    quickListSelect: document.getElementById('quickListSelect'),
    quickDueDate: document.getElementById('quickDueDate'),
    quickImportantBtn: document.getElementById('quickImportantBtn'),

    // Task Modal
    taskModal: document.getElementById('taskModal'),
    closeTaskModal: document.getElementById('closeTaskModal'),
    editTaskForm: document.getElementById('editTaskForm'),
    editTaskId: document.getElementById('editTaskId'),
    editTaskText: document.getElementById('editTaskText'),
    editTaskList: document.getElementById('editTaskList'),
    editTaskDueDate: document.getElementById('editTaskDueDate'),
    editTaskNotes: document.getElementById('editTaskNotes'),
    editTaskImportant: document.getElementById('editTaskImportant'),
    deleteTaskModalBtn: document.getElementById('deleteTaskModalBtn'),
    cancelTaskModalBtn: document.getElementById('cancelTaskModalBtn'),

    // List Modal
    listModal: document.getElementById('listModal'),
    listModalHeading: document.getElementById('listModalHeading'),
    closeListModal: document.getElementById('closeListModal'),
    customListForm: document.getElementById('customListForm'),
    editCustomListId: document.getElementById('editCustomListId'),
    customListName: document.getElementById('customListName'),
    iconSelectorGrid: document.getElementById('iconSelectorGrid'),
    colorSelectorGrid: document.getElementById('colorSelectorGrid'),
    saveListBtn: document.getElementById('saveListBtn'),
    cancelListModalBtn: document.getElementById('cancelListModalBtn'),

    // Help Modal
    helpModal: document.getElementById('helpModal'),
    closeHelpModal: document.getElementById('closeHelpModal'),
    helpCloseBtn: document.getElementById('helpCloseBtn')
  };

  // Quick form state
  let quickIsImportant = false;

  /* ==========================================================================
     DATA PERSISTENCE & MIGRATION
     ========================================================================== */

  function loadState() {
    // 1. Load User
    try {
      const directUsername = localStorage.getItem(STORAGE_KEYS.USERNAME) ?? localStorage.getItem(STORAGE_KEYS.LEGACY_USER);
      let loadedName = 'Guest';
      let loadedRole = 'PRO MEMBER';

      if (directUsername !== null && directUsername !== undefined && directUsername.trim() !== '') {
        loadedName = directUsername.trim();
      }

      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed.name === 'string' && parsed.name.trim() !== '') {
          loadedName = parsed.name.trim();
        }
        if (parsed && typeof parsed.role === 'string' && parsed.role.trim() !== '') {
          loadedRole = parsed.role.trim();
        }
      }

      user = { name: loadedName, role: loadedRole };
    } catch (e) {
      console.warn('Failed to parse user profile:', e);
      user = { name: 'Guest', role: 'PRO MEMBER' };
    }
    updateUserDisplay();

    // 2. Load Custom Lists
    try {
      const savedLists = localStorage.getItem(STORAGE_KEYS.LISTS);
      if (savedLists) {
        const parsed = JSON.parse(savedLists);
        if (Array.isArray(parsed) && parsed.length > 0) {
          customLists = parsed;
        } else {
          customLists = [...DEFAULT_LISTS];
          saveLists();
        }
      } else {
        customLists = [...DEFAULT_LISTS];
        saveLists();
      }
    } catch (e) {
      console.warn('Failed to parse custom lists:', e);
      customLists = [...DEFAULT_LISTS];
      saveLists();
    }

    // 3. Load Tasks & Legacy Migration
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (savedTasks) {
        tasks = JSON.parse(savedTasks);
      } else {
        // Check for legacy format
        const legacyTasksData = localStorage.getItem(STORAGE_KEYS.LEGACY_TASKS);
        if (legacyTasksData) {
          tasks = migrateLegacyTasks(JSON.parse(legacyTasksData));
          saveTasks();
        } else {
          tasks = [...DEFAULT_TASKS];
          saveTasks();
        }
      }
    } catch (e) {
      console.warn('Failed to parse tasks:', e);
      tasks = [...DEFAULT_TASKS];
    }

    populateListDropdowns();
  }

  function migrateLegacyTasks(legacyData) {
    const migrated = [];
    if (typeof legacyData !== 'object' || legacyData === null) return [...DEFAULT_TASKS];

    Object.keys(legacyData).forEach(listKey => {
      const listObj = legacyData[listKey];
      if (!listObj) return;

      let matchedListId = 'inbox';
      const foundList = customLists.find(l => l.name.toLowerCase() === listKey.toLowerCase());
      if (foundList) {
        matchedListId = foundList.id;
      } else if (listKey !== 'All' && listKey !== 'Important' && listKey !== 'Planned') {
        const newListId = 'list_' + Date.now() + Math.random().toString(36).substr(2, 4);
        customLists.push({ id: newListId, name: listKey, icon: '📁', color: '#58a6ff' });
        matchedListId = newListId;
      }

      if (Array.isArray(listObj.active)) {
        listObj.active.forEach(item => {
          migrated.push({
            id: 'legacy_' + Math.random().toString(36).substr(2, 9),
            text: item.text || 'Untitled Task',
            completed: false,
            important: listKey === 'Important',
            dueDate: item.dueDate || null,
            notes: item.notes || '',
            listId: matchedListId,
            createdAt: Date.now()
          });
        });
      }

      if (Array.isArray(listObj.completed)) {
        listObj.completed.forEach(item => {
          migrated.push({
            id: 'legacy_' + Math.random().toString(36).substr(2, 9),
            text: item.text || 'Untitled Task',
            completed: true,
            important: listKey === 'Important',
            dueDate: item.dueDate || null,
            notes: item.notes || '',
            listId: matchedListId,
            createdAt: Date.now()
          });
        });
      }
    });

    saveLists();
    return migrated.length > 0 ? migrated : [...DEFAULT_TASKS];
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    render();
  }

  function saveLists() {
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(customLists));
    populateListDropdowns();
    renderCustomLists();
    render();
  }

  function saveUser() {
    const validName = (user && typeof user.name === 'string' && user.name.trim() !== '') ? user.name.trim() : 'Guest';
    const validRole = (user && typeof user.role === 'string' && user.role.trim() !== '') ? user.role.trim() : 'PRO MEMBER';
    user.name = validName;
    user.role = validRole;
    localStorage.setItem(STORAGE_KEYS.USERNAME, validName);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    updateUserDisplay();
  }

  function updateUserDisplay() {
    const displayName = (user && typeof user.name === 'string' && user.name.trim() !== '') ? user.name.trim() : 'Guest';
    const displayRole = (user && typeof user.role === 'string' && user.role.trim() !== '') ? user.role.trim() : 'PRO MEMBER';

    if (el.userNameDisplay) el.userNameDisplay.textContent = displayName;
    if (el.userNameInput) el.userNameInput.value = displayName;
    if (el.userRoleDisplay) el.userRoleDisplay.textContent = displayRole;
    if (el.userRoleInput) el.userRoleInput.value = displayRole;

    // Calculate avatar initials
    if (el.avatarInitials) {
      const parts = displayName.trim().split(/\s+/).filter(Boolean);
      let initials = 'G';
      if (parts.length > 1) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.length === 1 && parts[0].length >= 2) {
        initials = parts[0].slice(0, 2).toUpperCase();
      } else if (parts.length === 1 && parts[0].length === 1) {
        initials = parts[0].toUpperCase();
      }
      el.avatarInitials.textContent = initials || 'G';
    }
  }

  /* ==========================================================================
     POPULATING SELECTORS & CUSTOM LISTS
     ========================================================================== */

  function populateListDropdowns() {
    if (el.quickListSelect) {
      el.quickListSelect.innerHTML = customLists.map(l => 
        `<option value="${l.id}">${l.icon} ${escapeHtml(l.name)}</option>`
      ).join('');
    }

    if (el.editTaskList) {
      el.editTaskList.innerHTML = customLists.map(l => 
        `<option value="${l.id}">${l.icon} ${escapeHtml(l.name)}</option>`
      ).join('');
    }
  }

  function renderCustomLists() {
    const container = el.listContainer || document.getElementById('listContainer') || document.getElementById('customListsContainer') || document.querySelector('.scrollable-lists');
    if (!container) return;
    el.listContainer = container;
    container.innerHTML = '';

    if (el.customListsCount) {
      el.customListsCount.textContent = customLists ? customLists.length : 0;
    }

    if (!customLists || customLists.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'custom-lists-empty';
      emptyDiv.innerHTML = `
        <span class="empty-lists-icon">📁</span>
        <span class="empty-lists-text">No custom lists yet</span>
        <button type="button" class="empty-lists-add-btn" id="emptyListsAddBtn">+ Add List</button>
      `;
      container.appendChild(emptyDiv);

      const addBtn = emptyDiv.querySelector('#emptyListsAddBtn');
      if (addBtn) {
        addBtn.addEventListener('click', openCreateListModal);
      }
      return;
    }

    customLists.forEach(list => {
      const count = tasks.filter(t => t.listId === list.id && !t.completed).length;
      const li = document.createElement('li');
      const isActive = currentFilter === list.id;
      li.className = `nav-item custom-list-item ${isActive ? 'active' : ''}`;
      li.dataset.filter = list.id;
      li.style.setProperty('--list-color', list.color || '#58a6ff');

      const isInbox = list.id === 'inbox';

      li.innerHTML = `
        <div class="nav-item-left">
          <span class="list-color-dot" style="background-color: ${list.color || '#58a6ff'}; box-shadow: 0 0 8px ${list.color || '#58a6ff'};"></span>
          <span class="nav-icon">${list.icon || '📁'}</span>
          <span class="nav-label" title="${escapeHtml(list.name)}">${escapeHtml(list.name)}</span>
        </div>
        <div class="nav-item-right">
          <span class="nav-count">${count}</span>
          <div class="list-actions">
            <button type="button" class="list-action-btn edit-list-btn" title="Edit List" data-edit-list="${list.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            ${!isInbox ? `
              <button type="button" class="list-action-btn delete-list-btn" title="Delete List" data-delete-list="${list.id}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>
      `;

      container.appendChild(li);
    });
  }

  /* ==========================================================================
     TASK FILTERING, SORTING & RENDERING
     ========================================================================== */

  function getFilteredTasks() {
    const today = getTodayString();

    return tasks.filter(task => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = task.text.toLowerCase().includes(query);
        const matchesNotes = task.notes && task.notes.toLowerCase().includes(query);
        if (!matchesText && !matchesNotes) return false;
      }

      // 2. View / List Filter
      if (currentFilter === 'all') {
        return true;
      } else if (currentFilter === 'important') {
        return task.important === true;
      } else if (currentFilter === 'planned') {
        return task.dueDate !== null && task.dueDate !== undefined && String(task.dueDate).trim() !== '';
      } else if (currentFilter === 'completed') {
        return task.completed === true;
      } else {
        // Specific custom list ID
        return task.listId === currentFilter;
      }
    });
  }

  function sortTaskList(list) {
    return [...list].sort((a, b) => {
      if (sortBy === 'created-desc') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (sortBy === 'created-asc') {
        return (a.createdAt || 0) - (b.createdAt || 0);
      } else if (sortBy === 'due-asc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      } else if (sortBy === 'priority') {
        if (a.important === b.important) return (b.createdAt || 0) - (a.createdAt || 0);
        return a.important ? -1 : 1;
      } else if (sortBy === 'alphabetical') {
        return a.text.localeCompare(b.text);
      }
      return 0;
    });
  }

  function updateSidebarCounters() {
    const totalPending = tasks.filter(t => !t.completed).length;
    const totalCompleted = tasks.filter(t => t.completed).length;
    const totalAll = tasks.length;
    const rate = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;

    if (el.totalPendingCount) el.totalPendingCount.textContent = totalPending;
    if (el.totalCompletedCount) el.totalCompletedCount.textContent = totalCompleted;
    if (el.completionRate) el.completionRate.textContent = `${rate}%`;

    if (el.countAll) el.countAll.textContent = totalPending;
    if (el.countImportant) el.countImportant.textContent = tasks.filter(t => t.important && !t.completed).length;
    if (el.countPlanned) el.countPlanned.textContent = tasks.filter(t => t.dueDate && String(t.dueDate).trim() !== '' && !t.completed).length;
    if (el.countCompleted) el.countCompleted.textContent = totalCompleted;

    // Highlight active item in sidebar standard views
    document.querySelectorAll('#standardFilters .nav-item').forEach(item => {
      if (item.dataset.filter === currentFilter) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function updateHeaderInfo() {
    let titleHtml = 'All <span class="title-accent">Tasks</span>';
    let category = 'ALL TASKS';
    let desc = 'Manage, schedule, and execute your high-priority roadmap.';

    if (currentFilter === 'important') {
      titleHtml = 'Important <span class="title-accent">Priority</span>';
      category = 'CRITICAL FOCUS';
      desc = 'High-leverage objectives requiring immediate execution and attention.';
    } else if (currentFilter === 'planned') {
      titleHtml = 'Planned <span class="title-accent">Roadmap</span>';
      category = 'SCHEDULED';
      desc = 'Time-sensitive tasks mapped to specific target completion deadlines.';
    } else if (currentFilter === 'completed') {
      titleHtml = 'Completed <span class="title-accent">Archive</span>';
      category = 'LOGGED HISTORY';
      desc = 'Comprehensive record of completed tasks and milestone achievements.';
    } else {
      const custom = customLists.find(l => l.id === currentFilter);
      if (custom) {
        titleHtml = `${escapeHtml(custom.name)} <span class="title-accent">Workspace</span>`;
        category = `${custom.icon} CUSTOM LIST`;
        desc = `Specialized task environment for ${escapeHtml(custom.name)}.`;
      }
    }

    if (el.viewBadgeCategory) el.viewBadgeCategory.textContent = category;
    if (el.activeListTitle) el.activeListTitle.innerHTML = titleHtml;
    if (el.activeListDesc) el.activeListDesc.textContent = desc;
  }

  function updateProgressBar(filtered) {
    const total = filtered.length;
    const completed = filtered.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : (currentFilter === 'completed' && total > 0 ? 100 : 0);

    if (el.progressBarFill) el.progressBarFill.style.width = `${pct}%`;
    if (el.progressPercentage) el.progressPercentage.textContent = `${pct}%`;
    if (el.progressCount) el.progressCount.textContent = `${completed} of ${total} completed`;

    if (el.progressSubtitle) {
      if (total === 0) {
        el.progressSubtitle.textContent = 'Workspace clear. Ready for new inputs.';
      } else if (pct === 100) {
        el.progressSubtitle.textContent = '⚡ Peak Velocity: 100% of tasks completed!';
      } else if (pct >= 50) {
        el.progressSubtitle.textContent = '🚀 Strong momentum: over halfway through target.';
      } else {
        el.progressSubtitle.textContent = 'Sprint active. Focused execution in progress.';
      }
    }
  }

  function updateEmptyState() {
    if (!el.emptyState) return;
    const emptyTitleEl = el.emptyState.querySelector('.empty-title');
    const emptyDescEl = el.emptyState.querySelector('.empty-desc');
    const emptyIconEl = el.emptyState.querySelector('.empty-icon');

    if (searchQuery && searchQuery.trim()) {
      if (emptyIconEl) emptyIconEl.textContent = '🔍';
      if (emptyTitleEl) emptyTitleEl.textContent = 'No Matches Found';
      if (emptyDescEl) emptyDescEl.innerHTML = `No tasks match "<strong>${escapeHtml(searchQuery)}</strong>". Try adjusting your search query.`;
    } else if (currentFilter === 'planned') {
      if (emptyIconEl) emptyIconEl.textContent = '📅';
      if (emptyTitleEl) emptyTitleEl.textContent = 'No Planned Tasks';
      if (emptyDescEl) emptyDescEl.innerHTML = 'No planned tasks. Add a due date to any task to see it here.';
    } else if (currentFilter === 'important') {
      if (emptyIconEl) emptyIconEl.textContent = '⭐';
      if (emptyTitleEl) emptyTitleEl.textContent = 'No Important Tasks';
      if (emptyDescEl) emptyDescEl.innerHTML = 'No important tasks. Click the star icon on any task to mark it high priority.';
    } else if (currentFilter === 'completed') {
      if (emptyIconEl) emptyIconEl.textContent = '✅';
      if (emptyTitleEl) emptyTitleEl.textContent = 'No Completed Tasks';
      if (emptyDescEl) emptyDescEl.innerHTML = 'Completed tasks will be archived and shown here.';
    } else {
      if (emptyIconEl) emptyIconEl.textContent = '✨';
      if (emptyTitleEl) emptyTitleEl.textContent = 'All Systems Clear';
      if (emptyDescEl) emptyDescEl.innerHTML = `No tasks found matching this view. Press <kbd class="kbd-hint">Enter</kbd> or use the input below to create one.`;
    }
  }

  function render() {
    updateSidebarCounters();
    renderCustomLists();
    updateHeaderInfo();

    const filtered = getFilteredTasks();
    updateProgressBar(filtered);

    const activeTasks = sortTaskList(filtered.filter(t => !t.completed));
    const completedTasks = sortTaskList(filtered.filter(t => t.completed));

    // Render Active Tasks
    el.tasksContainer.innerHTML = '';
    if (activeTasks.length > 0) {
      activeTasks.forEach((task, index) => {
        el.tasksContainer.appendChild(createTaskCard(task, index));
      });
      el.emptyState.style.display = 'none';
    } else if (completedTasks.length === 0 || (currentFilter === 'completed' && completedTasks.length === 0)) {
      updateEmptyState();
      el.emptyState.style.display = 'flex';
    } else if (currentFilter !== 'completed' && activeTasks.length === 0 && completedTasks.length > 0) {
      updateEmptyState();
      el.emptyState.style.display = 'none';
    } else {
      updateEmptyState();
      el.emptyState.style.display = 'none';
    }

    // Render Completed Section
    if (completedTasks.length > 0 && currentFilter !== 'completed') {
      el.completedSection.style.display = 'flex';
      el.completedPill.textContent = completedTasks.length;
      el.completedTasksContainer.innerHTML = '';
      completedTasks.forEach((task, index) => {
        el.completedTasksContainer.appendChild(createTaskCard(task, index + activeTasks.length));
      });
    } else if (currentFilter === 'completed' && completedTasks.length > 0) {
      // In completed view, render them in main container
      el.completedSection.style.display = 'none';
      completedTasks.forEach((task, index) => {
        el.tasksContainer.appendChild(createTaskCard(task, index));
      });
    } else {
      el.completedSection.style.display = 'none';
    }
  }

  /* ==========================================================================
     CREATE TASK CARD COMPONENT
     ========================================================================== */

  function createTaskCard(task, index) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'completed' : ''}`;
    card.dataset.taskId = task.id;
    card.style.setProperty('--item-index', index);

    // List badge info
    const parentList = customLists.find(l => l.id === task.listId) || { name: 'Inbox', icon: '📥', color: '#58a6ff' };

    // Due Date calculation & state
    let dueDateHtml = '';
    if (task.dueDate) {
      const today = getTodayString();
      let dueClass = '';
      let dueLabel = task.dueDate;

      if (!task.completed) {
        if (task.dueDate < today) {
          dueClass = 'due-overdue';
          dueLabel = `⚠️ Overdue (${task.dueDate})`;
        } else if (task.dueDate === today) {
          dueClass = 'due-today';
          dueLabel = `🔥 Due Today`;
        } else {
          dueLabel = `📅 ${task.dueDate}`;
        }
      } else {
        dueLabel = `📅 ${task.dueDate}`;
      }

      dueDateHtml = `<span class="task-badge due-badge ${dueClass}" title="Due Date">${dueLabel}</span>`;
    }

    // Notes indicator
    const notesHtml = (task.notes && task.notes.trim())
      ? `<span class="task-badge notes-indicator" title="View Notes" data-action="notes">📝 Notes</span>`
      : '';

    card.innerHTML = `
      <div class="custom-checkbox" data-action="toggle-complete" title="${task.completed ? 'Mark as active' : 'Mark as completed'}">
        <svg class="checkbox-svg" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <div class="task-content">
        <div class="task-title" title="Double click to edit details">${escapeHtml(task.text)}</div>
        <div class="task-meta">
          <span class="task-badge" style="border-color: ${parentList.color}40; color: ${parentList.color};">
            ${parentList.icon} ${escapeHtml(parentList.name)}
          </span>
          ${dueDateHtml}
          ${notesHtml}
        </div>
      </div>

      <div class="task-actions">
        <button class="action-icon-btn ${task.important ? 'star-active' : ''}" data-action="toggle-important" title="${task.important ? 'Remove priority' : 'Mark high priority'}">
          ${task.important ? '★' : '☆'}
        </button>
        <button class="action-icon-btn" data-action="edit" title="Edit Task Details">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="action-icon-btn btn-delete" data-action="delete" title="Delete Task">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    return card;
  }

  /* ==========================================================================
     INTERACTIONS & EVENT DELEGATION
     ========================================================================== */

  // Task Stream delegation (Complete, Important, Edit, Delete, Notes)
  document.getElementById('taskStream').addEventListener('click', (e) => {
    const card = e.target.closest('.task-card');
    if (!card) return;
    const taskId = card.dataset.taskId;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;

    if (action === 'toggle-complete') {
      tasks[taskIndex].completed = !tasks[taskIndex].completed;
      saveTasks();
    } else if (action === 'toggle-important') {
      tasks[taskIndex].important = !tasks[taskIndex].important;
      saveTasks();
    } else if (action === 'edit' || action === 'notes') {
      openTaskModal(tasks[taskIndex]);
    } else if (action === 'delete') {
      deleteTaskWithAnimation(card, taskId);
    }
  });

  // Double click task to open editor
  document.getElementById('taskStream').addEventListener('dblclick', (e) => {
    const card = e.target.closest('.task-card');
    if (!card) return;
    const taskId = card.dataset.taskId;
    const task = tasks.find(t => t.id === taskId);
    if (task) openTaskModal(task);
  });

  function deleteTaskWithAnimation(cardElement, taskId) {
    cardElement.classList.add('task-deleting');
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== taskId);
      saveTasks();
    }, 320);
  }

  // Add Task Form Handler
  el.addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = el.taskInput.value.trim();
    if (!text) return;

    const selectedList = el.quickListSelect.value || (currentFilter !== 'all' && currentFilter !== 'important' && currentFilter !== 'planned' && currentFilter !== 'completed' ? currentFilter : 'inbox');
    const dueDate = el.quickDueDate.value || null;

    const newTask = {
      id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 4),
      text: text,
      completed: false,
      important: quickIsImportant || currentFilter === 'important',
      dueDate: dueDate,
      notes: '',
      listId: selectedList,
      createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks();

    // Reset Form
    el.taskInput.value = '';
    el.quickDueDate.value = '';
    quickIsImportant = false;
    el.quickImportantBtn.classList.remove('active');
    el.quickImportantBtn.innerHTML = '<span class="star-icon">☆</span>';
  });

  // Quick Important Toggle
  el.quickImportantBtn.addEventListener('click', () => {
    quickIsImportant = !quickIsImportant;
    el.quickImportantBtn.classList.toggle('active', quickIsImportant);
    el.quickImportantBtn.innerHTML = quickIsImportant
      ? '<span class="star-icon" style="color: #ffdf5d;">★</span>'
      : '<span class="star-icon">☆</span>';
  });

  // Navigation Filter Click Handlers
  el.standardFilters.addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (!item) return;
    currentFilter = item.dataset.filter;
    render();
    closeMobileSidebar();
  });

  el.listContainer.addEventListener('click', (e) => {
    // Edit list button clicked
    const editBtn = e.target.closest('[data-edit-list]');
    if (editBtn) {
      e.stopPropagation();
      const listId = editBtn.dataset.editList;
      const targetList = customLists.find(l => l.id === listId);
      if (targetList) openEditListModal(targetList);
      return;
    }

    // Delete list button clicked
    const delBtn = e.target.closest('[data-delete-list]');
    if (delBtn) {
      e.stopPropagation();
      const listId = delBtn.dataset.deleteList;
      deleteCustomList(listId);
      return;
    }

    const item = e.target.closest('.nav-item');
    if (!item) return;
    currentFilter = item.dataset.filter;
    if (el.quickListSelect && customLists.some(l => l.id === currentFilter)) {
      el.quickListSelect.value = currentFilter;
    }
    render();
    closeMobileSidebar();
  });

  // Double click custom list to edit (Desktop)
  el.listContainer.addEventListener('dblclick', (e) => {
    const item = e.target.closest('.custom-list-item');
    if (!item) return;
    const listId = item.dataset.filter;
    const targetList = customLists.find(l => l.id === listId);
    if (targetList) openEditListModal(targetList);
  });

  // Long-press custom list to edit (Mobile Touch)
  let touchTimer = null;
  let touchMoved = false;

  el.listContainer.addEventListener('touchstart', (e) => {
    // If tapping action button, let click handler take care of it
    if (e.target.closest('.list-action-btn')) return;
    const item = e.target.closest('.custom-list-item');
    if (!item) return;

    touchMoved = false;
    const listId = item.dataset.filter;
    const targetList = customLists.find(l => l.id === listId);
    if (!targetList) return;

    touchTimer = setTimeout(() => {
      if (!touchMoved) {
        if (navigator.vibrate) navigator.vibrate(40);
        openEditListModal(targetList);
      }
    }, 550);
  }, { passive: true });

  el.listContainer.addEventListener('touchmove', () => {
    touchMoved = true;
    if (touchTimer) clearTimeout(touchTimer);
  }, { passive: true });

  el.listContainer.addEventListener('touchend', () => {
    if (touchTimer) clearTimeout(touchTimer);
  });

  function deleteCustomList(listId) {
    const targetList = customLists.find(l => l.id === listId);
    if (!targetList) return;

    if (confirm(`Delete the list "${targetList.name}"? Tasks inside will be moved to Inbox.`)) {
      tasks.forEach(t => {
        if (t.listId === listId) t.listId = 'inbox';
      });
      customLists = customLists.filter(l => l.id !== listId);
      if (currentFilter === listId) currentFilter = 'all';
      saveLists();
      saveTasks();
    }
  }

  // Clear Completed Tasks Action
  el.clearCompletedBtn.addEventListener('click', () => {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      alert('No completed tasks to clear.');
      return;
    }

    if (confirm(`Permanently remove all ${completedCount} completed tasks?`)) {
      tasks = tasks.filter(t => !t.completed);
      saveTasks();
    }
  });

  // Completed Accordion Toggle
  el.completedToggle.addEventListener('click', () => {
    const isCollapsed = el.completedTasksContainer.classList.toggle('collapsed');
    el.completedToggle.classList.toggle('collapsed', isCollapsed);
  });

  // Search Input Handlers
  el.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    el.clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    render();
  });

  el.clearSearchBtn.addEventListener('click', () => {
    el.searchInput.value = '';
    searchQuery = '';
    el.clearSearchBtn.style.display = 'none';
    render();
    el.searchInput.focus();
  });

  // Sort Selection Handler
  el.sortSelect.addEventListener('change', (e) => {
    sortBy = e.target.value;
    render();
  });

  // User Profile Name Editing
  let isEditingUserName = false;

  if (el.editUserNameBtn) {
    el.editUserNameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      enableUserNameEdit();
    });
  }

  if (el.userNameDisplay) {
    el.userNameDisplay.addEventListener('dblclick', enableUserNameEdit);
    if (el.userNameDisplay.parentElement) {
      el.userNameDisplay.parentElement.addEventListener('dblclick', enableUserNameEdit);
    }
  }

  function enableUserNameEdit() {
    if (isEditingUserName) return;
    isEditingUserName = true;
    const currentName = (user && typeof user.name === 'string' && user.name.trim() !== '') ? user.name.trim() : 'Guest';
    if (el.userNameInput) {
      el.userNameInput.value = currentName;
      el.userNameInput.style.display = 'block';
      el.userNameInput.focus();
      el.userNameInput.select();
    }
    if (el.userNameDisplay) {
      el.userNameDisplay.style.display = 'none';
    }
  }

  function finishUserNameEdit() {
    if (!isEditingUserName) return;
    isEditingUserName = false;

    let newName = el.userNameInput ? el.userNameInput.value.trim() : '';
    if (!newName || newName.length === 0) {
      newName = 'Guest';
    }

    user.name = newName;
    saveUser();

    if (el.userNameInput) {
      el.userNameInput.value = newName;
      el.userNameInput.style.display = 'none';
    }
    if (el.userNameDisplay) {
      el.userNameDisplay.style.display = 'block';
    }
  }

  if (el.userNameInput) {
    el.userNameInput.addEventListener('blur', finishUserNameEdit);
    el.userNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishUserNameEdit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        const currentName = (user && typeof user.name === 'string' && user.name.trim() !== '') ? user.name.trim() : 'Guest';
        el.userNameInput.value = currentName;
        finishUserNameEdit();
      }
    });
  }

  // User Profile Role/Badge Editing
  let isEditingUserRole = false;

  if (el.editUserRoleBtn) {
    el.editUserRoleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      enableUserRoleEdit();
    });
  }

  if (el.userRoleDisplay) {
    el.userRoleDisplay.addEventListener('dblclick', enableUserRoleEdit);
    if (el.userRoleDisplay.parentElement) {
      el.userRoleDisplay.parentElement.addEventListener('dblclick', enableUserRoleEdit);
    }
  }

  function enableUserRoleEdit() {
    if (isEditingUserRole) return;
    isEditingUserRole = true;
    const currentRole = (user && typeof user.role === 'string' && user.role.trim() !== '') ? user.role.trim() : 'PRO MEMBER';
    if (el.userRoleInput) {
      el.userRoleInput.value = currentRole;
      el.userRoleInput.style.display = 'inline-block';
      el.userRoleInput.focus();
      el.userRoleInput.select();
    }
    if (el.userRoleDisplay) {
      el.userRoleDisplay.style.display = 'none';
    }
  }

  function finishUserRoleEdit() {
    if (!isEditingUserRole) return;
    isEditingUserRole = false;

    let newRole = el.userRoleInput ? el.userRoleInput.value.trim() : '';
    if (!newRole || newRole.length === 0) {
      newRole = 'PRO MEMBER';
    }

    user.role = newRole.toUpperCase();
    saveUser();

    if (el.userRoleInput) {
      el.userRoleInput.value = user.role;
      el.userRoleInput.style.display = 'none';
    }
    if (el.userRoleDisplay) {
      el.userRoleDisplay.style.display = 'inline-block';
    }
  }

  if (el.userRoleInput) {
    el.userRoleInput.addEventListener('blur', finishUserRoleEdit);
    el.userRoleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishUserRoleEdit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        const currentRole = (user && typeof user.role === 'string' && user.role.trim() !== '') ? user.role.trim() : 'PRO MEMBER';
        el.userRoleInput.value = currentRole;
        finishUserRoleEdit();
      }
    });
  }

  // Mobile Drawer Toggle Handlers
  el.toggleBtn.addEventListener('click', () => {
    el.sidebar.classList.toggle('open');
    el.sidebarBackdrop.classList.toggle('active');
  });

  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
  }

  el.sidebarBackdrop.addEventListener('click', closeMobileSidebar);

  function closeMobileSidebar() {
    el.sidebar.classList.remove('open');
    el.sidebarBackdrop.classList.remove('active');
  }

  /* ==========================================================================
     MODALS: TASK MODAL, LIST MODAL, HELP MODAL
     ========================================================================== */

  // 1. Task Modal
  function openTaskModal(task) {
    el.editTaskId.value = task.id;
    el.editTaskText.value = task.text;
    el.editTaskList.value = task.listId;
    el.editTaskDueDate.value = task.dueDate || '';
    el.editTaskNotes.value = task.notes || '';
    el.editTaskImportant.checked = task.important === true;

    el.taskModal.style.display = 'flex';
    setTimeout(() => el.editTaskText.focus(), 50);
  }

  function closeTaskModal() {
    el.taskModal.style.display = 'none';
  }

  el.closeTaskModal.addEventListener('click', closeTaskModal);
  el.cancelTaskModalBtn.addEventListener('click', closeTaskModal);

  el.editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskId = el.editTaskId.value;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    tasks[taskIndex].text = el.editTaskText.value.trim() || 'Untitled Task';
    tasks[taskIndex].listId = el.editTaskList.value;
    tasks[taskIndex].dueDate = el.editTaskDueDate.value || null;
    tasks[taskIndex].notes = el.editTaskNotes.value.trim();
    tasks[taskIndex].important = el.editTaskImportant.checked;

    saveTasks();
    closeTaskModal();
  });

  el.deleteTaskModalBtn.addEventListener('click', () => {
    const taskId = el.editTaskId.value;
    if (confirm('Are you sure you want to delete this task?')) {
      tasks = tasks.filter(t => t.id !== taskId);
      saveTasks();
      closeTaskModal();
    }
  });

  // 2. Custom List Modal
  let selectedListIcon = '📁';
  let selectedListColor = '#58a6ff';

  function openCreateListModal() {
    el.customListName.value = '';
    el.editCustomListId.value = '';
    el.listModalHeading.textContent = 'Create Custom List';
    if (el.saveListBtn) el.saveListBtn.textContent = 'Create List';

    selectedListIcon = '📁';
    selectedListColor = '#58a6ff';

    document.querySelectorAll('#iconSelectorGrid .icon-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.icon === '📁');
    });
    document.querySelectorAll('#colorSelectorGrid .color-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.color === '#58a6ff');
    });

    el.listModal.style.display = 'flex';
    setTimeout(() => el.customListName.focus(), 50);
  }

  function openEditListModal(list) {
    if (!list) return;
    el.customListName.value = list.name;
    el.editCustomListId.value = list.id;
    el.listModalHeading.textContent = `Edit "${list.name}"`;
    if (el.saveListBtn) el.saveListBtn.textContent = 'Save Changes';

    selectedListIcon = list.icon || '📁';
    selectedListColor = list.color || '#58a6ff';

    let iconMatched = false;
    document.querySelectorAll('#iconSelectorGrid .icon-chip').forEach(c => {
      const match = c.dataset.icon === selectedListIcon;
      c.classList.toggle('active', match);
      if (match) iconMatched = true;
    });
    if (!iconMatched) {
      const firstIcon = document.querySelector('#iconSelectorGrid .icon-chip');
      if (firstIcon) firstIcon.classList.add('active');
    }

    let colorMatched = false;
    document.querySelectorAll('#colorSelectorGrid .color-chip').forEach(c => {
      const match = c.dataset.color === selectedListColor;
      c.classList.toggle('active', match);
      if (match) colorMatched = true;
    });
    if (!colorMatched) {
      const firstColor = document.querySelector('#colorSelectorGrid .color-chip');
      if (firstColor) firstColor.classList.add('active');
    }

    el.listModal.style.display = 'flex';
    setTimeout(() => el.customListName.focus(), 50);
  }

  el.newListBtn.addEventListener('click', openCreateListModal);

  function closeListModal() {
    el.listModal.style.display = 'none';
  }

  el.closeListModal.addEventListener('click', closeListModal);
  el.cancelListModalBtn.addEventListener('click', closeListModal);

  el.iconSelectorGrid.addEventListener('click', (e) => {
    const chip = e.target.closest('.icon-chip');
    if (!chip) return;
    document.querySelectorAll('.icon-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedListIcon = chip.dataset.icon;
  });

  el.colorSelectorGrid.addEventListener('click', (e) => {
    const chip = e.target.closest('.color-chip');
    if (!chip) return;
    document.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedListColor = chip.dataset.color;
  });

  el.customListForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.customListName.value.trim();
    if (!name) return;

    const editId = el.editCustomListId.value;
    if (editId) {
      // Edit mode
      const targetIndex = customLists.findIndex(l => l.id === editId);
      if (targetIndex !== -1) {
        customLists[targetIndex].name = name;
        customLists[targetIndex].icon = selectedListIcon;
        customLists[targetIndex].color = selectedListColor;
        saveLists();
      }
    } else {
      // Create mode
      const newList = {
        id: 'list_' + Date.now() + Math.random().toString(36).substr(2, 4),
        name: name,
        icon: selectedListIcon,
        color: selectedListColor
      };

      customLists.push(newList);
      currentFilter = newList.id;
      saveLists();
    }

    closeListModal();

    setTimeout(() => {
      if (el.listContainer) {
        const activeItem = el.listContainer.querySelector('.nav-item.active');
        if (activeItem) {
          activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 60);
  });

  // 3. Help Modal
  function openHelpModal() {
    el.helpModal.style.display = 'flex';
  }

  function closeHelpModal() {
    el.helpModal.style.display = 'none';
  }

  el.helpBtn.addEventListener('click', openHelpModal);
  el.mobileHelpBtn.addEventListener('click', openHelpModal);
  el.closeHelpModal.addEventListener('click', closeHelpModal);
  el.helpCloseBtn.addEventListener('click', closeHelpModal);

  // Close modals on clicking overlay backdrop
  [el.taskModal, el.listModal, el.helpModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  /* ==========================================================================
     GLOBAL KEYBOARD SHORTCUTS
     ========================================================================== */
  document.addEventListener('keydown', (e) => {
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

    // Escape closes all open modals / drawers
    if (e.key === 'Escape') {
      closeTaskModal();
      closeListModal();
      closeHelpModal();
      closeMobileSidebar();
      return;
    }

    // Ctrl + Enter in task editor modal saves
    if (el.taskModal.style.display === 'flex' && e.ctrlKey && e.key === 'Enter') {
      el.editTaskForm.requestSubmit();
      return;
    }

    // '/' or 'N' focuses add task input (when not actively typing)
    if (!isTyping) {
      if (e.key === '/' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        el.taskInput.focus();
      }
    }
  });

  /* ==========================================================================
     UTILITIES
     ========================================================================== */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Initial Bootstrap ---
  loadState();
  render();

});
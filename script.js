document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const toggleBtn = document.getElementById('toggleBtn');
    const sidebar = document.getElementById('sidebar');
    const usernameHeader = document.querySelector('#sidebar h1.bar');
    const newListBtn = document.getElementById('newList');
    const listContainer = document.getElementById('listContainer');
    const mainContent = document.querySelector('.main-content');
    const addTaskForm = document.querySelector('#addTask form');
    const addTaskContainer = document.getElementById('addTask');
    const taskInput = document.getElementById('taskInput');
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeModalBtn = document.querySelector('.close-modal');

    // --- State Management ---
    const saveData = () => {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
        localStorage.setItem('todoUsername', usernameHeader.textContent);
    };

    const loadData = () => {
        const savedTasks = localStorage.getItem('todoTasks');
        const savedUsername = localStorage.getItem('todoUsername');
        if (savedUsername) usernameHeader.textContent = savedUsername;
        if (savedTasks) return JSON.parse(savedTasks);
        
        return {
            "All": { active: [], completed: [] }, // "All" is now just a placeholder
            "Important": { active: [], completed: [] },
            "Planned": { 
                active: [{ text: "This is a planned task", dueDate: "", notes: "" }],
                completed: []
            }
        };
    };

    let tasks = loadData();
    let currentList = "All";
    const protectedLists = ["All", "Important", "Planned"];

    // --- RENDER FUNCTIONS ---
    const renderTasks = () => {
        mainContent.innerHTML = `<h1 class="main-heading">${currentList}</h1>`;
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'tasks-container';

        // Special logic for the "All" view
        if (currentList === "All") {
            addTaskContainer.style.display = 'none'; // Hide "Add Task" form
            let allActive = [];
            let allCompleted = [];

            // Aggregate tasks from all other lists
            Object.keys(tasks).forEach(listName => {
                if (listName !== "All") {
                    tasks[listName].active.forEach(task => allActive.push({ ...task, sourceList: listName }));
                    tasks[listName].completed.forEach(task => allCompleted.push({ ...task, sourceList: listName }));
                }
            });

            // Render aggregated lists
            if (allActive.length > 0) {
                allActive.forEach(task => tasksContainer.appendChild(createTaskElement(task, -1, false, task.sourceList)));
            } else {
                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = 'No active tasks across all lists!';
                emptyMessage.className = 'task-item-empty';
                tasksContainer.appendChild(emptyMessage);
            }
            if (allCompleted.length > 0) {
                const completedSection = document.createElement('div');
                completedSection.className = 'completed-section';
                const completedToggle = document.createElement('h3');
                completedToggle.className = 'completed-toggle';
                completedToggle.innerHTML = `<span>&#9662;</span> Completed (${allCompleted.length})`;
                const completedTasksContainer = document.createElement('div');
                completedTasksContainer.className = 'completed-tasks-container';
                allCompleted.forEach(task => completedTasksContainer.appendChild(createTaskElement(task, -1, true, task.sourceList)));
                completedSection.appendChild(completedToggle);
                completedSection.appendChild(completedTasksContainer);
                tasksContainer.appendChild(completedSection);
            }

        } else { // Logic for all other normal lists
            addTaskContainer.style.display = 'flex'; // Show "Add Task" form
            
            if (tasks[currentList].active.length > 0) {
                tasks[currentList].active.forEach((task, index) => {
                    tasksContainer.appendChild(createTaskElement(task, index, false));
                });
            } else {
                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = 'No active tasks. Add one below!';
                emptyMessage.className = 'task-item-empty';
                tasksContainer.appendChild(emptyMessage);
            }
            if (tasks[currentList].completed.length > 0) {
                const completedSection = document.createElement('div');
                completedSection.className = 'completed-section';
                const completedToggle = document.createElement('h3');
                completedToggle.className = 'completed-toggle';
                completedToggle.innerHTML = `<span>&#9662;</span> Completed (${tasks[currentList].completed.length})`;
                const completedTasksContainer = document.createElement('div');
                completedTasksContainer.className = 'completed-tasks-container';
                tasks[currentList].completed.forEach((task, index) => {
                    completedTasksContainer.appendChild(createTaskElement(task, index, true));
                });
                completedSection.appendChild(completedToggle);
                completedSection.appendChild(completedTasksContainer);
                tasksContainer.appendChild(completedSection);
            }
            // Only allow dragging in normal lists, not "All" view
            initDragAndDrop(tasksContainer, '.task-wrapper', reorderTasks);
        }

        mainContent.appendChild(tasksContainer);
    };

    function createTaskElement(task, index, isCompleted, sourceList = null) {
        const taskWrapper = document.createElement('div');
        const isDraggable = !isCompleted && !sourceList; // Not draggable if completed or in "All" view
        taskWrapper.className = `task-wrapper ${isDraggable ? 'draggable' : ''}`;
        taskWrapper.dataset.index = index;
        taskWrapper.dataset.type = isCompleted ? 'completed' : 'active';
        // Pass sourceList info for event handling if it exists
        if(sourceList) taskWrapper.dataset.sourceList = sourceList;
        taskWrapper.draggable = isDraggable;
        
        const taskContainer = document.createElement('div');
        taskContainer.className = 'task-item-container';
        if(isCompleted) taskContainer.classList.add('task-is-completed');

        if (task.dueDate && !isCompleted) {
            const today = new Date(); const dueDate = new Date(task.dueDate);
            today.setHours(0,0,0,0); dueDate.setHours(1,0,0,0);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 0) taskContainer.classList.add('overdue');
            else if (diffDays === 0) taskContainer.classList.add('due-today');
            else taskContainer.classList.add('due-future');
        }

        const tickIcon = document.createElement('span');
        tickIcon.className = 'tick-icon';
        tickIcon.innerHTML = isCompleted ? '&#10227;' : '&#10003;';
        
        const textWrapper = document.createElement('div');
        textWrapper.className = 'task-text-wrapper';
        const taskElement = document.createElement('p');
        taskElement.className = 'task-item-text';
        taskElement.textContent = task.text;
        textWrapper.appendChild(taskElement);

        // Add source list badge if in "All" view
        if (sourceList) {
            const sourceBadge = document.createElement('span');
            sourceBadge.className = 'task-source-badge';
            sourceBadge.textContent = sourceList;
            textWrapper.appendChild(sourceBadge);
        }
        
        taskContainer.appendChild(tickIcon);
        taskContainer.appendChild(textWrapper);

        if (isCompleted) {
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '&#128465;';
            taskContainer.appendChild(deleteBtn);
        } else {
            const taskActions = document.createElement('div');
            taskActions.className = 'task-actions';
            const notesBtn = document.createElement('span');
            notesBtn.className = 'notes-btn';
            notesBtn.innerHTML = '&#128221; Notes';
            taskActions.appendChild(notesBtn);
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';
            if (task.dueDate) {
                const dateTextSpan = document.createElement('span');
                dateTextSpan.className = 'due-date-text';
                const today = new Date(); const dueDate = new Date(task.dueDate);
                today.setHours(0,0,0,0); dueDate.setHours(1,0,0,0);
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                dateTextSpan.textContent = diffDays < 0 ? 'Overdue' : (diffDays === 0 ? 'Due Today' : `${diffDays} day${diffDays > 1 ? 's' : ''} left`);
                dateGroup.appendChild(dateTextSpan);
            }
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.className = 'due-date-picker';
            dateInput.value = task.dueDate || '';
            dateGroup.appendChild(dateInput);
            taskActions.appendChild(dateGroup);
            taskContainer.appendChild(taskActions);
        }
        
        const notesArea = document.createElement('div');
        notesArea.className = 'task-notes-area';
        const notesTextarea = document.createElement('textarea');
        notesTextarea.placeholder = 'Add your notes here...';
        notesTextarea.value = task.notes || '';
        notesArea.appendChild(notesTextarea);
        
        taskWrapper.appendChild(taskContainer);
        taskWrapper.appendChild(notesArea);
        return taskWrapper;
    }
    
    // All other functions like renderSidebar, handleRename, etc. remain the same,
    // but the main click handler needs to be updated.
    
    const renderSidebar = () => {
        listContainer.innerHTML = '';
        Object.keys(tasks).forEach(listName => {
            if (!protectedLists.includes(listName) && listName !== "All") { // Exclude "All" from user list section
                const listElement = document.createElement('li');
                listElement.textContent = listName;
                listElement.className = 'list-link draggable';
                listElement.draggable = true;
                listContainer.appendChild(listElement);
            }
        });
        initDragAndDrop(listContainer, '.list-link', reorderLists);
    };

    function initDragAndDrop(container, draggableSelector, onDropCallback) {
        // ... (This function remains unchanged)
    }

    function reorderTasks(draggedEl, newIndex) {
        // ... (This function remains unchanged)
    }

    function reorderLists(draggedEl, newIndex) {
        // ... (This function remains unchanged)
    }
    
    const handleRename = (element, originalText, isList = false) => {
        // ... (This function needs to be updated to handle the new data structure when renaming a task)
        const input = document.createElement('input');
        input.type = 'text'; input.value = originalText;
        if (element.classList.contains('main-heading')) input.className = 'h1-main-edit-input';
        else if (isList) input.className = 'list-edit-input';
        else input.className = 'task-edit-input';
        element.replaceWith(input);
        input.focus();
        const saveChanges = () => {
            const newText = input.value.trim();
            if (!newText || newText === originalText) { if (isList) renderSidebar(); renderTasks(); return; }
            if (isList) {
                if (tasks.hasOwnProperty(newText)) { alert('A list with this name already exists.'); renderSidebar(); } 
                else {
                    tasks[newText] = tasks[originalText];
                    delete tasks[originalText];
                    if (currentList === originalText) currentList = newText;
                    saveData(); renderSidebar(); renderTasks();
                }
            } else { // Renaming a task
                const taskWrapper = input.closest('.task-wrapper');
                const taskIndex = parseInt(taskWrapper.dataset.index);
                const taskType = taskWrapper.dataset.type;
                const sourceList = taskWrapper.dataset.sourceList || currentList;
                if (taskIndex > -1) {
                    tasks[sourceList][taskType][taskIndex].text = newText;
                    saveData();
                }
                renderTasks();
            }
        };
        input.addEventListener('blur', saveChanges);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') input.blur();
            else if (e.key === 'Escape') { input.value = originalText; input.blur(); }
        });
    };
    
    // ... (All other event listeners and functions need to be checked for compatibility)
    // The main click handler needs the biggest update
    mainContent.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('completed-toggle')) {
            const container = target.nextElementSibling;
            container.style.display = container.style.display === 'block' ? 'none' : 'block';
            target.querySelector('span').classList.toggle('rotated');
            return;
        }
        const taskWrapper = target.closest('.task-wrapper');
        if (!taskWrapper) return;

        const taskIndex = parseInt(taskWrapper.dataset.index);
        const taskType = taskWrapper.dataset.type;
        // If we're in the "All" view, use the sourceList to modify the correct list
        const listToModify = taskWrapper.dataset.sourceList || currentList;

        if (target.classList.contains('tick-icon')) {
            if(taskType === 'active') {
                const [taskToComplete] = tasks[listToModify].active.splice(taskIndex, 1);
                tasks[listToModify].completed.push(taskToComplete);
            } else { // 'completed'
                const [taskToRestore] = tasks[listToModify].completed.splice(taskIndex, 1);
                tasks[listToModify].active.push(taskToRestore);
            }
            saveData(); renderTasks();
        } else if (target.classList.contains('notes-btn')) {
            const notesArea = taskWrapper.querySelector('.task-notes-area');
            notesArea.style.display = notesArea.style.display === 'block' ? 'none' : 'block';
        } else if (target.classList.contains('delete-btn')) {
            if(confirm('Are you sure you want to permanently delete this task?')) {
                tasks[listToModify].completed.splice(taskIndex, 1);
                saveData();
                renderTasks();
            }
        }
    });

    mainContent.addEventListener('change', (e) => {
        const target = e.target; const taskWrapper = target.closest('.task-wrapper');
        if (!taskWrapper) return;
        const taskIndex = parseInt(taskWrapper.dataset.index);
        const taskType = taskWrapper.dataset.type;
        const listToModify = taskWrapper.dataset.sourceList || currentList;
        if (target.classList.contains('due-date-picker')) {
            tasks[listToModify][taskType][taskIndex].dueDate = target.value;
            saveData(); renderTasks();
        }
    });
    mainContent.addEventListener('input', (e) => {
        const target = e.target; const taskWrapper = target.closest('.task-wrapper');
        if (!taskWrapper) return;
        const taskIndex = parseInt(taskWrapper.dataset.index);
        const taskType = taskWrapper.dataset.type;
        const listToModify = taskWrapper.dataset.sourceList || currentList;
        if (target.tagName === 'TEXTAREA') {
            tasks[listToModify][taskType][taskIndex].notes = target.value;
            saveData();
        }
    });

    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTaskText = taskInput.value.trim();
        if (newTaskText !== "" && currentList !== "All") { // Prevent adding to "All"
            tasks[currentList].active.push({ text: newTaskText, dueDate: "", notes: "" });
            taskInput.value = "";
            saveData(); renderTasks();
        }
    });
    
    // (The rest of the file remains the same)
    // ...
    let lastTap = 0;
    const handleDoubleClick = (e) => {
        const target = e.target;
        if (e.type === 'dblclick') { triggerRename(target); return; }
        if (e.type === 'touchend' && !document.querySelector('.dragging')) {
            const currentTime = new Date().getTime();
            if (currentTime - lastTap < 300) { e.preventDefault(); triggerRename(target); }
            lastTap = currentTime;
        }
    };
    const triggerRename = (target) => {
        if (target === usernameHeader) renameUsername(target);
        else if (target.classList.contains('list-link') && !protectedLists.includes(target.textContent)) handleRename(target, target.textContent, true);
        else if (target.classList.contains('main-heading') && !protectedLists.includes(target.textContent)) handleRename(target, target.textContent, true);
        else if (target.classList.contains('task-item-text')) handleRename(target, target.textContent, false);
    };
    const renameUsername = (h1) => {
        const originalText = h1.textContent;
        const input = document.createElement('input');
        input.type = 'text'; input.value = originalText; input.className = 'h1-edit-input';
        h1.replaceWith(input);
        input.focus();
        const saveUsername = () => {
            const newText = input.value.trim();
            h1.textContent = newText ? newText : originalText;
            input.replaceWith(h1);
            saveData();
        };
        input.addEventListener('blur', saveUsername);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
    };
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('active'));
    sidebar.addEventListener('click', (e) => {
        if (e.target.classList.contains('list-link') || e.target.parentElement.id === 'sidebarList') {
            let listName = e.target.textContent;
            if (e.target.parentElement.id === 'sidebarList') { // Handle clicking the main list items
                 if (e.target.textContent === 'All' || e.target.textContent === 'Important' || e.target.textContent === 'Planned') {
                    listName = e.target.textContent;
                 }
            }
             currentList = listName;
             renderTasks();
            if (window.innerWidth <= 480) sidebar.classList.remove('active');
        }
    });
    sidebar.addEventListener('dblclick', handleDoubleClick);
    sidebar.addEventListener('touchend', handleDoubleClick);
    mainContent.addEventListener('dblclick', handleDoubleClick);
    mainContent.addEventListener('touchend', handleDoubleClick);
    newListBtn.addEventListener('click', () => {
        if (document.querySelector('.new-list-input')) return;
        newListBtn.style.display = 'none';
        const input = document.createElement('input');
        input.type = 'text'; input.placeholder = 'Enter new list name...'; input.className = 'list-edit-input new-list-input';
        listContainer.appendChild(input);
        input.focus();
        const saveNewList = () => {
            const listName = input.value.trim();
            if (listName) {
                if (!tasks.hasOwnProperty(listName)) {
                    tasks[listName] = { active: [], completed: [] };
                    currentList = listName;
                    saveData();
                } else { alert("A list with this name already exists."); }
            }
            renderSidebar(); renderTasks();
            newListBtn.style.display = 'block';
        };
        input.addEventListener('blur', saveNewList);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') { input.value = ''; input.blur(); }
        });
    });
     helpBtn.addEventListener('click', () => helpModal.style.display = 'flex');
    closeModalBtn.addEventListener('click', () => helpModal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.style.display = 'none'; });
    
    // Correctly bind to the static list items in the sidebar
    document.querySelectorAll('#sidebarList .list-link').forEach(item => {
        item.addEventListener('click', () => {
            currentList = item.textContent;
            renderTasks();
            if (window.innerWidth <= 480) sidebar.classList.remove('active');
        });
    });

    renderSidebar();
    renderTasks();
});
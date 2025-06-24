// To-Do List Application
class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    bindEvents() {
        // Input and Add Task Events
        const taskInput = document.getElementById('taskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');

        addTaskBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter Events
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Action Button Events
        document.getElementById('clearCompleted').addEventListener('click', () => {
            this.showConfirmModal('Are you sure you want to clear all completed tasks?', () => {
                this.clearCompleted();
            });
        });

        document.getElementById('clearAll').addEventListener('click', () => {
            this.showConfirmModal('Are you sure you want to clear all tasks? This action cannot be undone.', () => {
                this.clearAll();
            });
        });

        // Modal Events
        this.bindModalEvents();
    }

    bindModalEvents() {
        // Edit Modal
        const editModal = document.getElementById('editModal');
        const editTaskInput = document.getElementById('editTaskInput');
        const saveEditBtn = document.getElementById('saveEdit');
        const cancelEditBtn = document.getElementById('cancelEdit');

        saveEditBtn.addEventListener('click', () => this.saveEdit());
        cancelEditBtn.addEventListener('click', () => this.closeEditModal());
        editTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEdit();
            if (e.key === 'Escape') this.closeEditModal();
        });

        // Confirm Modal
        const confirmModal = document.getElementById('confirmModal');
        const confirmActionBtn = document.getElementById('confirmAction');
        const cancelActionBtn = document.getElementById('cancelAction');

        confirmActionBtn.addEventListener('click', () => this.executeConfirmAction());
        cancelActionBtn.addEventListener('click', () => this.closeConfirmModal());

        // Close modal when clicking outside or on close button
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const taskText = taskInput.value.trim();

        if (taskText === '') {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        if (taskText.length > 100) {
            this.showNotification('Task is too long! Maximum 100 characters.', 'error');
            return;
        }

        const newTask = {
            id: Date.now().toString(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        taskInput.value = '';
        this.showNotification('Task added successfully!', 'success');
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task deleted successfully!', 'success');
    }

    toggleTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Task completed!' : 'Task marked as pending!';
            this.showNotification(message, 'success');
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            const editModal = document.getElementById('editModal');
            const editTaskInput = document.getElementById('editTaskInput');
            
            editTaskInput.value = task.text;
            this.showModal(editModal);
            editTaskInput.focus();
            editTaskInput.select();
        }
    }

    saveEdit() {
        const editTaskInput = document.getElementById('editTaskInput');
        const newText = editTaskInput.value.trim();

        if (newText === '') {
            this.showNotification('Task cannot be empty!', 'error');
            return;
        }

        if (newText.length > 100) {
            this.showNotification('Task is too long! Maximum 100 characters.', 'error');
            return;
        }

        const task = this.tasks.find(task => task.id === this.editingTaskId);
        if (task) {
            task.text = newText;
            this.saveTasks();
            this.renderTasks();
            this.closeEditModal();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    closeEditModal() {
        const editModal = document.getElementById('editModal');
        this.closeModal(editModal);
        this.editingTaskId = null;
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            default:
                return this.tasks;
        }
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeConfirmModal();
        this.showNotification('Completed tasks cleared!', 'success');
    }

    clearAll() {
        this.tasks = [];
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeConfirmModal();
        this.showNotification('All tasks cleared!', 'success');
    }

    renderTasks() {
        const tasksContainer = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        tasksContainer.innerHTML = '';

        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });
    }    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        // Create checkbox
        const checkbox = document.createElement('div');
        checkbox.className = `task-checkbox ${task.completed ? 'checked' : ''}`;
        checkbox.addEventListener('click', () => this.toggleTask(task.id));
        
        // Create task text
        const taskText = document.createElement('div');
        taskText.className = `task-text ${task.completed ? 'completed' : ''}`;
        taskText.textContent = task.text;
        
        // Create actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';
        
        // Create edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'task-btn edit-btn';
        editBtn.disabled = task.completed;
        editBtn.innerHTML = `<i class="fas fa-edit"></i> Edit`;
        editBtn.addEventListener('click', () => this.editTask(task.id));
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-btn delete-btn';
        deleteBtn.innerHTML = `<i class="fas fa-trash"></i> Delete`;
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showDeleteConfirm(task.id);
        });
        
        // Append elements
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        taskDiv.appendChild(checkbox);
        taskDiv.appendChild(taskText);
        taskDiv.appendChild(actionsDiv);
        
        return taskDiv;
    }    showDeleteConfirm(taskId) {
        console.log('showDeleteConfirm called with taskId:', taskId); // Debug log
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('Task not found for ID:', taskId); // Debug log
            this.showNotification('Task not found!', 'error');
            return;
        }
        
        console.log('Found task:', task.text); // Debug log
        const message = `Are you sure you want to delete "${task.text}"?`;
        this.showConfirmModal(message, () => this.deleteTask(taskId));
    }

    showConfirmModal(message, action) {
        console.log('showConfirmModal called with message:', message); // Debug log
        const confirmModal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmMessage');
        
        if (!confirmModal || !confirmMessage) {
            console.error('Confirm modal elements not found'); // Debug log
            console.log('confirmModal:', confirmModal);
            console.log('confirmMessage:', confirmMessage);
            return;
        }
        
        console.log('Setting message and showing modal'); // Debug log
        confirmMessage.textContent = message;
        this.confirmAction = action;
        this.showModal(confirmModal);
    }executeConfirmAction() {
        if (this.confirmAction) {
            this.confirmAction();
            this.confirmAction = null;
        }
        this.closeConfirmModal();
    }

    closeConfirmModal() {
        const confirmModal = document.getElementById('confirmModal');
        this.closeModal(confirmModal);
        this.confirmAction = null;
    }    showModal(modal) {
        if (!modal) {
            console.error('Modal element not found');
            return;
        }
        
        console.log('Showing modal:', modal.id); // Debug log
        modal.style.display = 'block';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        document.body.style.overflow = 'hidden';
        
        // Add a small delay to ensure the modal is visible before any animations
        setTimeout(() => {
            modal.classList.add('modal-visible');
            console.log('Modal should now be visible'); // Debug log
        }, 10);
    }

    closeModal(modal) {
        if (!modal) {
            console.error('Modal element not found');
            return;
        }
        
        console.log('Closing modal:', modal.id); // Debug log
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        document.body.style.overflow = 'auto';
        modal.classList.remove('modal-visible');
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
    }

    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #fc8181, #e53e3e)';
                break;
            default:
                notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="block"]');
        if (openModal) {
            todoApp.closeModal(openModal);
        }
    }
    
    // Ctrl/Cmd + Enter to add task from anywhere
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('taskInput').focus();
    }
});

// Export functions for global access (for onclick handlers)
window.todoApp = null;
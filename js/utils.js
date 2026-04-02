// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || '✅';
}

// ===== LOADING SPINNER =====
function showLoader(text = 'Loading...') {
    let loader = document.getElementById('loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loader';
        loader.className = 'loader-overlay';
        document.body.appendChild(loader);
    }
    
    loader.innerHTML = `
        <div class="loader-content">
            <div class="spinner"></div>
            <p>${text}</p>
        </div>
    `;
    loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// ===== CONFIRM DIALOG =====
function showConfirm(message, callback) {
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-content">
            <h3>Confirm Action</h3>
            <p>${message}</p>
            <div class="confirm-buttons">
                <button class="btn-confirm-yes" onclick="confirmYes()">Yes, Proceed</button>
                <button class="btn-confirm-no" onclick="confirmNo()">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    window.confirmYes = function() {
        modal.remove();
        callback(true);
    };
    
    window.confirmNo = function() {
        modal.remove();
        callback(false);
    };
}

// ===== FORM VALIDATION =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password && password.length >= 4 && password.length <= 20;
}

function validatePhoneNumber(phone) {
    const re = /^[0-9\s\-\+\(\)]{10,}$/;
    return re.test(phone);
}

function validateFullName(name) {
    return name && name.trim().length >= 3;
}

// ===== IMAGE VALIDATION & PREVIEW =====
function validateImage(file, maxSizeMB = 5) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'Please upload a valid image (JPEG, PNG, or WebP)' };
    }

    if (file.size > maxSizeBytes) {
        return { valid: false, error: `Image size must be less than ${maxSizeMB}MB` };
    }

    return { valid: true };
}

function showImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!input) return;

    input.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const validation = validateImage(this.files[0]);
            
            if (!validation.valid) {
                showToast(validation.error, 'error');
                this.value = '';
                if (preview) preview.innerHTML = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 300px; border-radius: 8px;">`;
                }
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

// ===== PAGINATION =====
function paginate(items, pageSize = 6) {
    const totalPages = Math.ceil(items.length / pageSize);
    let currentPage = 1;

    return {
        getPage: function(pageNum) {
            if (pageNum < 1 || pageNum > totalPages) return [];
            currentPage = pageNum;
            const start = (pageNum - 1) * pageSize;
            return items.slice(start, start + pageSize);
        },
        getCurrentPage: function() {
            return currentPage;
        },
        getTotalPages: function() {
            return totalPages;
        },
        hasNextPage: function() {
            return currentPage < totalPages;
        },
        hasPreviousPage: function() {
            return currentPage > 1;
        }
    };
}

// ===== SORTING =====
function sortApartments(apartments, sortBy = 'newest') {
    const sorted = [...apartments];
    
    switch(sortBy) {
        case 'price-low':
            return sorted.sort((a, b) => Number(a.price) - Number(b.price));
        case 'price-high':
            return sorted.sort((a, b) => Number(b.price) - Number(a.price));
        case 'newest':
            return sorted.reverse();
        case 'oldest':
            return sorted;
        default:
            return sorted;
    }
}

// ===== DEBOUNCE =====
function debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// ===== DARK MODE =====
function initializeDarkMode() {
    const darkModeBtn = document.getElementById('darkModeToggle');
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeBtn) darkModeBtn.textContent = '☀️';
    }

    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', toggleDarkMode);
    }
}

function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    const btn = document.getElementById('darkModeToggle');
    if (btn) btn.textContent = isDarkMode ? '☀️' : '🌙';
    showToast(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
}

// ===== HELPER FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [name, secondsInInterval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
        }
    }
    return 'Just now';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeDarkMode);
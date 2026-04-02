

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initializeDashboard();
    setupMenuLinks();
    setupSearchFunctions();
});

// Check if admin is authenticated
function checkAdminAuth() {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!adminToken || !adminUser) {
        window.location.href = 'admin-login.html';
        return;
    }

    try {
        const user = JSON.parse(adminUser);
        document.querySelector('.sidebar-header p').textContent = user.email;
    } catch (e) {
        console.error('Error parsing admin user:', e);
    }
}

// Initialize dashboard
function initializeDashboard() {
    loadStatistics();
    loadUsers();
    loadApartments();
    loadReviews();
}

// Setup menu navigation
function setupMenuLinks() {
    const menuLinks = document.querySelectorAll('.menu-link');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

            link.classList.add('active');

            const sectionId = link.dataset.section;
            document.getElementById(sectionId).classList.add('active');

            const titles = {
                'dashboard': 'Dashboard',
                'users': 'Users Management',
                'properties': 'Apartments Management',
                'reviews': 'Reviews Management',
                'settings': 'Settings'
            };

            document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
        });
    });
}

// STATISTICS
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-dashboard-stats.php`);
        const result = await response.json();

        if (result.success) {
            document.getElementById('totalUsers').textContent = result.data.totalUsers;
            document.getElementById('totalProperties').textContent = result.data.totalApartments;
            document.getElementById('totalReviews').textContent = result.data.totalReviews;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// USERS MANAGEMENT
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-users.php`);
        const result = await response.json();

        if (result.success) {
            displayUsersTable(result.data);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsersTable(users) {
    const tbody = document.querySelector('#usersTable tbody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>#${user.id}</td>
            <td>${user.fullname}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td><span class="status-badge status-${user.verified.toLowerCase()}">${user.verified.toUpperCase()}</span></td>
            <td>${user.createdAt}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/delete-user.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId })
            });

            const result = await response.json();

            if (result.success) {
                alert('User deleted successfully!');
                loadUsers();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error deleting user: ' + error.message);
        }
    }
}

// APARTMENTS MANAGEMENT
async function loadApartments() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-apartments.php`);
        const result = await response.json();

        if (result.success) {
            displayApartmentsTable(result.data);
        }
    } catch (error) {
        console.error('Error loading apartments:', error);
    }
}

function displayApartmentsTable(apartments) {
    const tbody = document.querySelector('#propertiesTable tbody');

    if (apartments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No apartments found</td></tr>';
        return;
    }

    tbody.innerHTML = apartments.map(apt => `
        <tr>
            <td>#${apt.id}</td>
            <td>${apt.title}</td>
            <td>${apt.landlord}</td>
            <td>${apt.location}</td>
            <td>${apt.price}</td>
            <td><span class="status-badge status-${apt.status}">${apt.status.toUpperCase()}</span></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteApartment(${apt.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function deleteApartment(apartmentId) {
    if (confirm('Are you sure you want to delete this apartment?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/delete-apartment.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apartmentId: apartmentId })
            });

            const result = await response.json();

            if (result.success) {
                alert('Apartment deleted successfully!');
                loadApartments();
                loadStatistics();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error deleting apartment: ' + error.message);
        }
    }
}

function openPropertyModal() {
    // This can be implemented later for adding new apartments
    alert('Add apartment feature coming soon!');
}

// REVIEWS MANAGEMENT
async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-reviews.php`);
        const result = await response.json();

        if (result.success) {
            displayReviewsTable(result.data);
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

function displayReviewsTable(reviews) {
    const tbody = document.querySelector('#reviewsTable tbody');

    if (reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No reviews found</td></tr>';
        return;
    }

    tbody.innerHTML = reviews.map(review => `
        <tr>
            <td>#${review.id}</td>
            <td>${review.apartment}</td>
            <td>${review.reviewer}</td>
            <td>${'⭐'.repeat(review.rating)}</td>
            <td>${review.comment}</td>
            <td><span class="status-badge status-${review.status.toLowerCase()}">${review.status.toUpperCase()}</span></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteReview(${review.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function deleteReview(reviewId) {
    if (confirm('Are you sure you want to delete this review?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/delete-review.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId: reviewId })
            });

            const result = await response.json();

            if (result.success) {
                alert('Review deleted successfully!');
                loadReviews();
                loadStatistics();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error deleting review: ' + error.message);
        }
    }
}

// SETTINGS
function saveSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        siteEmail: document.getElementById('siteEmail').value,
        sitePhone: document.getElementById('sitePhone').value,
        siteDescription: document.getElementById('siteDescription').value,
        maintenanceMode: document.getElementById('maintenanceMode').value
    };

    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
}

// SEARCH FUNCTIONALITY
function setupSearchFunctions() {
    document.getElementById('userSearch')?.addEventListener('keyup', function () {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#usersTable tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    document.getElementById('propertySearch')?.addEventListener('keyup', function () {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#propertiesTable tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    document.getElementById('reviewSearch')?.addEventListener('keyup', function () {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#reviewsTable tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// LOGOUT
function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminId');
        window.location.href = 'admin-login.html';
    }
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    const userModal = document.getElementById('userModal');
    const propertyModal = document.getElementById('propertyModal');

    if (e.target === userModal) userModal.classList.remove('active');
    if (e.target === propertyModal) propertyModal.classList.remove('active');
});

// Close modal functions
function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function closePropertyModal() {
    document.getElementById('propertyModal').classList.remove('active');
}

function openUserModal() {
    alert('Add user feature coming soon!');
}
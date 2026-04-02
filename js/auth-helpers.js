
function getAuthToken() {
    return localStorage.getItem('authToken');
}

function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

function removeAuthToken() {
    localStorage.removeItem('authToken');
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getUserType() {
    const user = getCurrentUser();
    return user ? user.user_type : null;
}

function isStudent() {
    return getUserType() === 'student';
}

function isLandlord() {
    return getUserType() === 'landlord';
}

function isLoggedIn() {
    return !!getAuthToken() && !!getCurrentUser();
}

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return null;
    }
    return getCurrentUser();
}

function hasPermission(permission) {
    const user = getCurrentUser();

    if (!user) return false;

    const permissions = {
        student: ['save_apartment', 'send_message', 'leave_review', 'view_apartment'],
        landlord: ['create_apartment', 'edit_apartment', 'delete_apartment', 'view_messages']
    };

    const userPermissions = permissions[user.user_type] || [];
    return userPermissions.includes(permission);
}

function requirePermission(permission) {
    if (!hasPermission(permission)) {
        showToast('You do not have permission to perform this action', 'error');
        return false;
    }
    return true;
}
function isAdmin() {
    const user = getCurrentUser();
    return user && user.user_type === 'admin';
}
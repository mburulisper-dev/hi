const API_BASE_URL = 'http://localhost/nyumba-find-backend/api';
const UPLOAD_URL = 'http://localhost/nyumba-find-backend/uploads/';

console.log('API_BASE_URL:', API_BASE_URL);
console.log('UPLOAD_URL:', UPLOAD_URL);


function getAuthToken() {
    const token = localStorage.getItem('authToken');
    console.log('getAuthToken() returning:', token ? 'TOKEN EXISTS' : 'NO TOKEN');
    return token;
}

function setAuthToken(token) {
    console.log('setAuthToken() called with token:', token ? 'TOKEN SET' : 'EMPTY');
    localStorage.setItem('authToken', token);
    console.log('Verified stored:', localStorage.getItem('authToken') ? 'YES' : 'NO');
}

function removeAuthToken() {
    localStorage.removeItem('authToken');
}

function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Error parsing currentUser:', e);
        return null;
    }
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function isLoggedIn() {
    return !!getAuthToken() && !!getCurrentUser();
}

function isStudent() {
    const user = getCurrentUser();
    return user && user.user_type === 'student';
}

function isLandlord() {
    const user = getCurrentUser();
    return user && user.user_type === 'landlord';
}

async function apiCall(endpoint, method = 'GET', data = null) {
    console.log(`\n📡 API Call: ${method} ${endpoint}`);
    console.log('Data:', data);

    const token = getAuthToken();
    console.log('Token available:', !!token);
    console.log('Token length:', token ? token.length : 0);

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (token) {
        const authHeader = `Bearer ${token}`;
        options.headers['Authorization'] = authHeader;
        console.log('Authorization header:', authHeader.substring(0, 30) + '...');
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        options.body = JSON.stringify(data);
    }

    try {
        console.log('Fetching:', API_BASE_URL + endpoint);
        console.log('Headers:', options.headers);
        const response = await fetch(API_BASE_URL + endpoint, options);

        console.log('Response status:', response.status);
        console.log('Response headers:', {
            contentType: response.headers.get('content-type')
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ API Error ${response.status}:`, text);

            try {
                const errorData = JSON.parse(text);
                return {
                    status: 'error',
                    message: errorData.message || `API Error: ${response.status}`,
                    data: null
                };
            } catch (e) {
                return {
                    status: 'error',
                    message: `API Error: ${response.status}`,
                    data: null
                };
            }
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            console.log('✅ API Response:', result);
            return result;
        } else {
            console.error('Response is not JSON:', contentType);
            return {
                status: 'error',
                message: 'Invalid response format from server'
            };
        }
    } catch (error) {
        console.error('❌ Fetch Error:', error);
        return {
            status: 'error',
            message: 'Network error: ' + error.message
        };
    }
}

async function login(credentials) {
    return await apiCall('/auth/login.php', 'POST', credentials);
}

async function register(userData) {
    return await apiCall('/auth/register.php', 'POST', userData);
}

async function logout() {
    return await apiCall('/auth/logout.php', 'POST');
}

async function getApartments(filters = {}) {
    let endpoint = '/apartments/get.php';
    const params = new URLSearchParams();

    if (filters.location) params.append('location', filters.location);
    if (filters.price) params.append('price', filters.price);
    if (filters.room_type) params.append('room_type', filters.room_type);
    if (filters.page) params.append('page', filters.page);

    if (params.toString()) {
        endpoint += '?' + params.toString();
    }

    return await apiCall(endpoint, 'GET');
}

async function getApartment(id) {
    return await apiCall(`/apartments/get.php?id=${id}`, 'GET');
}

async function getApartmentsByLandlord() {
    return await apiCall('/apartments/get.php?landlord=true', 'GET');
}

async function createApartment(data) {
    return await apiCall('/apartments/create.php', 'POST', data);
}

async function updateApartment(data) {
    return await apiCall('/apartments/update.php', 'PUT', data);
}

async function deleteApartment(id) {
    return await apiCall('/apartments/delete.php', 'DELETE', { id: id });
}

async function saveApartment(apartmentId) {
    return await apiCall('/saved/save.php', 'POST', { apartment_id: apartmentId });
}

async function unsaveApartment(apartmentId) {
    return await apiCall('/saved/unsave.php', 'DELETE', { apartment_id: apartmentId });
}

// ===== COMPARISONS =====
async function getComparisons(userId) {
    console.log('📥 Getting comparisons for user:', userId);
    return await apiCall(`/comparisons/get.php?user_id=${userId}`, 'GET');
}

async function saveComparisons(userId, apartmentIds) {
    console.log('💾 Saving comparisons...');
    console.log('User ID:', userId);
    console.log('Apartment IDs:', apartmentIds);
    console.log('API URL:', API_BASE_URL + '/comparisons/add.php');

    const response = await apiCall('/comparisons/add.php', 'POST', {
        user_id: userId,
        apartment_ids: apartmentIds
    });

    console.log('📊 FULL RESPONSE:', response);
    console.log('Response status:', response.status);
    console.log('Response message:', response.message);
    console.log('Response data:', response.data);

    return response;
}

async function clearAllComparisons(userId) {
    console.log('🗑️ Clearing all comparisons for user:', userId);
    return await apiCall('/comparisons/clear.php', 'DELETE', {
        user_id: userId
    });
}

async function removeFromComparison(userId, apartmentId) {
    console.log('❌ Removing apartment from comparison:', { userId, apartmentId });
    return await apiCall('/comparisons/delete.php', 'DELETE', {
        user_id: userId,
        apartment_id: apartmentId
    });
}

async function sendMessage(receiverId, apartmentId, message) {
    return await apiCall('/messages/send.php', 'POST', {
        receiver_id: receiverId,
        apartment_id: apartmentId,
        message: message
    });
}

async function getMessages() {
    return await apiCall('/messages/get.php', 'GET');
}

async function createReview(apartmentId, rating, reviewText) {
    return await apiCall('/reviews/create.php', 'POST', {
        apartment_id: apartmentId,
        rating: rating,
        review_text: reviewText
    });
}

async function getReviews(apartmentId) {
    return await apiCall(`/reviews/get.php?apartment_id=${apartmentId}`, 'GET');
}
async function getReviewsByLandlord() {
    return await apiCall('/reviews/get.php?landlord=true', 'GET');
}

async function getProfile() {
    return await apiCall('/users/profile.php', 'GET');
}

async function updateProfile(data) {
    return await apiCall('/users/profile.php', 'PUT', data);
}

async function changePassword(data) {
    return await apiCall('/users/change-password.php', 'POST', data);
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Use correct path matching your API_BASE_URL
        const uploadUrl = API_BASE_URL + '/upload/image.php';
        console.log('Uploading to:', uploadUrl);

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log('Upload response:', data);

        if (data.status === 'success') {
            return {
                status: 'success',
                data: {
                    url: data.url || data.path,
                    filename: data.filename
                }
            };
        } else {
            return {
                status: 'error',
                message: data.message || 'Upload failed'
            };
        }
    } catch (error) {
        console.error('Upload error:', error);
        return {
            status: 'error',
            message: error.message
        };
    }
}

// ===== SAVED APARTMENTS (UPDATED TO MATCH YOUR API) =====
async function saveSavedApartment(userId, apartmentId) {
    // Your backend uses requireAuth() so userId is not needed in request
    return await apiCall('/saved/save.php', 'POST', {
        apartment_id: apartmentId
    });
}

async function unsaveSavedApartment(userId, apartmentId) {
    // Your backend uses requireAuth() so userId is not needed in request
    return await apiCall('/saved/unsave.php', 'DELETE', {
        apartment_id: apartmentId
    });
}

async function getSavedApartments() {
    return await apiCall('/saved/get.php', 'GET');
}
// ===== ADMIN LOGIN =====
async function adminLogin(credentials) {
    return await apiCall('/admin/login.php', 'POST', credentials);
}

async function adminRegister(data) {
    return await apiCall('/admin/register.php', 'POST', data);
}
// Admin Login Handler
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const rememberMe = document.getElementById('rememberAdmin').checked;

    // Clear previous errors
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';

    // Validate inputs
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        return;
    }

    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        return;
    }

    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Logging in...';

    try {
        // ===== CORRECTED API URL =====
        const API_BASE_URL = 'http://localhost/nyumba-find-backend/api';

        // Call API with correct path
        const response = await fetch(`${API_BASE_URL}/admin/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('🔐 Admin login response:', data);

        if (data.success || data.status === 'success') {
            // Store admin session
            const token = data.token || data.data?.token;
            const user = data.user || data.data?.user;

            localStorage.setItem('authToken', token);
            localStorage.setItem('adminToken', token);
            localStorage.setItem('currentUser', JSON.stringify({
                user_id: user.id,
                fullname: user.name || user.fullname,
                email: user.email,
                user_type: 'admin',
                role: user.role || 'admin'
            }));
            localStorage.setItem('adminUser', JSON.stringify(user));
            localStorage.setItem('adminRole', user.role || 'admin');
            localStorage.setItem('adminId', user.id);

            // Store remember me preference
            if (rememberMe) {
                localStorage.setItem('rememberAdmin', 'true');
                localStorage.setItem('adminEmail', email);
            } else {
                localStorage.removeItem('rememberAdmin');
                localStorage.removeItem('adminEmail');
            }

            // Show success message
            const successMsg = document.getElementById('successMessage');
            if (successMsg) successMsg.classList.add('show');

            // Redirect to admin dashboard
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1500);
        } else {
            // Handle login failure
            const errorMessage = data.message || 'Invalid email or password';

            if (data.errorField === 'email') {
                document.getElementById('emailError').textContent = errorMessage;
            } else if (data.errorField === 'password') {
                document.getElementById('passwordError').textContent = errorMessage;
            } else {
                document.getElementById('emailError').textContent = errorMessage;
            }

            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        document.getElementById('emailError').textContent = 'Connection error. Please try again.';
        console.log('Error details:', error.message);

        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Check for remembered admin email
window.addEventListener('DOMContentLoaded', () => {
    const rememberAdmin = localStorage.getItem('rememberAdmin');
    const adminEmail = localStorage.getItem('adminEmail');

    if (rememberAdmin === 'true' && adminEmail) {
        document.getElementById('adminEmail').value = adminEmail;
        document.getElementById('rememberAdmin').checked = true;
    }
});
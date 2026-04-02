let selectedType = null;

document.addEventListener('DOMContentLoaded', function () {
    console.log('Login page loaded');

    const studentBtn = document.getElementById('studentBtn');
    const landlordBtn = document.getElementById('landlordBtn');

    if (studentBtn) {
        studentBtn.addEventListener('click', function (e) {
            e.preventDefault();
            selectType('student', this);
        });
    }

    if (landlordBtn) {
        landlordBtn.addEventListener('click', function (e) {
            e.preventDefault();
            selectType('landlord', this);
        });
    }

    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

function selectType(type, button) {
    selectedType = type;
    console.log('Selected type:', type);

    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (button) {
        button.classList.add('active');
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.style.display = 'block';
    }
}

function backToTypeSelection() {
    selectedType = null;
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.style.display = 'none';
    }

    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById('loginFormElement').reset();
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('=== LOGIN STARTED ===');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        return;
    }

    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        return;
    }

    if (!selectedType) {
        showToast('Please select user type (Student or Landlord)', 'error');
        return;
    }

    console.log('Login attempt:', { email, selectedType });
    showLoader('Logging in...');

    try {
        const response = await login({
            email: email,
            password: password
        });

        hideLoader();
        console.log('Login response:', response);

        if (response.status !== 'success') {
            console.error('Login failed:', response.message);
            showToast(response.message || 'Login failed', 'error');
            return;
        }

        console.log('Saving auth data...');
        const token = response.data.token;
        console.log('Token to save:', token);

        setAuthToken(token);

        const userData = {
            user_id: response.data.user_id,
            email: response.data.email,
            fullname: response.data.fullname,
            user_type: response.data.user_type,
            phone: response.data.phone,
            title: response.data.title
        };

        setCurrentUser(userData);

        console.log('Auth data saved');
        console.log('Verify token saved:', localStorage.getItem('authToken') ? 'YES' : 'NO');
        console.log('Verify user saved:', localStorage.getItem('currentUser') ? 'YES' : 'NO');

        showToast('Login successful!', 'success');

        setTimeout(() => {
            console.log('Redirecting to dashboard...');
            if (response.data.user_type === 'student') {
                window.location.href = 'student-dashboard.html';
            } else if (response.data.user_type === 'landlord') {
                window.location.href = 'landlord-dashboard.html';
            }
        }, 1500);

    } catch (error) {
        hideLoader();
        console.error('Login error:', error);
        showToast('Login failed: ' + error.message, 'error');
    }
}
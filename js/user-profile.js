document.addEventListener('DOMContentLoaded', function () {
    console.log('=== USER PROFILE PAGE LOADED ===');
    loadProfileData();
    setupEventListeners();
    initializeDarkMode();
});

function loadProfileData() {
    console.log('Loading profile data...');

    const currentUser = getCurrentUser();
    const token = getAuthToken();

    console.log('Current user:', currentUser);
    console.log('Token exists:', !!token);

    if (!currentUser || !token) {
        console.log('❌ Not logged in, redirecting to login');
        showToast('Please login first', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }

    try {
        displayProfileData(currentUser);

        loadStats();
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        showToast('Error loading profile', 'error');
    }
}

function displayProfileData(user) {
    console.log('Displaying profile data:', user);

    document.getElementById("profileFullName").textContent = user.fullname || 'User';
    document.getElementById("profileEmail").textContent = user.email || '-';
    document.getElementById("profileMemberSince").textContent = 'Member since today';

    document.getElementById("infoFullName").textContent = user.fullname || '-';
    document.getElementById("infoEmail").textContent = user.email || '-';
    document.getElementById("infoPhone").textContent = user.phone || '-';
    document.getElementById("infoTitle").textContent = user.title || '-';
    document.getElementById("infoMemberDate").textContent = new Date().toLocaleDateString();

    document.getElementById("editFullName").value = user.fullname || '';
    document.getElementById("editEmail").value = user.email || '';
    document.getElementById("editPhone").value = user.phone || '';

    console.log('✅ Profile data displayed successfully');
}

function loadStats() {
    console.log('Loading stats...');
    document.getElementById("savedCount").textContent = '0';
    document.getElementById("reviewsCount").textContent = '0';
    document.getElementById("messagesCount").textContent = '0';
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    const editForm = document.getElementById('editProfileForm');
    const changePasswordForm = document.getElementById('changePasswordForm');

    if (editForm) {
        editForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateProfile();
        });
    } else {
        console.warn('⚠️ Edit form not found');
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function (e) {
            e.preventDefault();
            changePassword();
        });
    } else {
        console.warn('⚠️ Change password form not found');
    }
}

function showSection(section) {
    console.log('Showing section:', section);
    document.querySelectorAll('.profile-section').forEach(el => {
        el.style.display = 'none';
    });

    document.querySelectorAll('.menu-item').forEach(el => {
        el.classList.remove('active');
    });

    const sectionElement = document.getElementById(section + '-section');
    if (sectionElement) {
        sectionElement.style.display = 'block';
    } else {
        console.warn('⚠️ Section not found:', section + '-section');
    }

    if (event && event.target) {
        const menuItem = event.target.closest('.menu-item');
        if (menuItem) {
            menuItem.classList.add('active');
        }
    }
}

function updateProfile() {
    console.log('Updating profile...');

    const fullName = document.getElementById('editFullName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const fullNameError = document.getElementById('fullNameError');
    const phoneError = document.getElementById('phoneError');

    fullNameError.textContent = '';
    phoneError.textContent = '';

    let isValid = true;

    if (!fullName || fullName.length < 3) {
        fullNameError.textContent = 'Name must be at least 3 characters';
        isValid = false;
    }

    if (!phone || phone.length < 10) {
        phoneError.textContent = 'Invalid phone number (at least 10 digits)';
        isValid = false;
    }

    if (!isValid) {
        showToast('Please fix errors', 'error');
        return;
    }

    showLoader('Updating profile...');

    setTimeout(() => {
        hideLoader();

        try {
            const currentUser = getCurrentUser();
            currentUser.fullname = fullName;
            currentUser.phone = phone;
            setCurrentUser(currentUser);

            showToast('✅ Profile updated!', 'success');

            displayProfileData(currentUser);
            showSection('overview');
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Error updating profile', 'error');
        }
    }, 1000);
}

function changePassword() {
    console.log('Changing password...');

    const current = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    const currentError = document.getElementById('currentPasswordError');
    const newError = document.getElementById('newPasswordError');
    const confirmError = document.getElementById('confirmPasswordError');

    currentError.textContent = '';
    newError.textContent = '';
    confirmError.textContent = '';

    let isValid = true;

    if (!current) {
        currentError.textContent = 'Current password is required';
        isValid = false;
    }

    if (!newPwd || newPwd.length < 4) {
        newError.textContent = 'Password must be at least 4 characters';
        isValid = false;
    }

    if (newPwd !== confirm) {
        confirmError.textContent = 'Passwords do not match';
        isValid = false;
    }

    if (!isValid) {
        showToast('Please fix errors', 'error');
        return;
    }

    showLoader('Changing password...');

    setTimeout(() => {
        hideLoader();
        showToast('✅ Password changed successfully!', 'success');
        document.getElementById('changePasswordForm').reset();
    }, 1000);
}

function logout() {
    console.log('Logging out...');

    showConfirm('Are you sure you want to logout?', function (confirmed) {
        if (confirmed) {
            try {
                removeAuthToken();
                setCurrentUser(null);
                showToast('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = 'index.html';
            }
        }
    });
}
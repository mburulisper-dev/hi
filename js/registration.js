let selectedType = null;

document.addEventListener('DOMContentLoaded', function () {
    console.log('Registration page loaded');

    const studentBtn = document.getElementById('student-btn');
    const landlordBtn = document.getElementById('landlord-btn');

    console.log('Student button found:', !!studentBtn);
    console.log('Landlord button found:', !!landlordBtn);

    if (studentBtn) {
        studentBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Student button clicked');
            selectType('student', this);
            showRegistrationForm();
        });
    }

    if (landlordBtn) {
        landlordBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Landlord button clicked');
            selectType('landlord', this);
            showRegistrationForm();
        });
    }

    const form = document.getElementById('registerFormElement');
    console.log('Form found:', !!form);

    if (form) {
        form.addEventListener('submit', handleRegistrationSubmit);
    } else {
        console.error('❌ ERROR: Form with ID "registerFormElement" not found!');
        console.log('Available form IDs:', Array.from(document.querySelectorAll('form')).map(f => f.id));
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
}

function showRegistrationForm() {
    const typeSelection = document.getElementById('typeSelection');
    const registrationForm = document.getElementById('registrationForm');

    if (typeSelection) {
        typeSelection.style.display = 'none';
    }
    if (registrationForm) {
        registrationForm.style.display = 'block';
    }
}

function backToTypeSelection() {
    console.log('Going back to type selection');
    const typeSelection = document.getElementById('typeSelection');
    const registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {
        registrationForm.style.display = 'none';
    }
    if (typeSelection) {
        typeSelection.style.display = 'block';
    }

    selectedType = null;
}

// Main registration handler
async function handleRegistrationSubmit(e) {
    e.preventDefault();
    console.log('=== REGISTRATION FORM SUBMITTED ===');

    const fullname = document.getElementById('fullname')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const password = document.getElementById('password')?.value.trim() || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value.trim() || '';
    const title = document.querySelector('input[name="title"]:checked')?.value || '';
    const termsCheck = document.getElementById('termsCheck')?.checked || false;

    console.log('Form Data:', { fullname, email, phone, title, user_type: selectedType, termsCheck });

    // Clear all error messages
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    // Validation
    let isValid = true;
    let errors = [];

    if (!fullname || fullname.length < 3) {
        document.getElementById('fullnameError').textContent = 'Full name must be at least 3 characters';
        isValid = false;
        errors.push('Invalid full name');
    }

    if (!email || !validateEmail(email)) {
        document.getElementById('emailError').textContent = 'Invalid email address';
        isValid = false;
        errors.push('Invalid email');
    }

    if (!phone || phone.length < 10) {
        document.getElementById('phoneError').textContent = 'Phone must be at least 10 digits';
        isValid = false;
        errors.push('Invalid phone');
    }

    if (!password || password.length < 4) {
        document.getElementById('passwordError').textContent = 'Password must be at least 4 characters';
        isValid = false;
        errors.push('Invalid password');
    }

    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
        isValid = false;
        errors.push('Password mismatch');
    }

    if (!title) {
        document.getElementById('titleError').textContent = 'Please select a title';
        isValid = false;
        errors.push('No title selected');
    }

    if (!termsCheck) {
        document.getElementById('termsError').textContent = 'You must agree to terms and conditions';
        isValid = false;
        errors.push('Terms not accepted');
    }

    if (!selectedType) {
        showToast('Please select user type (Student or Landlord)', 'error');
        isValid = false;
        errors.push('No user type selected');
    }

    if (!isValid) {
        console.error('Validation errors:', errors);
        showToast('Please fix the errors above', 'error');
        return;
    }

    console.log('✅ All validation passed');
    showLoader('Creating account...');

    const registrationData = {
        fullname: fullname,
        email: email,
        phone: phone,
        password: password,
        title: title,
        user_type: selectedType
    };

    console.log('Sending to API:', registrationData);

    try {
        const response = await register(registrationData);
        hideLoader();

        console.log('Registration response:', response);

        if (response && response.status === 'success') {
            console.log('✅ Registration successful');

            if (response.data && response.data.token) {
                setAuthToken(response.data.token);
                console.log('Token stored');
            }

            const userData = {
                user_id: response.data.user_id,
                email: response.data.email,
                fullname: response.data.fullname,
                user_type: response.data.user_type,
                phone: response.data.phone,
                title: response.data.title
            };

            setCurrentUser(userData);
            console.log('User data stored:', userData);

            showToast('✅ Account created successfully!', 'success');

            setTimeout(() => {
                if (response.data.user_type === 'student') {
                    console.log('Redirecting to student dashboard');
                    window.location.href = 'student-dashboard.html';
                } else if (response.data.user_type === 'landlord') {
                    console.log('Redirecting to landlord dashboard');
                    window.location.href = 'landlord-dashboard.html';
                }
            }, 1500);
        } else {
            console.error('❌ Registration failed:', response);
            showToast(response?.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        hideLoader();
        console.error('❌ Registration error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
// Forgot Password Form
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
    forgotForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const emailError = document.getElementById('emailError');

        emailError.textContent = '';

        if (!email || !validateEmail(email)) {
            emailError.textContent = 'Please enter a valid email address';
            return;
        }

        showLoader('Sending reset link...');

        // Simulate API call
        setTimeout(() => {
            hideLoader();
            
            // Show success message
            document.getElementById('successMessage').style.display = 'block';
            forgotForm.style.display = 'none';

            // In production, call API to send email
            // const response = await apiCall('/auth/forgot-password.php', 'POST', { email });
            
            showToast('✅ Reset link sent to your email!', 'success');
        }, 1500);
    });
}

// Reset Password Form
const resetForm = document.getElementById('resetForm');
if (resetForm) {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const confirmError = document.getElementById('confirmError');

    // Real-time validation
    password.addEventListener('input', function() {
        const reqLength = document.getElementById('req-length');
        if (this.value.length >= 4) {
            reqLength.style.color = '#10b981';
        } else {
            reqLength.style.color = '#6b7280';
        }
    });

    confirmPassword.addEventListener('input', function() {
        const reqMatch = document.getElementById('req-match');
        if (password.value === this.value && this.value.length > 0) {
            reqMatch.style.color = '#10b981';
        } else {
            reqMatch.style.color = '#6b7280';
        }
    });

    resetForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const pwd = password.value.trim();
        const confirmPwd = confirmPassword.value.trim();

        passwordError.textContent = '';
        confirmError.textContent = '';

        let isValid = true;

        if (!pwd || pwd.length < 4) {
            passwordError.textContent = 'Password must be at least 4 characters';
            isValid = false;
        }

        if (pwd !== confirmPwd) {
            confirmError.textContent = 'Passwords do not match';
            isValid = false;
        }

        if (!isValid) {
            showToast('Please fix the errors above', 'error');
            return;
        }

        showLoader('Resetting password...');

        // Simulate API call
        setTimeout(() => {
            hideLoader();
            showToast('✅ Password reset successfully!', 'success');
            
            // In production, call API to reset password
            // const response = await apiCall('/auth/reset-password.php', 'POST', { 
            //     token: getResetToken(), 
            //     password: pwd 
            // });

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }, 1500);
    });
}
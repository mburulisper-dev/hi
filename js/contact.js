document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const messageInput = document.getElementById('contactMessage');
    const charCount = document.getElementById('charCount');

    if (messageInput) {
        messageInput.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = document.getElementById('contactName').value.trim();
            const email = document.getElementById('contactEmail').value.trim();
            const phone = document.getElementById('contactPhone').value.trim();
            const subject = document.getElementById('contactSubject').value.trim();
            const message = document.getElementById('contactMessage').value.trim();

            // Clear errors
            document.getElementById('nameError').textContent = '';
            document.getElementById('emailError').textContent = '';
            document.getElementById('subjectError').textContent = '';
            document.getElementById('messageError').textContent = '';

            // Validate
            let isValid = true;

            if (!name || name.length < 3) {
                document.getElementById('nameError').textContent = 'Name must be at least 3 characters';
                isValid = false;
            }

            if (!email || !validateEmail(email)) {
                document.getElementById('emailError').textContent = 'Invalid email address';
                isValid = false;
            }

            if (!subject || subject.length < 5) {
                document.getElementById('subjectError').textContent = 'Subject must be at least 5 characters';
                isValid = false;
            }

            if (!message || message.length < 10) {
                document.getElementById('messageError').textContent = 'Message must be at least 10 characters';
                isValid = false;
            }

            if (!isValid) {
                showToast('Please fix the errors above', 'error');
                return;
            }

            // Send message
            showLoader('Sending message...');

            setTimeout(() => {
                hideLoader();
                showToast('✅ Message sent successfully! We will contact you soon.', 'success');
                contactForm.reset();
                charCount.textContent = '0';
            }, 1500);

            // In production, send to API:
            // const response = await apiCall('/contact/send.php', 'POST', {
            //     name, email, phone, subject, message
            // });
        });
    }
});
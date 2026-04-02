// ===== ERROR HANDLING =====
window.addEventListener('error', function (e) {
    console.error('Global error:', e.error);
    hideLoader();
    if (e.error && e.error.message) {
        showToast('An error occurred: ' + e.error.message, 'error');
    }
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled promise rejection:', e.reason);
    hideLoader();
    showToast('An unexpected error occurred', 'error');
});

// ===== CHECK AUTHENTICATION =====
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

if (!isLandlord()) {
    window.location.href = 'student-dashboard.html';
}

console.log("Landlord profile loaded");

// ===== SHOW SECTIONS (GLOBAL FUNCTION) =====
function showSection(section) {
    console.log('Showing section:', section);

    // Hide all sections
    document.querySelectorAll('.profile-section').forEach(sec => {
        sec.style.display = 'none';
    });

    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const sectionId = section + '-section';
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }

    // Add active class to clicked menu item
    if (event && event.target) {
        const menuItem = event.target.closest('.menu-item');
        if (menuItem) {
            menuItem.classList.add('active');
        }
    }

    // Load reviews when reviews section is clicked
    if (section === 'reviews') {
        loadReviews();
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded fired');
    loadLandlordProfile();
    loadApartments();
    setupEditButton();
    createEditModal();
    setupProfileImageUpload();
});

// ===== LOAD LANDLORD PROFILE =====
function loadLandlordProfile() {
    const currentUser = getCurrentUser();
    console.log('Current user:', currentUser);

    if (!currentUser) {
        console.error('No user logged in');
        return;
    }

    // Update profile header
    document.getElementById("landlordName").textContent = currentUser.fullname || 'Landlord';
    document.getElementById("landlordLocation").textContent = currentUser.title + ' ' + currentUser.fullname || 'N/A';

    // Update contact info
    document.getElementById("contactEmail").textContent = currentUser.email || 'N/A';
    document.getElementById("contactPhone").textContent = currentUser.phone || 'N/A';
    document.getElementById("contactEmail").href = 'mailto:' + currentUser.email;
    document.getElementById("contactPhone").href = 'tel:' + currentUser.phone;

    // Load profile image if exists
    loadProfileImage();

    // Update verification status
    updateVerificationStatus(currentUser);

    console.log('Profile loaded');
}

// ===== LOAD PROFILE IMAGE =====
function loadProfileImage() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.log('No user logged in');
        return;
    }

    // Try different ways to get user ID
    const userId = currentUser.id || currentUser.user_id || currentUser.landlord_id;

    if (!userId) {
        console.log('No user ID found');
        return;
    }

    const profileImageData = localStorage.getItem('landlordProfileImage_' + userId);
    console.log('Loading profile image for user:', userId, 'Data exists:', !!profileImageData);

    if (profileImageData) {
        const profileImage = document.getElementById('profileImage');
        const avatarIcon = document.getElementById('avatarIcon');

        if (profileImage && avatarIcon) {
            profileImage.src = profileImageData;
            profileImage.style.display = 'block';
            avatarIcon.style.display = 'none';
            console.log('Profile image loaded successfully');
        }
    }
}

// ===== SETUP PROFILE IMAGE UPLOAD =====
function setupProfileImageUpload() {
    console.log('=== Starting Profile Image Upload Setup ===');

    // Get all elements
    const profileAvatar = document.getElementById('profileAvatar');
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImage = document.getElementById('profileImage');
    const avatarIcon = document.getElementById('avatarIcon');

    console.log('profileAvatar:', profileAvatar);
    console.log('profileImageInput:', profileImageInput);
    console.log('profileImage:', profileImage);
    console.log('avatarIcon:', avatarIcon);

    if (!profileAvatar || !profileImageInput) {
        console.error('❌ Missing elements!');
        return;
    }

    // Direct click event - no bubbling
    profileAvatar.onclick = function () {
        console.log('🖱️ Avatar clicked!');
        profileImageInput.click();
    };

    // File input change
    profileImageInput.onchange = function (e) {
        console.log('📁 File input changed');
        const file = e.target.files[0];

        if (!file) {
            console.log('❌ No file selected');
            return;
        }

        console.log('📄 File selected:', file.name, file.size, file.type);

        // Validate
        if (!file.type.startsWith('image/')) {
            showToast('❌ Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ File too large (max 5MB)', 'error');
            return;
        }

        console.log('✅ File validation passed');
        showLoader('📤 Uploading profile picture...');

        // Read file
        const reader = new FileReader();

        reader.onload = function (event) {
            console.log('📖 FileReader loaded');

            try {
                const imageData = event.target.result;
                const currentUser = getCurrentUser();

                console.log('👤 Current user:', currentUser);

                if (!currentUser) {
                    throw new Error('User not found - please log in again');
                }

                // Try different ways to get user ID
                const userId = currentUser.id || currentUser.user_id || currentUser.landlord_id;

                if (!userId) {
                    throw new Error('User ID not found in profile data');
                }

                // Save to localStorage
                const key = 'landlordProfileImage_' + userId;
                localStorage.setItem(key, imageData);
                console.log('💾 Saved to localStorage with key:', key);

                // Update UI
                if (profileImage && avatarIcon) {
                    profileImage.src = imageData;
                    profileImage.style.display = 'block';
                    avatarIcon.style.display = 'none';
                    console.log('🎨 UI updated');
                }

                hideLoader();
                showToast('✅ Profile picture updated successfully!', 'success');

                // Clear input
                profileImageInput.value = '';

            } catch (error) {
                hideLoader();
                console.error('❌ Error:', error);
                showToast('❌ Error: ' + error.message, 'error');
            }
        };

        reader.onerror = function (error) {
            hideLoader();
            console.error('❌ FileReader error:', error);
            showToast('❌ Error reading file', 'error');
        };

        console.log('🔄 Starting to read file...');
        reader.readAsDataURL(file);
    };

    console.log('✅ Profile Image Upload Setup Complete');
}

// ===== LOAD REVIEWS =====
async function loadReviews() {
    showLoader('Loading reviews...');
    try {
        const response = await apiCall('/reviews/landlord-reviews.php', 'GET');
        hideLoader();

        const container = document.getElementById('landlordReviews');
        if (!container) return;

        if (response.status !== 'success' || !response.data || response.data.reviews.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 40px; background: #f9fafb; border-radius: 12px;">
                    <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;">⭐</div>
                    <p style="color: #6b7280; font-size: 16px; margin: 0;">No reviews yet. Keep up the great work!</p>
                </div>
            `;
            return;
        }

        const { reviews, average_rating, total_reviews } = response.data;

        let html = `
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; text-align: center; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.1);">
                <div style="font-size: 36px; font-weight: 700; color: #f59e0b; margin-bottom: 8px;">⭐ ${average_rating.toFixed(1)}/5.0</div>
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">Based on ${total_reviews} review${total_reviews !== 1 ? 's' : ''}</p>
            </div>
        `;

        // Display individual reviews
        reviews.forEach((review, index) => {
            const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const reviewDate = new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            html += `
                <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: all 0.3s ease; animation: slideInUp 0.4s ease ${index * 0.05}s both;" onmouseover="this.style.boxShadow='0 8px 20px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)'">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                        <div style="flex: 1; min-width: 200px;">
                            <h4 style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600; font-size: 16px;">👤 ${escapeHtml(review.reviewer_name || 'Anonymous Student')}</h4>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">${reviewDate}</p>
                        </div>
                        <div style="font-size: 14px; color: #f59e0b; letter-spacing: 2px;">
                            ${stars}
                        </div>
                    </div>
                    <p style="margin: 12px 0; color: #374151; line-height: 1.6; font-style: italic; padding: 10px; background: #f9fafb; border-radius: 6px;">"${escapeHtml(review.review_text)}"</p>
                    
                    ${review.landlord_response ? `
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 15px;">
                            <p style="margin: 0 0 8px 0; color: #10b981; font-weight: 600; font-size: 13px;">✅ Your Response:</p>
                            <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">${escapeHtml(review.landlord_response)}</p>
                        </div>
                    ` : `
                        <button onclick="showReplyModal(${review.id})" style="background: #2563eb; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; margin-top: 12px; transition: all 0.3s ease;" onmouseover="this.style.background='#1d4ed8'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(37, 99, 235, 0.3)'" onmouseout="this.style.background='#2563eb'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            📝 Respond to Review
                        </button>
                    `}
                </div>
            `;
        });

        container.innerHTML = html;

        // Update stats
        document.getElementById('reviewCount').textContent = total_reviews;
        document.getElementById('totalReviews').textContent = total_reviews;
        document.getElementById('avgRating').textContent = average_rating.toFixed(1);

    } catch (error) {
        hideLoader();
        console.error('Error loading reviews:', error);
        showToast('Error loading reviews', 'error');
    }
}

// ===== SHOW REPLY MODAL =====
function showReplyModal(reviewId) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        animation: fadeIn 0.3s ease;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
    `;

    content.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px;">📝 Respond to Review</h3>
        <textarea id="responseText" placeholder="Write your professional response..." maxlength="500" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 13px; min-height: 120px; resize: vertical; box-sizing: border-box; margin-bottom: 20px; transition: all 0.3s ease;" onmouseover="this.style.borderColor='#2563eb'; this.style.boxShadow='0 0 0 3px rgba(37, 99, 235, 0.1)'" onmouseout="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'"></textarea>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="cancelReply" style="flex: 1; background: #f3f4f6; color: #6b7280; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">Cancel</button>
            <button class="submitReply" style="flex: 1; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;" onmouseover="this.style.background='#1d4ed8'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#2563eb'; this.style.transform='translateY(0)'">Send Response</button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    content.querySelector('.cancelReply').onclick = function () {
        modal.remove();
    };

    content.querySelector('.submitReply').onclick = function () {
        submitReviewResponse(reviewId, modal);
    };
}

// ===== SUBMIT REVIEW RESPONSE =====
async function submitReviewResponse(reviewId, modal) {
    const text = document.querySelector('#responseText').value.trim();

    if (!text) {
        showToast('Please write a response', 'error');
        return;
    }

    if (text.length < 5) {
        showToast('Response must be at least 5 characters', 'error');
        return;
    }

    showLoader('Sending response...');

    try {
        const response = await apiCall('/reviews/respond.php', 'POST', {
            review_id: reviewId,
            response: text
        });

        hideLoader();

        if (response.status === 'success') {
            showToast('✅ Response added!', 'success');
            modal.remove();
            loadReviews();
        } else {
            showToast(response.message || 'Failed to submit response', 'error');
        }
    } catch (error) {
        hideLoader();
        console.error('Error submitting review response:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== UPDATE VERIFICATION STATUS =====
function updateVerificationStatus(currentUser) {
    const verificationContainer = document.querySelector('.verification-badges');
    if (!verificationContainer) return;

    let html = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; width: 100%; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <i class="ri-check-double-line" style="font-size: 1.3em; color: #27ae60; flex-shrink: 0;"></i> 
            <strong style="color: #155724; font-weight: 600;">Verified Landlord Account</strong>
        </div>
    `;

    // Email verification
    if (currentUser.email) {
        html += `
            <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px 15px; background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; width: 100%; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <i class="ri-mail-check-line" style="font-size: 1.3em; color: #27ae60; flex-shrink: 0; margin-top: 2px;"></i>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <strong style="color: #155724; font-weight: 600; display: block;">Email Verified</strong>
                    <p style="margin: 0; font-size: 0.9em; color: #155724;">${currentUser.email}</p>
                </div>
            </div>
        `;
    } else {
        html += `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; background: #f8f9fa; border: 2px solid #e5e7eb; border-radius: 8px; width: 100%;">
                <i class="ri-mail-line" style="font-size: 1.3em; color: #999; flex-shrink: 0;"></i>
                <strong style="color: #555; font-weight: 600;">Email Not Verified</strong>
            </div>
        `;
    }

    // Phone verification
    if (currentUser.phone) {
        html += `
            <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px 15px; background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; width: 100%; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <i class="ri-phone-check-line" style="font-size: 1.3em; color: #27ae60; flex-shrink: 0; margin-top: 2px;"></i>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <strong style="color: #155724; font-weight: 600; display: block;">Phone Verified</strong>
                    <p style="margin: 0; font-size: 0.9em; color: #155724;">${currentUser.phone}</p>
                </div>
            </div>
        `;
    } else {
        html += `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; background: #f8f9fa; border: 2px solid #e5e7eb; border-radius: 8px; width: 100%;">
                <i class="ri-phone-line" style="font-size: 1.3em; color: #999; flex-shrink: 0;"></i>
                <strong style="color: #555; font-weight: 600;">Phone Not Verified</strong>
            </div>
        `;
    }

    verificationContainer.innerHTML = html;
}

// ===== CREATE EDIT MODAL =====
function createEditModal() {
    const modalHTML = `
        <div id="editModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s ease;">
                <h2 style="margin-top: 0; color: #1f2937;">✏️ Edit Your Profile</h2>
                
                <form id="editProfileForm">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Full Name</label>
                        <input type="text" id="editFullname" placeholder="Enter your full name" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 5px; box-sizing: border-box; transition: all 0.3s ease; font-size: 14px;" onmouseover="this.style.borderColor='#2563eb'" onmouseout="this.style.borderColor='#d1d5db'">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Email</label>
                        <input type="email" id="editEmail" placeholder="Enter your email" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 5px; box-sizing: border-box; transition: all 0.3s ease; font-size: 14px;" onmouseover="this.style.borderColor='#2563eb'" onmouseout="this.style.borderColor='#d1d5db'">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Phone Number</label>
                        <input type="tel" id="editPhone" placeholder="Enter your phone number" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 5px; box-sizing: border-box; transition: all 0.3s ease; font-size: 14px;" onmouseover="this.style.borderColor='#2563eb'" onmouseout="this.style.borderColor='#d1d5db'">
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" id="cancelEditBtn" style="padding: 10px 20px; background: #ddd; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: all 0.3s ease;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#ddd'">Cancel</button>
                        <button type="submit" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: all 0.3s ease;" onmouseover="this.style.background='#2980b9'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#3498db'; this.style.transform='translateY(0)'">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup modal event listeners
    const modal = document.getElementById('editModal');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const editForm = document.getElementById('editProfileForm');

    cancelBtn.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    editForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveProfileChanges();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// ===== SETUP EDIT BUTTON =====
function setupEditButton() {
    const editBtn = document.getElementById("editProfileBtn");
    if (editBtn) {
        editBtn.addEventListener("click", openEditModal);
    }
}

// ===== OPEN EDIT MODAL =====
function openEditModal() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Error: User not found', 'error');
        return;
    }

    const modal = document.getElementById('editModal');

    // Populate form with current data
    document.getElementById('editFullname').value = currentUser.fullname || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    document.getElementById('editPhone').value = currentUser.phone || '';

    // Show modal
    modal.style.display = 'flex';
}

// ===== SAVE PROFILE CHANGES =====
function saveProfileChanges() {
    const fullname = document.getElementById('editFullname').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();

    // Validate
    if (!fullname || !email || !phone) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (!email.includes('@')) {
        showToast('Please enter a valid email', 'error');
        return;
    }

    if (phone.length < 7) {
        showToast('Please enter a valid phone number', 'error');
        return;
    }

    // Get current user
    const currentUser = getCurrentUser();

    // Update user data
    currentUser.fullname = fullname;
    currentUser.email = email;
    currentUser.phone = phone;

    // Save to localStorage
    setCurrentUser(currentUser);

    // Close modal
    document.getElementById('editModal').style.display = 'none';

    // Reload profile everywhere
    loadLandlordProfile();

    // Show success message
    showToast('✅ Profile updated successfully!', 'success');
}

// ===== LOAD APARTMENTS =====
async function loadApartments() {
    console.log('Loading apartments...');
    showLoader('Loading apartments...');

    try {
        const response = await getApartmentsByLandlord();

        hideLoader();

        console.log('Apartments response:', response);

        if (response.status !== 'success' || !response.data) {
            console.error('Failed to load apartments');
            return;
        }

        const apartments = response.data;
        console.log('Apartments count:', apartments.length);

        // Update apartment count
        document.getElementById("apartmentCount").textContent = apartments.length;

        // Load apartments section
        const apartmentsContainer = document.getElementById("landlordApartments");
        if (apartmentsContainer) {
            let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">';

            if (apartments.length === 0) {
                html = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No apartments listed yet</p>';
            } else {
                apartments.forEach((apt, index) => {
                    let imageUrl = apt.image_path;

                    console.log('Raw image_path:', imageUrl);

                    // Strip everything and keep just the filename or /uploads/filename
                    if (imageUrl) {
                        // Extract just the filename or uploads path
                        let match = imageUrl.match(/uploads\/(.+)$/) || imageUrl.match(/([^\/]+\.(png|jpg|jpeg|gif|jfif))$/i);

                        if (match) {
                            // Get filename
                            let filename = match[1] || match[0];
                            // Use relative path from current page
                            imageUrl = '../nyumba-find-backend/uploads/' + filename;
                        } else {
                            imageUrl = '';
                        }
                    }

                    console.log('Final Image URL:', imageUrl);

                    html += `
                        <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s, box-shadow 0.3s; background: white; animation: slideInUp 0.4s ease ${index * 0.05}s both;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
                            <img src="${imageUrl}" alt="${escapeHtml(apt.title)}" style="width: 100%; height: 200px; object-fit: cover; background: #f0f0f0;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22250%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2214%22%3EImage not found%3C/text%3E%3C/svg%3E'">
                            <div style="padding: 15px;">
                                <h3 style="margin: 0 0 10px 0; font-size: 1.1em; color: #1f2937; font-weight: 600;">${escapeHtml(apt.title)}</h3>
                                <p style="margin: 5px 0; color: #666; font-size: 13px;"><i class="ri-map-pin-line"></i> ${escapeHtml(apt.location)}</p>
                                <p style="margin: 5px 0; font-weight: bold; color: #27ae60; font-size: 14px;">KSh ${Number(apt.price).toLocaleString()}/month</p>
                                <p style="margin: 5px 0; font-size: 0.9em; color: #666;"><small>${escapeHtml(apt.room_type)}</small></p>
                            </div>
                        </div>
                    `;
                });
            }

            html += '</div>';
            apartmentsContainer.innerHTML = html;
        }
    } catch (error) {
        hideLoader();
        console.error('Error loading apartments:', error);
        showToast('Error loading apartments', 'error');
    }
}

// ===== DARK MODE =====
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);

    const btn = document.getElementById('darkModeToggle');
    if (btn) {
        btn.textContent = isDarkMode ? '☀️' : '🌙';
    }
}

// Initialize dark mode on page load
const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
    document.body.classList.add('dark-mode');
}

const darkModeBtn = document.getElementById('darkModeToggle');
if (darkModeBtn) {
    darkModeBtn.textContent = isDarkMode ? '☀️' : '🌙';
    darkModeBtn.addEventListener('click', toggleDarkMode);
}

// ===== HELPER FUNCTION =====
async function getApartmentsByLandlord() {
    return await apiCall('/apartments/get.php?landlord=true', 'GET');
}
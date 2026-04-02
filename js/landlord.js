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

// ===== CHECK AUTHENTICATION AND ROLE =====
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

if (!isLandlord()) {
    window.location.href = 'student-dashboard.html';
}

console.log("Landlord dashboard loaded");

// ===== GLOBAL VARIABLES =====
let currentConversations = {};
let currentMessagesData = [];
let listings = [];
let messageRefreshInterval;

// ===== UTILITY: DEBOUNCE =====
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// ===== SKELETON LOADER =====
function showSkeletonLoader(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div style="background: white; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 12px; animation: skeleton-loading 1s infinite;">
                <div style="height: 14px; background: #e0e0e0; border-radius: 4px; margin-bottom: 8px;"></div>
                <div style="height: 14px; background: #e0e0e0; border-radius: 4px; width: 80%;"></div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ===== UPDATE MESSAGE BADGE WITH ANIMATION =====
function updateMessageBadge(count) {
    const badge = document.getElementById("messageBadge");
    if (badge) {
        const oldCount = parseInt(badge.textContent) || 0;
        badge.textContent = count;

        if (count > oldCount) {
            badge.style.animation = 'none';
            setTimeout(() => {
                badge.style.animation = 'pulse 0.6s ease';
            }, 10);
        }
    }
}

// ===== LOGOUT FUNCTION =====
window.logout = function () {
    stopMessageRefresh();
    showConfirm('Logout?', function (confirmed) {
        if (confirmed) {
            removeAuthToken();
            localStorage.removeItem("currentUser");
            showToast('Logged out', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    });
}

// ===== GET APARTMENTS BY LANDLORD =====
async function getApartmentsByLandlord() {
    return await apiCall('/apartments/get.php?landlord=true', 'GET');
}

// ===== VALIDATE APARTMENT DATA =====
function validateApartmentData(apartment) {
    return {
        ...apartment,
        title: apartment.title || 'Unnamed Apartment',
        location: apartment.location || 'Location TBD',
        price: apartment.price || 0,
        room_type: apartment.room_type || 'Not specified',
        available: apartment.available || 1
    };
}

// ===== UPDATE DASHBOARD =====
async function updateDashboard() {
    showLoader('Loading dashboard...');
    try {
        const apartmentsResponse = await getApartmentsByLandlord();
        const messagesResponse = await getMessages();
        const reviewsResponse = await getReviewsByLandlord(); // ← ADD THIS
        hideLoader();

        listings = apartmentsResponse.status === 'success' ? apartmentsResponse.data : [];
        const messages = messagesResponse.status === 'success' ? messagesResponse.data : [];
        const reviews = reviewsResponse.status === 'success' ? reviewsResponse.data : []; // ← ADD THIS

        const listingCount = document.getElementById("listingCount");
        if (listingCount) listingCount.textContent = listings.length;

        const messageCount = document.getElementById("messageCount");
        if (messageCount) messageCount.textContent = messages.length;

        const reviewCount = document.getElementById("reviewCount"); // ← ADD THIS
        if (reviewCount) reviewCount.textContent = reviews.length; // ← ADD THIS

        updateMessageBadge(messages.length);
    } catch (error) {
        hideLoader();
        console.error('Error updating dashboard:', error);
        showToast('Failed to load dashboard', 'error');
    }
}

// ===== DISPLAY LISTINGS =====
async function displayListings() {
    showLoader('Loading listings...');
    try {
        const response = await getApartmentsByLandlord();
        hideLoader();

        const table = document.getElementById("listingTable");
        if (!table) {
            console.error('Listing table not found');
            showToast('Error: Table not found', 'error');
            return;
        }

        table.innerHTML = "";

        if (response.status !== 'success' || !response.data || response.data.length === 0) {
            table.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No listings yet!</td></tr>';
            return;
        }

        listings = response.data.map(validateApartmentData);

        listings.forEach(apartment => {
            const row = document.createElement("tr");
            const formattedPrice = Number(apartment.price).toLocaleString();

            let imageUrl = apartment.image_path;

            if (imageUrl && imageUrl.trim() !== '') {
                let filename = imageUrl.replace(/^.*\//g, '').replace(/\\/g, '').trim();
                if (filename && filename.length > 0) {
                    imageUrl = UPLOAD_URL + filename;
                } else {
                    imageUrl = null;
                }
            } else {
                imageUrl = null;
            }

            if (!imageUrl) {
                imageUrl = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2270%22 height=%2250%22%3E%3Crect fill=%22%23ddd%22 width=%2270%22 height=%2250%22/%3C/svg%3E';
            }

            row.innerHTML = `
                <td><img src="${imageUrl}" alt="${apartment.title}" class="listing-img" style="width: 70px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td><strong>${escapeHtml(apartment.title)}</strong></td>
                <td>${escapeHtml(apartment.location)}</td>
                <td>KSh ${formattedPrice}</td>
                <td>
                    <button class="edit-btn" onclick="editListing(${apartment.id})" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 6px; transition: all 0.3s ease;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">Edit</button>
                    <button class="delete-btn" onclick="deleteListing(${apartment.id})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.3s ease;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });
    } catch (error) {
        hideLoader();
        console.error('Error displaying listings:', error);
        showToast('Failed to load listings', 'error');
    }
}

// ===== DELETE LISTING =====
window.deleteListing = async function (apartmentId) {
    const apartment = listings.find(a => a.id === apartmentId);
    const title = apartment ? apartment.title : 'this listing';

    showConfirm(`Delete "${escapeHtml(title)}"?`, async function (confirmed) {
        if (confirmed) {
            showLoader('Deleting...');
            try {
                const response = await deleteApartment(apartmentId);
                hideLoader();

                if (response.status === 'success') {
                    showToast('✅ Listing deleted!', 'success');
                    displayListings();
                    updateDashboard();
                } else {
                    showToast(response.message || 'Failed to delete', 'error');
                }
            } catch (error) {
                hideLoader();
                console.error('Error deleting listing:', error);
                showToast('Error deleting listing', 'error');
            }
        }
    });
}

// ===== EDIT LISTING =====
window.editListing = function (apartmentId) {
    const apartment = listings.find(a => a.id === apartmentId);
    if (!apartment) {
        showToast('Apartment not found', 'error');
        return;
    }

    const title = document.getElementById("title");
    const location = document.getElementById("location");
    const price = document.getElementById("price");
    const roomType = document.getElementById("roomType");

    if (title) title.value = apartment.title;
    if (location) location.value = apartment.location;
    if (price) price.value = apartment.price;
    if (roomType) roomType.value = apartment.room_type;

    const checkboxes = document.querySelectorAll('input.amenity');
    checkboxes.forEach(box => {
        box.checked = apartment.amenities && apartment.amenities.includes(box.value);
    });

    hideAllSections();
    const section = document.getElementById("addApartmentSection");
    if (section) section.style.display = "block";
    const btn = document.getElementById("addApartmentBtn");
    if (btn) btn.classList.add('active');
    showToast('ℹ️ Edit and submit to update', 'info');
}

// ===== SEARCH CONVERSATIONS =====
function searchConversations(searchTerm) {
    const messageBox = document.getElementById("messageBox");
    if (!messageBox) return;

    const cards = messageBox.querySelectorAll('div[data-conversation-key]');
    const term = searchTerm.toLowerCase().trim();

    let visibleCount = 0;
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const isMatch = text.includes(term);
        card.style.display = isMatch ? 'block' : 'none';
        if (isMatch) visibleCount++;
    });

    // Show "no results" message if needed
    if (visibleCount === 0 && term.length > 0) {
        let noResults = document.getElementById('noSearchResults');
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.id = 'noSearchResults';
            noResults.style.cssText = 'text-align: center; padding: 40px; color: #999;';
            messageBox.appendChild(noResults);
        }
        noResults.innerHTML = `<p>No conversations found matching "${escapeHtml(searchTerm)}"</p>`;
    } else {
        const noResults = document.getElementById('noSearchResults');
        if (noResults) noResults.remove();
    }
}

// ===== ADD SEARCH TO MESSAGES =====
function addSearchToMessages() {
    const messagesSection = document.getElementById("messagesSection");
    if (!messagesSection || document.getElementById("messageSearch")) return;

    const messageBox = document.getElementById("messageBox");
    if (!messageBox) return;

    const searchDiv = document.createElement('div');
    searchDiv.id = 'messageSearch';
    searchDiv.style.cssText = `
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
    `;
    searchDiv.innerHTML = `
        <input type="text" id="conversationSearchInput" placeholder="Search conversations by name or apartment..." 
            style="flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; transition: all 0.3s ease;" 
            onmouseover="this.style.borderColor='#2563eb'"
            onmouseout="this.style.borderColor='#d1d5db'">
    `;
    messageBox.parentNode.insertBefore(searchDiv, messageBox);

    const searchInput = document.getElementById("conversationSearchInput");
    const debouncedSearch = debounce(searchConversations, 300);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
}

// ===== CLEAR SEARCH =====
function clearMessageSearch() {
    const searchInput = document.getElementById("conversationSearchInput");
    if (searchInput) {
        searchInput.value = '';
        searchConversations('');
    }
}

// ===== LOAD MESSAGES =====
function loadMessages() {
    const messageBox = document.getElementById("messageBox");
    if (!messageBox) {
        console.error('Message box not found');
        return;
    }

    showSkeletonLoader("messageBox", 4);
    addSearchToMessages();

    getMessages().then(response => {
        hideLoader();

        messageBox.innerHTML = "";
        messageBox.style.cssText = "display: block;";

        if (response.status !== 'success' || !response.data || response.data.length === 0) {
            messageBox.innerHTML = `
                <div style="text-align: center; padding: 100px 40px; color: #9ca3af;">
                    <div style="font-size: 72px; margin-bottom: 25px; opacity: 0.4;">📬</div>
                    <h2 style="margin: 0 0 12px 0; color: #6b7280; font-size: 20px;">No messages yet</h2>
                    <p style="margin: 0; color: #9ca3af; font-size: 14px;">Start conversations with students!</p>
                </div>
            `;
            return;
        }

        currentMessagesData = response.data;
        updateMessageBadge(response.data.length);

        // Group conversations - FIX: Get student_id correctly
        currentConversations = {};
        response.data.forEach((msg) => {
            // Determine who the student is
            // If current user (landlord) is the receiver, then sender is the student
            // If current user (landlord) is the sender, then receiver is the student
            const landlordId = getCurrentUser().user_id;

            let studentId, studentName;

            if (msg.sender_id === landlordId) {
                // Landlord sent this message, so receiver is the student
                studentId = msg.receiver_id;
                studentName = msg.receiver_name || 'Unknown Student';
            } else {
                // Student sent this message, so sender is the student
                studentId = msg.sender_id;
                studentName = msg.sender_name || 'Unknown Student';
            }

            const conversationKey = `${studentId}-${msg.apartment_id}`;

            if (!currentConversations[conversationKey]) {
                currentConversations[conversationKey] = {
                    student: {
                        id: studentId,
                        name: studentName
                    },
                    apartment: {
                        id: msg.apartment_id,
                        title: msg.apartment_title || 'Apartment',
                        location: msg.apartment_location || 'Location'
                    },
                    messages: [],
                    lastMessageTime: new Date(msg.created_at)
                };
            }
            currentConversations[conversationKey].messages.push(msg);
        });

        // Display conversation cards
        Object.entries(currentConversations).forEach(([key, conversation]) => {
            const lastMsg = conversation.messages[conversation.messages.length - 1];
            const dateStr = new Date(lastMsg.created_at).toLocaleDateString();
            const preview = lastMsg.message.length > 65 ? lastMsg.message.substring(0, 65) + '...' : lastMsg.message;

            const card = document.createElement("div");
            card.setAttribute('data-conversation-key', key);
            card.style.cssText = `
                background: white;
                border: 1px solid #e5e7eb;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;

            card.addEventListener('mouseenter', function () {
                this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                this.style.transform = 'translateY(-2px)';
            });

            card.addEventListener('mouseleave', function () {
                this.style.boxShadow = 'none';
                this.style.transform = 'translateY(0)';
            });

            card.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 14px;">👤 ${escapeHtml(conversation.student.name)}</p>
                </div>
                <div style="margin-bottom: 8px;">
                    <p style="margin: 0; color: #374151; font-weight: 500; font-size: 13px;">🏢 ${escapeHtml(conversation.apartment.title)}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">📍 ${escapeHtml(conversation.apartment.location)}</p>
                </div>
                <div style="margin-bottom: 8px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.4;">"${escapeHtml(preview)}"</p>
                </div>
                <p style="margin: 0; color: #9ca3af; font-size: 11px;">📅 ${dateStr}</p>
            `;

            card.addEventListener('click', () => {
                openChatWithStudent(conversation);
            });

            messageBox.appendChild(card);
        });

        addSearchToMessages();
    }).catch(error => {
        hideLoader();
        console.error('Error loading messages:', error);
        messageBox.innerHTML = `
            <div style="text-align: center; padding: 60px 40px; color: #ef4444;">
                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                <p>Failed to load messages. Please try again.</p>
            </div>
        `;
    });
}

// ===== START MESSAGE REFRESH =====
function startMessageRefresh() {
    messageRefreshInterval = setInterval(() => {
        const messagesSection = document.getElementById("messagesSection");
        if (messagesSection && messagesSection.style.display !== "none") {
            console.log('Auto-refreshing messages...');
            loadMessages();
        }
    }, 30000); // 30 seconds
}

// ===== STOP MESSAGE REFRESH =====
function stopMessageRefresh() {
    if (messageRefreshInterval) {
        clearInterval(messageRefreshInterval);
        messageRefreshInterval = null;
    }
}

// ===== OPEN CHAT =====
function openChatWithStudent(conversation) {
    const student = conversation.student;
    const apartment = conversation.apartment;

    if (!student.id || !apartment.id) {
        showToast('Error: Missing student or apartment ID', 'error');
        return;
    }

    const conversationMessages = conversation.messages.sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
    );

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'chatModal';
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
        padding: 20px;
    `;

    const chatBox = document.createElement('div');
    chatBox.style.cssText = `
        display: flex;
        flex-direction: column;
        height: 90vh;
        width: 100%;
        max-width: 800px;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        z-index: 5;
    `;

    const headerContent = document.createElement('div');
    headerContent.innerHTML = `
        <h3 style="margin: 0; font-size: 18px;">👤 ${escapeHtml(student.name)}</h3>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">🏢 ${escapeHtml(apartment.title)}</p>
    `;
    header.appendChild(headerContent);

    const buttonDiv = document.createElement('div');
    buttonDiv.style.cssText = `
        display: flex;
        gap: 10px;
        position: relative;
        z-index: 10;
    `;

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.style.cssText = `
        background: rgba(239, 68, 68, 0.9);
        border: none;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
    `;
    deleteBtn.addEventListener('mouseover', function () {
        this.style.background = 'rgba(239, 68, 68, 1)';
    });
    deleteBtn.addEventListener('mouseout', function () {
        this.style.background = 'rgba(239, 68, 68, 0.9)';
    });
    deleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        deleteChat(student.id, apartment.id, modal);
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close';
    closeBtn.style.cssText = `
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
    `;
    closeBtn.addEventListener('mouseover', function () {
        this.style.background = 'rgba(255,255,255,0.3)';
    });
    closeBtn.addEventListener('mouseout', function () {
        this.style.background = 'rgba(255,255,255,0.2)';
    });
    closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        modal.remove();
        loadMessages();
    });

    buttonDiv.appendChild(deleteBtn);
    buttonDiv.appendChild(closeBtn);
    header.appendChild(buttonDiv);

    // Messages
    const messagesDiv = document.createElement('div');
    messagesDiv.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f9fafb;
        display: flex;
        flex-direction: column;
        gap: 12px;
    `;

    if (conversationMessages.length === 0) {
        messagesDiv.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">No messages yet</div>';
    } else {
        conversationMessages.forEach((msg) => {
            const isFromStudent = msg.sender_id === student.id;
            const msgDiv = document.createElement('div');
            msgDiv.style.cssText = `
                display: flex;
                justify-content: ${isFromStudent ? 'flex-start' : 'flex-end'};
            `;

            const bubble = document.createElement('div');
            bubble.style.cssText = `
                max-width: 70%;
                background: ${isFromStudent ? '#f0f0f0' : '#2563eb'};
                color: ${isFromStudent ? '#333' : '#fff'};
                padding: 10px 14px;
                border-radius: 10px;
                word-break: break-word;
                font-size: 13px;
            `;
            bubble.textContent = msg.message;
            msgDiv.appendChild(bubble);
            messagesDiv.appendChild(msgDiv);
        });
    }

    // Input
    const inputDiv = document.createElement('div');
    inputDiv.style.cssText = `
        background: white;
        border-top: 1px solid #e5e7eb;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;

    // Template row
    const templateRow = document.createElement('div');
    templateRow.style.cssText = `
        display: flex;
        gap: 10px;
    `;

    const templateSelect = document.createElement('select');
    templateSelect.style.cssText = `
        flex: 1;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 12px;
        font-family: inherit;
    `;
    templateSelect.innerHTML = '<option value="">📝 Select template...</option>';

    const insertBtn = document.createElement('button');
    insertBtn.textContent = 'Insert Template';
    insertBtn.style.cssText = `
        padding: 8px 14px;
        background: #8b5cf6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
        white-space: nowrap;
    `;
    insertBtn.addEventListener('mouseover', function () {
        this.style.background = '#7c3aed';
    });
    insertBtn.addEventListener('mouseout', function () {
        this.style.background = '#8b5cf6';
    });
    insertBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (templateSelect.value) {
            const textarea = document.getElementById('landlordReplyTextarea');
            const selectedOpt = templateSelect.options[templateSelect.selectedIndex];
            if (textarea && selectedOpt.dataset.content) {
                textarea.value = selectedOpt.dataset.content;
                textarea.focus();
            }
        }
    });

    templateRow.appendChild(templateSelect);
    templateRow.appendChild(insertBtn);
    inputDiv.appendChild(templateRow);

    // Load templates into dropdown
    apiCall('/message-templates/get.php', 'GET').then(res => {
        if (res.status === 'success' && res.data && res.data.length > 0) {
            res.data.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.name;
                opt.dataset.content = t.content;
                templateSelect.appendChild(opt);
            });
        }
    }).catch(err => console.log('Templates skipped'));

    // Message input row
    const messageRowDiv = document.createElement('div');
    messageRowDiv.style.cssText = `
        display: flex;
        gap: 10px;
    `;

    const textarea = document.createElement('textarea');
    textarea.id = 'landlordReplyTextarea';
    textarea.placeholder = 'Type your reply...';
    textarea.maxLength = 500;
    textarea.style.cssText = `
        flex: 1;
        padding: 10px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-family: inherit;
        font-size: 13px;
        resize: vertical;
        min-height: 50px;
        max-height: 120px;
        transition: all 0.3s ease;
    `;

    // Typing indicator style change
    textarea.addEventListener('focus', function () {
        this.style.borderColor = '#2563eb';
        this.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
    });

    textarea.addEventListener('blur', function () {
        this.style.borderColor = '#d1d5db';
        this.style.boxShadow = 'none';
    });

    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Send';
    sendBtn.style.cssText = `
        padding: 10px 20px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.3s ease;
    `;
    sendBtn.addEventListener('mouseover', function () {
        this.style.background = '#1d4ed8';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
    });
    sendBtn.addEventListener('mouseout', function () {
        this.style.background = '#2563eb';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
    sendBtn.addEventListener('click', function (e) {
        e.preventDefault();
        sendLandlordReply(student.id, apartment.id, modal);
    });

    messageRowDiv.appendChild(textarea);
    messageRowDiv.appendChild(sendBtn);
    inputDiv.appendChild(messageRowDiv);

    chatBox.appendChild(header);
    chatBox.appendChild(messagesDiv);
    chatBox.appendChild(inputDiv);
    modal.appendChild(chatBox);
    document.body.appendChild(modal);

    setTimeout(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        textarea.focus();
    }, 100);
}

async function sendLandlordReply(studentId, apartmentId, modal) {
    const textarea = document.getElementById('landlordReplyTextarea');
    if (!textarea) return;

    const message = textarea.value.trim();

    if (!message || message.length < 2) {
        showToast('Please type a message', 'warning');
        return;
    }

    showLoader('Sending...');

    try {
        const response = await sendMessage(studentId, apartmentId, message);
        hideLoader();

        if (response.status === 'success') {
            showToast('✅ Sent!', 'success');
            textarea.value = '';
            modal.remove();
            // DON'T call loadMessages() here - let the auto-refresh handle it
            // loadMessages();  ← REMOVE THIS LINE
        } else {
            showToast(response.message || 'Failed', 'error');
        }
    } catch (error) {
        hideLoader();
        console.error('Error sending reply:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== DELETE CHAT =====
window.deleteChat = function (studentId, apartmentId, modal) {
    const confirmModal = document.createElement('div');
    confirmModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
    `;

    const confirmBox = document.createElement('div');
    confirmBox.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        animation: slideUp 0.3s ease;
    `;

    confirmBox.innerHTML = `
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px;">🗑️ Delete Conversation?</h3>
        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">This will permanently delete all messages in this conversation. This action cannot be undone.</p>
        <div style="display: flex; gap: 12px;">
            <button class="confirmCancel" style="flex: 1; background: #f3f4f6; color: #6b7280; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s ease;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">Cancel</button>
            <button class="confirmDelete" style="flex: 1; background: #ef4444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s ease;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">Delete</button>
        </div>
    `;

    confirmModal.appendChild(confirmBox);
    document.body.appendChild(confirmModal);

    confirmBox.querySelector('.confirmCancel').onclick = function () {
        confirmModal.remove();
    };

    confirmBox.querySelector('.confirmDelete').onclick = async function () {
        confirmModal.remove();

        showLoader('Deleting...');

        const sId = parseInt(studentId);
        const aId = parseInt(apartmentId);

        if (!sId || !aId) {
            hideLoader();
            showToast('Error: Missing student or apartment ID', 'error');
            return;
        }

        const payload = {
            student_id: sId,
            apartment_id: aId
        };

        try {
            const response = await fetch(API_BASE_URL + '/messages/delete.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            hideLoader();

            if (data.status === 'success') {
                showToast('✅ Chat deleted!', 'success');
                if (modal) modal.remove();
                loadMessages();
            } else {
                showToast('❌ ' + (data.message || 'Failed to delete'), 'error');
            }
        } catch (error) {
            hideLoader();
            console.error('Error deleting chat:', error);
            showToast('❌ Error: ' + error.message, 'error');
        }
    };
}

// ===== LOAD REVIEWS =====
async function loadReviews() {
    showLoader('Loading reviews...');
    try {
        const response = await apiCall('/reviews/landlord-reviews.php', 'GET');
        hideLoader();

        const container = document.getElementById('reviewsContainer');
        if (!container) return;

        if (response.status !== 'success' || !response.data || response.data.reviews.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 60px 40px; color: #999;"><div style="font-size: 48px; margin-bottom: 15px;">⭐</div><p>No reviews yet. Keep up the great work!</p></div>';
            return;
        }

        const { reviews, average_rating, total_reviews } = response.data;

        let html = `
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                <div style="font-size: 36px; font-weight: 700; color: #f59e0b; margin-bottom: 8px;">⭐ ${average_rating.toFixed(1)}/5.0</div>
                <p style="margin: 0; color: #92400e; font-size: 14px;">Based on ${total_reviews} review${total_reviews !== 1 ? 's' : ''}</p>
            </div>
        `;

        reviews.forEach(review => {
            const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const reviewDate = new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            html += `
                <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: all 0.3s ease;" onmouseover="this.style.boxShadow='0 8px 20px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <h4 style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600;">👤 ${escapeHtml(review.reviewer_name || 'Anonymous Student')}</h4>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">${reviewDate}</p>
                        </div>
                        <div style="font-size: 14px; color: #f59e0b;">
                            ${stars}
                        </div>
                    </div>
                    <p style="margin: 12px 0; color: #374151; line-height: 1.6; font-style: italic;">"${escapeHtml(review.review_text)}"</p>
                    
                    ${review.landlord_response ? `
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 15px;">
                            <p style="margin: 0 0 8px 0; color: #10b981; font-weight: 600; font-size: 13px;">✅ Your Response:</p>
                            <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">${escapeHtml(review.landlord_response)}</p>
                        </div>
                    ` : `
                        <button onclick="showReplyModal(${review.id})" style="background: #2563eb; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; margin-top: 12px; transition: all 0.3s ease;" onmouseover="this.style.background='#1d4ed8'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#2563eb'; this.style.transform='translateY(0)'">
                            📝 Respond to Review
                        </button>
                    `}
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        hideLoader();
        console.error('Error loading reviews:', error);
        showToast('Failed to load reviews', 'error');
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
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        animation: slideUp 0.3s ease;
    `;

    content.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #1f2937;">Respond to Review</h3>
        <textarea id="responseText" placeholder="Write your professional response..." maxlength="500" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 13px; min-height: 120px; resize: vertical; box-sizing: border-box; margin-bottom: 20px; transition: all 0.3s ease;" onmouseover="this.style.borderColor='#2563eb'" onmouseout="this.style.borderColor='#d1d5db'"></textarea>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="cancelReply" style="flex: 1; background: #f3f4f6; color: #6b7280; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">Cancel</button>
            <button class="submitReply" style="flex: 1; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;" onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">Send Response</button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    content.querySelector('.cancelReply').onclick = function () {
        modal.remove();
    };

    content.querySelector('.submitReply').onclick = function () {
        submitReview(reviewId, modal);
    };
}

// ===== SUBMIT REVIEW =====
async function submitReview(reviewId, modal) {
    const text = document.querySelector('#responseText').value.trim();

    if (!text) {
        showToast('Please write a response', 'error');
        return;
    }

    showLoader('Sending...');

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
            showToast(response.message || 'Failed', 'error');
        }
    } catch (error) {
        hideLoader();
        console.error('Error submitting review:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== LOAD NOTIFICATIONS =====
async function loadNotifications() {
    showLoader('Loading notifications...');
    try {
        const response = await apiCall('/notifications/get.php', 'GET');
        hideLoader();

        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        const notifications = response.data?.notifications || [];

        if (response.status !== 'success' || notifications.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No notifications yet</p>';
            return;
        }

        let html = '';
        notifications.forEach(notif => {
            const icon = notif.type === 'new_inquiry' ? '❓' : (notif.type === 'message' ? '💬' : '⭐');
            const time = new Date(notif.created_at).toLocaleString();

            html += `
                <div style="background: white; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 12px; transition: all 0.3s ease; ${notif.is_read ? 'opacity: 0.7;' : ''}" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
                    <h4 style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px;">
                        ${icon} ${escapeHtml(notif.title || 'Notification')}
                    </h4>
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;">${escapeHtml(notif.message || 'New notification')}</p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">📅 ${time}</p>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        hideLoader();
        console.error('Error loading notifications:', error);
        showToast('Failed to load notifications', 'error');
    }
}

// ===== LOAD TEMPLATES =====
async function loadTemplates() {
    showLoader('Loading templates...');
    try {
        const response = await apiCall('/message-templates/get.php', 'GET');
        hideLoader();

        const container = document.getElementById('templatesContainer');
        if (!container) return;

        if (response.status !== 'success' || !response.data || response.data.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #999; padding: 40px;">No templates. <a href="javascript:showCreateTemplateModal();" style="color: #2563eb; cursor: pointer; text-decoration: underline;">Create one</a></p>`;
            return;
        }

        let html = '<button onclick="showCreateTemplateModal()" style="background: #10b981; color: white; padding: 10px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-bottom: 16px; transition: all 0.3s ease;" onmouseover="this.style.background=\'#059669\'" onmouseout="this.style.background=\'#10b981\'">➕ New Template</button>';

        response.data.forEach(template => {
            html += `
                <div style="background: white; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; transition: all 0.3s ease;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 6px 0; color: #1f2937; font-weight: 600;">${escapeHtml(template.name)}</h4>
                        <p style="margin: 0; color: #6b7280; font-size: 13px;">"${escapeHtml(template.content)}"</p>
                    </div>
                    <button onclick="deleteTemplate(${template.id})" style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; white-space: nowrap; transition: all 0.3s ease;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">Delete</button>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        hideLoader();
        console.error('Error loading templates:', error);
        showToast('Failed to load templates', 'error');
    }
}

// ===== SHOW CREATE TEMPLATE MODAL =====
function showCreateTemplateModal() {
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
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        animation: slideUp 0.3s ease;
    `;

    content.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #1f2937;">Create Template</h3>
        <input type="text" class="tplName" placeholder="Template name" maxlength="100" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 12px; font-size: 13px; box-sizing: border-box; transition: all 0.3s ease;" onmouseover="this.style.borderColor='#2563eb'" onmouseout="this.style.borderColor='#d1d5db'">
        <textarea class="tplContent" placeholder="Message content..." maxlength="500" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 13px; min-height: 100px; resize: vertical; box-sizing: border-box; margin-bottom: 16px; transition: all 0.3s ease;" onmouseover="this.style.borderColor='#2563eb'" onmouseout="this.style.borderColor='#d1d5db'"></textarea>
        <div style="display: flex; gap: 10px;">
            <button class="cancelTpl" style="flex: 1; background: #f3f4f6; color: #6b7280; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">Cancel</button>
            <button class="createTpl" style="flex: 1; background: #10b981; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">Create</button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    content.querySelector('.cancelTpl').onclick = function () {
        modal.remove();
    };

    content.querySelector('.createTpl').onclick = function () {
        createTemplate(modal);
    };
}

// ===== CREATE TEMPLATE =====
async function createTemplate(modal) {
    const name = document.querySelector('.tplName').value.trim();
    const content = document.querySelector('.tplContent').value.trim();

    if (!name || !content) {
        showToast('Please fill all fields', 'error');
        return;
    }

    showLoader('Creating...');

    try {
        const response = await apiCall('/message-templates/create.php', 'POST', { name, content });

        hideLoader();

        if (response.status === 'success') {
            showToast('✅ Created!', 'success');
            modal.remove();
            loadTemplates();
        } else {
            showToast(response.message || 'Failed', 'error');
        }
    } catch (error) {
        hideLoader();
        console.error('Error creating template:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== DELETE TEMPLATE =====
async function deleteTemplate(templateId) {
    showConfirm('Delete this template?', async function (confirmed) {
        if (confirmed) {
            showLoader('Deleting...');
            try {
                const response = await apiCall('/message-templates/delete.php', 'DELETE', { template_id: templateId });
                hideLoader();

                if (response.status === 'success') {
                    showToast('✅ Deleted!', 'success');
                    loadTemplates();
                } else {
                    showToast(response.message || 'Failed', 'error');
                }
            } catch (error) {
                hideLoader();
                console.error('Error deleting template:', error);
                showToast('Error: ' + error.message, 'error');
            }
        }
    });
}

// ===== HIDE ALL SECTIONS =====
function hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(s => s.style.display = "none");
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
    console.log('Landlord dashboard initializing...');

    const dashboardBtn = document.getElementById("dashboardBtn");
    const listingsBtn = document.getElementById("listingsBtn");
    const addApartmentBtn = document.getElementById("addApartmentBtn");
    const messagesBtn = document.getElementById("messagesBtn");
    const reviewsBtn = document.getElementById("reviewsBtn");
    const notificationsBtn = document.getElementById("notificationsBtn");
    const templatesBtn = document.getElementById("templatesBtn");
    const profileBtn = document.getElementById("profileBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (dashboardBtn) dashboardBtn.addEventListener("click", () => {
        stopMessageRefresh();
        hideAllSections();
        const s = document.getElementById("dashboardSection");
        if (s) s.style.display = "block";
        dashboardBtn.classList.add('active');
        updateDashboard();
    });

    if (listingsBtn) listingsBtn.addEventListener("click", () => {
        stopMessageRefresh();
        hideAllSections();
        const s = document.getElementById("listingsSection");
        if (s) s.style.display = "block";
        listingsBtn.classList.add('active');
        displayListings();
    });

    if (messagesBtn) messagesBtn.addEventListener("click", () => {
        hideAllSections();
        const s = document.getElementById("messagesSection");
        if (s) s.style.display = "block";
        messagesBtn.classList.add('active');
        loadMessages();
        startMessageRefresh();
    });

    if (reviewsBtn) reviewsBtn.addEventListener("click", () => {
        stopMessageRefresh();
        hideAllSections();
        const s = document.getElementById("reviewsSection");
        if (s) s.style.display = "block";
        reviewsBtn.classList.add('active');
        loadReviews();
    });

    if (notificationsBtn) notificationsBtn.addEventListener("click", () => {
        stopMessageRefresh();
        hideAllSections();
        const s = document.getElementById("notificationsSection");
        if (s) s.style.display = "block";
        notificationsBtn.classList.add('active');
        loadNotifications();
    });

    if (templatesBtn) templatesBtn.addEventListener("click", () => {
        stopMessageRefresh();
        hideAllSections();
        const s = document.getElementById("templatesSection");
        if (s) s.style.display = "block";
        templatesBtn.classList.add('active');
        loadTemplates();
    });

    if (addApartmentBtn) addApartmentBtn.addEventListener("click", () => {
        stopMessageRefresh();
        hideAllSections();
        const s = document.getElementById("addApartmentSection");
        if (s) s.style.display = "block";
        addApartmentBtn.classList.add('active');
        const f = document.getElementById("listingForm");
        if (f) f.reset();
        const p = document.getElementById("imagePreview");
        if (p) p.innerHTML = "";
    });

    if (profileBtn) profileBtn.addEventListener("click", () => {
        stopMessageRefresh();
        window.location.href = "landlord-profile.html";
    });

    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');

    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 300px; border-radius: 8px;">`;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    const form = document.getElementById("listingForm");
    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            const title = document.getElementById("title").value.trim();
            const location = document.getElementById("location").value.trim();
            const price = document.getElementById("price").value.trim();
            const roomType = document.getElementById("roomType").value;

            const imageFile = document.getElementById("image").files[0];

            if (!title || !location || !roomType || !price || !imageFile) {
                showToast('Please fill all fields', 'error');
                return;
            }

            showLoader('Uploading...');
            try {
                const uploadResponse = await uploadImage(imageFile);
                hideLoader();

                if (uploadResponse.status !== 'success') {
                    showToast('Failed to upload image', 'error');
                    return;
                }

                const imagePath = uploadResponse.data.url || uploadResponse.data.filename;

                showLoader('Creating apartment...');
                const response = await createApartment({
                    title, location, price, room_type: roomType,
                    amenities: Array.from(document.querySelectorAll('input.amenity:checked')).map(cb => cb.value),
                    image_path: imagePath,
                    description: ''
                });
                hideLoader();

                if (response.status === 'success') {
                    showToast('✅ Apartment added!', 'success');
                    form.reset();
                    imagePreview.innerHTML = "";
                    hideAllSections();
                    const s = document.getElementById("dashboardSection");
                    if (s) s.style.display = "block";
                    if (dashboardBtn) dashboardBtn.classList.add('active');
                    updateDashboard();
                } else {
                    showToast(response.message || 'Failed', 'error');
                }
            } catch (error) {
                hideLoader();
                console.error('Error creating apartment:', error);
                showToast('Error: ' + error.message, 'error');
            }
        });
    }

    hideAllSections();
    const s = document.getElementById("dashboardSection");
    if (s) s.style.display = "block";
    if (dashboardBtn) dashboardBtn.classList.add('active');
    updateDashboard();

    console.log('Landlord dashboard initialized successfully');
});
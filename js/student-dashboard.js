// ===== student-dashboard.js =====
// ===== AUTH CHECK =====
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

if (!isStudent()) {
    window.location.href = 'landlord-dashboard.html';
}

console.log("Student dashboard loaded");

// ===== STATE =====
let apartments = [];
let filteredApartments = [];
let paginationManager = null;
let selectedApartmentsForComparison = [];
let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
let currentView = 'dashboard';
let currentUserId = null;

// ===== DARK MODE =====
function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = isDark ? '<i class="ri-moon-line"></i>' : '<i class="ri-sun-line"></i>';
        themeToggle.addEventListener('click', () => {
            const isDarkNow = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDarkNow);
            themeToggle.innerHTML = isDarkNow ? '<i class="ri-moon-line"></i>' : '<i class="ri-sun-line"></i>';
            showToast(isDarkNow ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'info');
        });
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard initializing...');

    initDarkMode();
    setupSidebar();
    setupHeaderDropdowns();

    const currentUser = getCurrentUser();
    console.log('📋 Current user:', currentUser);

    if (!currentUser) {
        console.error('❌ No current user found');
        window.location.href = 'login.html';
        return;
    }

    currentUserId = currentUser.user_id;
    console.log('✅ currentUserId:', currentUserId);

    updateUserInfo(currentUser);

    const [comparisonsResult, apartmentsResult] = await Promise.all([
        loadComparisons(),
        loadApartments()
    ]);

    displayDashboardApartments();
    updateCompareBadge();
    updateStats();
    setupEventListeners();

    console.log('✅ Dashboard ready with', selectedApartmentsForComparison.length, 'comparisons');
});

// ===== LOAD COMPARISONS FROM BACKEND =====
async function loadComparisons() {
    console.log('📥 Loading comparisons...');

    if (!currentUserId || currentUserId === undefined || currentUserId === 'undefined' || currentUserId === null) {
        console.error('❌ Cannot load comparisons - currentUserId is invalid!', currentUserId);
        selectedApartmentsForComparison = [];
        return;
    }

    try {
        const response = await getComparisons(currentUserId);

        if (response && response.status === 'success') {
            if (response.data && response.data.apartments && Array.isArray(response.data.apartments)) {
                selectedApartmentsForComparison = response.data.apartments.map(apt => apt.id);
                console.log('✅ Loaded', selectedApartmentsForComparison.length, 'comparisons');
            } else {
                selectedApartmentsForComparison = [];
            }
        } else {
            selectedApartmentsForComparison = [];
        }
    } catch (error) {
        console.error('❌ Error loading comparisons:', error);
        selectedApartmentsForComparison = [];
    }
}

// ===== UPDATE COMPARE BADGE =====
function updateCompareBadge() {
    const badge = document.getElementById('sidebarCompareBadge');
    if (badge) {
        badge.textContent = selectedApartmentsForComparison.length;
    }
}

// ===== SIDEBAR =====
function setupSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menuItems = document.querySelectorAll('.menu-item');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('closed');
            overlay.classList.toggle('active');
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.add('closed');
            overlay.classList.remove('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.add('closed');
            overlay.classList.remove('active');
        });
    }

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(m => m.classList.remove('active'));
            item.classList.add('active');

            const section = item.dataset.section;
            showView(section);

            if (window.innerWidth <= 1024) {
                sidebar.classList.add('closed');
                overlay.classList.remove('active');
            }
        });
    });
}

// ===== HEADER DROPDOWNS =====
function setupHeaderDropdowns() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            profileDropdown.classList.remove('active');
        });

        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const dropdownItems = profileDropdown.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = item.dataset.action;
                if (action === 'profile') showView('profile');
                else if (action === 'saved') showView('saved');
                else if (action === 'messages') showView('messages');
                profileDropdown.classList.remove('active');
            });
        });

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }
}

// ===== USER INFO =====
function updateUserInfo(user) {
    if (document.getElementById('welcomeName')) document.getElementById('welcomeName').textContent = user.fullname || 'User';
    if (document.getElementById('dropdownName')) document.getElementById('dropdownName').textContent = user.fullname || 'User';
    if (document.getElementById('dropdownEmail')) document.getElementById('dropdownEmail').textContent = user.email || 'user@email.com';
    if (document.getElementById('sidebarUserName')) document.getElementById('sidebarUserName').textContent = user.fullname || 'Student';
    if (document.getElementById('sidebarUserEmail')) document.getElementById('sidebarUserEmail').textContent = user.email || 'user@email.com';
    if (document.getElementById('profileName')) document.getElementById('profileName').textContent = user.fullname || 'User';
    if (document.getElementById('profileEmail')) document.getElementById('profileEmail').textContent = user.email || 'user@email.com';
    if (document.getElementById('profilePhone')) document.getElementById('profilePhone').textContent = user.phone || 'Not provided';

    const profileDate = document.getElementById('profileDate');
    if (profileDate) {
        const date = new Date(user.created_at || new Date());
        profileDate.textContent = date.toLocaleDateString();
    }

    const bannerMessage = document.getElementById('bannerMessage');
    if (bannerMessage) {
        const hour = new Date().getHours();
        let message = 'Ready to find your perfect apartment?';
        if (hour < 12) message = '🌅 Good morning! Start your apartment search.';
        else if (hour < 17) message = '☀️ Good afternoon! Browse available apartments.';
        else message = '🌙 Good evening! Explore housing options.';
        bannerMessage.textContent = message;
    }
}

// ===== VIEW MANAGEMENT =====
function showView(viewName) {
    document.querySelectorAll('.view-section').forEach(view => {
        view.style.display = 'none';
    });

    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === viewName);
    });

    const view = document.getElementById(viewName + 'View');
    if (view) view.style.display = 'block';

    currentView = viewName;

    if (viewName === 'saved') loadSavedApartments();
    else if (viewName === 'messages') loadMessagesView();
    else if (viewName === 'browse') setupBrowseView();
    else if (viewName === 'compare') displayComparison();

    window.scrollTo(0, 0);

    if (viewName === 'map') {
        setTimeout(() => loadMapView(), 100);
    }
}

// ===== LOAD APARTMENTS =====
async function loadApartments() {
    showLoader('Loading apartments...');
    const response = await getApartments();
    hideLoader();

    if (response.status !== 'success' || !response.data) {
        showToast('Failed to load apartments', 'error');
        return;
    }

    apartments = response.data;
    console.log('Apartments loaded:', apartments.length);
}

// ===== DISPLAY DASHBOARD =====
function displayDashboardApartments() {
    const featuredContainer = document.getElementById('featuredContainer');
    if (!featuredContainer) return;

    const featured = apartments.slice(0, 4);
    featuredContainer.innerHTML = '';
    featured.forEach(apt => {
        featuredContainer.appendChild(createApartmentCard(apt));
    });

    const recentlyViewedSection = document.getElementById('recentlyViewedSection');
    if (recentlyViewedSection && recentlyViewed.length > 0) {
        recentlyViewedSection.style.display = 'block';
        const recentContainer = document.getElementById('recentlyViewedContainer');
        if (recentContainer) {
            recentContainer.innerHTML = '';
            recentlyViewed.slice(0, 4).forEach(aptId => {
                const apt = apartments.find(a => a.id === aptId);
                if (apt) recentContainer.appendChild(createApartmentCard(apt));
            });
        }
    }
}

// ===== BROWSE VIEW =====
function setupBrowseView() {
    const apartmentContainer = document.getElementById('apartmentContainer');
    if (!apartmentContainer) return;

    filteredApartments = [...apartments];

    if (filteredApartments.length === 0) {
        apartmentContainer.innerHTML = '<div class="empty-message" style="grid-column: 1/-1;"><i class="ri-search-line"></i><h3>No apartments found</h3><p>Try adjusting your filters</p></div>';
        return;
    }

    paginationManager = paginate(filteredApartments, 9);
    displayBrowsePage(1);
}

function displayBrowsePage(pageNum) {
    const container = document.getElementById('apartmentContainer');
    if (!container || !paginationManager) return;

    const pageApts = paginationManager.getPage(pageNum);
    container.innerHTML = '';

    if (pageApts.length === 0) {
        container.innerHTML = '<div class="empty-message" style="grid-column: 1/-1;"><i class="ri-search-line"></i><h3>No apartments found</h3><p>Try adjusting your filters</p></div>';
    } else {
        pageApts.forEach(apt => {
            container.appendChild(createApartmentCard(apt, true));
        });
    }

    updatePaginationUI();
    updateResultsInfo();
}

function createApartmentCard(apt, isBrowse = false) {
    const card = document.createElement('div');
    card.className = 'card';

    let imageUrl = apt.image_path || '';
    if (imageUrl && imageUrl.trim()) {
        const filename = imageUrl.split('/').pop();
        imageUrl = UPLOAD_URL + filename;
    } else {
        imageUrl = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22270%22 height=%22200%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22270%22 height=%22200%22/%3E%3C/svg%3E';
    }

    const price = Number(apt.price || 0).toLocaleString();
    const isSaved = JSON.parse(localStorage.getItem('saved_apartments') || '[]').includes(apt.id);
    const isComparing = selectedApartmentsForComparison.includes(apt.id);

    card.innerHTML = `
        <div class="card-image">
            <img src="${imageUrl}" alt="${escapeHtml(apt.title)}" loading="lazy">
            <span class="card-badge">${apt.room_type}</span>
        </div>
        <div class="card-content">
            <div class="card-header">
                <div class="card-price">KSh ${price}</div>
                <button class="card-save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSave(${apt.id}, this)">
                    <i class="ri-heart-${isSaved ? 'fill' : 'line'}"></i>
                </button>
            </div>
            <div class="card-title">${escapeHtml(apt.title)}</div>
            <div class="card-location">
                <i class="ri-map-pin-line"></i> ${escapeHtml(apt.location)}
            </div>
            <div class="card-amenities">
                ${(apt.amenities || []).slice(0, 2).map(a => `<span class="amenity-tag">${a}</span>`).join('')}
            </div>
            <div class="card-footer">
                <button class="btn-primary" onclick="viewApartment(${apt.id})">
                    <i class="ri-eye-line"></i> View
                </button>
                <button class="btn-secondary ${isComparing ? 'active' : ''}" id="compare-btn-${apt.id}" onclick="toggleCompare(${apt.id})">
                    <i class="ri-equalizer-line"></i>
                </button>
            </div>
        </div>
    `;

    return card;
}

function updatePaginationUI() {
    if (!paginationManager) return;

    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const paginationContainer = document.getElementById('paginationContainer');

    const currentPage = paginationManager.currentPage;
    const totalPages = paginationManager.getTotalPages();

    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;

    if (totalPages > 1 && paginationContainer) {
        paginationContainer.style.display = 'flex';
    }
}

function updateResultsInfo() {
    const resultsInfo = document.getElementById('resultsCount');
    if (resultsInfo) {
        resultsInfo.textContent = `${filteredApartments.length} apartment${filteredApartments.length !== 1 ? 's' : ''} found`;
    }
}

// ===== SAVED APARTMENTS =====
async function loadSavedApartments() {
    showLoader('Loading saved apartments...');
    const response = await getSavedApartments();
    hideLoader();

    const container = document.getElementById('savedContainer');
    if (!container) return;

    container.innerHTML = '';

    if (response.status !== 'success' || !response.data || response.data.length === 0) {
        container.innerHTML = '<div class="empty-message" style="grid-column: 1/-1;"><i class="ri-heart-line"></i><h3>No saved apartments</h3><p>Start saving your favorite apartments!</p></div>';
        return;
    }

    response.data.forEach(apt => {
        container.appendChild(createApartmentCard(apt));
    });
}

async function toggleSave(apartmentId, btn) {
    const currentUser = getCurrentUser();
    const userId = currentUser.user_id;

    let saved = JSON.parse(localStorage.getItem('saved_apartments') || '[]');

    if (saved.includes(apartmentId)) {
        // ===== REMOVE FROM SAVED =====
        saved = saved.filter(id => id !== apartmentId);
        showToast('❌ Removed from saved', 'info');

        const response = await unsaveSavedApartment(userId, apartmentId);
        if (response.status !== 'success') {
            showToast('Error unsaving apartment', 'error');
            return;
        }

        // ===== UPDATE BUTTON IMMEDIATELY =====
        if (btn) {
            btn.classList.remove('saved');
            btn.innerHTML = '<i class="ri-heart-line"></i>';
        }

        // ===== RELOAD SAVED VIEW IF VIEWING IT =====
        if (currentView === 'saved') {
            await loadSavedApartments();
        }
    } else {
        // ===== ADD TO SAVED =====
        saved.push(apartmentId);
        showToast('❤️ Saved!', 'success');

        const response = await saveSavedApartment(userId, apartmentId);
        if (response.status !== 'success') {
            showToast('Error saving apartment', 'error');
            return;
        }

        // ===== UPDATE BUTTON IMMEDIATELY =====
        if (btn) {
            btn.classList.add('saved');
            btn.innerHTML = '<i class="ri-heart-fill"></i>';
        }

        // ===== RELOAD SAVED VIEW IF VIEWING IT =====
        if (currentView === 'saved') {
            await loadSavedApartments();
        }
    }

    // ===== ALWAYS UPDATE LOCALSTORAGE =====
    localStorage.setItem('saved_apartments', JSON.stringify(saved));

    // ===== ALWAYS UPDATE STATS =====
    updateStats();
}

// ===== MESSAGES =====
// ===== MESSAGES =====
async function loadMessagesView() {
    showLoader('Loading messages...');
    const response = await getMessages();
    hideLoader();

    const container = document.getElementById('messagesContainer');
    if (!container) return;

    container.innerHTML = '';

    if (response.status !== 'success' || !response.data || response.data.length === 0) {
        container.innerHTML = '<div class="empty-message" style="grid-column: 1/-1;"><i class="ri-mail-open-line"></i><h3>No conversations</h3><p>Start messaging landlords!</p></div>';
        return;
    }

    // Group messages by apartment
    const conversations = {};
    response.data.forEach(msg => {
        const aptId = msg.apartment_id;
        if (!conversations[aptId]) {
            conversations[aptId] = {
                apartment: { id: msg.apartment_id, title: msg.apartment_title, location: msg.apartment_location, price: msg.apartment_price, landlord_id: msg.landlord_id },
                messages: []
            };
        }
        conversations[aptId].messages.push(msg);
    });

    // Display each conversation
    Object.values(conversations).forEach(conv => {
        const price = Number(conv.apartment.price || 0).toLocaleString();

        // Create conversation card
        const card = document.createElement('div');
        card.style.cssText = `
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 0;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: all 0.3s;
            overflow: hidden;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `
            <div>
                <h3 style="margin: 0 0 4px 0; font-size: 18px;">${escapeHtml(conv.apartment.title)}</h3>
                <p style="margin: 0; font-size: 13px; opacity: 0.9;">
                    <i class="ri-map-pin-line"></i> ${escapeHtml(conv.apartment.location)} • KSh ${price}/month
                </p>
            </div>
        `;

        // Messages container
        const messagesDiv = document.createElement('div');
        messagesDiv.style.cssText = `
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
            background: #f9fafb;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;

        // Sort messages by date (oldest first)
        const sortedMessages = [...conv.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        // Display all messages
        sortedMessages.forEach(msg => {
            const isUserMessage = msg.sender_id === currentUserId;
            const msgDate = new Date(msg.created_at);
            const msgTime = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const msgDate2 = msgDate.toLocaleDateString();

            const messageBubble = document.createElement('div');
            messageBubble.style.cssText = `
                display: flex;
                justify-content: ${isUserMessage ? 'flex-end' : 'flex-start'};
                margin-bottom: 8px;
            `;

            messageBubble.innerHTML = `
                <div style="
                    max-width: 70%;
                    background: ${isUserMessage ? '#2563eb' : '#e5e7eb'};
                    color: ${isUserMessage ? 'white' : '#1f2937'};
                    padding: 12px 16px;
                    border-radius: 12px;
                    word-wrap: break-word;
                ">
                    <p style="margin: 0; font-size: 14px; line-height: 1.4;">
                        ${escapeHtml(msg.message)}
                    </p>
                    <small style="
                        font-size: 11px;
                        opacity: 0.7;
                        margin-top: 6px;
                        display: block;
                    ">
                        ${msgTime} • ${msgDate2}
                    </small>
                </div>
            `;

            messagesDiv.appendChild(messageBubble);
        });

        // Footer with buttons
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 16px 20px;
            background: white;
            display: flex;
            gap: 8px;
            border-top: 1px solid #e5e7eb;
        `;

        footer.innerHTML = `
            <button onclick="viewApartment(${conv.apartment.id})" style="
                flex: 1;
                padding: 12px;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                transition: background 0.2s;
            " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
                <i class="ri-eye-line"></i> View Apartment
            </button>
            <button onclick="openReplyDrawer(${conv.apartment.id})" style="
                flex: 1;
                padding: 12px;
                background: #10b981;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                transition: background 0.2s;
            " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                <i class="ri-reply-line"></i> Reply
            </button>
        `;

        // Append all parts
        card.appendChild(header);
        card.appendChild(messagesDiv);
        card.appendChild(footer);

        container.appendChild(card);
    });

    setupMessageDrawer();
}

// ===== OPEN REPLY DRAWER =====
function openReplyDrawer(apartmentId) {
    const drawer = document.getElementById('replyDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const select = document.getElementById('messageApartmentSelect');

    if (!drawer || !select) return;

    select.value = apartmentId;
    updateDrawerApartmentInfo();

    drawer.style.right = '0';
    overlay.style.display = 'block';
    overlay.style.background = 'rgba(0, 0, 0, 0.5)';

    document.getElementById('messageInput').focus();
}

// ===== CLOSE REPLY DRAWER =====
function closeReplyDrawer() {
    const drawer = document.getElementById('replyDrawer');
    const overlay = document.getElementById('drawerOverlay');

    if (!drawer) return;

    drawer.style.right = '-400px';
    overlay.style.background = 'rgba(0, 0, 0, 0)';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

// ===== UPDATE DRAWER INFO =====
function updateDrawerApartmentInfo() {
    const select = document.getElementById('messageApartmentSelect');
    const aptId = parseInt(select.value);
    const apt = apartments.find(a => a.id === aptId);

    if (apt) {
        document.getElementById('selectedAptTitle').textContent = apt.title;
        document.getElementById('selectedAptLocation').textContent = `📍 ${apt.location}`;
        document.getElementById('selectedAptPrice').textContent = `KSh ${Number(apt.price).toLocaleString()}/month`;
    }
}

// ===== SETUP MESSAGE DRAWER =====
function setupMessageDrawer() {
    const form = document.getElementById('messageForm');
    const select = document.getElementById('messageApartmentSelect');
    const textarea = document.getElementById('messageInput');
    const closeBtn = document.getElementById('closeDrawer');
    const cancelBtn = document.getElementById('cancelDrawer');

    if (!form || !select || !textarea) {
        console.error('Form elements not found');
        return;
    }

    // Populate select
    select.innerHTML = '<option value="">-- Choose apartment --</option>';
    apartments.forEach(apt => {
        const opt = document.createElement('option');
        opt.value = apt.id;
        opt.text = apt.title;
        select.appendChild(opt);
    });

    // Close buttons
    if (closeBtn) closeBtn.onclick = closeReplyDrawer;
    if (cancelBtn) cancelBtn.onclick = closeReplyDrawer;

    // Form submit
    form.onsubmit = async (e) => {
        e.preventDefault();

        const aptId = parseInt(select.value);
        const msg = textarea.value.trim();

        if (!aptId || !msg) {
            showToast('Select apartment and type message', 'error');
            return;
        }

        const apt = apartments.find(a => a.id === aptId);
        if (!apt || !apt.landlord_id) {
            showToast('Landlord not found', 'error');
            return;
        }

        showLoader('Sending...');
        const res = await sendMessage(apt.landlord_id, aptId, msg);
        hideLoader();

        if (res && res.status === 'success') {
            showToast('✅ Sent!', 'success');
            textarea.value = '';
            select.value = '';
            closeReplyDrawer();
            setTimeout(() => loadMessagesView(), 1000);
        } else {
            showToast('Error: ' + (res?.message || 'Failed'), 'error');
        }
    };
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    const searchLocation = document.getElementById('searchLocation');
    const priceMax = document.getElementById('priceMax');
    const priceSlider = document.getElementById('priceSlider');
    const sortBy = document.getElementById('sortBy');
    const amenityFilters = document.querySelectorAll('.amenity-filter');
    const roomTypeBtns = document.querySelectorAll('.room-type-btn');

    if (searchLocation) searchLocation.addEventListener('input', () => applyFilters());
    if (priceMax) priceMax.addEventListener('change', () => {
        if (priceSlider) priceSlider.value = priceMax.value;
        applyFilters();
    });
    if (priceSlider) priceSlider.addEventListener('input', () => {
        if (priceMax) priceMax.value = priceSlider.value;
        applyFilters();
    });
    if (sortBy) sortBy.addEventListener('change', () => applyFilters());

    amenityFilters.forEach(filter => {
        filter.addEventListener('change', () => applyFilters());
    });

    roomTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roomTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            const drawer = document.getElementById('filterDrawer');
            if (drawer) drawer.style.display = 'none';
            showToast('✅ Filters applied!', 'success');
        });
    }

    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);

    const filterToggle = document.getElementById('filterToggle');
    const filterClose = document.getElementById('filterClose');

    if (filterToggle) {
        filterToggle.addEventListener('click', () => {
            const drawer = document.getElementById('filterDrawer');
            if (drawer) {
                drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    if (filterClose) {
        filterClose.addEventListener('click', () => {
            const drawer = document.getElementById('filterDrawer');
            if (drawer) drawer.style.display = 'none';
        });
    }

    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => showView(btn.dataset.action));
    });

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (paginationManager && paginationManager.currentPage > 1) {
                displayBrowsePage(paginationManager.currentPage - 1);
                window.scrollTo(0, 0);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (paginationManager && paginationManager.currentPage < paginationManager.getTotalPages()) {
                displayBrowsePage(paginationManager.currentPage + 1);
                window.scrollTo(0, 0);
            }
        });
    }

    const fab = document.getElementById('fab');
    if (fab) {
        fab.addEventListener('click', () => {
            showView('browse');
            setTimeout(() => {
                const drawer = document.getElementById('filterDrawer');
                if (drawer) drawer.style.display = 'block';
            }, 100);
        });
    }

    const viewAllLink = document.querySelector('.view-all');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView('browse');
        });
    }



    // Add map view loading
    const mapMenuItem = document.querySelector('[data-section="map"]');
    if (mapMenuItem) {
        mapMenuItem.addEventListener('click', () => {
            loadMapView();
        });
    }
}

// ===== FILTERS =====
function applyFilters() {
    const searchLocation = document.getElementById('searchLocation');
    const priceMax = document.getElementById('priceMax');
    const sortBy = document.getElementById('sortBy');

    const location = (searchLocation?.value || '').toLowerCase().trim();
    const maxPrice = Number(priceMax?.value || 100000);
    const sortValue = sortBy?.value || 'newest';
    const amenities = Array.from(document.querySelectorAll('.amenity-filter:checked')).map(el => el.value);
    const activeRoomType = document.querySelector('.room-type-btn.active');
    const roomType = activeRoomType?.dataset.type || '';

    filteredApartments = apartments.filter(apt => {
        const price = Number(apt.price) || 0;
        const aptLocation = (apt.location || '').toLowerCase();
        const aptTitle = (apt.title || '').toLowerCase();

        const locationMatch = !location || aptLocation.includes(location) || aptTitle.includes(location);
        const priceMatch = price <= maxPrice;
        const roomMatch = !roomType || apt.room_type === roomType;
        const amenitiesMatch = amenities.length === 0 || amenities.every(a => (apt.amenities || []).includes(a));

        return locationMatch && priceMatch && roomMatch && amenitiesMatch;
    });

    if (sortValue === 'price-low') {
        filteredApartments.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortValue === 'price-high') {
        filteredApartments.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
        filteredApartments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (currentView === 'browse') {
        paginationManager = paginate(filteredApartments, 9);
        displayBrowsePage(1);
    }
}

function resetFilters() {
    document.getElementById('searchLocation').value = '';
    document.getElementById('priceMax').value = '100000';
    document.getElementById('priceSlider').value = '100000';
    document.getElementById('sortBy').value = 'newest';
    document.querySelectorAll('.amenity-filter').forEach(el => el.checked = false);
    document.querySelectorAll('.room-type-btn').forEach(el => el.classList.remove('active'));

    filteredApartments = [...apartments];
    displayBrowsePage(1);
    showToast('🔄 Filters reset!', 'success');
}

// ===== UTILITIES =====
function viewApartment(id) {
    recentlyViewed = recentlyViewed.filter(v => v !== id);
    recentlyViewed.unshift(id);
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed.slice(0, 10)));

    localStorage.setItem('selectedApartmentId', id);
    window.location.href = 'apartmentdetails.html';
}

// ===== TOGGLE COMPARE =====
async function toggleCompare(apartmentId) {
    let newComparisons;

    if (selectedApartmentsForComparison.includes(apartmentId)) {
        newComparisons = selectedApartmentsForComparison.filter(id => id !== apartmentId);
        showToast('❌ Removed from comparison', 'info');
    } else {
        if (selectedApartmentsForComparison.length < 3) {
            newComparisons = [...selectedApartmentsForComparison, apartmentId];
            showToast(`✅ Added to comparison (${newComparisons.length}/3)`, 'success');
        } else {
            showToast('❌ Maximum 3 apartments for comparison', 'warning');
            return;
        }
    }

    await saveComparisonToBackend(newComparisons);
}

// ===== UPDATE COMPARE BUTTON STATES =====
function updateCompareButtonStates() {
    const buttons = document.querySelectorAll('[id^="compare-btn-"]');

    buttons.forEach(btn => {
        const btnId = btn.getAttribute('id');
        if (!btnId) return;

        const match = btnId.match(/compare-btn-(\d+)/);

        if (match) {
            const aptId = parseInt(match[1]);

            if (selectedApartmentsForComparison.includes(aptId)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

// ===== SAVE COMPARISON TO BACKEND =====
async function saveComparisonToBackend(apartmentIds) {
    if (!currentUserId) {
        showToast('Error: User not identified', 'error');
        return;
    }

    try {
        const response = await saveComparisons(currentUserId, apartmentIds);

        if (response.status === 'success') {
            selectedApartmentsForComparison = apartmentIds;
            updateCompareBadge();

            if (currentView === 'browse') {
                updateCompareButtonStates();
            }
        } else {
            showToast(response.message || 'Failed to save comparison', 'error');
        }
    } catch (error) {
        showToast('Error saving comparison', 'error');
    }
}

// ===== REMOVE FROM COMPARISON =====
async function removeFromComparison(apartmentId) {
    let newComparisons = selectedApartmentsForComparison.filter(id => id !== apartmentId);
    await saveComparisonToBackend(newComparisons);
    displayComparison();
}

function updateStats() {
    const saved = JSON.parse(localStorage.getItem('saved_apartments') || '[]');

    const updateElement = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    updateElement('statsAvailable', apartments.length);
    updateElement('statsSaved', saved.length);
    updateElement('sidebarSavedBadge', saved.length);
    updateElement('savedBadge', saved.length);

    getMessages().then(res => {
        if (res.data) {
            updateElement('statsMessages', res.data.length);
            updateElement('sidebarMessageBadge', res.data.length);
            updateElement('messageBadge', res.data.length);
            updateElement('notificationCount', res.data.length);
        }
    });
}

function logout() {
    removeAuthToken();
    localStorage.removeItem('currentUser');
    showToast('👋 Logged out!', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// ===== COMPARISON DISPLAY =====
function displayComparison() {
    const comparisonTable = document.getElementById('comparisonTable');
    if (!comparisonTable) return;

    if (selectedApartmentsForComparison.length === 0) {
        comparisonTable.innerHTML = '<h2 style="text-align: center; padding: 40px; color: #6b7280;">No apartments selected for comparison</h2>';
        return;
    }

    let html = '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">';
    html += '<tr style="background: #f3f4f6;">';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Feature</th>';

    selectedApartmentsForComparison.forEach(aptId => {
        const apt = apartments.find(a => a.id === aptId);
        if (apt) {
            html += '<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">' + escapeHtml(apt.title) + '</th>';
        }
    });

    html += '</tr>';

    html += '<tr>';
    html += '<td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600;">Location</td>';
    selectedApartmentsForComparison.forEach(aptId => {
        const apt = apartments.find(a => a.id === aptId);
        if (apt) {
            html += '<td style="padding: 12px; border: 1px solid #e5e7eb;">' + escapeHtml(apt.location || 'N/A') + '</td>';
        }
    });
    html += '</tr>';

    html += '<tr style="background: #f9fafb;">';
    html += '<td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600;">Price</td>';
    selectedApartmentsForComparison.forEach(aptId => {
        const apt = apartments.find(a => a.id === aptId);
        if (apt) {
            html += '<td style="padding: 12px; border: 1px solid #e5e7eb; color: #2563eb; font-weight: 600;">KSh ' + Number(apt.price || 0).toLocaleString() + '</td>';
        }
    });
    html += '</tr>';

    html += '<tr>';
    html += '<td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600;">Room Type</td>';
    selectedApartmentsForComparison.forEach(aptId => {
        const apt = apartments.find(a => a.id === aptId);
        if (apt) {
            html += '<td style="padding: 12px; border: 1px solid #e5e7eb;">' + (apt.room_type || 'N/A') + '</td>';
        }
    });
    html += '</tr>';

    html += '<tr style="background: #f9fafb;">';
    html += '<td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600;">Actions</td>';
    selectedApartmentsForComparison.forEach(aptId => {
        const apt = apartments.find(a => a.id === aptId);
        if (apt) {
            html += '<td style="padding: 12px; border: 1px solid #e5e7eb;">';
            html += '<button onclick="viewApartment(' + apt.id + ')" style="padding: 8px 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px; font-weight: 600;">View</button>';
            html += '<button onclick="removeFromComparison(' + apt.id + ')" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Remove</button>';
            html += '</td>';
        }
    });
    html += '</tr>';

    html += '</table></div>';
    comparisonTable.innerHTML = html;
}
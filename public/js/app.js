// Global variables
let currentUser = null;
let currentModule = 'dashboard';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeEventListeners();
});

// Check if user is already logged in
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/session-status', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                currentUser = data.user;
                window.isAuthenticated = true;
                showMainApp();
            } else {
                console.log('ℹ️ User not authenticated, showing login page');
                window.isAuthenticated = false;
                showLoginPage();
            }
        } else {
            console.error('Session status check failed:', response.status, response.statusText);
            window.isAuthenticated = false;
            showLoginPage();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.isAuthenticated = false;
        showLoginPage();
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form event listener attached');
    } else {
        console.error('❌ Login form not found');
    }

    // Create vote form
    const createVoteForm = document.getElementById('createVoteForm');
    if (createVoteForm) {
        createVoteForm.addEventListener('submit', handleCreateVote);
    }

    // Digital signature form
    const digitalSignForm = document.getElementById('digitalSignForm');
    if (digitalSignForm) {
        digitalSignForm.addEventListener('submit', handleDigitalSign);
    }

    // Add user form
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }

    // Assignee type change
    const assigneeRadios = document.querySelectorAll('input[name="assigneeType"]');
    assigneeRadios.forEach(radio => {
        radio.addEventListener('change', handleAssigneeTypeChange);
    });

    // Create vote modal setup
    setTimeout(() => {
        const createVoteModal = document.getElementById('createVoteModal');
        if (createVoteModal) {
            createVoteModal.addEventListener('shown.bs.modal', function () {
                console.log('Vote modal shown, setting up assignee listeners');
                const modalAssigneeRadios = createVoteModal.querySelectorAll('input[name="assigneeType"]');
                modalAssigneeRadios.forEach(radio => {
                    if (!radio.hasAttribute('data-listener-added')) {
                        radio.addEventListener('change', handleAssigneeTypeChange);
                        radio.setAttribute('data-listener-added', 'true');
                    }
                });
            });
        }
    }, 1000);

    // Viewer type change for draft creation
    setTimeout(() => {
        const viewerRadios = document.querySelectorAll('input[name="viewerType"]');
        console.log('Setting up viewer radios:', viewerRadios.length);
        viewerRadios.forEach(radio => {
            radio.addEventListener('change', handleViewerTypeChange);
        });
        
        // Also setup for modal show event
        const createDraftModal = document.getElementById('createDraftModal');
        if (createDraftModal) {
            createDraftModal.addEventListener('shown.bs.modal', function () {
                console.log('Draft modal shown, setting up viewer listeners');
                const modalViewerRadios = createDraftModal.querySelectorAll('input[name="viewerType"]');
                modalViewerRadios.forEach(radio => {
                    if (!radio.hasAttribute('data-listener-added')) {
                        radio.addEventListener('change', handleViewerTypeChange);
                        radio.setAttribute('data-listener-added', 'true');
                    }
                });
            });
            
            // Add modal hidden event listener
            createDraftModal.addEventListener('hidden.bs.modal', function () {
                // Reset form và modal về trạng thái ban đầu khi modal được đóng
                resetCreateDraftModal();
            });
        }
        
        // Thêm event listener cho submit button
        const submitBtn = document.getElementById('submitDraft');
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Submit button clicked - creating new draft');
                createDraft();
            });
        }
    }, 1000);
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    console.log('🔑 Attempting login for:', username);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        console.log('📡 Login response status:', response.status);
        const data = await response.json();
        console.log('📦 Login response data:', data);
        
        if (data.success) {
            console.log('✅ Login successful, setting user data...');
            currentUser = data.user;
            window.isAuthenticated = true;
            console.log('📱 Calling showMainApp()...');
            showMainApp();
        } else {
            console.log('❌ Login failed:', data.error);
            showError(errorDiv, data.error || 'Đăng nhập thất bại');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(errorDiv, 'Lỗi kết nối');
    }
}

// Handle logout
async function logout() {
    try {
        await fetch('/api/logout', { 
            method: 'POST',
            credentials: 'include'
        });
        currentUser = null;
        window.isAuthenticated = false;
        showLoginPage();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Show login page
function showLoginPage() {
    document.getElementById('loginPage').classList.remove('d-none');
    document.getElementById('mainApp').classList.add('d-none');
}

// Show main application
function showMainApp() {
    console.log('🏠 showMainApp() called');
    
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('mainApp');
    
    console.log('🔍 loginPage element:', loginPage);
    console.log('🔍 mainApp element:', mainApp);
    
    if (loginPage) {
        loginPage.classList.add('d-none');
        console.log('✅ Hidden login page');
    } else {
        console.error('❌ loginPage element not found!');
    }
    
    if (mainApp) {
        mainApp.classList.remove('d-none');
        console.log('✅ Shown main app');
    } else {
        console.error('❌ mainApp element not found!');
    }
    
    // Update user info
    updateHeaderInfo();
    
    // Update footer info
    updateFooterInfo();
    
    // Build menu based on permissions
    buildMenu();
    
    // Initialize responsive features
    initializeResponsiveFeatures();
    
    // Apply permissions for all UI elements immediately after login
    setTimeout(() => {
        applyDraftCreationPermissions();
    }, 100);
    
    // Load dashboard
    showModule('dashboard');
    
    console.log('🏠 showMainApp() completed');
}

// Update header information
function updateHeaderInfo() {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName'); 
    const userRole = document.getElementById('userRole');
    const currentDate = document.getElementById('currentDate');
    
    // Set current date and time
    if (currentDate) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        currentDate.textContent = now.toLocaleDateString('vi-VN', options);
    }
    
    // Update user info if logged in
    if (currentUser) {
        if (userAvatar) {
            userAvatar.style.display = 'inline-block';
        }
        if (userName) {
            userName.textContent = currentUser.FullName || currentUser.username || 'Người dùng';
        }
        if (userRole) {
            const role = currentUser.Role === 'Admin' ? 'Quản trị viên' : 'Cổ đông';
            userRole.textContent = role;
        }
    }
    
    // Update time every minute
    setInterval(() => {
        if (currentDate) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            currentDate.textContent = now.toLocaleDateString('vi-VN', options);
        }
    }, 60000);
}

// Update footer information
function updateFooterInfo() {
    const currentYear = document.getElementById('currentYear');
    const systemVersion = document.getElementById('systemVersion'); 
    const lastUpdate = document.getElementById('lastUpdate');
    
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
    
    if (systemVersion) {
        systemVersion.textContent = 'v6.0.0';
    }
    
    if (lastUpdate) {
        const now = new Date();
        const lastUpdateStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN');
        lastUpdate.textContent = lastUpdateStr;
    }
}

// Footer functions
function showAbout() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">Về hệ thống</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-4 text-center">
                            <img src="images/evn-logo.png" alt="EVN Logo" class="img-fluid mb-3" style="max-height: 120px;">
                        </div>
                        <div class="col-md-8">
                            <h6 class="text-primary">Hệ thống Họp và Biểu quyết Điện tử</h6>
                            <p><strong>Phiên bản:</strong> 6.0.0</p>
                            <p><strong>Công ty:</strong> Tổng Công ty Điện lực Miền Trung</p>
                            <p><strong>Địa chỉ:</strong> 18 Hùng Vương, Thành phố Huế</p>
                            <p><strong>Hotline:</strong> 1900 1909</p>
                            <hr>
                            <small class="text-muted">
                                Hệ thống được phát triển để hỗ trợ tổ chức các cuộc họp và biểu quyết trực tuyến 
                                một cách hiệu quả, minh bạch và bảo mật.
                            </small>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function showUserGuide() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header bg-info text-white">
                    <h5 class="modal-title">Hướng dẫn sử dụng</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-12">
                            <h6 class="text-primary">1. Đăng nhập hệ thống</h6>
                            <p>Sử dụng tài khoản và mật khẩu được cấp để đăng nhập vào hệ thống.</p>
                            
                            <h6 class="text-primary">2. Tham gia cuộc họp</h6>
                            <p>Chọn cuộc họp từ danh sách và nhấn "Tham gia" để vào phòng họp trực tuyến.</p>
                            
                            <h6 class="text-primary">3. Biểu quyết</h6>
                            <p>Khi có nghị quyết cần biểu quyết, hệ thống sẽ hiển thị các lựa chọn: Tán thành, Không tán thành, Không ý kiến.</p>
                            
                            <h6 class="text-primary">4. Xem kết quả</h6>
                            <p>Sau khi biểu quyết, bạn có thể xem kết quả chi tiết và thống kê.</p>
                            
                            <h6 class="text-primary">5. Hỗ trợ kỹ thuật</h6>
                            <p>Liên hệ Hotline: <strong>1900 1909</strong> hoặc email: support@evncpc.vn</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function showSupport() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title">Hỗ trợ kỹ thuật</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-12">
                            <h6 class="text-success">Thông tin liên hệ</h6>
                            <div class="mb-3">
                                <i class="fas fa-phone text-success me-2"></i>
                                <strong>Hotline:</strong> 1900 1909 (24/7)
                            </div>
                            <div class="mb-3">
                                <i class="fas fa-envelope text-success me-2"></i>
                                <strong>Email:</strong> support@evncpc.vn
                            </div>
                            <div class="mb-3">
                                <i class="fas fa-map-marker-alt text-success me-2"></i>
                                <strong>Địa chỉ:</strong> 18 Hùng Vương, Thành phố Huế
                            </div>
                            
                            <hr>
                            
                            <h6 class="text-success">Các vấn đề thường gặp</h6>
                            <div class="accordion" id="faqAccordion">
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                                            Không thể đăng nhập vào hệ thống?
                                        </button>
                                    </h2>
                                    <div id="faq1" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                        <div class="accordion-body">
                                            Kiểm tra lại tên đăng nhập và mật khẩu. Nếu vẫn không được, liên hệ IT để reset mật khẩu.
                                        </div>
                                    </div>
                                </div>
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                                            Không thể biểu quyết?
                                        </button>
                                    </h2>
                                    <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                        <div class="accordion-body">
                                            Đảm bảo bạn đã tham gia cuộc họp và nghị quyết đang trong thời gian biểu quyết.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

// Build navigation menu based on user permissions
function buildMenu() {
    console.log('🔧 buildMenu() called');
    console.log('🔧 currentUser:', currentUser);
    
    const menu = document.getElementById('mainMenu');
    console.log('🔧 menu element:', menu);
    
    if (!menu) {
        console.error('❌ Menu element not found!');
        return;
    }
    
    const menuItems = [
        { 
            id: 'dashboard', 
            name: 'Trang chủ', 
            shortName: 'Trang chủ',
            icon: 'fas fa-home', 
            permission: null 
        },
        { 
            id: 'draftManagement', 
            name: 'Dự thảo tờ trình', 
            shortName: 'Dự thảo',
            icon: 'fas fa-file-alt', 
            permission: 'draft_management' 
        },
        { 
            id: 'voteManagement', 
            name: 'Biểu quyết', 
            shortName: 'Biểu quyết',
            icon: 'fas fa-vote-yea', 
            permission: 'vote_participation' // Back to original permission
        },
        { 
            id: 'summary', 
            name: 'Phiếu tổng hợp', 
            shortName: 'Tổng hợp',
            icon: 'fas fa-clipboard-list', 
            permission: 'vote_summary' 
        },
        { 
            id: 'resolution', 
            name: 'Quản lý nghị quyết', 
            shortName: 'Nghị quyết',
            icon: 'fas fa-gavel', 
            permission: 'resolution_management' 
        },
        { 
            id: 'documents', 
            name: 'Tủ tài liệu', 
            shortName: 'Tài liệu',
            icon: 'fas fa-folder', 
            permission: 'document_library' 
        },
        { 
            id: 'digitalSign', 
            name: 'Ký số văn bản', 
            shortName: 'Ký số',
            icon: 'fas fa-signature', 
            permission: 'digital_signature' 
        },
        { 
            id: 'admin', 
            name: 'Quản trị người dùng', 
            shortName: 'Quản trị',
            icon: 'fas fa-users-cog', 
            permission: 'user_management' 
        },
        { 
            id: 'recycleBin', 
            name: 'Thùng rác', 
            shortName: 'Thùng rác',
            icon: 'fas fa-trash-restore', 
            permission: 'user_management' 
        }
    ];
    
    // Clear existing menu items and loading state
    menu.innerHTML = '';

    console.log('Current user:', currentUser); // Debug log
    console.log('Current user permissions:', currentUser.Permissions); // Debug log
    
    // Show all items for now if permissions are not set, or filter by role
    const visibleItems = menuItems.filter(item => {
        // Always show dashboard
        if (item.permission === null) return true;
        
        // If no permissions system set up, show based on role
        if (!currentUser.Permissions) {
            if (currentUser.Role === 'Admin') {
                return true; // Admin sees everything
            } else {
                // Regular users see basic functions
                return ['draft_management', 'vote_participation', 'vote_results', 'document_library'].includes(item.permission);
            }
        }
        
        // Use permission system if available
        return currentUser.Permissions.includes(item.permission);
    });
    
    visibleItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        
        // Create responsive menu item with proper ARIA support
        li.innerHTML = `
            <a class="nav-link" 
               href="#" 
               data-module="${item.id}" 
               onclick="showModule('${item.id}')"
               role="menuitem"
               aria-label="${item.name} - Chuyển đến module ${item.name}"
               tabindex="0"
               onkeypress="if(event.key==='Enter'||event.key===' ') showModule('${item.id}')">
                <i class="${item.icon}" aria-hidden="true"></i>
                <span class="menu-text">
                    <span class="d-none d-lg-inline">${item.name}</span>
                    <span class="d-lg-none">${item.shortName}</span>
                </span>
            </a>
        `;
        menu.appendChild(li);
    });
    
    console.log(`✅ buildMenu() completed. Created ${visibleItems.length} menu items from ${menuItems.length} total items`);
    console.log('🔧 Menu HTML:', menu.innerHTML.substring(0, 200) + '...');
    
    // Add mobile menu auto-collapse functionality
    if (window.innerWidth <= 991) {
        const navLinks = menu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Auto-collapse mobile menu after selection
                const navbarCollapse = document.getElementById('mainNavigation');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                        toggle: false
                    });
                    bsCollapse.hide();
                }
            });
        });
    }
    
    // Add touch/swipe indicators for mobile
    if ('ontouchstart' in window && window.innerWidth <= 768) {
        addMobileSwipeSupport();
    }
}

// Show module with responsive enhancements
function showModule(moduleId) {
    console.log('🔧 DEBUG: showModule called with:', moduleId);
    
    // Remove active class from all menu items
    document.querySelectorAll('.main-navigation .nav-link').forEach(link => {
        link.classList.remove('active');
        link.setAttribute('aria-selected', 'false');
    });
    
    // Add active class to current menu item
    const activeLink = document.querySelector(`.main-navigation .nav-link[data-module="${moduleId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-selected', 'true');
        
        // Scroll active item into view on mobile
        if (window.innerWidth <= 991) {
            activeLink.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'center'
            });
        }
    }
    
    // Hide all modules with animation
    document.querySelectorAll('.module-content').forEach(module => {
        module.classList.add('d-none');
        module.setAttribute('aria-hidden', 'true');
    });
    
    // Show selected module with animation
    const selectedModule = document.getElementById(moduleId);
    if (selectedModule) {
        selectedModule.classList.remove('d-none');
        selectedModule.setAttribute('aria-hidden', 'false');
        
        // Smooth scroll to top on mobile
        if (window.innerWidth <= 768) {
            selectedModule.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }
    
    // Update current module
    currentModule = moduleId;
    
    // Update page title for better navigation
    updatePageTitle(moduleId);
    
    // Load module-specific data
    console.log('🔧 Calling loadModuleData for:', moduleId); // Debug log
    loadModuleData(moduleId);
}

// Show Vote Management module with specific tab
function showVoteManagementTab(tabId) {
    // First show the vote management module
    showModule('voteManagement');
    
    // Wait a bit for module to load, then activate the specific tab
    setTimeout(() => {
        const tabButton = document.getElementById(tabId + '-tab');
        if (tabButton) {
            // Trigger the tab click
            const tab = new bootstrap.Tab(tabButton);
            tab.show();
        }
    }, 100);
}

// Update page title based on current module
function updatePageTitle(moduleId) {
    const titleMap = {
        'dashboard': 'Bảng điều khiển',
        'draftManagement': 'Quản lý dự thảo',
        'voteManagement': 'Biểu quyết',
        'summary': 'Phiếu tổng hợp',
        'resolution': 'Quản lý nghị quyết',
        'documents': 'Tủ tài liệu',
        'digitalSign': 'Ký số văn bản',
        'admin': 'Quản trị hệ thống',
        'recycleBin': 'Thùng rác'
    };
    
    const moduleTitle = titleMap[moduleId] || 'Hệ thống';
    document.title = `${moduleTitle} - EVNCHP Voting System`;
}

// Add mobile swipe support for navigation
function addMobileSwipeSupport() {
    let startX = 0;
    let startY = 0;
    const minSwipeDistance = 50;
    
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    contentArea.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    
    contentArea.addEventListener('touchend', (e) => {
        if (!startX || !startY) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // Only handle horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            const modules = getVisibleModules();
            const currentIndex = modules.findIndex(m => m === currentModule);
            
            if (deltaX > 0 && currentIndex > 0) {
                // Swipe right - previous module
                showModule(modules[currentIndex - 1]);
            } else if (deltaX < 0 && currentIndex < modules.length - 1) {
                // Swipe left - next module
                showModule(modules[currentIndex + 1]);
            }
        }
        
        startX = 0;
        startY = 0;
    }, { passive: true });
}

// Get list of visible modules based on user permissions
function getVisibleModules() {
    const allModules = [
        'dashboard', 'draftManagement', 'voteManagement', 
        'summary', 'resolution', 'documents', 
        'digitalSign', 'admin', 'recycleBin'
    ];
    
    return allModules.filter(moduleId => {
        const menuItem = document.querySelector(`.nav-link[data-module="${moduleId}"]`);
        return menuItem !== null;
    });
}

// Handle window resize for responsive adjustments
function handleResize() {
    // Rebuild menu if needed for responsive changes
    if (window.innerWidth <= 991) {
        // Mobile/tablet mode
        document.body.classList.add('mobile-mode');
        
        // Ensure mobile navigation is properly collapsed
        const navbarCollapse = document.getElementById('mainNavigation');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                toggle: false
            });
            bsCollapse.hide();
        }
    } else {
        // Desktop mode
        document.body.classList.remove('mobile-mode');
        
        // Ensure desktop navigation is properly expanded
        const navbarCollapse = document.getElementById('mainNavigation');
        if (navbarCollapse && !navbarCollapse.classList.contains('show')) {
            const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                toggle: false
            });
            bsCollapse.show();
        }
    }
    
    // Update mobile user name display
    updateMobileUserInfo();
}

// Update mobile user info display
function updateMobileUserInfo() {
    const userNameMobile = document.getElementById('userNameMobile');
    const userName = document.getElementById('userName');
    
    if (userNameMobile && userName && currentUser) {
        const displayName = currentUser.FullName || currentUser.username || 'Tài khoản';
        const shortName = displayName.length > 10 ? displayName.substring(0, 10) + '...' : displayName;
        userNameMobile.textContent = shortName;
    }
}

// Initialize responsive features
function initializeResponsiveFeatures() {
    // Add resize listener
    window.addEventListener('resize', debounce(handleResize, 250));
    
    // Initial resize handling
    handleResize();
    
    // Add orientation change support
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 100);
    });
    
    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Load module-specific data
function loadModuleData(moduleId) {
    console.log('🔧 loadModuleData called with:', moduleId); // Debug log
    
    switch(moduleId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'voteManagement':
            loadVoteManagement();
            break;
        case 'vote':
            loadVotesList();
            break;
        case 'endVote':
            loadEndVotesList();
            break;
        case 'draftManagement':
            loadDraftManagement();
            // Apply draft creation permissions after loading
            applyDraftCreationPermissions();
            break;
        case 'admin':
            if (currentUser.Role === 'Admin' || (currentUser.Permissions && currentUser.Permissions.includes('user_management'))) {
                loadAdmin();
            }
            break;
        case 'recycleBin':
            // Temporarily remove permission check for debugging
            console.log('Loading recycleBin - currentUser:', currentUser);
            loadRecycleBin();
            break;
        default:
            // Other modules load on demand
            break;
    }
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load module content
async function loadModuleContent(moduleId) {
    const targetModule = document.getElementById(moduleId);
    if (targetModule) {
        targetModule.classList.remove('d-none');
        currentModule = moduleId;
        
        // Load module-specific data
        loadModuleData(moduleId);
        
        // Load additional content based on module
        switch (moduleId) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'draftManagement':
                await loadDraftManagement();
                break;
            case 'voteManagement':
                await loadVoteManagement();
                break;
            case 'summary':
                await loadVoteSummary();
                break;
            case 'resolution':
                await loadResolutionManagement();
                break;
            case 'documents':
                await loadDocuments();
                break;
            case 'digitalSign':
                await loadDigitalSign();
                break;
            case 'admin':
                await loadAdmin();
                break;
            case 'recycleBin':
                await loadRecycleBin();
                break;
            default:
                break;
        }
    }
}

// Load dashboard statistics
async function loadDashboard() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        document.getElementById('pendingVotesCount').textContent = data.pendingVotes;
        document.getElementById('completedVotesCount').textContent = data.completedVotes;
        document.getElementById('draftCommentsCount').textContent = data.pendingComments || 0;
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// Load draft management
async function loadDraftManagement() {
    try {
        const response = await fetch('/api/drafts');
        const drafts = await response.json();
        
        const tableBody = document.getElementById('draftsTableBody');
        const emptyState = document.getElementById('draftsEmptyState');
        
        if (drafts.length === 0) {
            tableBody.innerHTML = '';
            emptyState.classList.remove('d-none');
            return;
        }
        
        emptyState.classList.add('d-none');
        
        let tableHTML = '';
        drafts.forEach((draft, index) => {
            const deadlineDate = new Date(draft.CreatedDate);
            deadlineDate.setDate(deadlineDate.getDate() + draft.CommentPeriod);
            
            tableHTML += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>
                        <div class="fw-medium">${draft.Title}</div>
                        <small class="text-muted">Tạo bởi: ${draft.CreatedBy || 'Admin'}</small>
                    </td>
                    <td class="text-center">${formatDate(draft.CreatedDate)}</td>
                    <td class="text-center">${formatDate(deadlineDate)}</td>
                    <td class="text-center">
                        <div class="btn-group" role="group">
                            <button class="btn btn-info btn-sm" onclick="viewDraftDetails(${draft.DraftID})" title="Xem chi tiết">
                                <i class="fas fa-eye"></i> Xem chi tiết
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteDraft(${draft.DraftID})" title="Xóa">
                                <i class="fas fa-trash"></i> Xóa
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
        
        // Apply permissions after loading data
        applyDraftCreationPermissions();
        
    } catch (error) {
        console.error('Draft management load error:', error);
        document.getElementById('draftsEmptyState').classList.remove('d-none');
        document.getElementById('draftsTableBody').innerHTML = '';
        
        // Still apply permissions even if loading failed
        applyDraftCreationPermissions();
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get status badge for draft
function getStatusBadge(status) {
    switch(status) {
        case 'Draft':
            return '<span class="badge bg-secondary"><i class="fas fa-edit me-1"></i>Bản nháp</span>';
        case 'Open':
            return '<span class="badge bg-primary"><i class="fas fa-comments me-1"></i>Đang góp ý</span>';
        case 'Approved':
            return '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Đã thống nhất</span>';
        case 'Finalized':
            return '<span class="badge bg-info"><i class="fas fa-flag me-1"></i>Đã hoàn thiện</span>';
        case 'Closed':
            return '<span class="badge bg-warning text-dark"><i class="fas fa-clock me-1"></i>Hết hạn góp ý</span>';
        case 'Published':
            return '<span class="badge bg-dark"><i class="fas fa-paper-plane me-1"></i>Đã công bố</span>';
        case 'Rejected':
            return '<span class="badge bg-danger"><i class="fas fa-times me-1"></i>Từ chối</span>';
        default:
            return '<span class="badge bg-light text-dark">Không xác định</span>';
    }
}

// Check if user has permission to create drafts
function hasCreateDraftPermission() {
    if (!currentUser) {
        console.log('🔒 No user logged in');
        return false;
    }
    
    console.log('🔍 Checking create_draft permission for user:', currentUser.Username);
    console.log('🔍 User role:', currentUser.Role);
    console.log('🔍 User permissions:', currentUser.Permissions);
    
    // Admin always has permission
    if (currentUser.Role === 'Admin') {
        console.log('✅ Admin user - create_draft permission granted');
        return true;
    }
    
    // Check if user has specific create_draft permission
    if (currentUser.Permissions && currentUser.Permissions.includes('create_draft')) {
        console.log('✅ User has create_draft permission');
        return true;
    }
    
    console.log('❌ User does not have create_draft permission');
    return false;
}

// Check if user has permission to close draft comments
function hasCloseDraftPermission() {
    if (!currentUser) {
        console.log('🔒 No user logged in');
        return false;
    }
    
    console.log('🔍 Checking close_draft permission for user:', currentUser.Username);
    console.log('🔍 User role:', currentUser.Role);
    console.log('🔍 User permissions:', currentUser.Permissions);
    
    // Admin always has permission
    if (currentUser.Role === 'Admin') {
        console.log('✅ Admin user - close_draft permission granted');
        return true;
    }
    
    // Check if user has specific close_draft permission
    if (currentUser.Permissions && currentUser.Permissions.includes('close_draft')) {
        console.log('✅ User has close_draft permission');
        return true;
    }
    
    console.log('❌ User does not have close_draft permission');
    return false;
}

// Apply draft creation permissions to UI elements
function applyDraftCreationPermissions() {
    console.log('🔒 Applying draft creation permissions...');
    
    const createDraftButton = document.getElementById('createDraftButton');
    const createDraftEmptyButton = document.getElementById('createDraftEmptyButton');
    
    const hasPermission = hasCreateDraftPermission();
    
    // Main create draft button
    if (createDraftButton) {
        if (hasPermission) {
            console.log('✅ Showing main create draft button');
            createDraftButton.style.display = 'block';
            createDraftButton.classList.remove('d-none');
        } else {
            console.log('❌ Hiding main create draft button - no permission');
            createDraftButton.style.display = 'none';
            createDraftButton.classList.add('d-none');
        }
    } else {
        console.warn('⚠️ Main create draft button not found');
    }
    
    // Empty state create draft button
    if (createDraftEmptyButton) {
        if (hasPermission) {
            console.log('✅ Showing empty state create draft button');
            createDraftEmptyButton.style.display = 'inline-block';
            createDraftEmptyButton.classList.remove('d-none');
        } else {
            console.log('❌ Hiding empty state create draft button - no permission');
            createDraftEmptyButton.style.display = 'none';
            createDraftEmptyButton.classList.add('d-none');
            
            // Update empty state message when user has no permission
            const emptyStateText = createDraftEmptyButton.parentElement?.querySelector('p');
            if (emptyStateText) {
                emptyStateText.textContent = 'Liên hệ quản trị viên để được cấp quyền tạo dự thảo mới.';
            }
        }
    } else {
        console.warn('⚠️ Empty state create draft button not found');
    }
}

// Enhanced showCreateDraftModal with permission check
function showCreateDraftModal() {
    console.log('🎭 showCreateDraftModal called');
    
    // Double-check permission before showing modal
    if (!hasCreateDraftPermission()) {
        console.log('❌ Access denied - no create_draft permission');
        // Don't show alert since button should be hidden - just return silently
        return;
    }
    
    console.log('✅ Permission verified - showing modal');
    
    // Đảm bảo modal ở chế độ tạo mới
    resetCreateDraftModal();
    
    const modal = new bootstrap.Modal(document.getElementById('createDraftModal'));
    
    // Setup event listeners sau khi modal được show
    modal._element.addEventListener('shown.bs.modal', function() {
        console.log('Modal shown, setting up event listeners');
        setupViewerTypeListeners();
    }, { once: true });
    
    modal.show();
}

// Setup viewer type event listeners
function setupViewerTypeListeners() {
    console.log('Setting up viewer type listeners');
    
    const viewerRadios = document.querySelectorAll('input[name="viewerType"]');
    console.log('Found viewer radios:', viewerRadios.length);
    
    viewerRadios.forEach((radio, index) => {
        console.log(`Radio ${index}:`, radio.id, radio.value, radio.checked);
        
        // Remove existing listeners to avoid duplicates
        radio.removeEventListener('change', handleViewerTypeChange);
        
        // Add new listener
        radio.addEventListener('change', function() {
            console.log('Radio changed:', radio.value, radio.checked);
            handleViewerTypeChange();
        });
    });
    
    // Trigger initial state
    handleViewerTypeChange();
}

// Reset create draft modal to original state
function resetCreateDraftModal() {
    const modalTitle = document.querySelector('#createDraftModal .modal-title');
    const submitBtn = document.getElementById('submitDraft');
    const form = document.getElementById('createDraftForm');
    
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-file-alt me-2"></i>Tạo Dự thảo Mới';
    }
    
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Tạo Dự thảo';
        // Reset data attributes
        delete submitBtn.dataset.draftId;
        delete submitBtn.dataset.mode;
    }
    
    if (form) {
        form.reset();
    }
    
    // Xóa thông tin file hiện tại nếu có
    const currentFiles = document.getElementById('currentFiles');
    if (currentFiles) {
        currentFiles.remove();
    }
}

// Format file size helper function
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show loading modal helper function
function showLoadingModal(message = 'Đang xử lý...') {
    // Tạo modal loading đơn giản
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingModal';
    loadingDiv.className = 'modal fade';
    loadingDiv.setAttribute('data-bs-backdrop', 'static');
    loadingDiv.innerHTML = `
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-body text-center p-4">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div>${message}</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(loadingDiv);
    const modal = new bootstrap.Modal(loadingDiv);
    modal.show();
    
    // Return modal instance with cleanup
    return {
        hide: () => {
            modal.hide();
            setTimeout(() => {
                document.body.removeChild(loadingDiv);
            }, 300);
        }
    };
}

// Soft Delete draft function
async function deleteDraft(draftId) {
    if (!confirm('Bạn có chắc chắn muốn xóa dự thảo này? Dự thảo sẽ được chuyển vào thùng rác và có thể khôi phục sau.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/drafts/${draftId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Dự thảo đã được chuyển vào thùng rác thành công!');
            // Tải lại danh sách dự thảo
            loadDraftManagement();
        } else {
            throw new Error(result.message || 'Lỗi xóa dự thảo');
        }
        
    } catch (error) {
        console.error('Delete draft error:', error);
        alert('Lỗi: ' + error.message);
    }
}

// View draft details - FIXED VERSION
async function viewDraftDetails(draftId) {
    try {
        console.log('🔍 Loading draft details for ID:', draftId);
        
        const response = await fetch(`/api/drafts/${draftId}`);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ HTTP error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📋 Draft data received:', data);
        
        // Check if response has success flag
        if (data.success === false) {
            throw new Error(data.error || 'Failed to load draft details');
        }
        
        // API trả về object có draft và comments
        const draft = data.draft || data;
        const comments = data.comments || [];
        
        console.log('📄 Draft object:', draft);
        console.log('💬 Comments:', comments.length);
        
        // Handle attached files safely
        let attachedFiles = [];
        try {
            if (Array.isArray(draft.AttachedFiles)) {
                console.log('📎 Processing as array:', draft.AttachedFiles);
                attachedFiles = draft.AttachedFiles;
            } else if (typeof draft.AttachedFiles === 'string' && draft.AttachedFiles.trim()) {
                console.log('📎 Processing as string:', draft.AttachedFiles);
                attachedFiles = draft.AttachedFiles.split(',').filter(f => f.trim()).map(f => ({
                    FileName: f.trim(),
                    DownloadUrl: `/uploads/drafts/${f.trim()}`
                }));
            } else if (draft.AttachedFiles === null || draft.AttachedFiles === undefined) {
                console.log('📎 No attached files');
                attachedFiles = [];
            }
        } catch (fileError) {
            console.error('❌ Error processing attached files:', fileError);
            attachedFiles = [];
        }
        
        console.log('✅ Final processed files:', attachedFiles);
        draft.ProcessedAttachedFiles = attachedFiles;
        
        const modal = new bootstrap.Modal(document.getElementById('draftDetailsModal'));
        const content = document.getElementById('draftDetailsContent');
        
        // Calculate comment deadline
        const createdDate = new Date(draft.CreatedDate);
        const deadlineDate = new Date(createdDate);
        deadlineDate.setDate(deadlineDate.getDate() + (draft.CommentPeriod || 7));
        
        // Check if expired
        const isExpired = new Date() > deadlineDate;
        const canComment = !isExpired && (draft.Status === 'Draft' || !draft.Status);
        
        content.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <!-- Header thông tin -->
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h4 class="text-primary mb-0">
                                <i class="fas fa-file-alt me-2"></i>${draft.Title}
                            </h4>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="mb-2">
                                        <i class="fas fa-user text-muted me-2"></i>
                                        <strong>Người tạo:</strong> ${draft.CreatedBy}
                                    </p>
                                    <p class="mb-2">
                                        <i class="fas fa-calendar text-muted me-2"></i>
                                        <strong>Ngày tạo:</strong> ${formatDate(draft.CreatedDate)}
                                    </p>
                                    <p class="mb-0">
                                        <i class="fas fa-clock text-muted me-2"></i>
                                        <strong>Thời hạn góp ý:</strong> ${formatDate(deadlineDate)}
                                        ${isExpired ? '<span class="badge bg-danger ms-2">Đã hết hạn</span>' : '<span class="badge bg-success ms-2">Còn thời gian</span>'}
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <p class="mb-2">
                                        <i class="fas fa-info-circle text-muted me-2"></i>
                                        <strong>Trạng thái:</strong> ${getDraftStatusBadge(draft.Status)}
                                    </p>
                                    <p class="mb-2">
                                        <i class="fas fa-comments text-muted me-2"></i>
                                        <strong>Số góp ý:</strong> ${comments.length} bình luận
                                    </p>
                                    <p class="mb-0">
                                        <i class="fas fa-hourglass-half text-muted me-2"></i>
                                        <strong>Thời gian góp ý:</strong> ${draft.CommentPeriod || 7} ngày
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Nội dung tóm tắt dự thảo -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-align-left me-2"></i>Nội dung tóm tắt dự thảo
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="content-area content-area-responsive p-3 bg-light rounded">
${draft.Content || 'Không có nội dung'}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tài liệu đính kèm -->
                    ${(() => {
                        console.log('Rendering attachments, count:', draft.ProcessedAttachedFiles ? draft.ProcessedAttachedFiles.length : 0);
                        console.log('ProcessedAttachedFiles content:', draft.ProcessedAttachedFiles);
                        
                        if (draft.ProcessedAttachedFiles && draft.ProcessedAttachedFiles.length > 0) {
                            return `
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h5 class="mb-0">
                                            <i class="fas fa-paperclip me-2"></i>Tài liệu đính kèm (${draft.ProcessedAttachedFiles.length})
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="list-group">
                                            ${draft.ProcessedAttachedFiles.map(file => 
                                                `<a href="/uploads/drafts/${file.FileName}" class="list-group-item list-group-item-action d-flex align-items-center" target="_blank">
                                                    <i class="fas fa-file-pdf text-danger me-3"></i>
                                                    <div>
                                                        <div class="fw-bold">${file.FileName}</div>
                                                        <small class="text-muted">Nhấn để tải xuống</small>
                                                    </div>
                                                </a>`
                                            ).join('')}
                                        </div>
                                    </div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h5 class="mb-0">
                                            <i class="fas fa-paperclip me-2"></i>Tài liệu đính kèm
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <p class="text-muted text-center">
                                            <i class="fas fa-folder-open fa-2x mb-2 d-block"></i>
                                            Không có tài liệu đính kèm nào
                                        </p>
                                    </div>
                                </div>
                            `;
                        }
                    })()}
                    
                    <!-- Góp ý hoặc thống nhất -->
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">
                                <i class="fas fa-comments me-2"></i>Góp ý hoặc thống nhất (${comments.length})
                            </h5>
                            ${canComment ? `
                                <button class="btn btn-primary btn-sm" onclick="showAddCommentForm(${draftId})">
                                    <i class="fas fa-plus me-1"></i>Thêm góp ý hoặc thống nhất
                                </button>
                            ` : ''}
                        </div>
                        <div class="card-body">
                            <div id="draftComments">
                                ${renderDraftComments(comments)}
                            </div>
                            
                            <!-- Form góp ý hoặc thống nhất -->
                            <div id="commentForm" class="d-none mt-3">
                                <div class="border rounded p-3 bg-light">
                                    <h6>Chọn hình thức phản hồi:</h6>
                                    
                                    <!-- Radio buttons for selection type -->
                                    <div class="mb-3">
                                        <div class="form-check mb-2">
                                            <input class="form-check-input" type="radio" name="responseType" id="agreeRadio" value="agree" onchange="toggleResponseOptions()">
                                            <label class="form-check-label fw-bold text-success" for="agreeRadio">
                                                <i class="fas fa-check-circle me-1"></i>Thống nhất
                                            </label>
                                            <small class="text-muted d-block ms-4">Đồng ý với nội dung dự thảo</small>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="responseType" id="commentRadio" value="comment" onchange="toggleResponseOptions()">
                                            <label class="form-check-label fw-bold text-primary" for="commentRadio">
                                                <i class="fas fa-comment me-1"></i>Góp ý
                                            </label>
                                            <small class="text-muted d-block ms-4">Đưa ra ý kiến, đề xuất cụ thể</small>
                                        </div>
                                    </div>
                                    
                                    <!-- Comment textarea (hidden by default) -->
                                    <div id="commentTextArea" class="d-none">
                                        <label for="newComment" class="form-label">Nội dung góp ý:</label>
                                        <textarea id="newComment" class="form-control mb-3" rows="4" placeholder="Nhập góp ý chi tiết của bạn..."></textarea>
                                    </div>
                                    
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-success btn-sm" onclick="submitResponse(${draftId})" id="submitResponseBtn" disabled>
                                            <i class="fas fa-paper-plane me-1"></i><span id="submitBtnText">Gửi phản hồi</span>
                                        </button>
                                        <button class="btn btn-secondary btn-sm" onclick="hideAddCommentForm()">
                                            <i class="fas fa-times me-1"></i>Hủy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Store draft ID in modal for later use - CRITICAL FOR ACTION BUTTONS
        const modalElement = document.getElementById('draftDetailsModal');
        console.log('🔍 Setting current draft ID in modal:', draftId);
        console.log('🔍 Modal element:', modalElement);
        
        if (modalElement) {
            modalElement.dataset.currentDraftId = draftId;
            console.log('✅ Draft ID set successfully:', modalElement.dataset.currentDraftId);
        } else {
            console.error('❌ Modal element not found!');
        }
        
        // Populate modal footer with action buttons containing the draft ID
        const modalFooter = document.getElementById('draftModalFooter');
        if (modalFooter) {
            // Base buttons
            let footerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times me-2"></i>Đóng
                </button>
                <button type="button" class="btn btn-success" onclick="approveDraftWithId(${draftId})">
                    <i class="fas fa-check me-2"></i>Hoàn thành
                </button>
            `;
            
            // Add "Kết thúc góp ý" button only if user has permission
            if (hasCloseDraftPermission()) {
                console.log('✅ User has close_draft permission - showing "Kết thúc góp ý" button');
                footerHTML += `
                    <button type="button" class="btn btn-warning" onclick="closeDraftComments(${draftId})">
                        <i class="fas fa-lock me-2"></i>Kết thúc góp ý
                    </button>
                `;
            } else {
                console.log('❌ User does not have close_draft permission - hiding "Kết thúc góp ý" button');
            }
            
            modalFooter.innerHTML = footerHTML;
            console.log('✅ Modal footer populated with draft ID and permissions applied:', draftId);
        }
        
        modal.show();
        
        // Adjust content area height after modal is shown
        setTimeout(() => {
            adjustContentAreaHeight();
        }, 100);
        
    } catch (error) {
        console.error('View draft details error:', error);
        alert('Lỗi khi tải chi tiết dự thảo: ' + error.message);
    }
}

// Function to adjust content area height based on content
function adjustContentAreaHeight() {
    const contentAreas = document.querySelectorAll('.content-area-responsive');
    contentAreas.forEach(area => {
        const textLength = area.textContent.trim().length;
        if (textLength < 100) {
            area.style.minHeight = '60px';
        } else if (textLength < 300) {
            area.style.minHeight = '120px';
        } else if (textLength < 600) {
            area.style.minHeight = '180px';
        } else {
            area.style.minHeight = '240px';
        }
        
        // Additional responsiveness based on line breaks
        const lineCount = (area.textContent.match(/\n/g) || []).length + 1;
        const estimatedHeight = Math.max(60, lineCount * 25);
        area.style.minHeight = Math.max(parseInt(area.style.minHeight), estimatedHeight) + 'px';
    });
}

// Load draft comments
async function loadDraftComments(draftId) {
    try {
        const response = await fetch(`/api/drafts/${draftId}/comments`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📝 Comments loaded:', result);
        
        // Ensure comments is an array
        const comments = Array.isArray(result) ? result : [];
        
        const commentsDiv = document.getElementById('draftComments');
        if (commentsDiv) {
            commentsDiv.innerHTML = renderDraftComments(comments);
        }
        
    } catch (error) {
        console.error('Load comments error:', error);
        const commentsDiv = document.getElementById('draftComments');
        if (commentsDiv) {
            commentsDiv.innerHTML = '<p class="text-danger">Lỗi khi tải góp ý</p>';
        }
    }
}

// Render draft comments
function renderDraftComments(comments) {
    if (!comments || comments.length === 0) {
        return `
            <div class="text-center py-4">
                <i class="fas fa-comments text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-2">Chưa có góp ý nào</p>
                <small class="text-muted">Hãy là người đầu tiên góp ý cho dự thảo này</small>
            </div>
        `;
    }
    
    return comments.map(comment => `
        <div class="comment-item p-3 mb-3 border rounded bg-white">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex align-items-center">
                    <div class="comment-avatar me-3">
                        <i class="fas fa-user-circle text-primary" style="font-size: 2rem;"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 text-primary">${comment.UserName || comment.CommenterName || 'Người dùng'}</h6>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            ${formatDate(comment.CommentDate)}
                        </small>
                    </div>
                </div>
                <span class="badge bg-light text-dark border">
                    <i class="fas fa-comment me-1"></i>Góp ý
                </span>
            </div>
            <div class="comment-content">
                <p class="mb-0" style="white-space: pre-wrap; line-height: 1.6;">${comment.Comment}</p>
            </div>
        </div>
    `).join('');
}

// Get draft status badge
function getDraftStatusBadge(status) {
    const statusMap = {
        'Draft': '<span class="badge bg-warning text-dark"><i class="fas fa-edit me-1"></i>Dự thảo</span>',
        'Approved': '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Đã duyệt</span>',
        'Finalized': '<span class="badge bg-primary"><i class="fas fa-flag me-1"></i>Hoàn thiện</span>',
        'Rejected': '<span class="badge bg-danger"><i class="fas fa-times me-1"></i>Từ chối</span>'
    };
    return statusMap[status] || `<span class="badge bg-secondary">${status}</span>`;
}

// Show add comment form
function showAddCommentForm(draftId) {
    document.getElementById('commentForm').classList.remove('d-none');
    document.getElementById('newComment').focus();
}

// Hide add comment form
function hideAddCommentForm() {
    document.getElementById('commentForm').classList.add('d-none');
    document.getElementById('newComment').value = '';
    // Reset radio buttons
    document.querySelectorAll('input[name="responseType"]').forEach(radio => radio.checked = false);
    document.getElementById('commentTextArea').classList.add('d-none');
    document.getElementById('submitResponseBtn').disabled = true;
}

// Toggle response options based on radio selection
function toggleResponseOptions() {
    const agreeRadio = document.getElementById('agreeRadio');
    const commentRadio = document.getElementById('commentRadio');
    const commentTextArea = document.getElementById('commentTextArea');
    const submitBtn = document.getElementById('submitResponseBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    
    if (agreeRadio.checked) {
        // Hide comment textarea for "Thống nhất"
        commentTextArea.classList.add('d-none');
        document.getElementById('newComment').value = '';
        submitBtn.disabled = false;
        submitBtnText.textContent = 'Gửi thống nhất';
        submitBtn.className = 'btn btn-success btn-sm';
        submitBtn.innerHTML = '<i class="fas fa-check me-1"></i><span id="submitBtnText">Gửi thống nhất</span>';
    } else if (commentRadio.checked) {
        // Show comment textarea for "Góp ý"
        commentTextArea.classList.remove('d-none');
        submitBtn.disabled = false;
        submitBtnText.textContent = 'Gửi góp ý';
        submitBtn.className = 'btn btn-primary btn-sm';
        submitBtn.innerHTML = '<i class="fas fa-comment me-1"></i><span id="submitBtnText">Gửi góp ý</span>';
        // Focus on textarea
        setTimeout(() => document.getElementById('newComment').focus(), 100);
    } else {
        // No selection
        commentTextArea.classList.add('d-none');
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Gửi phản hồi';
    }
}

// Submit response (either agreement or comment)
async function submitResponse(draftId) {
    try {
        const agreeRadio = document.getElementById('agreeRadio');
        const commentRadio = document.getElementById('commentRadio');
        
        if (!agreeRadio.checked && !commentRadio.checked) {
            alert('Vui lòng chọn hình thức phản hồi (Thống nhất hoặc Góp ý)');
            return;
        }
        
        if (agreeRadio.checked) {
            // Handle agreement
            const response = await fetch(`/api/drafts/${draftId}/agree`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Đã gửi thống nhất thành công!');
                hideAddCommentForm();
                // Refresh the draft details to show updated status
                viewDraftDetails(draftId);
            } else {
                alert('Lỗi: ' + (result.message || 'Không thể gửi thống nhất'));
            }
            
        } else if (commentRadio.checked) {
            // Handle comment submission
            const comment = document.getElementById('newComment').value.trim();
            
            if (!comment) {
                alert('Vui lòng nhập nội dung góp ý');
                return;
            }
            
            const response = await fetch(`/api/drafts/${draftId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Góp ý đã được gửi thành công!');
                hideAddCommentForm();
                // Refresh the draft details to show new comment
                viewDraftDetails(draftId);
            } else {
                alert('Lỗi: ' + (result.message || 'Không thể gửi góp ý'));
            }
        }
        
    } catch (error) {
        console.error('Submit response error:', error);
        alert('Lỗi kết nối. Vui lòng thử lại!');
    }
}

// Submit comment
async function submitComment(draftId) {
    try {
        const comment = document.getElementById('newComment').value.trim();
        
        if (!comment) {
            alert('Vui lòng nhập nội dung góp ý');
            return;
        }
        
        const response = await fetch(`/api/drafts/${draftId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Góp ý đã được gửi thành công!');
            hideAddCommentForm();
            // Clear any modal backdrops that might be stuck
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            });
            // Remove modal-open class from body
            document.body.classList.remove('modal-open');
            // Reset body style
            document.body.style = '';
            // Reload comments only instead of entire modal
            loadDraftComments(draftId);
        } else {
            alert(result.error || 'Lỗi khi gửi góp ý');
        }
        
    } catch (error) {
        console.error('Submit comment error:', error);
        alert('Lỗi khi gửi góp ý: ' + error.message);
    }
}

// Wrapper functions that receive draftId directly
async function approveDraftWithId(draftId) {
    if (!confirm('Bạn có chắc chắn muốn thống nhất dự thảo này?')) {
        return;
    }
    
    try {
        console.log('🔍 Approving draft with direct ID:', draftId);
        
        if (!draftId) {
            alert('Không thể xác định ID dự thảo. Vui lòng thử lại.');
            return;
        }
        
        const response = await fetch(`/api/drafts/${draftId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Dự thảo đã được thống nhất!');
            // Close modal and refresh draft list
            bootstrap.Modal.getInstance(document.getElementById('draftDetailsModal')).hide();
            loadDrafts();
        } else {
            alert(result.error || 'Lỗi khi thống nhất dự thảo');
        }
        
    } catch (error) {
        console.error('Approve draft error:', error);
        alert('Lỗi khi thống nhất dự thảo: ' + error.message);
    }
}

async function finalizeDraftWithId(draftId) {
    if (!confirm('Bạn có chắc chắn muốn hoàn thiện dự thảo này? Sau khi hoàn thiện, dự thảo sẽ không thể góp ý thêm.')) {
        return;
    }
    
    try {
        console.log('🔍 Finalizing draft with direct ID:', draftId);
        
        if (!draftId) {
            alert('Không thể xác định ID dự thảo. Vui lòng thử lại.');
            return;
        }
        
        const response = await fetch(`/api/drafts/${draftId}/finalize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Dự thảo đã được hoàn thiện!');
            // Close modal and refresh draft list
            bootstrap.Modal.getInstance(document.getElementById('draftDetailsModal')).hide();
            loadDrafts();
        } else {
            alert(result.error || 'Lỗi khi hoàn thiện dự thảo');
        }
        
    } catch (error) {
        console.error('Finalize draft error:', error);
        alert('Lỗi khi hoàn thiện dự thảo: ' + error.message);
    }
}

// Original functions - kept for compatibility
// Approve draft (Thống nhất dự thảo)
async function approveDraft() {
    if (!confirm('Bạn có chắc chắn muốn thống nhất dự thảo này?')) {
        return;
    }
    
    try {
        const draftId = getCurrentDraftId();
        console.log('🔍 Approving draft with ID:', draftId);
        
        if (!draftId) {
            alert('Không thể xác định ID dự thảo. Vui lòng thử lại.');
            return;
        }
        
        const response = await fetch(`/api/drafts/${draftId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Dự thảo đã được thống nhất!');
            // Close modal and refresh draft list
            bootstrap.Modal.getInstance(document.getElementById('draftDetailsModal')).hide();
            loadDrafts();
        } else {
            alert(result.error || 'Lỗi khi thống nhất dự thảo');
        }
        
    } catch (error) {
        console.error('Approve draft error:', error);
        alert('Lỗi khi thống nhất dự thảo: ' + error.message);
    }
}

// Close draft comments (Kết thúc góp ý)
async function closeDraftComments(draftId = null) {
    console.log('🔒 closeDraftComments called with draftId:', draftId);
    
    // Check permission first
    if (!hasCloseDraftPermission()) {
        console.log('❌ Access denied - no close_draft permission');
        // Don't show alert since button should be hidden - just return silently
        return;
    }
    
    console.log('✅ Permission verified - proceeding with close comments');
    
    if (!confirm('Bạn có chắc chắn muốn kết thúc góp ý cho dự thảo này?\n\nSau khi kết thúc:\n- Người dùng không thể góp ý thêm\n- Dự thảo chuyển sang trạng thái "Đã hoàn thành góp ý"\n- Chỉ có thể xem nội dung và các góp ý đã có')) {
        console.log('🚫 User cancelled close comments');
        return;
    }
    
    try {
        // If draftId not passed, try to get it from modal
        if (!draftId) {
            draftId = getCurrentDraftId();
            console.log('🔍 Got draftId from getCurrentDraftId:', draftId);
        }
        
        console.log('🔒 Closing comments for draft with ID:', draftId);
        console.log('🌐 Making API call to:', `/api/drafts/${draftId}/close-comments`);
        
        if (!draftId) {
            console.error('❌ No draft ID available');
            alert('Không thể xác định ID dự thảo. Vui lòng thử lại.');
            return;
        }
        
        const response = await fetch(`/api/drafts/${draftId}/close-comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 API Response status:', response.status);
        console.log('📡 API Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ API Response result:', result);
        
        if (result.success) {
            alert('Đã kết thúc góp ý cho dự thảo!\n\nDự thảo sẽ chuyển sang danh mục "Đã hoàn thành góp ý".');
            // Close modal and refresh both draft tabs
            const modalElement = document.getElementById('draftDetailsModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
            
            // Refresh both active and closed drafts
            await loadActiveDrafts();
            await loadClosedDrafts();
            
            // Switch to closed drafts tab to show the moved draft
            const closedTab = document.getElementById('closed-drafts-tab');
            if (closedTab) {
                closedTab.click();
            }
        } else {
            alert(result.error || 'Lỗi khi kết thúc góp ý dự thảo');
        }
        
    } catch (error) {
        console.error('Close draft comments error:', error);
        alert('Lỗi khi kết thúc góp ý dự thảo: ' + error.message);
    }
}

// Finalize draft (Hoàn thiện dự thảo) - DEPRECATED, use closeDraftComments instead
async function finalizeDraft() {
    if (!confirm('Bạn có chắc chắn muốn hoàn thiện dự thảo này? Sau khi hoàn thiện, dự thảo sẽ không thể góp ý thêm.')) {
        return;
    }
    
    try {
        const draftId = getCurrentDraftId();
        console.log('🔍 Finalizing draft with ID:', draftId);
        
        if (!draftId) {
            alert('Không thể xác định ID dự thảo. Vui lòng thử lại.');
            return;
        }
        
        const response = await fetch(`/api/drafts/${draftId}/finalize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Dự thảo đã được hoàn thiện!');
            // Close modal and refresh draft list
            bootstrap.Modal.getInstance(document.getElementById('draftDetailsModal')).hide();
            loadDrafts();
        } else {
            alert(result.error || 'Lỗi khi hoàn thiện dự thảo');
        }
        
    } catch (error) {
        console.error('Finalize draft error:', error);
        alert('Lỗi khi hoàn thiện dự thảo: ' + error.message);
    }
}

// Publish draft
async function publishDraft() {
    if (!confirm('Bạn có chắc chắn muốn công bố dự thảo này? Sau khi công bố, dự thảo sẽ không thể chỉnh sửa.')) {
        return;
    }
    
    try {
        // Get current draft ID from modal (you might need to store this globally)
        const draftId = getCurrentDraftId(); // This function needs to be implemented
        
        const response = await fetch(`/api/drafts/${draftId}/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Dự thảo đã được công bố thành công!');
            // Close modal and refresh draft list
            bootstrap.Modal.getInstance(document.getElementById('draftDetailsModal')).hide();
            loadDrafts();
        } else {
            alert(result.error || 'Lỗi khi công bố dự thảo');
        }
        
    } catch (error) {
        console.error('Publish draft error:', error);
        alert('Lỗi khi công bố dự thảo: ' + error.message);
    }
}

// Get current draft ID (helper function)
function getCurrentDraftId() {
    console.log('🔍 Getting current draft ID...');
    
    // Try multiple ways to get the current draft ID
    const modal = document.getElementById('draftDetailsModal');
    console.log('🔍 Modal element found:', !!modal);
    
    // Method 1: Check dataset
    if (modal && modal.dataset.currentDraftId) {
        console.log('📋 Got draft ID from modal dataset:', modal.dataset.currentDraftId);
        return modal.dataset.currentDraftId;
    }
    
    // Method 2: Check all data attributes
    if (modal) {
        console.log('🔍 All modal datasets:', modal.dataset);
        console.log('� Modal innerHTML length:', modal.innerHTML.length);
    }
    
    // Method 3: Try to extract from modal content
    const modalContent = document.getElementById('draftDetailsContent');
    if (modalContent) {
        console.log('🔍 Modal content found, checking for draft ID...');
        // Look for draft ID in content
        const draftIdMatch = modalContent.innerHTML.match(/draftId["\s]*[:=]\s*(\d+)/i);
        if (draftIdMatch) {
            console.log('📋 Got draft ID from content:', draftIdMatch[1]);
            return draftIdMatch[1];
        }
    }
    
    // Method 4: Parse from URL fragments or form data  
    const urlParams = new URLSearchParams(window.location.search);
    const urlDraftId = urlParams.get('draftId');
    if (urlDraftId) {
        console.log('📋 Got draft ID from URL:', urlDraftId);
        return urlDraftId;
    }
    
    console.error('❌ Could not determine current draft ID from any method');
    return null;
}

// Load Active Drafts (Dự thảo đang mở góp ý)
async function loadActiveDrafts() {
    try {
        console.log('📋 Loading active drafts...');
        
        const response = await fetch('/api/drafts?status=active');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const drafts = await response.json();
        console.log('📄 Active drafts loaded:', drafts.length);
        
        // Use the displayDrafts function from drafts module
        if (typeof displayDrafts === 'function') {
            displayDrafts(drafts);
        } else {
            // Fallback to manual display
            const tableBody = document.getElementById('activeDraftsTableBody');
            const emptyState = document.getElementById('activeDraftsEmptyState');
            
            if (!tableBody) {
                console.error('❌ Active drafts table body not found');
                return;
            }
            
            if (drafts.length === 0) {
                tableBody.innerHTML = '';
                if (emptyState) emptyState.classList.remove('d-none');
                return;
            }
            
            if (emptyState) emptyState.classList.add('d-none');
            
            let tableHTML = '';
            drafts.forEach((draft, index) => {
                const createdDate = new Date(draft.CreatedDate).toLocaleDateString('vi-VN');
                const deadlineDate = new Date(draft.CreatedDate);
                deadlineDate.setDate(deadlineDate.getDate() + (draft.CommentPeriod || 7));
                
                const statusBadge = getStatusBadge ? getStatusBadge(draft.Status) : 
                    '<span class="badge bg-success">Đang mở góp ý</span>';
                
                tableHTML += `
                    <tr>
                        <td class="text-center d-none d-md-table-cell">${index + 1}</td>
                        <td>
                            <div>
                                <strong>${escapeHtml ? escapeHtml(draft.Title) : draft.Title}</strong>
                                <br><small class="text-muted">Tạo bởi: ${escapeHtml ? escapeHtml(draft.CreatedByName || 'N/A') : (draft.CreatedByName || 'N/A')}</small>
                            </div>
                        </td>
                        <td class="text-center d-none d-lg-table-cell">
                            <small>${createdDate}</small>
                        </td>
                        <td class="text-center d-none d-lg-table-cell">
                            <small>${draft.CommentPeriod || 7} ngày</small>
                        </td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm" role="group">
                                <button type="button" class="btn btn-outline-primary btn-sm" onclick="viewDraftDetails(${draft.DraftID})" title="Xem chi tiết">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button type="button" class="btn btn-outline-warning btn-sm" onclick="editDraft(${draft.DraftID})" title="Chỉnh sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button type="button" class="btn btn-outline-danger btn-sm" onclick="confirmDeleteDraft(${draft.DraftID}, '${escapeHtml ? escapeHtml(draft.Title) : draft.Title}')" title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tableBody.innerHTML = tableHTML;
        }
        
    } catch (error) {
        console.error('❌ Error loading active drafts:', error);
        const tableBody = document.getElementById('activeDraftsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Lỗi tải danh sách dự thảo: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Load Closed Drafts (Dự thảo đã kết thúc góp ý)
async function loadClosedDrafts() {
    try {
        console.log('🔒 Loading closed drafts...');
        
        const response = await fetch('/api/drafts?status=closed');
        const drafts = await response.json();
        
        console.log('📄 Closed drafts response:', drafts);
        console.log('📄 Closed drafts loaded:', drafts.length);
        
        // Debug: Log each draft's status
        drafts.forEach(draft => {
            console.log(`🔒 Closed draft ${draft.DraftID}: "${draft.Title}" - Status: "${draft.Status}"`);
        });
        
        const tableBody = document.getElementById('closedDraftsTableBody');
        const emptyState = document.getElementById('closedDraftsEmptyState');
        const countBadge = document.getElementById('closedDraftsCount');
        
        if (!tableBody) {
            console.error('❌ Closed drafts table body not found');
            return;
        }
        
        // Update count badge
        if (countBadge) {
            countBadge.textContent = drafts.length;
        }
        
        if (drafts.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('d-none');
            return;
        }
        
        if (emptyState) emptyState.classList.add('d-none');
        
        let tableHTML = '';
        let validDraftsCount = 0;
        
        drafts.forEach((draft, index) => {
            // Check using CommentStatus from backend
            const isClosed = draft.CommentStatus === 'closed';
            
            if (!isClosed) {
                console.warn(`⚠️ Skipping non-closed draft ${draft.DraftID} with CommentStatus: "${draft.CommentStatus}"`);
                return;
            }
            
            validDraftsCount++;
            const commentCount = draft.CommentCount || 0;
            
            tableHTML += `
                <tr>
                    <td class="text-center">${validDraftsCount}</td>
                    <td>
                        <div class="fw-medium">${draft.Title || 'Không có tiêu đề'}</div>
                        <small class="text-muted">Tạo bởi: ${draft.CreatedByName || 'N/A'}</small>
                    </td>
                    <td class="text-center">${formatDate(draft.CreatedDate)}</td>
                    <td class="text-center">${draft.ClosedDate ? formatDate(draft.ClosedDate) : 'N/A'}</td>
                    <!-- <td class="text-center">
                        <small class="text-muted">${draft.ClosedByName || 'N/A'}</small>
                    </td> -->
                    <td class="text-center">
                        <span class="badge bg-info">${commentCount} góp ý</span>
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-info" onclick="viewDraftDetails(${draft.DraftID})" title="Xem chi tiết">
                                <i class="fas fa-eye"></i> Xem
                            </button>
                            <button class="btn btn-outline-success" onclick="exportDraftSummary(${draft.DraftID})" title="Xuất báo cáo">
                                <i class="fas fa-download"></i> Xuất
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        // Update count badge
        if (countBadge) {
            countBadge.textContent = validDraftsCount;
        }
        
        // Check if no valid drafts after filtering
        if (validDraftsCount === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('d-none');
            return;
        }
        
        tableBody.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('❌ Error loading closed drafts:', error);
        const tableBody = document.getElementById('closedDraftsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Lỗi tải danh sách dự thảo đã kết thúc: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Legacy loadDrafts function (for backward compatibility)
async function loadDrafts() {
    console.log('📋 loadDrafts called - loading active drafts');
    await loadActiveDrafts();
}

// Load Draft Management Module
async function loadDraftManagement() {
    console.log('📋 Loading Draft Management module...');
    // Load active drafts by default when entering the module
    await loadActiveDrafts();
}

// Export Draft Summary
async function exportDraftSummary(draftId) {
    try {
        console.log('📊 Exporting draft summary for ID:', draftId);
        
        const response = await fetch(`/api/drafts/${draftId}/export`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Du_thao_tom_tat_${draftId}_${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Draft summary exported successfully');
        
    } catch (error) {
        console.error('❌ Error exporting draft summary:', error);
        alert('Lỗi xuất báo cáo tóm tắt: ' + error.message);
    }
}

// Publish draft
function publishDraft() {
    if (confirm('Bạn có chắc chắn muốn công bố dự thảo này?')) {
        alert('Chức năng công bố dự thảo sẽ được phát triển trong phiên bản tiếp theo');
    }
}

// Load create vote
async function loadCreateVote() {
    // Load users for assignment
    await loadUsersForAssignment();
    
    // Thiết lập thời gian mặc định cho phiếu biểu quyết
    setupDefaultVoteTime();
}

// Thiết lập thời gian mặc định cho form tạo phiếu
function setupDefaultVoteTime() {
    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    
    // Mặc định: bắt đầu từ hôm nay, kết thúc sau 7 ngày
    endDate.setDate(endDate.getDate() + 7);
    
    // Format theo date input (YYYY-MM-DD)
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Set giá trị mặc định
    const startInput = document.getElementById('voteStartDate');
    const endInput = document.getElementById('voteEndDate');
    
    if (startInput) startInput.value = formatDate(startDate);
    if (endInput) endInput.value = formatDate(endDate);
    
    // Thêm validation để đảm bảo endDate > startDate ít nhất 1 ngày
    if (startInput && endInput) {
        startInput.addEventListener('change', function() {
            const startValue = new Date(this.value);
            const endValue = new Date(endInput.value);
            
            if (endValue <= startValue) {
                const newEndDate = new Date(startValue);
                newEndDate.setDate(newEndDate.getDate() + 1); // Ít nhất 1 ngày sau
                endInput.value = formatDate(newEndDate);
            }
        });
        
        endInput.addEventListener('change', function() {
            const startValue = new Date(startInput.value);
            const endValue = new Date(this.value);
            
            if (endValue <= startValue) {
                alert('Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày!');
                const newEndDate = new Date(startValue);
                newEndDate.setDate(newEndDate.getDate() + 1);
                this.value = formatDate(newEndDate);
            }
        });
    }
}

// Load users for vote assignment
async function loadUsersForAssignment() {
    try {
        const usersLoading = document.getElementById('usersLoading');
        const usersList = document.getElementById('usersList');
        
        // Show loading
        usersLoading.style.display = 'block';
        usersList.style.display = 'none';
        usersList.innerHTML = '';

        const response = await fetch('/api/users');
        const users = await response.json();
        
        // Hide loading
        usersLoading.style.display = 'none';
        usersList.style.display = 'block';
        
        let nonAdminCount = 0;
        users.forEach(user => {
            if (user.Role !== 'Admin') {
                nonAdminCount++;
                const div = document.createElement('div');
                div.className = 'form-check mb-2';
                div.innerHTML = `
                    <input class="form-check-input" type="checkbox" value="${user.UserID}" id="voteUser${user.UserID}">
                    <label class="form-check-label" for="voteUser${user.UserID}">
                        <strong>${user.FullName}</strong> <small class="text-muted">(${user.Username} - ${user.Role})</small>
                    </label>
                `;
                usersList.appendChild(div);
            }
        });

        // Add select all/none buttons
        if (nonAdminCount > 0) {
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'mt-3 d-flex gap-2';
            buttonsDiv.innerHTML = `
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="selectAllVoteUsers()">
                    <i class="fas fa-check-square me-1"></i>Chọn tất cả
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="selectNoneVoteUsers()">
                    <i class="fas fa-square me-1"></i>Bỏ chọn tất cả
                </button>
            `;
            usersList.appendChild(buttonsDiv);
        }

    } catch (error) {
        console.error('Load users error:', error);
        const usersLoading = document.getElementById('usersLoading');
        const usersList = document.getElementById('usersList');
        
        usersLoading.style.display = 'none';
        usersList.style.display = 'block';
        usersList.innerHTML = '<div class="alert alert-danger">Lỗi tải danh sách người dùng</div>';
    }
}

// Select all vote users
function selectAllVoteUsers() {
    const checkboxes = document.querySelectorAll('#usersList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

// Select none vote users
function selectNoneVoteUsers() {
    const checkboxes = document.querySelectorAll('#usersList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

// Handle assignee type change
async function handleAssigneeTypeChange(event) {
    const specificUsersDiv = document.getElementById('specificUsers');
    if (event.target.value === 'specific') {
        specificUsersDiv.classList.remove('d-none');
        // Load users when selecting specific option
        await loadUsersForAssignment();
    } else {
        specificUsersDiv.classList.add('d-none');
    }
}

// Load vote management module
async function loadVoteManagement() {
    console.log('🔧 loadVoteManagement() called');
    console.log('🔧 currentUser:', currentUser);
    
    // Check permissions and show/hide create button
    const createButton = document.getElementById('createVoteBtn');
    if (currentUser?.permissions?.includes('vote_creation') || currentUser?.Permissions?.includes('vote_creation')) {
        createButton.style.display = 'block';
    } else {
        createButton.style.display = 'none';
    }
    
    // Load default tab content (vote participation)
    console.log('🔧 Loading votes list...');
    await loadVotesList();
    
    // Setup tab event listeners
    const participationTab = document.getElementById('vote-participation-tab');
    const resultsTab = document.getElementById('vote-results-tab');
    
    participationTab.addEventListener('shown.bs.tab', async () => {
        console.log('🔧 Participation tab shown');
        await loadVotesList();
    });
    
    resultsTab.addEventListener('shown.bs.tab', async () => {
        console.log('🔧 Results tab shown');
        if (currentUser?.permissions?.includes('vote_results') || currentUser?.Permissions?.includes('vote_results')) {
            await loadEndVotesList();
        } else {
            document.getElementById('endVotesList').innerHTML = 
                '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>Bạn không có quyền xem kết quả biểu quyết</div>';
        }
    });
}

// Open create vote modal
function openCreateVoteModal() {
    const modal = new bootstrap.Modal(document.getElementById('createVoteModal'));
    modal.show();
    
    // Load users and setup form when modal opens
    loadUsersForAssignment();
    setupDefaultVoteTime();
}

// Submit create vote from modal
async function submitCreateVote() {
    // Validation ngày
    const startDate = document.getElementById('voteStartDate').value;
    const endDate = document.getElementById('voteEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng nhập đầy đủ ngày bắt đầu và kết thúc!');
        return;
    }
    
    // Tạo datetime với thời gian cụ thể
    // Ngày bắt đầu: 00:00:00
    const startDateTime = new Date(startDate + 'T00:00:00');
    // Ngày kết thúc: 23:59:59
    const endDateTime = new Date(endDate + 'T23:59:59');
    const now = new Date();
    
    // Validation: Ngày bắt đầu phải từ hôm nay trở đi
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set về đầu ngày để so sánh
    
    if (startDateTime < today) {
        alert('Ngày bắt đầu phải từ hôm nay trở đi!');
        return;
    }
    
    // Validation: Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày
    if (endDateTime <= startDateTime) {
        alert('Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày!');
        return;
    }
    
    // Kiểm tra khoảng cách tối thiểu (ít nhất 1 ngày)
    const timeDiff = endDateTime - startDateTime;
    const minTime = 24 * 60 * 60 * 1000; // 1 ngày
    
    if (timeDiff < minTime) {
        alert('Thời gian biểu quyết phải ít nhất 1 ngày!');
        return;
    }
    
    const formData = new FormData();
    formData.append('voteNumber', document.getElementById('voteNumber').value);
    formData.append('title', document.getElementById('voteTitle').value);
    formData.append('content', document.getElementById('voteContent').value);
    
    // Thêm thời gian biểu quyết với format ISO
    formData.append('startDate', startDateTime.toISOString());
    formData.append('endDate', endDateTime.toISOString());
    formData.append('autoClose', document.getElementById('autoCloseVote').checked);
    
    const assigneeType = document.querySelector('input[name="assigneeType"]:checked').value;
    formData.append('assigneeType', assigneeType);
    
    if (assigneeType === 'specific') {
        const selectedUsers = document.querySelectorAll('#usersList input[type="checkbox"]:checked');
        if (selectedUsers.length === 0) {
            alert('Vui lòng chọn ít nhất một người dùng khi chọn "Chọn người dùng cụ thể"!');
            return;
        }
        selectedUsers.forEach(user => {
            formData.append('assignees', user.value);
        });
    }
    
    const files = document.getElementById('voteFiles').files;
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    try {
        const response = await fetch('/api/votes', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            // Thành công - hiển thị thông báo
            alert('Tạo phiếu biểu quyết thành công!');
            
            // Reset form
            document.getElementById('createVoteForm').reset();
            document.getElementById('specificUsers').classList.add('d-none');
            
            // Reset lại thời gian mặc định
            setupDefaultVoteTime();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('createVoteModal'));
            modal.hide();
            
            // Refresh the current tab
            const activeTab = document.querySelector('#voteManagementTabs .nav-link.active');
            if (activeTab && activeTab.id === 'vote-participation-tab') {
                await loadVotesList();
            }
        } else {
            // Lỗi từ server
            const errorText = await response.text();
            console.error('Server error:', errorText);
            alert('Lỗi: ' + (response.status === 500 ? 'Lỗi server' : 'Không thể tạo phiếu biểu quyết'));
        }
    } catch (error) {
        console.error('Create vote error:', error);
        alert('Lỗi kết nối. Vui lòng thử lại!');
    }
}

// Load votes list
async function loadVotesList() {
    console.log('🔧 loadVotesList() called');
    try {
        console.log('🔧 Fetching /api/votes...');
        const response = await fetch('/api/votes');
        const votes = await response.json();
        console.log('🔧 Votes received:', votes.length);
        
        const votesList = document.getElementById('votesList');
        console.log('🔧 votesList element:', votesList);
        votesList.innerHTML = '';
        
        if (votes.length === 0) {
            votesList.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>Không có phiếu biểu quyết nào đang chờ</div>';
            return;
        }
        
        votes.forEach(vote => {
            // Tính toán thời gian còn lại và trạng thái
            const timeInfo = getVoteTimeInfo(vote);
            
            const voteCard = document.createElement('div');
            voteCard.className = `card vote-card mb-3 ${vote.HasVoted ? 'completed' : ''} ${timeInfo.cssClass}`;
            voteCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h5 class="card-title">${vote.Title}</h5>
                            <p class="card-text">${vote.Content.substring(0, 200)}${vote.Content.length > 200 ? '...' : ''}</p>
                            
                            <!-- Thời gian biểu quyết -->
                            ${timeInfo.html}
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <i class="fas fa-hashtag me-1"></i>${vote.VoteNumber}<br>
                                    <i class="fas fa-user me-1"></i>Tạo bởi: ${vote.CreatedBy}<br>
                                    <i class="fas fa-calendar me-1"></i>${formatDate(vote.CreatedDate)}
                                </small>
                                <div>
                                    ${vote.HasVoted ? 
                                        '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Đã biểu quyết</span>' : 
                                        '<span class="badge bg-warning text-dark"><i class="fas fa-clock me-1"></i>Chưa biểu quyết</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-primary ${timeInfo.buttonDisabled ? 'disabled' : ''}" 
                                onclick="showVoteDetail(${vote.VoteID})" 
                                ${timeInfo.buttonDisabled ? 'disabled' : ''}>
                            <i class="fas fa-eye me-2"></i>Xem chi tiết & Biểu quyết
                        </button>
                        ${timeInfo.buttonDisabled ? 
                            '<small class="text-muted ms-2">Phiếu đã hết hạn</small>' : ''
                        }
                    </div>
                </div>
            `;
            votesList.appendChild(voteCard);
        });
        
    } catch (error) {
        console.error('Load votes error:', error);
        document.getElementById('votesList').innerHTML = '<div class="alert alert-danger">Lỗi tải danh sách phiếu biểu quyết</div>';
    }
}

// Tính toán thông tin thời gian của phiếu biểu quyết
function getVoteTimeInfo(vote) {
    if (!vote.EndDate) {
        return {
            html: '<div class="alert alert-info py-2 mb-2"><i class="fas fa-infinity me-1"></i>Không giới hạn thời gian</div>',
            cssClass: '',
            buttonDisabled: false
        };
    }

    const now = new Date();
    const startDate = new Date(vote.StartDate);
    const endDate = new Date(vote.EndDate);
    const minutesRemaining = vote.MinutesRemaining || 0;

    if (vote.TimeStatus === 'Not Started') {
        const minutesToStart = Math.floor((startDate - now) / (1000 * 60));
        const hoursToStart = Math.floor(minutesToStart / 60);
        const remainingMinutes = minutesToStart % 60;
        
        return {
            html: `<div class="alert alert-secondary py-2 mb-2">
                     <i class="fas fa-clock me-1"></i>Sẽ bắt đầu sau: ${hoursToStart}h ${remainingMinutes}m
                     <br><small>Bắt đầu: ${formatDateTime(vote.StartDate)}</small>
                   </div>`,
            cssClass: 'not-started',
            buttonDisabled: true
        };
    }

    if (vote.TimeStatus === 'Expired') {
        return {
            html: `<div class="alert alert-danger py-2 mb-2">
                     <i class="fas fa-times-circle me-1"></i>Đã hết hạn
                     <br><small>Kết thúc: ${formatDateTime(vote.EndDate)}</small>
                   </div>`,
            cssClass: 'expired',
            buttonDisabled: true
        };
    }

    // Đang hoạt động
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    let timeText = '';
    if (days > 0) {
        timeText = `${days} ngày ${remainingHours}h ${minutes}m`;
    } else if (hours > 0) {
        timeText = `${hours}h ${minutes}m`;
    } else {
        timeText = `${minutes}m`;
    }

    const alertClass = minutesRemaining < 60 ? 'alert-danger' : 
                      minutesRemaining < 24*60 ? 'alert-warning' : 'alert-success';

    return {
        html: `<div class="alert ${alertClass} py-2 mb-2">
                 <i class="fas fa-hourglass-half me-1"></i>Thời gian còn lại: <strong>${timeText}</strong>
                 <br><small>Kết thúc: ${formatDateTime(vote.EndDate)}</small>
               </div>`,
        cssClass: minutesRemaining < 60 ? 'urgent' : '',
        buttonDisabled: false
    };
}

// Format datetime cho hiển thị
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Load end votes list
async function loadEndVotesList() {
    console.log('Loading end votes list...');
    
    try {
        const response = await fetch('/api/votes?status=closed');
        if (response.ok) {
            const votes = await response.json();
            const container = document.getElementById('endVotesList');
            
            if (votes.length === 0) {
                container.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Chưa có phiếu biểu quyết nào đã kết thúc.
                    </div>
                `;
                return;
            }
            
            container.innerHTML = votes.map(vote => `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="card-title">${vote.Title}</h5>
                                <p class="text-muted mb-2">
                                    <i class="fas fa-hashtag me-1"></i>Số hiệu: ${vote.VoteNumber}
                                </p>
                                <p class="text-muted mb-2">
                                    <i class="fas fa-calendar me-1"></i>Ngày tạo: ${formatDate(vote.CreatedDate)}
                                </p>
                                ${vote.EndDate ? `
                                    <p class="text-muted mb-2">
                                        <i class="fas fa-clock me-1"></i>Kết thúc: ${formatDate(vote.EndDate)}
                                    </p>
                                ` : ''}
                            </div>
                            <div class="text-end">
                                <span class="badge bg-secondary fs-6">Đã kết thúc</span>
                                <div class="mt-2">
                                    <button class="btn btn-outline-primary btn-sm me-1" 
                                            onclick="viewVoteResults(${vote.VoteID})"
                                            title="Xem kết quả">
                                        <i class="fas fa-chart-bar"></i> Kết quả
                                    </button>
                                    <button class="btn btn-outline-info btn-sm" 
                                            onclick="viewVoteDetails(${vote.VoteID})"
                                            title="Xem chi tiết">
                                        <i class="fas fa-eye"></i> Chi tiết
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            document.getElementById('endVotesList').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Lỗi khi tải danh sách phiếu biểu quyết đã kết thúc.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading end votes:', error);
        document.getElementById('endVotesList').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Lỗi kết nối khi tải danh sách phiếu biểu quyết.
            </div>
        `;
    }
}

// Load document management module
async function loadDocumentManagement() {
    console.log('Loading document management...');
}

// Load resolution management module
async function loadResolutionManagement() {
    try {
        console.log('🔄 Starting loadPermissions...');
        
        // Check if DOM elements exist
        const loadingElement = document.getElementById('permissionsLoading');
        const emptyStateElement = document.getElementById('permissionsEmptyState');
        
        if (!loadingElement) {
            console.error('❌ permissionsLoading element not found');
            return;
        }
        
        if (!emptyStateElement) {
            console.error('❌ permissionsEmptyState element not found');
            return;
        }
        
        loadingElement.classList.remove('d-none');
        emptyStateElement.classList.add('d-none');
        
        // Load users and their permissions
        console.log('📡 Fetching users and permissions...');
        
        const usersResponse = await fetch('/api/admin/users');
        console.log('👥 Users response status:', usersResponse.status);
        
        if (!usersResponse.ok) {
            const errorText = await usersResponse.text();
            throw new Error(`Users API failed: ${usersResponse.status} - ${errorText}`);
        }
        
        const permissionsResponse = await fetch('/api/admin/permissions');
        console.log('🔑 Permissions response status:', permissionsResponse.status);
        
        if (!permissionsResponse.ok) {
            const errorText = await permissionsResponse.text();
            throw new Error(`Permissions API failed: ${permissionsResponse.status} - ${errorText}`);
        }
        
        const users = await usersResponse.json();
        const permissions = await permissionsResponse.json();
        
        console.log('👥 Users loaded:', users.length);
        console.log('🔑 Permissions loaded:', permissions.length);
        
        if (users.length > 0) {
            console.log('📋 Sample user:', users[0]);
        }
        if (permissions.length > 0) {
            console.log('🔐 Sample permission:', permissions[0]);
        }
        
        // Create permissions lookup
        const permissionsLookup = {};
        permissions.forEach(perm => {
            if (!permissionsLookup[perm.UserID]) {
                permissionsLookup[perm.UserID] = {};
            }
            permissionsLookup[perm.UserID][perm.Module] = true;
        });
        
        const tableBody = document.getElementById('permissionsTableBody');
        const emptyState = document.getElementById('permissionsEmptyState');
        const loadingState = document.getElementById('permissionsLoading');
        
        if (!tableBody || !emptyState || !loadingState) {
            console.error('❌ Required DOM elements not found:', {
                tableBody: !!tableBody,
                emptyState: !!emptyState,
                loadingState: !!loadingState
            });
            return;
        }
        
        loadingState.classList.add('d-none');
        
        if (users.length === 0) {
            tableBody.innerHTML = '';
            emptyState.classList.remove('d-none');
            return;
        }
        
        emptyState.classList.add('d-none');
        
        const modules = ['draft', 'create', 'vote', 'result', 'history', 'document', 'admin'];
        
        let tableHTML = '';
        users.forEach(user => {
            const userPermissions = permissionsLookup[user.UserID] || {};
            
            tableHTML += `
                <tr data-user-id="${user.UserID}">
                    <td class="user-info">
                        <div class="user-name">${user.FullName}</div>
                        <div class="user-role">${user.Role}</div>
                    </td>
            `;
            
            modules.forEach(module => {
                const isChecked = userPermissions[module] ? 'checked' : '';
                tableHTML += `
                    <td>
                        <input type="checkbox" class="permissions-checkbox" 
                               data-user-id="${user.UserID}" 
                               data-module="${module}" 
                               ${isChecked}
                               onchange="updatePermission(${user.UserID}, '${module}', this.checked)">
                    </td>
                `;
            });
            
            tableHTML += '</tr>';
        });
        
        tableBody.innerHTML = tableHTML;
        
        // Update statistics
        updatePermissionsStats(users.length, permissions.length);
        
    } catch (error) {
        console.error('Load permissions error:', error);
        document.getElementById('permissionsLoading').classList.add('d-none');
        document.getElementById('permissionsEmptyState').classList.remove('d-none');
        document.getElementById('permissionsEmptyState').innerHTML = 
            `<div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h5 class="text-warning">Lỗi tải dữ liệu phân quyền</h5>
                <p class="text-muted">Lỗi: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadPermissions()">
                    <i class="fas fa-refresh me-2"></i>Thử lại
                </button>
            </div>`;
    }
}

// Update single permission
async function updatePermission(userId, module, hasPermission) {
    try {
        const response = await fetch('/api/admin/permissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                module: module,
                hasPermission: hasPermission
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Highlight the changed cell
            const checkbox = document.querySelector(`input[data-user-id="${userId}"][data-module="${module}"]`);
            const cell = checkbox.closest('td');
            cell.classList.add('permission-changed');
            
            setTimeout(() => {
                cell.classList.remove('permission-changed');
            }, 1000);
            
            // Update last update time
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('vi-VN');
            
        } else {
            throw new Error(result.message || 'Lỗi cập nhật quyền');
        }
        
    } catch (error) {
        console.error('Update permission error:', error);
        alert('Lỗi: ' + error.message);
        
        // Revert checkbox state
        const checkbox = document.querySelector(`input[data-user-id="${userId}"][data-module="${module}"]`);
        checkbox.checked = !hasPermission;
    }
}

// Toggle all permissions for a column
function toggleColumnPermission(module) {
    const checkboxes = document.querySelectorAll(`input[data-module="${module}"]`);
    const checkedCount = document.querySelectorAll(`input[data-module="${module}"]:checked`).length;
    const shouldCheck = checkedCount < checkboxes.length / 2;
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked !== shouldCheck) {
            checkbox.checked = shouldCheck;
            const userId = parseInt(checkbox.dataset.userId);
            updatePermission(userId, module, shouldCheck);
        }
    });
}

// Save all permissions
async function saveAllPermissions() {
    const saveBtn = event.target;
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang lưu...';
    saveBtn.disabled = true;
    
    try {
        const permissions = [];
        const checkboxes = document.querySelectorAll('.permissions-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            permissions.push({
                userId: parseInt(checkbox.dataset.userId),
                module: checkbox.dataset.module
            });
        });
        
        const response = await fetch('/api/admin/permissions/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ permissions })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Lưu tất cả quyền thành công!');
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('vi-VN');
        } else {
            throw new Error(result.message || 'Lỗi lưu quyền');
        }
        
    } catch (error) {
        console.error('Save all permissions error:', error);
        alert('Lỗi: ' + error.message);
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// Reset permissions
function resetPermissions() {
    if (confirm('Bạn có chắc chắn muốn khôi phục tất cả quyền về trạng thái ban đầu?')) {
        loadPermissions();
    }
}

// Search users in permissions matrix
function searchUsers() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#permissionsTableBody tr');
    
    rows.forEach(row => {
        const userName = row.querySelector('.user-name').textContent.toLowerCase();
        const userRole = row.querySelector('.user-role').textContent.toLowerCase();
        
        if (userName.includes(searchTerm) || userRole.includes(searchTerm)) {
            row.style.display = '';
            
            // Highlight matching text
            if (searchTerm) {
                row.querySelectorAll('.user-name, .user-role').forEach(element => {
                    if (!element.classList.contains('search-highlight') && 
                        element.textContent.toLowerCase().includes(searchTerm)) {
                        element.classList.add('search-highlight');
                    }
                });
            } else {
                row.querySelectorAll('.search-highlight').forEach(element => {
                    element.classList.remove('search-highlight');
                });
            }
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update empty state
    const visibleRows = document.querySelectorAll('#permissionsTableBody tr[style=""]');
    const emptyState = document.getElementById('permissionsEmptyState');
    
    if (visibleRows.length === 0 && searchTerm) {
        emptyState.classList.remove('d-none');
        emptyState.innerHTML = '<p class="text-muted">Không tìm thấy người dùng nào phù hợp</p>';
    } else {
        emptyState.classList.add('d-none');
    }
}

// Test permissions API
async function testPermissionsAPI() {
    try {
        console.log('🧪 Testing permissions API...');
        
        // First check current user session
        console.log('0️⃣ Checking current user session');
        console.log('Current user:', currentUser);
        
        if (!currentUser || !currentUser.UserID) {
            console.log('❌ No current user found, might need to re-login');
            alert('Session might have expired. Please refresh and login again.');
            return;
        }
        
        // Test admin test endpoint
        console.log('1️⃣ Testing /api/admin/test');
        const testResponse = await fetch('/api/admin/test');
        console.log('Test response status:', testResponse.status);
        console.log('Test response headers:', testResponse.headers.get('content-type'));
        
        if (!testResponse.ok) {
            const errorText = await testResponse.text();
            console.log('❌ Test endpoint failed:', errorText);
            if (testResponse.status === 401) {
                alert('Session expired. Please refresh and login again.');
                return;
            }
        } else {
            const testData = await testResponse.json();
            console.log('✅ Test result:', testData);
        }
        
        // Test users endpoint
        console.log('2️⃣ Testing /api/admin/users');
        const usersResponse = await fetch('/api/admin/users');
        console.log('Users status:', usersResponse.status);
        console.log('Users content-type:', usersResponse.headers.get('content-type'));
        
        if (!usersResponse.ok) {
            const errorText = await usersResponse.text();
            console.log('❌ Users endpoint failed:', errorText);
        } else {
            const usersData = await usersResponse.json();
            console.log('✅ Users data:', usersData);
        }
        
        // Test permissions endpoint
        console.log('3️⃣ Testing /api/admin/permissions');
        const permissionsResponse = await fetch('/api/admin/permissions');
        console.log('Permissions status:', permissionsResponse.status);
        console.log('Permissions content-type:', permissionsResponse.headers.get('content-type'));
        
        if (!permissionsResponse.ok) {
            const errorText = await permissionsResponse.text();
            console.log('❌ Permissions endpoint failed:', errorText);
        } else {
            const permissionsData = await permissionsResponse.json();
            console.log('✅ Permissions data:', permissionsData);
        }
        
        alert('Check console for detailed API test results');
        
    } catch (error) {
        console.error('❌ API test failed:', error);
        alert('API test failed: ' + error.message);
    }
}

// Update permissions statistics
function updatePermissionsStats(totalUsers, totalPermissions) {
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalPermissions').textContent = totalPermissions;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('vi-VN');
}

// Load history
async function loadHistory() {
    console.log('Loading history...');
}

// Load documents
async function loadDocuments() {
    console.log('Loading documents...');
}

// Load digital signature
async function loadDigitalSign() {
    console.log('Loading digital signature...');
}

// Load admin panel
async function loadAdmin() {
    console.log('🔧 loadAdmin() called');
    console.log('Current user:', currentUser);
    console.log('User role:', currentUser?.Role);
    
    if (currentUser.Role === 'Admin') {
        console.log('✅ User is Admin, loading users...');
        await loadUsers();
        
        // Add event listeners for admin tabs
        const adminTabs = document.querySelectorAll('#adminTabs a[data-bs-toggle="tab"]');
        console.log('🔧 Found admin tabs:', adminTabs.length);
        
        adminTabs.forEach((tab, index) => {
            console.log(`🔧 Tab ${index}:`, tab.getAttribute('data-bs-target'));
            
            tab.addEventListener('shown.bs.tab', async function (e) {
                const targetId = e.target.getAttribute('data-bs-target').substring(1);
                console.log('🔄 Tab switched to:', targetId);
                
                if (targetId === 'permissions') {
                    console.log('🔑 Loading permissions for tab switch...');
                    await loadPermissions();
                } else if (targetId === 'users') {
                    console.log('👥 Loading users for tab switch...');
                    await loadUsers();
                }
            });
        });
        
        // Also load permissions immediately if permissions tab is already active
        const activeTab = document.querySelector('#adminTabs .nav-link.active');
        if (activeTab && activeTab.getAttribute('data-bs-target') === '#permissions') {
            console.log('🔑 Permissions tab is already active, loading data...');
            await loadPermissions();
        }
    } else {
        console.log('❌ User is not Admin, role:', currentUser?.Role);
    }
}

// Load permissions management with matrix view
async function loadPermissions() {
    try {
        console.log('🔑 Loading permissions matrix...');
        console.log('Current user:', currentUser);
        console.log('User role:', currentUser?.Role);
        
        // Check if user is logged in
        if (!currentUser) {
            console.error('❌ User not logged in');
            throw new Error('User not logged in');
        }
        
        if (currentUser.Role !== 'Admin') {
            console.error('❌ User is not admin:', currentUser.Role);
            throw new Error('Admin access required');
        }
        
        console.log('📡 Calling API: /api/admin/permissions');
        const response = await fetch('/api/admin/permissions', {
            method: 'GET',
            credentials: 'include', // Include cookies/session
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('📡 Permissions API response type:', typeof result);
        console.log('📡 Permissions API response:', result);
        
        let users = [];
        if (result.success && result.data) {
            users = result.data;
            console.log('✅ Using result.data format');
        } else if (Array.isArray(result)) {
            users = result;
            console.log('✅ Using direct array format');
        } else {
            console.error('❌ Unexpected API response format:', result);
            throw new Error('Invalid API response format');
        }
        
        console.log('✅ Permissions loaded:', users.length, 'users');
        if (users.length > 0) {
            console.log('👤 First user sample:', users[0]);
            console.log('🔑 First user permissions:', users[0].Permissions);
        }
        
        // Store users globally for filtering
        window.allUsers = users;
        
        // Render permission matrix
        console.log('🎨 Calling renderPermissionMatrix with', users.length, 'users');
        renderPermissionMatrix(users);
        
    } catch (error) {
        console.error('❌ Error loading permissions:', error);
        const matrixBody = document.getElementById('permissionMatrixBody');
        if (matrixBody) {
            matrixBody.innerHTML = 
                `<tr><td colspan="100%" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Lỗi khi tải dữ liệu phân quyền: ${error.message}
                    <br><small>Vui lòng kiểm tra đăng nhập và thử lại</small>
                    <br><button class="btn btn-warning btn-sm mt-2" onclick="debugLoadPermissions()">🐛 Debug</button>
                </td></tr>`;
        }
    }
}

// Define all available permissions - matching actual database values
const ALL_PERMISSIONS = [
    { key: 'dashboard', name: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { key: 'DraftManagement', name: 'Dự thảo', icon: 'fas fa-file-alt' },
    { key: 'Votes', name: 'Biểu quyết', icon: 'fas fa-vote-yea' },
    { key: 'Drafts', name: 'Quản lý Dự thảo', icon: 'fas fa-file-edit' },
    { key: 'create_draft', name: 'Tạo dự thảo mới', icon: 'fas fa-edit' },
    { key: 'close_draft', name: 'Kết thúc góp ý', icon: 'fas fa-lock' },
    { key: 'vote_creation', name: 'Tạo phiếu', icon: 'fas fa-plus-circle' },
    { key: 'vote_results', name: 'Kết quả', icon: 'fas fa-chart-bar' },
    { key: 'vote_summary', name: 'Tổng kết', icon: 'fas fa-clipboard-list' },
    { key: 'resolution_management', name: 'Nghị quyết', icon: 'fas fa-gavel' },
    { key: 'document_library', name: 'Thư viện', icon: 'fas fa-book' },
    { key: 'digital_signature', name: 'Chữ ký số', icon: 'fas fa-signature' },
    { key: 'user_management', name: 'Quản lý User', icon: 'fas fa-users-cog' }
];

// Render permission matrix
function renderPermissionMatrix(users) {
    console.log('=== renderPermissionMatrix called ===');
    console.log('Users data:', users);
    console.log('Users count:', users?.length);
    
    const matrix = document.getElementById('permissionMatrix');
    const matrixBody = document.getElementById('permissionMatrixBody');
    
    console.log('Matrix element:', matrix);
    console.log('MatrixBody element:', matrixBody);
    
    if (!matrix || !matrixBody) {
        console.error('Missing required DOM elements');
        return;
    }
    
    // Clear existing body content
    matrixBody.innerHTML = '';
    
    if (!users || users.length === 0) {
        matrixBody.innerHTML = '<tr><td colspan="100%" class="text-center text-muted">Không có dữ liệu người dùng</td></tr>';
        return;
    }
    
    // Update header with permission columns
    const headerRow = matrix.querySelector('thead tr:first-child');
    const permissionHeaderRow = matrix.querySelector('thead tr:last-child');
    
    // Clear existing permission columns
    const existingPermCols = headerRow.querySelectorAll('.perm-col');
    existingPermCols.forEach(col => col.remove());
    
    const existingPermHeaders = permissionHeaderRow.querySelectorAll('.perm-header');
    existingPermHeaders.forEach(header => header.remove());
    
    // Add permission columns to header
    ALL_PERMISSIONS.forEach(perm => {
        // Main header
        const th = document.createElement('th');
        th.className = 'perm-col text-center';
        th.style.minWidth = '80px';
        th.innerHTML = `
            <div class="d-flex flex-column align-items-center">
                <i class="${perm.icon} mb-1"></i>
                <small>${perm.name}</small>
            </div>
        `;
        headerRow.appendChild(th);
        
        // Permission toggle header
        const permTh = document.createElement('th');
        permTh.className = 'perm-header text-center';
        permTh.innerHTML = `
            <input type="checkbox" class="form-check-input permission-toggle-all" 
                   data-permission="${perm.key}" 
                   onchange="togglePermissionForAll('${perm.key}')"
                   title="Toggle ${perm.name} cho tất cả users">
        `;
        permissionHeaderRow.appendChild(permTh);
    });
    
    // Render user rows
    users.forEach((user, index) => {
        console.log(`Rendering user ${index}:`, user);
        
        const row = document.createElement('tr');
        row.className = 'user-row';
        
        // Checkbox column
        const checkboxCell = document.createElement('td');
        checkboxCell.className = 'text-center';
        checkboxCell.innerHTML = `<input type="checkbox" class="form-check-input user-checkbox" value="${user.UserId || user.UserID}">`;
        row.appendChild(checkboxCell);
        
        // User ID
        const idCell = document.createElement('td');
        idCell.textContent = user.UserId || user.UserID || '';
        row.appendChild(idCell);
        
        // Username
        const usernameCell = document.createElement('td');
        usernameCell.textContent = user.Username || '';
        row.appendChild(usernameCell);
        
        // Full name
        const nameCell = document.createElement('td');
        nameCell.textContent = user.FullName || '';
        row.appendChild(nameCell);
        
        // Role
        const roleCell = document.createElement('td');
        roleCell.innerHTML = `<span class="badge ${user.Role === 'Admin' ? 'bg-danger' : 'bg-secondary'}">${user.Role || 'User'}</span>`;
        row.appendChild(roleCell);
        
        // Permission columns
        ALL_PERMISSIONS.forEach(perm => {
            const permCell = document.createElement('td');
            permCell.className = 'text-center';
            
            const hasPermission = user.Permissions && user.Permissions.includes(perm.key);
            const isDisabled = user.Role === 'Admin'; // Admin có tất cả quyền
            
            permCell.innerHTML = `
                <input type="checkbox" 
                       class="form-check-input permission-checkbox" 
                       data-user-id="${user.UserId || user.UserID}" 
                       data-permission="${perm.key}"
                       ${hasPermission || isDisabled ? 'checked' : ''}
                       ${isDisabled ? 'disabled title="Admin có tất cả quyền"' : ''}
                       onchange="updateUserPermission(${user.UserId || user.UserID}, '${perm.key}', this.checked)">
            `;
            row.appendChild(permCell);
        });
        
        matrixBody.appendChild(row);
    });
    
    console.log('Matrix rendered successfully');
}

// Render single user row
function renderUserRow(user) {
    const isAdmin = user.Role === 'Admin';
    const userPermissions = user.Permissions || [];
    
    let permissionCells = '';
    ALL_PERMISSIONS.forEach(perm => {
        const hasPermission = isAdmin || userPermissions.includes(perm.key);
        const isDisabled = isAdmin ? 'disabled' : '';
        const checkboxClass = isAdmin ? 'text-warning' : (hasPermission ? 'text-success' : 'text-muted');
        
        permissionCells += `
            <td class="text-center">
                <input type="checkbox" 
                       class="form-check-input permission-checkbox ${checkboxClass}"
                       data-user-id="${user.UserID}"
                       data-permission="${perm.key}"
                       ${hasPermission ? 'checked' : ''}
                       ${isDisabled}
                       onchange="updateUserPermission(${user.UserID}, '${perm.key}', this.checked)"
                       title="${isAdmin ? 'Admin có tất cả quyền' : (hasPermission ? 'Có quyền ' + perm.name : 'Không có quyền ' + perm.name)}">
            </td>
        `;
    });
    
    return `
        <tr data-user-id="${user.UserID}" class="${isAdmin ? 'table-warning' : ''}">
            <td class="text-center">
                <input type="checkbox" class="form-check-input user-selector" 
                       data-user-id="${user.UserID}" 
                       onchange="updateUserSelection()"
                       ${isAdmin ? 'disabled title="Không thể chọn Admin"' : ''}>
            </td>
            <td>${user.UserID}</td>
            <td>
                <div class="d-flex align-items-center">
                    ${isAdmin ? '<i class="fas fa-crown text-warning me-2" title="Administrator"></i>' : ''}
                    <strong>${user.Username}</strong>
                </div>
            </td>
            <td>${user.FullName}</td>
            <td>
                <span class="badge ${getRoleBadgeClass(user.Role)}">${user.Role}</span>
            </td>
            ${permissionCells}
        </tr>
    `;
}

// Get role badge class
function getRoleBadgeClass(role) {
    switch(role) {
        case 'Admin': return 'bg-warning text-dark';
        case 'Manager': return 'bg-info';
        case 'Member': return 'bg-primary';
        default: return 'bg-secondary';
    }
}

// Filter permission matrix
function filterPermissionMatrix() {
    const searchTerm = document.getElementById('permissionSearch').value.toLowerCase();
    const selectedRole = document.getElementById('permissionRoleFilter').value;
    
    if (!window.allUsers) return;
    
    const filteredUsers = window.allUsers.filter(user => {
        const matchesSearch = user.FullName.toLowerCase().includes(searchTerm) || 
                            user.Username.toLowerCase().includes(searchTerm);
        const matchesRole = !selectedRole || user.Role === selectedRole;
        return matchesSearch && matchesRole;
    });
    
    renderPermissionMatrix(filteredUsers);
}

// Update user permission
async function updateUserPermission(userId, permission, hasPermission) {
    try {
        console.log(`Updating permission: User ${userId}, ${permission} = ${hasPermission}`);
        
        // Find user data
        const user = window.allUsers.find(u => u.UserID === userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Update user permissions locally
        if (!user.Permissions) user.Permissions = [];
        
        if (hasPermission) {
            if (!user.Permissions.includes(permission)) {
                user.Permissions.push(permission);
            }
        } else {
            user.Permissions = user.Permissions.filter(p => p !== permission);
        }
        
        // Update server
        const response = await fetch(`/api/admin/permissions/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: user.Role,
                permissions: user.Permissions
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        console.log('Permission updated successfully');
        
        // Update checkbox appearance
        const checkbox = document.querySelector(`input[data-user-id="${userId}"][data-permission="${permission}"]`);
        if (checkbox) {
            checkbox.className = `form-check-input permission-checkbox ${hasPermission ? 'text-success' : 'text-muted'}`;
            checkbox.title = hasPermission ? `Có quyền ${permission}` : `Không có quyền ${permission}`;
        }
        
    } catch (error) {
        console.error('Error updating permission:', error);
        
        // Revert checkbox state
        const checkbox = document.querySelector(`input[data-user-id="${userId}"][data-permission="${permission}"]`);
        if (checkbox) {
            checkbox.checked = !hasPermission;
        }
        
        alert('Lỗi cập nhật quyền: ' + error.message);
    }
}

// Toggle all users selection
function toggleAllUsers() {
    const masterCheckbox = document.getElementById('selectAllUsersCheckbox');
    const userCheckboxes = document.querySelectorAll('.user-selector:not(:disabled)');
    
    userCheckboxes.forEach(checkbox => {
        checkbox.checked = masterCheckbox.checked;
    });
    
    updateUserSelection();
}

// Update user selection state
function updateUserSelection() {
    const selectedUsers = document.querySelectorAll('.user-selector:checked');
    const allUsers = document.querySelectorAll('.user-selector:not(:disabled)');
    const masterCheckbox = document.getElementById('selectAllUsersCheckbox');
    
    // Update master checkbox state
    if (selectedUsers.length === 0) {
        masterCheckbox.indeterminate = false;
        masterCheckbox.checked = false;
    } else if (selectedUsers.length === allUsers.length) {
        masterCheckbox.indeterminate = false;
        masterCheckbox.checked = true;
    } else {
        masterCheckbox.indeterminate = true;
    }
    
    console.log(`Selected ${selectedUsers.length} of ${allUsers.length} users`);
}

// Select all users
function selectAllUsers() {
    const userCheckboxes = document.querySelectorAll('.user-selector:not(:disabled)');
    userCheckboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    updateUserSelection();
}

// Unselect all users
function unselectAllUsers() {
    const userCheckboxes = document.querySelectorAll('.user-selector:not(:disabled)');
    userCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateUserSelection();
}

// Toggle column permission for all selected users
function toggleColumnPermission(permission) {
    const selectedUsers = Array.from(document.querySelectorAll('.user-selector:checked'))
        .map(cb => parseInt(cb.dataset.userId));
    
    if (selectedUsers.length === 0) {
        alert('Vui lòng chọn ít nhất một người dùng');
        return;
    }
    
    // Check current state of permission for selected users
    const permCheckboxes = selectedUsers.map(userId => 
        document.querySelector(`input[data-user-id="${userId}"][data-permission="${permission}"]`)
    ).filter(cb => cb && !cb.disabled);
    
    const checkedCount = permCheckboxes.filter(cb => cb.checked).length;
    const shouldGrant = checkedCount < permCheckboxes.length / 2; // Toggle based on majority
    
    console.log(`Toggling ${permission} for ${selectedUsers.length} users to ${shouldGrant}`);
    
    // Update all checkboxes
    permCheckboxes.forEach(checkbox => {
        if (checkbox.checked !== shouldGrant) {
            checkbox.checked = shouldGrant;
            const userId = parseInt(checkbox.dataset.userId);
            updateUserPermission(userId, permission, shouldGrant);
        }
    });
}

// Grant selected permissions
function grantSelectedPermissions() {
    const permissionToGrant = prompt('Nhập tên quyền cần cấp (ví dụ: vote_participation, draft_management):');
    if (!permissionToGrant) return;
    
    const validPermission = ALL_PERMISSIONS.find(p => p.key === permissionToGrant || p.name.toLowerCase() === permissionToGrant.toLowerCase());
    if (!validPermission) {
        alert('Quyền không hợp lệ. Vui lòng chọn từ danh sách có sẵn.');
        return;
    }
    
    const selectedUsers = Array.from(document.querySelectorAll('.user-selector:checked'))
        .map(cb => parseInt(cb.dataset.userId));
    
    if (selectedUsers.length === 0) {
        alert('Vui lòng chọn ít nhất một người dùng');
        return;
    }
    
    selectedUsers.forEach(userId => {
        const checkbox = document.querySelector(`input[data-user-id="${userId}"][data-permission="${validPermission.key}"]`);
        if (checkbox && !checkbox.disabled && !checkbox.checked) {
            checkbox.checked = true;
            updateUserPermission(userId, validPermission.key, true);
        }
    });
}

// Revoke selected permissions
function revokeSelectedPermissions() {
    const permissionToRevoke = prompt('Nhập tên quyền cần thu hồi (ví dụ: vote_participation, draft_management):');
    if (!permissionToRevoke) return;
    
    const validPermission = ALL_PERMISSIONS.find(p => p.key === permissionToRevoke || p.name.toLowerCase() === permissionToRevoke.toLowerCase());
    if (!validPermission) {
        alert('Quyền không hợp lệ. Vui lòng chọn từ danh sách có sẵn.');
        return;
    }
    
    const selectedUsers = Array.from(document.querySelectorAll('.user-selector:checked'))
        .map(cb => parseInt(cb.dataset.userId));
    
    if (selectedUsers.length === 0) {
        alert('Vui lòng chọn ít nhất một người dùng');
        return;
    }
    
    selectedUsers.forEach(userId => {
        const checkbox = document.querySelector(`input[data-user-id="${userId}"][data-permission="${validPermission.key}"]`);
        if (checkbox && !checkbox.disabled && checkbox.checked) {
            checkbox.checked = false;
            updateUserPermission(userId, validPermission.key, false);
        }
    });
}

// Save all permissions
async function saveAllPermissions() {
    if (!confirm('Bạn có chắc chắn muốn lưu tất cả thay đổi quyền?')) {
        return;
    }
    
    try {
        const saveButton = document.querySelector('button[onclick="saveAllPermissions()"]');
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang lưu...';
        
        // Here you could implement batch save API call
        console.log('Saving all permissions...');
        
        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert('✅ Đã lưu thành công tất cả thay đổi quyền!');
        
    } catch (error) {
        console.error('Error saving permissions:', error);
        alert('❌ Lỗi khi lưu: ' + error.message);
    } finally {
        const saveButton = document.querySelector('button[onclick="saveAllPermissions()"]');
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fas fa-save me-2"></i>Lưu tất cả';
    }
}

// Reset permissions
function resetPermissions() {
    if (!confirm('Bạn có chắc chắn muốn khôi phục về trạng thái ban đầu?')) {
        return;
    }
    
    // Reload permissions from server
    loadPermissions();
}

// Export permissions
function exportPermissions() {
    if (!window.allUsers) {
        alert('Không có dữ liệu để xuất');
        return;
    }
    
    // Create CSV content
    let csvContent = 'UserID,Username,FullName,Role';
    ALL_PERMISSIONS.forEach(perm => {
        csvContent += ',' + perm.name;
    });
    csvContent += '\n';
    
    window.allUsers.forEach(user => {
        const isAdmin = user.Role === 'Admin';
        const userPermissions = user.Permissions || [];
        
        csvContent += `${user.UserID},${user.Username},"${user.FullName}",${user.Role}`;
        ALL_PERMISSIONS.forEach(perm => {
            const hasPermission = isAdmin || userPermissions.includes(perm.key);
            csvContent += ',' + (hasPermission ? 'Yes' : 'No');
        });
        csvContent += '\n';
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'permissions_matrix_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Render permissions table
function renderPermissionsTable(users) {
    if (!users || users.length === 0) {
        return `
            <div class="text-center py-4">
                <i class="fas fa-users text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-2">Không có người dùng nào</p>
            </div>
        `;
    }
    
    return `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>STT</th>
                        <th>Họ tên</th>
                        <th>Tên đăng nhập</th>
                        <th>Vai trò</th>
                        <th>Quyền hiện tại</th>
                        <th>Trạng thái</th>
                        <th class="text-center">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map((user, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="user-avatar me-2">
                                        <i class="fas fa-user-circle text-primary"></i>
                                    </div>
                                    <div>
                                        <strong>${user.FullName}</strong>
                                        ${user.Email ? `<br><small class="text-muted">${user.Email}</small>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <code>${user.Username}</code>
                            </td>
                            <td>
                                <span class="badge ${getRoleBadgeClass(user.Role)}">
                                    <i class="${getRoleIcon(user.Role)} me-1"></i>
                                    ${user.Role}
                                </span>
                            </td>
                            <td>
                                <div class="permissions-list">
                                    ${renderUserPermissions(user.Permissions)}
                                </div>
                            </td>
                            <td>
                                <span class="badge ${user.IsActive ? 'bg-success' : 'bg-danger'}">
                                    <i class="fas fa-${user.IsActive ? 'check' : 'times'} me-1"></i>
                                    ${user.IsActive ? 'Hoạt động' : 'Bị khóa'}
                                </span>
                            </td>
                            <td class="text-center">
                                <div class="btn-group" role="group">
                                    <button class="btn btn-sm btn-outline-primary" 
                                            onclick="showEditPermissionModal(${user.UserID})" 
                                            title="Chỉnh sửa quyền">
                                        <i class="fas fa-key"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" 
                                            onclick="viewUserPermissionHistory(${user.UserID})" 
                                            title="Lịch sử phân quyền">
                                        <i class="fas fa-history"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Render user permissions
function renderUserPermissions(permissions) {
    if (!permissions || permissions.length === 0) {
        return '<span class="text-muted">Không có quyền</span>';
    }
    
    const permissionLabels = {
        'view_dashboard': { icon: 'tachometer-alt', label: 'Dashboard', color: 'primary' },
        'vote_management': { icon: 'vote-yea', label: 'Biểu quyết', color: 'success' },
        'draft_management': { icon: 'file-alt', label: 'Dự thảo', color: 'info' },
        'create_vote': { icon: 'plus-circle', label: 'Tạo phiếu', color: 'warning' },
        'create_draft': { icon: 'edit', label: 'Tạo dự thảo', color: 'secondary' },
        'close_draft': { icon: 'lock', label: 'Kết thúc góp ý', color: 'warning' },
        'user_management': { icon: 'users-cog', label: 'Người dùng', color: 'danger' },
        'view_results': { icon: 'chart-bar', label: 'Kết quả', color: 'dark' },
        'system_admin': { icon: 'cogs', label: 'Hệ thống', color: 'warning' }
    };
    
    return permissions.map(perm => {
        const permInfo = permissionLabels[perm] || { icon: 'question', label: perm, color: 'secondary' };
        return `
            <span class="badge bg-${permInfo.color} me-1 mb-1" title="${permInfo.label}">
                <i class="fas fa-${permInfo.icon} me-1"></i>
                ${permInfo.label}
            </span>
        `;
    }).join('');
}

// Get role badge class
function getRoleBadgeClass(role) {
    switch (role) {
        case 'Admin': return 'bg-danger';
        case 'Manager': return 'bg-warning text-dark';
        case 'User': return 'bg-primary';
        default: return 'bg-secondary';
    }
}

// Get role icon
function getRoleIcon(role) {
    switch (role) {
        case 'Admin': return 'fas fa-crown';
        case 'Manager': return 'fas fa-user-tie';
        case 'User': return 'fas fa-user';
        default: return 'fas fa-question';
    }
}

// Show edit permission modal
async function showEditPermissionModal(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const user = await response.json();
        
        // Populate modal
        document.getElementById('editPermissionUserId').value = user.UserID;
        document.getElementById('editPermissionUsername').value = user.Username;
        document.getElementById('editPermissionFullName').value = user.FullName;
        document.getElementById('editPermissionRole').value = user.Role;
        
        // Set permissions checkboxes
        const permissions = user.Permissions || [];
        const permissionCheckboxes = [
            'view_dashboard', 'vote_management', 'draft_management', 'create_vote',
            'create_draft', 'close_draft', 'user_management', 'view_results', 'system_admin'
        ];
        
        permissionCheckboxes.forEach(perm => {
            const checkbox = document.getElementById(`perm_${perm}`);
            if (checkbox) {
                checkbox.checked = permissions.includes(perm);
            }
        });
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editPermissionModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error loading user details:', error);
        alert('Lỗi khi tải thông tin người dùng');
    }
}

// Show bulk permission modal
async function showBulkPermissionModal() {
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        
        // Populate user selection
        const userSelection = document.getElementById('bulkUserSelection');
        userSelection.innerHTML = users.map(user => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="bulkUser_${user.UserID}" value="${user.UserID}">
                <label class="form-check-label" for="bulkUser_${user.UserID}">
                    <strong>${user.FullName}</strong> (${user.Username}) - ${user.Role}
                </label>
            </div>
        `).join('');
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bulkPermissionModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error loading users for bulk permission:', error);
        alert('Lỗi khi tải danh sách người dùng');
    }
}

// Save user permissions
async function saveUserPermissions() {
    try {
        const userId = document.getElementById('editPermissionUserId').value;
        const role = document.getElementById('editPermissionRole').value;
        
        // Get selected permissions
        const permissions = [];
        const permissionCheckboxes = [
            'view_dashboard', 'vote_management', 'draft_management', 'create_vote',
            'create_draft', 'close_draft', 'user_management', 'view_results', 'system_admin'
        ];
        
        permissionCheckboxes.forEach(perm => {
            const checkbox = document.getElementById(`perm_${perm}`);
            if (checkbox && checkbox.checked) {
                permissions.push(perm);
            }
        });
        
        const response = await fetch(`/api/admin/permissions/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: role,
                permissions: permissions
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Cập nhật quyền thành công!');
            bootstrap.Modal.getInstance(document.getElementById('editPermissionModal')).hide();
            await loadPermissions(); // Reload permissions table
        } else {
            alert('Lỗi: ' + result.error);
        }
        
    } catch (error) {
        console.error('Error saving permissions:', error);
        alert('Lỗi khi lưu quyền: ' + error.message);
    }
}

// Save bulk permissions
async function saveBulkPermissions() {
    try {
        // Get selected users
        const selectedUsers = [];
        const userCheckboxes = document.querySelectorAll('#bulkUserSelection input[type="checkbox"]:checked');
        userCheckboxes.forEach(checkbox => {
            selectedUsers.push(parseInt(checkbox.value));
        });
        
        if (selectedUsers.length === 0) {
            alert('Vui lòng chọn ít nhất một người dùng');
            return;
        }
        
        const role = document.getElementById('bulkPermissionRole').value;
        const action = document.querySelector('input[name="permissionAction"]:checked').value;
        
        // Get selected permissions
        const permissions = [];
        const permissionCheckboxes = [
            'view_dashboard', 'vote_management', 'draft_management', 'create_vote',
            'create_draft', 'close_draft', 'user_management', 'view_results', 'system_admin'
        ];
        
        permissionCheckboxes.forEach(perm => {
            const checkbox = document.getElementById(`bulk_perm_${perm}`);
            if (checkbox && checkbox.checked) {
                permissions.push(perm);
            }
        });
        
        const response = await fetch('/api/admin/permissions/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIds: selectedUsers,
                role: role || null,
                permissions: permissions,
                action: action
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Cập nhật quyền cho ${result.updatedCount} người dùng thành công!`);
            bootstrap.Modal.getInstance(document.getElementById('bulkPermissionModal')).hide();
            await loadPermissions(); // Reload permissions table
        } else {
            alert('Lỗi: ' + result.error);
        }
        
    } catch (error) {
        console.error('Error saving bulk permissions:', error);
        alert('Lỗi khi lưu quyền hàng loạt: ' + error.message);
    }
}

// View user permission history
async function viewUserPermissionHistory(userId) {
    try {
        const response = await fetch(`/api/admin/permissions/${userId}/history`);
        const history = await response.json();
        
        // Create a simple alert for now - can be enhanced to a modal later
        if (history.length === 0) {
            alert('Chưa có lịch sử thay đổi quyền cho người dùng này');
        } else {
            const historyText = history.map(h => 
                `${h.changeDate}: ${h.action} - ${h.permissions} (bởi ${h.changedBy})`
            ).join('\n');
            alert('Lịch sử phân quyền:\n\n' + historyText);
        }
        
    } catch (error) {
        console.error('Error loading permission history:', error);
        alert('Lỗi khi tải lịch sử phân quyền');
    }
}

// Test database connection direct (no auth)
async function testDbConnectionDirect() {
    try {
        console.log('Testing direct database connection...');
        const response = await fetch('/api/test-db');
        const result = await response.json();
        
        if (response.ok) {
            alert(`✅ Direct DB test successful!\n\nResults:\n- Pool: ${result.pool}\n- User count: ${result.userCount}\n- Server: ${result.server}\n- Database: ${result.database}`);
            console.log('Direct DB test result:', result);
        } else {
            alert(`❌ Direct DB test failed!\n\nError: ${result.error}\nDetails: ${result.details}\nCode: ${result.code}\nNumber: ${result.number}`);
            console.error('Direct DB test error:', result);
        }
    } catch (error) {
        alert(`❌ Direct connection test failed!\n\nError: ${error.message}`);
        console.error('Direct test connection error:', error);
    }
}

// Test database connection
async function testDbConnection() {
    try {
        console.log('Testing database connection...');
        const response = await fetch('/api/admin/test');
        const result = await response.json();
        
        if (response.ok) {
            alert(`✅ Database test successful!\n\nResults:\n- Pool: ${result.pool}\n- User count: ${result.userCount}\n- Session: ${result.sessionUser}`);
            console.log('DB test result:', result);
        } else {
            alert(`❌ Database test failed!\n\nError: ${result.error}\nDetails: ${result.details}\nCode: ${result.code}\nNumber: ${result.number}`);
            console.error('DB test error:', result);
        }
    } catch (error) {
        alert(`❌ Connection test failed!\n\nError: ${error.message}`);
        console.error('Test connection error:', error);
    }
}

// Load users for admin
async function loadUsers() {
    try {
        console.log('🔄 Loading users...');
        const response = await fetch('/api/admin/users');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
        }
        
        const users = await response.json();
        console.log('Users data received:', users);
        console.log('Users type:', typeof users);
        console.log('Is array?', Array.isArray(users));
        
        // Validate that users is an array
        if (!Array.isArray(users)) {
            console.error('❌ Users is not an array:', users);
            throw new Error('Invalid data format: expected array');
        }
        
        const usersTableDiv = document.getElementById('usersTable');
        if (!usersTableDiv) {
            console.error('❌ usersTable element not found');
            return;
        }
        
        let tableHTML = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên đăng nhập</th>
                            <th>Họ tên</th>
                            <th>Vai trò</th>
                            <th>Ngày tạo</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        if (users.length === 0) {
            tableHTML += `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        <i class="fas fa-users"></i> Chưa có người dùng nào
                    </td>
                </tr>
            `;
        } else {
            users.forEach(user => {
                tableHTML += `
                    <tr>
                        <td>${user.UserID || 'N/A'}</td>
                        <td>${user.Username || 'N/A'}</td>
                        <td>${user.FullName || 'N/A'}</td>
                        <td><span class="badge ${user.Role === 'Admin' ? 'bg-primary' : 'bg-secondary'}">${user.Role || 'User'}</span></td>
                        <td>${user.CreatedDate ? formatDate(user.CreatedDate) : 'N/A'}</td>
                        <td><span class="badge ${user.IsActive ? 'bg-success' : 'bg-danger'}">${user.IsActive ? 'Hoạt động' : 'Vô hiệu'}</span></td>
                        <td>
                            ${user.Username !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${user.UserID})" title="Xóa người dùng"><i class="fas fa-trash"></i></button>` : '<span class="text-muted">System</span>'}
                        </td>
                    </tr>
                `;
            });
        }
        
        tableHTML += '</tbody></table></div>';
        usersTableDiv.innerHTML = tableHTML;
        
        console.log('✅ Users table updated successfully');
        
    } catch (error) {
        console.error('❌ Load users error:', error);
        const usersTableDiv = document.getElementById('usersTable');
        if (usersTableDiv) {
            usersTableDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Lỗi tải danh sách người dùng: ${error.message}
                    <br><small>Kiểm tra console để xem chi tiết</small>
                </div>
            `;
        }
    }
}

// Add user
async function addUser() {
    const username = document.getElementById('newUsername').value;
    const fullName = document.getElementById('newFullName').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                fullName,
                password,
                role
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Thêm người dùng thành công!');
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            document.getElementById('addUserForm').reset();
            await loadUsers();
        } else {
            alert('Lỗi: ' + data.error);
        }
    } catch (error) {
        console.error('Add user error:', error);
        alert('Lỗi kết nối');
    }
}

// Show vote detail modal
async function showVoteDetail(voteId) {
    try {
        console.log('🔄 Loading vote detail for ID:', voteId);
        const response = await fetch(`/api/votes/${voteId}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error:', errorData);
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Vote data loaded:', data);
        
        if (!data.vote) {
            throw new Error('Dữ liệu phiếu biểu quyết không hợp lệ');
        }
        
        const modal = document.getElementById('voteDetailModal');
        const modalTitle = document.getElementById('voteDetailTitle');
        const modalContent = document.getElementById('voteDetailContent');
        const modalFooter = document.getElementById('voteDetailFooter');
        
        modalTitle.textContent = data.vote.Title;
        
        let contentHTML = `
            <div class="mb-3">
                <strong>Số phiếu:</strong> ${data.vote.VoteNumber}
            </div>
            <div class="mb-3">
                <strong>Nội dung:</strong>
                <p>${data.vote.Content}</p>
            </div>
        `;
        
        // Check if user already voted
        const userVote = data.results.find(r => r.UserID === currentUser.UserID);
        
        if (userVote) {
            contentHTML += `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>Bạn đã biểu quyết:</strong> ${userVote.Choice}
                    ${userVote.Reason ? `<br><strong>Lý do:</strong> ${userVote.Reason}` : ''}
                    <br><small>Thời gian: ${formatDate(userVote.VotedDate)}</small>
                </div>
            `;
            modalFooter.innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>';
        } else if (currentUser.Role !== 'Admin') {
            // Show voting form
            contentHTML += `
                <hr>
                <h6>Biểu quyết của bạn:</h6>
                <form id="voteForm">
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="voteChoice" id="agree" value="agree">
                            <label class="form-check-label" for="agree">
                                <i class="fas fa-thumbs-up text-success me-2"></i>Đồng ý
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="voteChoice" id="disagree" value="disagree">
                            <label class="form-check-label" for="disagree">
                                <i class="fas fa-thumbs-down text-danger me-2"></i>Không đồng ý
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="voteChoice" id="other" value="other">
                            <label class="form-check-label" for="other">
                                <i class="fas fa-comment text-warning me-2"></i>Ý kiến khác
                            </label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="voteReason" class="form-label">Lý do / Ý kiến (tuỳ chọn)</label>
                        <textarea class="form-control" id="voteReason" rows="3"></textarea>
                    </div>
                </form>
            `;
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                <button type="button" class="btn btn-primary" onclick="submitVote(${voteId})">
                    <i class="fas fa-paper-plane me-2"></i>Gửi Biểu quyết
                </button>
            `;
        } else {
            contentHTML += '<div class="alert alert-info">Admin có thể xem chi tiết nhưng không tham gia biểu quyết</div>';
            modalFooter.innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>';
        }
        
        modalContent.innerHTML = contentHTML;
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
    } catch (error) {
        console.error('❌ Show vote detail error:', error.message);
        console.error('📋 Full error:', error);
        
        // Show user-friendly error message
        const errorMsg = error.message.includes('HTTP') 
            ? 'Không thể tải chi tiết phiếu biểu quyết. Vui lòng thử lại.'
            : error.message;
            
        showAlert(errorMsg, 'danger');
    }
}

// Submit vote
async function submitVote(voteId) {
    const selectedChoice = document.querySelector('input[name="voteChoice"]:checked');
    if (!selectedChoice) {
        alert('Vui lòng chọn một lựa chọn');
        return;
    }
    
    const choice = selectedChoice.value;
    const reason = document.getElementById('voteReason').value;
    
    if (choice === 'disagree' && !reason.trim()) {
        alert('Vui lòng nhập lý do khi không đồng ý');
        return;
    }
    
    if (choice === 'other' && !reason.trim()) {
        alert('Vui lòng nhập ý kiến khác');
        return;
    }
    
    try {
        const response = await fetch(`/api/votes/${voteId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                choice,
                reason
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Display success message
            alert(data.message);
            
            console.log('🔧 Vote submitted successfully, refreshing data...');
            
            // Close the modal
            bootstrap.Modal.getInstance(document.getElementById('voteDetailModal')).hide();
            
            // If vote was auto-closed, show notification and redirect
            if (data.autoClosed) {
                setTimeout(async () => {
                    alert('🎉 Tất cả người dùng đã hoàn thành biểu quyết!\nPhiếu đã được tự động đóng và chuyển sang kết quả.');
                    
                    // Redirect to dashboard or specified module
                    if (data.redirectTo) {
                        showModule(data.redirectTo);
                    } else {
                        // Default to dashboard if no redirectTo specified
                        showModule('dashboard');
                    }
                    
                    // Refresh dashboard stats in all cases
                    await loadDashboard();
                }, 500);
            } else {
                // Just reload the votes list and refresh dashboard
                console.log('🔧 Reloading votes list...');
                await loadVotesList();
                
                // Always refresh dashboard stats after voting
                console.log('🔧 Force refreshing dashboard stats...');
                await loadDashboard();
                
                // Also update dashboard element directly if visible
                const pendingCountElement = document.getElementById('pendingVotesCount');
                if (pendingCountElement) {
                    // Force reload dashboard data
                    setTimeout(async () => {
                        await loadDashboard();
                    }, 500);
                }
            }
        } else {
            alert('Lỗi: ' + data.error);
        }
    } catch (error) {
        console.error('Submit vote error:', error);
        alert('Lỗi kết nối');
    }
}

// View draft details
async function viewDraft(draftId) {
    try {
        const response = await fetch(`/api/drafts/${draftId}`);
        const data = await response.json();
        
        // This would show draft details in a modal
        console.log('Draft details:', data);
        alert('Chức năng xem chi tiết dự thảo sẽ được triển khai');
    } catch (error) {
        console.error('View draft error:', error);
        alert('Lỗi tải chi tiết dự thảo');
    }
}

// Approve draft
async function approveDraft(draftId) {
    if (confirm('Bạn có chắc chắn thống nhất dự thảo này?')) {
        try {
            const response = await fetch(`/api/drafts/${draftId}/approve`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Thống nhất dự thảo thành công!');
                await loadDraftManagement();
            } else {
                alert('Lỗi: ' + data.error);
            }
        } catch (error) {
            console.error('Approve draft error:', error);
            alert('Lỗi kết nối');
        }
    }
}

// Handle create draft
async function handleCreateDraft(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('draftTitle').value);
    formData.append('content', document.getElementById('draftContent').value);
    formData.append('commentPeriod', document.getElementById('commentPeriod').value);
    formData.append('priority', document.getElementById('draftPriority').value);
    
    // Handle viewer selection
    const viewerType = document.querySelector('input[name="viewerType"]:checked').value;
    formData.append('viewerType', viewerType);
    
    console.log('📤 ViewerType:', viewerType);
    
    if (viewerType === 'specific') {
        const selectedUsers = Array.from(document.querySelectorAll('#selectedUsers .selected-user-item'))
            .map(item => item.dataset.userId);
        
        if (selectedUsers.length === 0) {
            alert('Vui lòng chọn ít nhất một người dùng để xem nội dung dự thảo!');
            return;
        }
        
        console.log('📤 Sending selectedUserIds:', selectedUsers);
        formData.append('selectedUserIds', JSON.stringify(selectedUsers));
    }
    
    const files = document.getElementById('draftFiles').files;
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    try {
        const response = await fetch('/api/drafts', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Tạo dự thảo thành công!');
            document.getElementById('draftForm').reset();
            
            // Reset viewer selection UI
            document.getElementById('viewerAll').checked = true;
            document.getElementById('specificViewers').classList.add('d-none');
            document.getElementById('selectedUsers').innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-user-plus"></i> Chưa chọn người dùng nào
                </div>
            `;
            
            // Đóng modal tạo dự thảo với delay nhỏ để người dùng thấy thông báo
            setTimeout(() => {
                const createDraftModal = document.getElementById('createDraftModal');
                const modalInstance = bootstrap.Modal.getInstance(createDraftModal);
                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    // Nếu không lấy được instance, tạo mới và đóng
                    const newModalInstance = new bootstrap.Modal(createDraftModal);
                    newModalInstance.hide();
                }
            }, 500);
            
            await loadDraftManagement();
        } else {
            alert('Lỗi: ' + data.error);
        }
    } catch (error) {
        console.error('Create draft error:', error);
        alert('Lỗi kết nối');
    }
}

// Handle create vote
async function handleCreateVote(event) {
    event.preventDefault();
    
    // Validation ngày
    const startDate = document.getElementById('voteStartDate').value;
    const endDate = document.getElementById('voteEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng nhập đầy đủ ngày bắt đầu và kết thúc!');
        return;
    }
    
    // Tạo datetime với thời gian cụ thể
    // Ngày bắt đầu: 00:00:00
    const startDateTime = new Date(startDate + 'T00:00:00');
    // Ngày kết thúc: 23:59:59
    const endDateTime = new Date(endDate + 'T23:59:59');
    const now = new Date();
    
    // Validation: Ngày bắt đầu phải từ hôm nay trở đi
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set về đầu ngày để so sánh
    
    if (startDateTime < today) {
        alert('Ngày bắt đầu phải từ hôm nay trở đi!');
        return;
    }
    
    // Validation: Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày
    if (endDateTime <= startDateTime) {
        alert('Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày!');
        return;
    }
    
    // Kiểm tra khoảng cách tối thiểu (ít nhất 1 ngày)
    const timeDiff = endDateTime - startDateTime;
    const minTime = 24 * 60 * 60 * 1000; // 1 ngày
    
    if (timeDiff < minTime) {
        alert('Thời gian biểu quyết phải ít nhất 1 ngày!');
        return;
    }
    
    const formData = new FormData();
    formData.append('voteNumber', document.getElementById('voteNumber').value);
    formData.append('title', document.getElementById('voteTitle').value);
    formData.append('content', document.getElementById('voteContent').value);
    
    // Thêm thời gian biểu quyết với format ISO
    formData.append('startDate', startDateTime.toISOString());
    formData.append('endDate', endDateTime.toISOString());
    formData.append('autoClose', document.getElementById('autoCloseVote').checked);
    
    const assigneeType = document.querySelector('input[name="assigneeType"]:checked').value;
    formData.append('assigneeType', assigneeType);
    
    if (assigneeType === 'specific') {
        const selectedUsers = document.querySelectorAll('#usersList input[type="checkbox"]:checked');
        if (selectedUsers.length === 0) {
            alert('Vui lòng chọn ít nhất một người dùng khi chọn "Chọn người dùng cụ thể"!');
            return;
        }
        selectedUsers.forEach(user => {
            formData.append('assignees', user.value);
        });
    }
    
    const files = document.getElementById('voteFiles').files;
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    try {
        const response = await fetch('/api/votes', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            // Thành công - hiển thị thông báo và trở về trang chủ
            alert('Tạo phiếu biểu quyết thành công!');
            document.getElementById('createVoteForm').reset();
            document.getElementById('specificUsers').classList.add('d-none');
            
            // Reset lại thời gian mặc định
            setupDefaultVoteTime();
            
            // Trở về trang chủ (dashboard)
            showModule('dashboard');
        } else {
            // Lỗi từ server
            const errorText = await response.text();
            console.error('Server error:', errorText);
            alert('Lỗi: ' + (response.status === 500 ? 'Lỗi server' : 'Không thể tạo phiếu biểu quyết'));
        }
    } catch (error) {
        console.error('Create vote error:', error);
        alert('Lỗi kết nối. Vui lòng thử lại!');
    }
}

// Handle digital signature
async function handleDigitalSign(event) {
    event.preventDefault();
    console.log('Processing digital signature...');
}

// Handle add user
async function handleAddUser(event) {
    event.preventDefault();
    
    console.log('=== HANDLE ADD USER ===');
    
    const form = event.target;
    const formData = new FormData(form);
    
    const userData = {
        username: formData.get('username'),
        fullName: formData.get('fullName'),
        password: formData.get('password'),
        role: formData.get('role'),
        email: formData.get('email') // Include email even if not used
    };
    
    // Collect permissions from checkboxes
    const permissions = [];
    const permissionCheckboxes = [
        'perm_view_dashboard',
        'perm_draft_management', 
        'perm_vote_management',
        'perm_create_vote',
        'perm_create_draft',  // Add create_draft permission
        'perm_close_draft',   // Add close_draft permission
        'perm_user_management',
        'perm_view_results',
        'perm_system_admin'
    ];
    
    permissionCheckboxes.forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox && checkbox.checked) {
            // Convert checkbox ID to permission name
            const permissionName = checkboxId.replace('perm_', '');
            permissions.push(permissionName);
        }
    });
    
    console.log('Collected permissions:', permissions);
    userData.permissions = permissions;
    
    console.log('Form data extracted:', userData);
    
    // Validate form data
    if (!userData.username || !userData.fullName || !userData.password || !userData.role) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    try {
        console.log('Sending POST request to /api/admin/users');
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (response.ok) {
            // Success - close modal and refresh user list
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            
            // Clear form
            form.reset();
            
            // Show success message
            alert('Thêm người dùng thành công!');
            
            // Reload user list
            await loadUsers();
        } else {
            // Show error message with details
            const errorMsg = result.error || 'Có lỗi xảy ra khi thêm người dùng';
            const details = result.details ? '\nChi tiết: ' + result.details : '';
            const code = result.code ? '\nMã lỗi: ' + result.code : '';
            const number = result.number ? '\nSố lỗi: ' + result.number : '';
            alert(errorMsg + details + code + number);
            console.error('Server error:', result);
        }
    } catch (error) {
        console.error('Add user error:', error);
        alert('Lỗi kết nối đến server: ' + error.message);
        alert('Lỗi kết nối. Vui lòng thử lại.');
    }
}

// Show add user modal
function showAddUserModal() {
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
}

// Soft Delete user
async function deleteUser(userId) {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này? Người dùng sẽ được chuyển vào thùng rác và có thể khôi phục sau.')) {
        try {
            console.log('=== SOFT DELETE USER REQUEST ===');
            console.log('User ID to delete:', userId);
            
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            console.log('Delete response status:', response.status);
            console.log('Delete response ok:', response.ok);
            
            const result = await response.json();
            console.log('Delete response data:', result);
            
            if (response.ok) {
                alert('Người dùng đã được chuyển vào thùng rác thành công!');
                await loadUsers(); // Reload user list
            } else {
                const errorMsg = result.error || 'Có lỗi xảy ra khi xóa người dùng';
                const details = result.details ? '\nChi tiết: ' + result.details : '';
                alert(errorMsg + details);
                console.error('Server error:', result);
            }
        } catch (error) {
            console.error('Delete user error:', error);
            alert('Lỗi kết nối: ' + error.message);
        }
    }
}

// Utility functions
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('d-none');
    setTimeout(() => {
        element.classList.add('d-none');
    }, 5000);
}

function showSuccess(element, message) {
    element.textContent = message;
    element.classList.remove('d-none');
    element.classList.add('alert-success');
    element.classList.remove('alert-danger');
    setTimeout(() => {
        element.classList.add('d-none');
        element.classList.remove('alert-success');
        element.classList.add('alert-danger');
    }, 5000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// File upload handling
function handleFileUpload(inputElement, maxSizeMB = 300) {
    const files = Array.from(inputElement.files);
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    
    for (const file of files) {
        if (file.size > maxSize) {
            alert(`File "${file.name}" vượt quá giới hạn ${maxSizeMB}MB`);
            inputElement.value = '';
            return false;
        }
    }
    return true;
}

// Load vote summary module
async function loadVoteSummary() {
    try {
        const response = await fetch('/api/votes/summary');
        const summaries = await response.json();
        
        const summaryList = document.getElementById('summaryList');
        if (summaryList) {
            summaryList.innerHTML = summaries.length ? 
                summaries.map(s => `
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5>${s.VoteTitle}</h5>
                            <p>Tổng số: ${s.TotalVoters} | Đồng ý: ${s.AgreeCount} | Không đồng ý: ${s.DisagreeCount}</p>
                        </div>
                    </div>
                `).join('') :
                '<p class="text-muted">Chưa có phiếu tổng hợp nào</p>';
        }
    } catch (error) {
        console.error('Load vote summary error:', error);
    }
}

// Load resolution management module
async function loadResolutionManagement() {
    try {
        const response = await fetch('/api/resolutions');
        const resolutions = await response.json();
        
        const resolutionList = document.getElementById('resolutionList');
        if (resolutionList) {
            resolutionList.innerHTML = resolutions.length ?
                resolutions.map(r => `
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5>${r.ResolutionNumber} - ${r.Title}</h5>
                            <p class="text-muted">Trạng thái: ${r.Status}</p>
                        </div>
                    </div>
                `).join('') :
                '<p class="text-muted">Chưa có nghị quyết nào</p>';
        }
    } catch (error) {
        console.error('Load resolution management error:', error);
    }
}

// Create draft
async function createDraft() {
    console.log('createDraft() called');
    const title = document.getElementById('draftTitle').value;
    const content = document.getElementById('draftContent').value;
    const commentPeriod = document.getElementById('commentPeriod').value;
    const attachedFiles = document.getElementById('attachedFiles').files;
    
    if (!title || !content) {
        alert('Vui lòng nhập tiêu đề và nội dung');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('commentPeriod', commentPeriod);
    
    // Add attached files
    for (let i = 0; i < attachedFiles.length; i++) {
        formData.append('attachedFiles', attachedFiles[i]);
    }
    
    const submitBtn = document.getElementById('submitDraft');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang tạo...';
    submitBtn.disabled = true;
    
    try {
        console.log('Making POST request to: /api/drafts');
        const response = await fetch('/api/drafts', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('Create response:', result);
        
        if (response.ok) {
            alert('Tạo dự thảo thành công!');
            document.getElementById('createDraftForm').reset();
            
            // Đóng modal tạo dự thảo với delay nhỏ để người dùng thấy thông báo
            setTimeout(() => {
                const createDraftModal = document.getElementById('createDraftModal');
                const modalInstance = bootstrap.Modal.getInstance(createDraftModal);
                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    // Nếu không lấy được instance, tạo mới và đóng
                    const newModalInstance = new bootstrap.Modal(createDraftModal);
                    newModalInstance.hide();
                }
            }, 500);
            
            // Tải lại danh sách dự thảo
            loadDraftManagement();
        } else {
            throw new Error(result.message || 'Lỗi tạo dự thảo');
        }
        
    } catch (error) {
        console.error('Create draft error:', error);
        alert('Lỗi: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Search drafts
function searchDrafts() {
    const searchTerm = document.getElementById('draftSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#draftsTableBody tr');
    
    rows.forEach(row => {
        const title = row.querySelector('td:nth-child(2) .fw-medium').textContent.toLowerCase();
        const createdBy = row.querySelector('td:nth-child(2) small').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || createdBy.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update empty state
    const visibleRows = document.querySelectorAll('#draftsTableBody tr[style=""]');
    const emptyState = document.getElementById('draftsEmptyState');
    
    if (visibleRows.length === 0) {
        emptyState.classList.remove('d-none');
        emptyState.innerHTML = '<p class="text-muted">Không tìm thấy dự thảo nào phù hợp</p>';
    } else {
        emptyState.classList.add('d-none');
    }
}

// Filter drafts by status
function filterDrafts(status) {
    const rows = document.querySelectorAll('#draftsTableBody tr');
    const filterButtons = document.querySelectorAll('[onclick*="filterDrafts"]');
    
    // Update active button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    rows.forEach(row => {
        const statusCell = row.querySelector('td:nth-child(5)');
        const statusText = statusCell.textContent.trim();
        
        if (status === 'all') {
            row.style.display = '';
        } else {
            let shouldShow = false;
            
            switch(status) {
                case 'draft':
                    shouldShow = statusText.includes('Bản nháp');
                    break;
                case 'approved':
                    shouldShow = statusText.includes('Đang góp ý') || statusText.includes('Đã công bố');
                    break;
                case 'rejected':
                    shouldShow = statusText.includes('Hết hạn góp ý');
                    break;
            }
            
            row.style.display = shouldShow ? '' : 'none';
        }
    });
    
    // Update empty state
    const visibleRows = document.querySelectorAll('#draftsTableBody tr[style=""]');
    const emptyState = document.getElementById('draftsEmptyState');
    
    if (visibleRows.length === 0) {
        emptyState.classList.remove('d-none');
        emptyState.innerHTML = '<p class="text-muted">Không có dự thảo nào trong trạng thái này</p>';
    } else {
        emptyState.classList.add('d-none');
    }
}

// Clear search
function clearSearch() {
    document.getElementById('draftSearchInput').value = '';
    searchDrafts();
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Export functions for global access
window.showModule = showModule;
window.logout = logout;
window.showAddUserModal = showAddUserModal;
window.addUser = addUser;
window.deleteUser = deleteUser;
window.showVoteDetail = showVoteDetail;
window.submitVote = submitVote;
window.viewDraft = viewDraft;
window.approveDraft = approveDraft;
window.approveDraftWithId = approveDraftWithId;
window.finalizeDraftWithId = finalizeDraftWithId;
window.createDraft = createDraft;
window.showCreateDraftModal = showCreateDraftModal;
window.viewDraftDetails = viewDraftDetails;
window.searchDrafts = searchDrafts;
window.filterDrafts = filterDrafts;
window.clearSearch = clearSearch;
window.deleteDraft = deleteDraft;
window.resetCreateDraftModal = resetCreateDraftModal;
window.formatFileSize = formatFileSize;
window.showLoadingModal = showLoadingModal;
window.publishDraft = publishDraft;
window.finalizeDraft = finalizeDraft;
window.closeDraftComments = closeDraftComments;
window.showAddCommentForm = showAddCommentForm;
window.hideAddCommentForm = hideAddCommentForm;
window.submitComment = submitComment;
window.loadActiveDrafts = loadActiveDrafts;
window.loadClosedDrafts = loadClosedDrafts;
window.loadDrafts = loadDrafts;
window.exportDraftSummary = exportDraftSummary;
window.loadPermissions = loadPermissions;
window.showEditPermissionModal = showEditPermissionModal;
window.showBulkPermissionModal = showBulkPermissionModal;
window.saveUserPermissions = saveUserPermissions;
window.saveBulkPermissions = saveBulkPermissions;
window.viewUserPermissionHistory = viewUserPermissionHistory;

// Load recycle bin module  
async function loadRecycleBin() {
    try {
        console.log('Loading recycle bin...');
        
        // Load recycle bin stats
        const statsResponse = await fetch('/api/recycle-bin/stats');
        const stats = await statsResponse.json();
        
        // Load all deleted items
        const itemsResponse = await fetch('/api/recycle-bin');
        const items = await itemsResponse.json();
        
        console.log('Recycle bin stats:', stats);
        console.log('Recycle bin items:', items);
        
        // Update stats display
        document.getElementById('recycleBinTotal').textContent = stats.total || 0;
        
        // Update items table
        const tableBody = document.getElementById('recycleBinTableBody');
        const emptyState = document.getElementById('recycleBinEmptyState');
        
        if (items.length === 0) {
            tableBody.innerHTML = '';
            emptyState.classList.remove('d-none');
            return;
        }
        
        emptyState.classList.add('d-none');
        
        let tableHTML = '';
        items.forEach((item, index) => {
            const deletedDate = new Date(item.DeletedDate);
            tableHTML += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>
                        <div class="fw-medium">${item.RecordTitle || 'Không có tiêu đề'}</div>
                        <small class="text-muted">${item.TypeName}</small>
                    </td>
                    <td class="text-center">${item.DeletedBy}</td>
                    <td class="text-center">${formatDate(item.DeletedDate)}</td>
                    <td class="text-center">
                        <div class="btn-group" role="group">
                            <button class="btn btn-success btn-sm" 
                                    onclick="restoreItem('${item.TableName}', ${item.RecordID})" 
                                    title="Khôi phục">
                                <i class="fas fa-undo"></i> Khôi phục
                            </button>
                            <button class="btn btn-warning btn-sm" 
                                    onclick="viewDeletedItem('${item.TableName}', ${item.RecordID})" 
                                    title="Xem chi tiết">
                                <i class="fas fa-eye"></i> Chi tiết
                            </button>
                            <button class="btn btn-danger btn-sm" 
                                    onclick="permanentDelete('${item.TableName}', ${item.RecordID})" 
                                    title="Xóa vĩnh viễn">
                                <i class="fas fa-trash-alt"></i> Xóa vĩnh viễn
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Load recycle bin error:', error);
        document.getElementById('recycleBinEmptyState').classList.remove('d-none');
        document.getElementById('recycleBinTableBody').innerHTML = '';
    }
}

// Restore item from recycle bin
async function restoreItem(tableName, recordId) {
    if (!confirm('Bạn có chắc chắn muốn khôi phục mục này?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/recycle-bin/restore/${tableName}/${recordId}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadRecycleBin(); // Reload recycle bin
        } else {
            alert('Lỗi: ' + result.error);
        }
        
    } catch (error) {
        console.error('Restore item error:', error);
        alert('Lỗi: ' + error.message);
    }
}

// View deleted item details
async function viewDeletedItem(tableName, recordId) {
    try {
        const response = await fetch(`/api/recycle-bin/${tableName}/${recordId}`);
        const result = await response.json();
        
        if (response.ok) {
            // Show item details in modal
            const modal = new bootstrap.Modal(document.getElementById('deletedItemModal'));
            const content = document.getElementById('deletedItemContent');
            
            content.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="fas fa-info-circle me-2"></i>Chi tiết mục đã xóa
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3"><strong>Loại:</strong></div>
                            <div class="col-md-9">${tableName}</div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-3"><strong>ID:</strong></div>
                            <div class="col-md-9">${recordId}</div>
                        </div>
                        <hr>
                        <h6>Dữ liệu:</h6>
                        <pre class="bg-light p-3 rounded">${JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                </div>
            `;
            
            modal.show();
        } else {
            alert('Lỗi: ' + result.error);
        }
        
    } catch (error) {
        console.error('View deleted item error:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Permanent delete item
async function permanentDelete(tableName, recordId) {
    if (!confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN mục này? Hành động này KHÔNG THỂ HOÀN TÁC!')) {
        return;
    }
    
    if (!confirm('XÁC NHẬN LẦN CUỐI: Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục!')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/recycle-bin/permanent/${tableName}/${recordId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadRecycleBin(); // Reload recycle bin
        } else {
            alert('Lỗi: ' + result.error);
        }
        
    } catch (error) {
        console.error('Permanent delete error:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Empty entire recycle bin
async function emptyRecycleBin() {
    if (!confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN TẤT CẢ các mục trong thùng rác? Hành động này KHÔNG THỂ HOÀN TÁC!')) {
        return;
    }
    
    if (!confirm('XÁC NHẬN LẦN CUỐI: Toàn bộ dữ liệu trong thùng rác sẽ bị xóa vĩnh viễn!')) {
        return;
    }
    
    try {
        const response = await fetch('/api/recycle-bin/empty', {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadRecycleBin(); // Reload recycle bin
        } else {
            alert('Lỗi: ' + result.error);
        }
        
    } catch (error) {
        console.error('Empty recycle bin error:', error);
        alert('Lỗi: ' + error.message);
    }
}
window.hideAddCommentForm = hideAddCommentForm;
window.submitComment = submitComment;

// Test functions for debugging
async function testPing() {
    try {
        console.log('🔄 Testing server ping...');
        const response = await fetch('/api/ping');
        const result = await response.json();
        
        console.log('Ping result:', result);
        
        if (result.success) {
            alert(`✅ Server is running!\nPort: ${result.port}\nTime: ${result.timestamp}`);
        } else {
            alert(`❌ Server ping failed: ${result.error}`);
        }
    } catch (error) {
        console.error('Ping error:', error);
        alert(`❌ Ping failed: ${error.message}`);
    }
}

async function testDbConnectionDirect() {
    try {
        console.log('🔄 Testing database connection directly...');
        const response = await fetch('/api/test-admin-users');
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('Non-JSON response:', textResponse);
            throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('Test result:', result);
        
        if (result.success) {
            alert(`✅ Database test successful!\nTable exists: ${result.table_exists}\nColumns: ${result.columns?.join(', ')}\nUsers found: ${result.usersCount}\nSample users: ${result.users?.map(u => u.FullName).join(', ')}`);
        } else {
            alert(`❌ Database test failed: ${result.error}\nDetails: ${result.details || 'No details'}`);
        }
    } catch (error) {
        console.error('Test error:', error);
        alert(`❌ Test failed: ${error.message}`);
    }
}

async function testDbConnection() {
    try {
        console.log('🔄 Testing database connection...');
        const response = await fetch('/api/test-db');
        const result = await response.json();
        
        console.log('DB Test result:', result);
        
        if (result.success) {
            alert(`✅ Database connected!\nServer: ${result.server}\nDatabase: ${result.database}\nUser count: ${result.userCount}`);
        } else {
            alert(`❌ Database test failed: ${result.error}`);
        }
    } catch (error) {
        console.error('DB Test error:', error);
        alert(`❌ DB Test failed: ${error.message}`);
    }
}

// Export recycle bin functions to global scope
window.loadRecycleBin = loadRecycleBin;
window.restoreItem = restoreItem;
window.viewDeletedItem = viewDeletedItem;
window.permanentDelete = permanentDelete;
window.emptyRecycleBin = emptyRecycleBin;

// Export test functions to global scope
window.testPing = testPing;
window.testDbConnectionDirect = testDbConnectionDirect;
window.testDbConnection = testDbConnection;

// Export new permission matrix functions to global scope
window.filterPermissionMatrix = filterPermissionMatrix;
window.updateUserPermission = updateUserPermission;
window.toggleAllUsers = toggleAllUsers;
window.updateUserSelection = updateUserSelection;
window.selectAllUsers = selectAllUsers;
window.unselectAllUsers = unselectAllUsers;
window.toggleColumnPermission = toggleColumnPermission;
window.grantSelectedPermissions = grantSelectedPermissions;
window.revokeSelectedPermissions = revokeSelectedPermissions;
window.saveAllPermissions = saveAllPermissions;
window.resetPermissions = resetPermissions;
window.exportPermissions = exportPermissions;

// Debug function to manually test loadPermissions
function debugLoadPermissions() {
    console.log('🔍 DEBUG: Manual loadPermissions test');
    console.log('Current user:', currentUser);
    console.log('Is admin?', currentUser?.Role === 'Admin');
    
    // Check DOM elements
    const matrixBody = document.getElementById('permissionMatrixBody');
    console.log('Matrix body element:', matrixBody);
    
    const matrix = document.getElementById('permissionMatrix');
    console.log('Matrix table element:', matrix);
    
    // Test API call directly
    fetch('/api/admin/permissions', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Debug API response status:', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Debug API error:', text);
                throw new Error(`HTTP ${response.status}: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Debug API success:', data);
        console.log('Users count:', data.length);
        if (data.length > 0) {
            console.log('First user:', data[0]);
        }
        
        // Store users globally
        window.allUsers = data;
        
        // Actually render the matrix
        console.log('🎨 Calling renderPermissionMatrix from debug...');
        renderPermissionMatrix(data);
        
        // Show success message in matrix temporarily
        setTimeout(() => {
            if (matrixBody && matrixBody.children.length === 0) {
                matrixBody.innerHTML = `<tr><td colspan="20" class="text-center text-info">Matrix rendering failed - check console for errors</td></tr>`;
            }
        }, 1000);
    })
    .catch(error => {
        console.error('Debug API error:', error);
        if (matrixBody) {
            matrixBody.innerHTML = `<tr><td colspan="20" class="text-center text-danger">DEBUG ERROR: ${error.message}</td></tr>`;
        }
    });
}

// Handle viewer type change for draft creation
function handleViewerTypeChange() {
    console.log('🔄 handleViewerTypeChange called');
    const viewerAll = document.getElementById('viewerAll');
    const viewerSpecific = document.getElementById('viewerSpecific');
    const specificViewersDiv = document.getElementById('specificViewers');
    
    console.log('🔍 Elements check:', {
        viewerAll: !!viewerAll,
        viewerAllChecked: viewerAll?.checked,
        viewerSpecific: !!viewerSpecific,
        viewerSpecificChecked: viewerSpecific?.checked,
        specificViewersDiv: !!specificViewersDiv
    });
    
    if (!specificViewersDiv) {
        console.warn('❌ specificViewers div not found');
        return;
    }
    
    if (viewerAll && viewerAll.checked) {
        console.log('🌐 Hiding specific viewers - showing all users option');
        specificViewersDiv.classList.add('d-none');
    } else if (viewerSpecific && viewerSpecific.checked) {
        console.log('👥 Showing specific viewers and loading users');
        specificViewersDiv.classList.remove('d-none');
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
            loadAvailableUsers();
        }, 100);
    }
}

// Load available users for draft viewer selection
async function loadAvailableUsers() {
    console.log('🔍 loadAvailableUsers called');
    const availableUsersDiv = document.getElementById('availableUsers');
    const userSearchInput = document.getElementById('userSearch');
    
    if (!availableUsersDiv) {
        console.warn('❌ availableUsers div not found');
        return;
    }
    
    console.log('✅ Found availableUsers div');
    
    // Show loading state
    availableUsersDiv.innerHTML = `
        <div class="text-center text-muted py-3">
            <i class="fas fa-spinner fa-spin"></i> Đang tải danh sách người dùng...
        </div>
    `;
    
    try {
        console.log('📡 Loading users from server...');
        console.log('👤 Current user object:', JSON.stringify(currentUser, null, 2));
        
        let response;
        let data;
        
        // Check if user has admin role or create_draft permission
        const isAdmin = currentUser && (currentUser.Role === 'admin' || currentUser.Role === 'Admin');
        const hasCreateDraftPermission = currentUser && currentUser.Permissions && 
                                       currentUser.Permissions.includes('create_draft');
        
        console.log('� Frontend authorization check:');
        console.log('  - currentUser exists:', !!currentUser);
        console.log('  - currentUser.Role:', currentUser?.Role);
        console.log('  - currentUser.Permissions:', currentUser?.Permissions);
        console.log('  - isAdmin:', isAdmin);
        console.log('  - hasCreateDraftPermission:', hasCreateDraftPermission);
        
        // Both admin and users with create_draft permission should use admin endpoint for consistent data
        if (isAdmin || hasCreateDraftPermission) {
            try {
                console.log('🔗 User has admin or create_draft permission - trying /api/admin/users endpoint...');
                response = await fetch('/api/admin/users');
                console.log('📊 Response status:', response.status, response.statusText);
                
                if (response.ok) {
                    const rawData = await response.json();
                    console.log('✅ Admin users raw response:', rawData);
                    
                    // API trả về trực tiếp mảng users, không có wrapper object
                    if (Array.isArray(rawData)) {
                        data = {
                            success: true,
                            users: rawData
                        };
                        console.log('✅ Successfully parsed admin users data');
                    } else if (rawData.error) {
                        console.log('❌ API returned error:', rawData.error);
                    } else {
                        data = rawData;
                        console.log('✅ Using raw data structure from admin endpoint');
                    }
                } else {
                    const errorText = await response.text();
                    console.log('⚠️ Admin endpoint returned:', response.status, '- Error:', errorText);
                    
                    // For users with create_draft permission, we should NOT fallback to mock data
                    // Instead, we should try to fix the permission issue
                    if (hasCreateDraftPermission && response.status === 403) {
                        console.error('🚨 User with create_draft permission cannot access /api/admin/users - this is a server-side permission issue');
                        throw new Error('Permission denied for /api/admin/users. Please check server configuration.');
                    }
                }
            } catch (e) {
                console.log('❌ Admin users endpoint failed:', e);
                if (hasCreateDraftPermission) {
                    console.error('🚨 Critical: User with create_draft permission failed to access real user data');
                }
            }
        } else {
            console.log('⚠️ User has no admin role or create_draft permission, skipping admin endpoint');
        }
        
        // If admin endpoint fails, try general users endpoint as fallback
        if (!data || !data.success) {
            try {
                console.log('🔗 Trying fallback /api/users endpoint...');
                response = await fetch('/api/users');
                console.log('📊 Response status:', response.status, response.statusText);
                if (response.ok) {
                    const rawData = await response.json();
                    console.log('✅ General users raw response:', rawData);
                    
                    // API trả về trực tiếp mảng users
                    if (Array.isArray(rawData)) {
                        data = {
                            success: true,
                            users: rawData
                        };
                    } else {
                        data = rawData;
                    }
                } else {
                    console.log('⚠️ /api/users returned:', response.status);
                    // If both endpoints fail, create mock data that matches the real user structure
                    if (response.status === 404 || response.status === 401) {
                        console.log('🔄 Using fallback - admin endpoint likely failed, creating consistent user list');
                        data = {
                            success: true,
                            users: [
                                { UserID: 1, Username: 'admin', FullName: 'Hồ Hoàn Kiếm', Role: 'Admin' },
                                { UserID: 2, Username: 'kiemhh', FullName: 'Hồ Hoàn Kiếm', Role: 'User' },
                                { UserID: 3, Username: 'tuanlqa', FullName: 'Lê Quý Anh Tuấn', Role: 'User' },
                                { UserID: 4, Username: 'thuyetlv', FullName: 'Lê Văn Thuyết', Role: 'User' }
                            ]
                        };
                    }
                }
            } catch (e) {
                console.log('❌ General users endpoint failed:', e);
                // Use fallback that matches what admin sees
                data = {
                    success: true,
                    users: [
                        { UserID: 1, Username: 'admin', FullName: 'Dương Việt Cường', Role: 'Admin' },
                        { UserID: 2, Username: 'kiemhh', FullName: 'Hồ Hoàn Kiếm', Role: 'User' },
                        { UserID: 3, Username: 'tuanlqa', FullName: 'Lê Quý Anh Tuấn', Role: 'User' },
                        { UserID: 4, Username: 'thuyetlv', FullName: 'Lê Văn Thuyết', Role: 'User' }
                    ]
                };
            }
        }
        
        // Only use fallback if all endpoints fail AND user doesn't have create_draft permission
        if (!data || !data.success || !data.users || data.users.length === 0) {
            if (hasCreateDraftPermission) {
                // Users with create_draft permission should NEVER use fallback data
                console.error('🚨 CRITICAL: User with create_draft permission failed to get real user data');
                throw new Error('Unable to load user list from database. Users with create_draft permission must access real user data. Please contact administrator.');
            }
            
            console.warn('⚠️ All API endpoints failed - using final fallback user list for regular users');
            data = {
                success: true,
                users: [
                    { UserID: 1, Username: 'admin', FullName: 'Dương Việt Cường', Role: 'Admin' },
                    { UserID: 2, Username: 'kiemhh', FullName: 'Hồ Hoàn Kiếm', Role: 'User' },
                    { UserID: 3, Username: 'tuanlqa', FullName: 'Lê Quý Anh Tuấn', Role: 'User' },
                    { UserID: 4, Username: 'thuyetlv', FullName: 'Lê Văn Thuyết', Role: 'User' }
                ]
            };
        }
        
        // Validate data structure
        if (!data) {
            throw new Error('No data received from server');
        }
        
        const users = data.users || data || [];
        console.log('👥 Final users array:', users);
        console.log('Users loaded:', users.length);
        
        if (users.length === 0) {
            availableUsersDiv.innerHTML = `
                <div class="text-center text-warning py-3">
                    <i class="fas fa-exclamation-triangle"></i> Không có người dùng nào trong hệ thống
                </div>
            `;
            return;
        }
        
        renderAvailableUsers(users);
        
        // Setup search functionality (remove existing listeners first)
        if (userSearchInput) {
            // Remove existing event listeners
            const newInput = userSearchInput.cloneNode(true);
            userSearchInput.parentNode.replaceChild(newInput, userSearchInput);
            
            // Add new event listener
            newInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase().trim();
                if (searchTerm === '') {
                    renderAvailableUsers(users);
                } else {
                    const filteredUsers = users.filter(user => 
                        (user.Username && user.Username.toLowerCase().includes(searchTerm)) ||
                        (user.FullName && user.FullName.toLowerCase().includes(searchTerm))
                    );
                    renderAvailableUsers(filteredUsers);
                }
            });
        }
        
    } catch (error) {
        console.error('Error loading users:', error);
        availableUsersDiv.innerHTML = `
            <div class="text-center text-danger py-3">
                <i class="fas fa-exclamation-triangle"></i> Lỗi tải danh sách người dùng: ${error.message}
            </div>
        `;
    }
}

// Render available users list
function renderAvailableUsers(users) {
    console.log('🎨 renderAvailableUsers called with:', users);
    const availableUsersDiv = document.getElementById('availableUsers');
    if (!availableUsersDiv) {
        console.warn('❌ availableUsers div not found');
        return;
    }
    
    // Validate users array
    if (!Array.isArray(users)) {
        console.warn('❌ users is not an array:', users);
        availableUsersDiv.innerHTML = `
            <div class="text-center text-danger py-3">
                <i class="fas fa-exclamation-triangle"></i> Dữ liệu người dùng không hợp lệ
            </div>
        `;
        return;
    }
    
    if (users.length === 0) {
        availableUsersDiv.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-search"></i> Không tìm thấy người dùng
            </div>
        `;
        return;
    }
    
    console.log('✅ Rendering', users.length, 'users');
    
    const userItems = users.map(user => {
        // Validate user object
        if (!user || !user.UserID) {
            console.warn('❌ Invalid user object:', user);
            return '';
        }
        
        const fullName = user.FullName || user.Username || 'Người dùng';
        const username = user.Username || 'unknown';
        
        return `
            <div class="user-item d-flex align-items-center justify-content-between p-2 border-bottom" 
                 data-user-id="${user.UserID}" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <div class="user-avatar me-2">
                        <i class="fas fa-user-circle text-primary"></i>
                    </div>
                    <div>
                        <div class="fw-bold">${fullName}</div>
                        <small class="text-muted">@${username}</small>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-primary add-user-btn" type="button">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    }).filter(item => item !== '').join('');
    
    availableUsersDiv.innerHTML = userItems;
    
    // Add click handlers
    availableUsersDiv.querySelectorAll('.user-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.add-user-btn')) return;
            
            const userId = item.dataset.userId;
            const user = users.find(u => u.UserID == userId);
            if (user) {
                addSelectedUser(user);
            }
        });
    });
}

// Add user to selected list
function addSelectedUser(user) {
    const selectedUsersDiv = document.getElementById('selectedUsers');
    if (!selectedUsersDiv) return;
    
    // Check if user already selected
    if (selectedUsersDiv.querySelector(`[data-user-id="${user.UserID}"]`)) {
        return;
    }
    
    // Clear "no users selected" message if exists
    if (selectedUsersDiv.innerHTML.includes('Chưa chọn người dùng nào')) {
        selectedUsersDiv.innerHTML = '';
    }
    
    const userItem = document.createElement('div');
    userItem.className = 'selected-user-item d-flex align-items-center justify-content-between p-2 border-bottom bg-light';
    userItem.dataset.userId = user.UserID;
    userItem.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="user-avatar me-2">
                <i class="fas fa-user-check text-success"></i>
            </div>
            <div>
                <div class="fw-bold">${user.FullName}</div>
                <small class="text-muted">@${user.Username}</small>
            </div>
        </div>
        <button class="btn btn-sm btn-outline-danger remove-user-btn" type="button">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    selectedUsersDiv.appendChild(userItem);
    
    // Add remove handler
    userItem.querySelector('.remove-user-btn').addEventListener('click', () => {
        userItem.remove();
        
        // Show message if no users left
        if (selectedUsersDiv.children.length === 0) {
            selectedUsersDiv.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-user-plus"></i> Chưa chọn người dùng nào
                </div>
            `;
        }
    });
}

window.debugLoadPermissions = debugLoadPermissions;

// Manual debug functions for testing user selection
window.debugUserSelection = {
    testModal: () => {
        console.log('🎭 Opening modal for testing...');
        showCreateDraftModal();
    },
    
    testSpecificViewers: () => {
        console.log('👥 Testing specific viewers selection...');
        const viewerSpecific = document.getElementById('viewerSpecific');
        if (viewerSpecific) {
            viewerSpecific.checked = true;
            handleViewerTypeChange();
        } else {
            console.log('❌ viewerSpecific not found');
        }
    },
    
    testLoadUsers: () => {
        console.log('📡 Testing load users...');
        loadAvailableUsers();
    },
    
    testAPI: async () => {
        console.log('🔌 Testing API endpoints...');
        
        const endpoints = [
            '/api/admin/users',
            '/api/users', 
            '/admin/users'
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Testing ${endpoint}...`);
                const response = await fetch(endpoint);
                console.log(`${endpoint} - Status:`, response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`${endpoint} - Data:`, data);
                    
                    if (Array.isArray(data) && data.length > 0) {
                        console.log(`✅ ${endpoint} returned ${data.length} users`);
                        return data;
                    }
                } else {
                    const errorText = await response.text();
                    console.log(`${endpoint} - Error:`, errorText);
                }
            } catch (error) {
                console.log(`${endpoint} - Network error:`, error);
            }
        }
        
        console.log('❌ All endpoints failed');
        return null;
    },
    
    checkElements: () => {
        const elements = [
            'viewerAll', 'viewerSpecific', 'specificViewers', 
            'availableUsers', 'selectedUsers', 'userSearch'
        ];
        
        console.log('🔍 Checking elements:');
        elements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id}: ${element ? '✅' : '❌'}`);
        });
    },
    
    runFullTest: async () => {
        console.log('🚀 Running full user selection test...');
        
        // Step 1: Check elements
        window.debugUserSelection.checkElements();
        
        // Step 2: Test API
        await window.debugUserSelection.testAPI();
        
        // Step 3: Open modal
        window.debugUserSelection.testModal();
        
        // Step 4: Wait a bit then select specific viewers
        setTimeout(() => {
            window.debugUserSelection.testSpecificViewers();
        }, 1000);
    }
};

// Function to load all drafts for admin management
async function loadAllDraftsForAdmin() {
    try {
        console.log('📋 Loading all drafts for admin...');
        
        const response = await fetch('/api/drafts/all');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const drafts = await response.json();
        console.log('📄 All drafts loaded for admin:', drafts.length);
        
        const tableBody = document.getElementById('allDraftsTableBody');
        const emptyState = document.getElementById('draftsEmptyState');
        const loadingState = document.getElementById('draftsLoading');
        
        if (!tableBody) {
            console.error('❌ All drafts table body not found');
            return;
        }
        
        // Hide loading state
        if (loadingState) loadingState.classList.add('d-none');
        
        if (drafts.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('d-none');
            return;
        }
        
        if (emptyState) emptyState.classList.add('d-none');
        
        let tableHTML = '';
        drafts.forEach((draft, index) => {
            const createdDate = new Date(draft.CreatedDate).toLocaleDateString('vi-VN');
            const statusBadge = getStatusBadge ? getStatusBadge(draft.Status) : 
                `<span class="badge bg-secondary">${draft.Status || 'Draft'}</span>`;
            
            tableHTML += `
                <tr>
                    <td class="text-center d-none d-md-table-cell">${index + 1}</td>
                    <td>
                        <div>
                            <strong>${escapeHtml ? escapeHtml(draft.Title) : draft.Title}</strong>
                        </div>
                    </td>
                    <td class="text-center">${statusBadge}</td>
                    <td class="text-center d-none d-md-table-cell">
                        <small>${escapeHtml ? escapeHtml(draft.CreatedBy || 'N/A') : (draft.CreatedBy || 'N/A')}</small>
                    </td>
                    <td class="text-center d-none d-lg-table-cell">
                        <small>${createdDate}</small>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-info">${draft.CommentCount || 0}</span>
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn btn-outline-primary btn-sm" onclick="viewDraftDetails(${draft.DraftID})" title="Xem chi tiết">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button type="button" class="btn btn-outline-warning btn-sm" onclick="editDraft(${draft.DraftID})" title="Chỉnh sửa">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn btn-outline-danger btn-sm" onclick="confirmDeleteDraft(${draft.DraftID}, '${escapeHtml ? escapeHtml(draft.Title) : draft.Title}')" title="Xóa">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('❌ Error loading all drafts for admin:', error);
        const tableBody = document.getElementById('allDraftsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Lỗi tải danh sách dự thảo: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// View vote results function
async function viewVoteResults(voteId) {
    try {
        const response = await fetch(`/api/votes/${voteId}/results`);
        if (response.ok) {
            const results = await response.json();
            
            // Show results in a modal or navigate to results page
            // For now, show an alert with basic info
            let resultText = `Kết quả biểu quyết:\n\n`;
            if (results.totalVotes === 0) {
                resultText += 'Chưa có ai tham gia biểu quyết.';
            } else {
                resultText += `Tổng số phiếu: ${results.totalVotes}\n`;
                resultText += `Đồng ý: ${results.agreeCount || 0}\n`;
                resultText += `Không đồng ý: ${results.disagreeCount || 0}\n`;
                resultText += `Tỷ lệ đồng ý: ${((results.agreeCount || 0) / results.totalVotes * 100).toFixed(1)}%`;
            }
            
            alert(resultText);
        } else {
            alert('Không thể tải kết quả biểu quyết');
        }
    } catch (error) {
        console.error('Error loading vote results:', error);
        alert('Lỗi khi tải kết quả biểu quyết');
    }
}

// View vote details function
async function viewVoteDetails(voteId) {
    try {
        const response = await fetch(`/api/votes/${voteId}`);
        if (response.ok) {
            const data = await response.json();
            const vote = data.vote; // Fix: Access the vote object correctly
            
            // Show vote details in a modal or navigate to details page
            // For now, show an alert with basic info
            let detailText = `Chi tiết phiếu biểu quyết:\n\n`;
            detailText += `Số hiệu: ${vote.VoteNumber || 'N/A'}\n`;
            detailText += `Tiêu đề: ${vote.Title || 'N/A'}\n`;
            detailText += `Người tạo: ${vote.CreatedBy || 'N/A'}\n`;
            detailText += `Ngày tạo: ${vote.CreatedDate ? formatDate(vote.CreatedDate) : 'N/A'}\n`;
            if (vote.StartDate) {
                detailText += `Thời gian bắt đầu: ${formatDate(vote.StartDate)}\n`;
            }
            if (vote.EndDate) {
                detailText += `Thời gian kết thúc: ${formatDate(vote.EndDate)}\n`;
            }
            detailText += `Trạng thái: ${vote.Status || 'N/A'}\n`;
            detailText += `Loại phân công: ${vote.AssigneeType || 'N/A'}\n`;
            
            // Show results summary
            if (data.results && data.results.length > 0) {
                detailText += `\nSố người đã biểu quyết: ${data.results.length}\n`;
                const agreeCount = data.results.filter(r => r.Choice === 'Agree').length;
                const disagreeCount = data.results.filter(r => r.Choice === 'Disagree').length;
                const abstainCount = data.results.filter(r => r.Choice === 'Abstain').length;
                detailText += `- Đồng ý: ${agreeCount}\n`;
                detailText += `- Không đồng ý: ${disagreeCount}\n`;
                detailText += `- Không có ý kiến: ${abstainCount}\n`;
            } else {
                detailText += `\nChưa có ai biểu quyết\n`;
            }
            
            detailText += `\nNội dung:\n${vote.Content || 'Không có nội dung'}`;
            
            alert(detailText);
        } else {
            alert('Không thể tải thông tin chi tiết');
        }
    } catch (error) {
        console.error('Error loading vote details:', error);
        alert('Lỗi khi tải chi tiết phiếu biểu quyết');
    }
}

// Test function to close a vote (temporary)
async function testCloseVote(voteId) {
    try {
        const response = await fetch(`/api/votes/${voteId}/close`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Vote closed:', result);
            alert(`Phiếu ${voteId} đã được đóng thành công!`);
            // Reload current module if it's endVote
            if (window.currentModule === 'endVote') {
                loadEndVotesList();
            }
        } else {
            console.error('Failed to close vote');
            alert('Lỗi khi đóng phiếu biểu quyết');
        }
    } catch (error) {
        console.error('Error closing vote:', error);
        alert('Lỗi khi đóng phiếu biểu quyết');
    }
}

// Make function available globally for testing
window.testCloseVote = testCloseVote;

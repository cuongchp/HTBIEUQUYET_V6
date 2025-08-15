// Main application initialization file
// Load all modules and initialize the application

document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication
    checkAuthStatus();
    // Initialize event listeners
    initializeEventListeners();
    // Load current page content
    loadCurrentPage();
});

function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-link');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    console.log('Event listeners initialized');
}

function loadCurrentPage() {
    const currentPage = getCurrentPage();
    switch (currentPage) {
        case 'drafts':
            loadDraftManagement();
            break;
        case 'votes':
            loadVotesList();
            break;
        case 'admin':
            loadUsers();
            loadPermissions();
            break;
        default:
            console.log('Loading default page');
    }
}

function getCurrentPage() {
    // Determine current page from URL or other means
    const path = window.location.pathname;
    if (path.includes('drafts')) return 'drafts';
    if (path.includes('votes')) return 'votes';
    if (path.includes('admin')) return 'admin';
    return 'dashboard';
}

function handleNavigation(event) {
    event.preventDefault();
    const target = event.target.getAttribute('data-target');
    if (target) {
        showSection(target);
    }
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    const success = await login(username, password);
    if (success) {
        window.location.reload();
    } else {
        showError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
}

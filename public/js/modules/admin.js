// Admin and User Management Module
// Functions: loadUsers, addUser, deleteUser, loadPermissions, updatePermission

async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${user.Username}</td><td>${user.FullName}</td><td>${user.Email}</td><td>${user.Role}</td><td>${user.IsActive ? 'Active' : 'Inactive'}</td>`;
        tableBody.appendChild(row);
    });
}

async function loadPermissions() {
    try {
        const response = await fetch('/api/admin/permissions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const permissions = await response.json();
        displayPermissions(permissions);
    } catch (error) {
        console.error('Error loading permissions:', error);
    }
}

function displayPermissions(permissions) {
    const container = document.getElementById('permissionsContainer');
    if (!container) return;
    // Implementation for displaying permissions matrix
    console.log('Permissions loaded:', permissions);
}

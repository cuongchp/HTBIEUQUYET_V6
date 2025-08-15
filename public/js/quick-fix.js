// Quick fix for user selection issue
// Run this in browser console

console.log('🔧 Quick fix for user selection issue');

// 1. Test if modal opens
function quickTestModal() {
    console.log('1. Testing modal open...');
    try {
        showCreateDraftModal();
        console.log('✅ Modal opened successfully');
        return true;
    } catch (error) {
        console.log('❌ Modal failed to open:', error);
        return false;
    }
}

// 2. Test user selection UI
function quickTestUserSelectionUI() {
    console.log('2. Testing user selection UI...');
    
    const elements = {
        viewerAll: document.getElementById('viewerAll'),
        viewerSpecific: document.getElementById('viewerSpecific'),
        specificViewers: document.getElementById('specificViewers'),
        availableUsers: document.getElementById('availableUsers'),
        selectedUsers: document.getElementById('selectedUsers')
    };
    
    let allFound = true;
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            console.log(`✅ ${name} found`);
        } else {
            console.log(`❌ ${name} NOT found`);
            allFound = false;
        }
    }
    
    return allFound;
}

// 3. Test API endpoints
async function quickTestAPI() {
    console.log('3. Testing API endpoints...');
    
    const endpoints = ['/api/admin/users', '/admin/users', '/api/users'];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint);
            console.log(`${endpoint}: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    console.log(`✅ ${endpoint} returned ${data.length} users`);
                    return { endpoint, data };
                } else {
                    console.log(`⚠️ ${endpoint} returned non-array:`, data);
                }
            }
        } catch (error) {
            console.log(`❌ ${endpoint} error:`, error.message);
        }
    }
    
    return null;
}

// 4. Manual force load users
function quickForceLoadUsers() {
    console.log('4. Force loading users with mock data...');
    
    const availableUsersDiv = document.getElementById('availableUsers');
    if (!availableUsersDiv) {
        console.log('❌ availableUsers div not found');
        return false;
    }
    
    const mockUsers = [
        { UserID: 1, Username: 'admin', FullName: 'Administrator' },
        { UserID: 2, Username: 'user1', FullName: 'Người dùng 1' },
        { UserID: 3, Username: 'user2', FullName: 'Người dùng 2' }
    ];
    
    renderAvailableUsers(mockUsers);
    console.log('✅ Mock users loaded');
    return true;
}

// 5. Run complete test
async function quickCompleteTest() {
    console.log('🚀 Running complete quick test...');
    
    // Test 1: Modal
    if (!quickTestModal()) return;
    
    // Wait for modal to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 2: UI Elements
    if (!quickTestUserSelectionUI()) return;
    
    // Test 3: API
    const apiResult = await quickTestAPI();
    
    // Test 4: Select specific viewers
    const viewerSpecific = document.getElementById('viewerSpecific');
    if (viewerSpecific) {
        viewerSpecific.checked = true;
        handleViewerTypeChange();
        console.log('✅ Selected specific viewers');
        
        // Wait a bit then test force load if API failed
        setTimeout(() => {
            const availableUsers = document.getElementById('availableUsers');
            if (availableUsers && availableUsers.innerHTML.includes('Lỗi tải danh sách')) {
                console.log('⚠️ API failed, using mock data');
                quickForceLoadUsers();
            }
        }, 1000);
    }
    
    console.log('✅ Quick test completed');
}

// Export functions for manual use
window.quickFix = {
    testModal: quickTestModal,
    testUI: quickTestUserSelectionUI,
    testAPI: quickTestAPI,
    forceLoadUsers: quickForceLoadUsers,
    completeTest: quickCompleteTest
};

console.log('Use window.quickFix.completeTest() to run all tests');

// Test User Selection Functionality
console.log('🧪 Testing User Selection - DISABLED until authentication');

// Test 1: Check if API endpoint exists
async function testUserAPI() {
    console.log('📡 Testing /api/admin/users endpoint...');
    
    try {
        const response = await fetch('/api/admin/users', {
            credentials: 'include'
        });
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Success:', data);
            return data;
        } else {
            const errorText = await response.text();
            console.log('❌ API Error:', response.status, errorText);
        }
    } catch (error) {
        console.log('❌ Network Error:', error);
    }
    
    return null;
}

// Test 2: Test modal and user selection
function testModalUserSelection() {
    console.log('🎭 Testing Modal User Selection...');
    
    // Check if create draft modal exists
    const createDraftModal = document.getElementById('createDraftModal');
    if (!createDraftModal) {
        console.log('❌ Create draft modal not found');
        return;
    }
    console.log('✅ Create draft modal found');
    
    // Check if viewer type radio buttons exist
    const viewerAll = document.getElementById('viewerAll');
    const viewerSpecific = document.getElementById('viewerSpecific');
    
    if (!viewerAll || !viewerSpecific) {
        console.log('❌ Viewer type radio buttons not found');
        return;
    }
    console.log('✅ Viewer type radio buttons found');
    
    // Check if specific viewers div exists
    const specificViewers = document.getElementById('specificViewers');
    if (!specificViewers) {
        console.log('❌ Specific viewers div not found');
        return;
    }
    console.log('✅ Specific viewers div found');
    
    // Check if available users div exists
    const availableUsers = document.getElementById('availableUsers');
    if (!availableUsers) {
        console.log('❌ Available users div not found');
        return;
    }
    console.log('✅ Available users div found');
    
    // Check if selected users div exists
    const selectedUsers = document.getElementById('selectedUsers');
    if (!selectedUsers) {
        console.log('❌ Selected users div not found');
        return;
    }
    console.log('✅ Selected users div found');
    
    return true;
}

// Test 3: Simulate user selection
function simulateUserSelection() {
    console.log('🎮 Simulating User Selection...');
    
    // Open modal
    const createDraftButton = document.querySelector('button[onclick="showCreateDraftModal()"]');
    if (createDraftButton) {
        createDraftButton.click();
        console.log('✅ Modal opened');
        
        // Wait a bit then select specific viewers
        setTimeout(() => {
            const viewerSpecific = document.getElementById('viewerSpecific');
            if (viewerSpecific) {
                viewerSpecific.checked = true;
                viewerSpecific.dispatchEvent(new Event('change'));
                console.log('✅ Selected specific viewers option');
            }
        }, 500);
    }
}

// Run tests
async function runAllTests() {
    console.log('🚀 Starting All Tests...');
    
    // Test 1: API
    await testUserAPI();
    
    // Test 2: Modal elements
    testModalUserSelection();
    
    // Test 3: Simulate selection
    simulateUserSelection();
    
    console.log('✅ All tests completed!');
}

// Auto-run tests when page loads - DISABLED to prevent 401 errors
// Tests should be run manually after login
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', runAllTests);
// } else {
//     runAllTests();
// }

// Export for manual testing
window.testUserSelection = {
    testUserAPI,
    testModalUserSelection,
    simulateUserSelection,
    runAllTests
};

// Check user session and permissions
async function checkUserSession() {
    try {
        console.log('🔍 Checking current user session...');
        
        // Get current user from session
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
            const user = await response.json();
            console.log('👤 Current user:', JSON.stringify(user, null, 2));
            
            if (user.Permissions) {
                console.log('🔑 User permissions:');
                user.Permissions.forEach(perm => {
                    console.log(`  - ${perm}`);
                });
                
                const hasCreateDraft = user.Permissions.includes('create_draft');
                console.log(`✅ Has create_draft permission: ${hasCreateDraft}`);
                
                if (hasCreateDraft) {
                    console.log('🧪 Testing /api/admin/users access...');
                    const adminTest = await fetch('/api/admin/users');
                    console.log(`/api/admin/users status: ${adminTest.status}`);
                    
                    if (adminTest.status === 403) {
                        const errorText = await adminTest.text();
                        console.log('Error details:', errorText);
                    }
                }
            } else {
                console.log('❌ No permissions found in user session');
            }
        } else {
            console.log('❌ Failed to get current user session');
        }
        
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkUserSession();

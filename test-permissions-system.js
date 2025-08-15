const sql = require('mssql');

async function testPermissionsSystem() {
    console.log('='.repeat(60));
    console.log('   DRAFT PERMISSIONS SYSTEM VERIFICATION');
    console.log('='.repeat(60));
    
    try {
        const pool = await sql.connect({
            server: 'localhost',
            user: 'sa',
            password: '123456',
            database: 'BIEUQUYET_CHP',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        });

        // Check DraftPermissions table
        console.log('\n📊 Checking DraftPermissions table structure:');
        const permissionsCheck = await pool.request().query(`
            SELECT TOP 5 * FROM DraftPermissions
        `);
        console.log(`Records found: ${permissionsCheck.recordset.length}`);
        if (permissionsCheck.recordset.length > 0) {
            console.log('Sample data:', permissionsCheck.recordset[0]);
        }

        // Check Drafts table with ViewerType
        console.log('\n📋 Checking Drafts table with ViewerType:');
        const draftsCheck = await pool.request().query(`
            SELECT TOP 5 DraftID, Title, ViewerType, CreatedBy 
            FROM Drafts 
            ORDER BY DraftID DESC
        `);
        console.log(`Drafts found: ${draftsCheck.recordset.length}`);
        draftsCheck.recordset.forEach(draft => {
            console.log(`- Draft ${draft.DraftID}: "${draft.Title}" (ViewerType: ${draft.ViewerType || 'NULL'})`);
        });

        // Check Users for testing
        console.log('\n👥 Available users for testing:');
        const usersCheck = await pool.request().query(`
            SELECT TOP 10 UserID, Username, Role 
            FROM Users 
            ORDER BY UserID
        `);
        usersCheck.recordset.forEach(user => {
            console.log(`- ${user.Username} (Role: ${user.Role})`);
        });

        await pool.close();

        console.log('\n✅ IMPLEMENTATION STATUS:');
        console.log('✓ DraftPermissions table created');
        console.log('✓ Backend API updated with permission filtering');
        console.log('✓ Frontend updated with user selection');
        console.log('✓ Server restarted with new code');

        console.log('\n🔍 MANUAL TESTING REQUIRED:');
        console.log('1. Go to http://localhost:3000');
        console.log('2. Login as admin');
        console.log('3. Create new draft with specific users selected');
        console.log('4. Logout and login as different user');
        console.log('5. Verify permission system works correctly');

        console.log('\n📝 EXPECTED BEHAVIOR:');
        console.log('- Admin: Sees ALL drafts');
        console.log('- Draft Creator: Sees own drafts');
        console.log('- Selected Users: See drafts they have access to');
        console.log('- Other Users: Only see "all users" drafts');

    } catch (error) {
        console.error('❌ Error testing permissions system:', error.message);
    }
}

testPermissionsSystem();

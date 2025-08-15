const sql = require('mssql');

async function testUsersAPI() {
    console.log('🧪 TEST API /api/users');
    console.log('='.repeat(40));
    
    try {
        const pool = await sql.connect({
            server: 'localhost',
            user: 'sa',
            password: '123456',
            database: 'BIEUQUYET_CHP',
            options: { encrypt: false, trustServerCertificate: true }
        });

        // Test query tương tự API
        console.log('\n📊 USERS TRONG DATABASE:');
        const users = await pool.request().query(`
            SELECT UserID, Username, FullName, Role, IsActive, IsDeleted
            FROM Users 
            WHERE IsActive = 1 AND (IsDeleted = 0 OR IsDeleted IS NULL)
            ORDER BY FullName
        `);
        
        console.log(`Tổng số users: ${users.recordset.length}`);
        
        console.log('\n👥 DANH SÁCH USERS (không có Admin):');
        const nonAdminUsers = users.recordset.filter(user => user.Role !== 'Admin');
        console.log(`Số users không phải Admin: ${nonAdminUsers.length}`);
        
        nonAdminUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.FullName} (${user.Username}) - Role: ${user.Role}`);
        });
        
        console.log('\n👤 ADMIN USERS (sẽ bị loại bỏ):');
        const adminUsers = users.recordset.filter(user => user.Role === 'Admin');
        adminUsers.forEach(user => {
            console.log(`- ${user.FullName} (${user.Username})`);
        });

        await pool.close();

        console.log('\n✅ KẾT QUẢ:');
        console.log(`✓ Có ${nonAdminUsers.length} users sẽ hiển thị trong danh sách chọn`);
        console.log(`✓ ${adminUsers.length} admin users sẽ được loại bỏ`);
        console.log('\n🎯 HƯỚNG DẪN TEST:');
        console.log('1. Mở http://localhost:3000');
        console.log('2. Vào module "Tạo Phiếu Biểu quyết"');
        console.log('3. Click radio "Chọn người dùng cụ thể"');
        console.log('4. Sẽ thấy danh sách users (không có Admin)');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
}

testUsersAPI();

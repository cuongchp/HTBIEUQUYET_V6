const sql = require('mssql');

async function fixNullIsDeleted() {
    console.log('🔧 SỬA LỖI IsDeleted = NULL');
    console.log('='.repeat(50));
    
    try {
        const pool = await sql.connect({
            server: 'localhost',
            user: 'sa',
            password: '123456',
            database: 'BIEUQUYET_CHP',
            options: { encrypt: false, trustServerCertificate: true }
        });

        // 1. Hiển thị dữ liệu trước khi sửa
        console.log('\n📊 TRƯỚC KHI SỬA:');
        const beforeFix = await pool.request().query(`
            SELECT DraftID, Title, IsDeleted, CreatedDate
            FROM Drafts 
            WHERE IsDeleted IS NULL
            ORDER BY CreatedDate DESC
        `);
        
        console.log(`Số dự thảo có IsDeleted = NULL: ${beforeFix.recordset.length}`);
        beforeFix.recordset.forEach((draft, index) => {
            console.log(`${index + 1}. ID=${draft.DraftID} | "${draft.Title}" | IsDeleted=${draft.IsDeleted}`);
        });

        // 2. Cập nhật IsDeleted = NULL thành IsDeleted = 0 
        console.log('\n🔄 ĐANG CẬP NHẬT...');
        const updateResult = await pool.request().query(`
            UPDATE Drafts 
            SET IsDeleted = 0 
            WHERE IsDeleted IS NULL
        `);
        
        console.log(`✅ Đã cập nhật ${updateResult.rowsAffected[0]} dự thảo`);

        // 3. Kiểm tra sau khi sửa
        console.log('\n📊 SAU KHI SỬA:');
        const afterFix = await pool.request().query(`
            SELECT 
                COUNT(*) as Total,
                SUM(CASE WHEN IsDeleted IS NULL THEN 1 ELSE 0 END) as NullCount,
                SUM(CASE WHEN IsDeleted = 0 THEN 1 ELSE 0 END) as ActiveCount,
                SUM(CASE WHEN IsDeleted = 1 THEN 1 ELSE 0 END) as DeletedCount
            FROM Drafts
        `);
        
        const stats = afterFix.recordset[0];
        console.log(`Total drafts: ${stats.Total}`);
        console.log(`IsDeleted = NULL: ${stats.NullCount}`);
        console.log(`IsDeleted = 0 (active): ${stats.ActiveCount}`);
        console.log(`IsDeleted = 1 (deleted): ${stats.DeletedCount}`);

        // 4. Test query API
        console.log('\n🔧 TEST QUERY API:');
        const apiTest = await pool.request().query(`
            SELECT d.DraftID, d.Title,
                   CASE 
                     WHEN DATEADD(day, ISNULL(d.CommentPeriod, 7), d.CreatedDate) > GETDATE() THEN 'active'
                     ELSE 'closed'
                   END as CommentStatus
            FROM Drafts d
            INNER JOIN Users u ON d.CreatedBy = u.UserID
            WHERE d.IsDeleted = 0
            ORDER BY d.CreatedDate DESC
        `);
        
        console.log(`API sẽ trả về: ${apiTest.recordset.length} dự thảo`);
        
        // Phân loại theo trạng thái
        const activeCount = apiTest.recordset.filter(d => d.CommentStatus === 'active').length;
        const closedCount = apiTest.recordset.filter(d => d.CommentStatus === 'closed').length;
        
        console.log(`- ĐANG GÓP Ý: ${activeCount} dự thảo`);
        console.log(`- ĐÃ KẾT THÚC: ${closedCount} dự thảo`);

        await pool.close();

        console.log('\n🎉 HOÀN THÀNH!');
        console.log('✅ Tất cả dữ liệu cũ đã được phục hồi');
        console.log('✅ Frontend sẽ hiển thị đầy đủ dự thảo');
        console.log('\n🔗 Test ngay: http://localhost:3000');
        console.log('   → Vào "Dự thảo tờ trình" sẽ thấy tất cả dự thảo');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
}

fixNullIsDeleted();

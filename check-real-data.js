const sql = require('mssql');

async function checkRealData() {
    console.log('🔍 KIỂM TRA DỮ LIỆU THỰC TẾ TRONG SQL SERVER');
    console.log('='.repeat(60));
    
    try {
        const pool = await sql.connect({
            server: 'localhost',
            user: 'sa',
            password: '123456',
            database: 'BIEUQUYET_CHP',
            options: { encrypt: false, trustServerCertificate: true }
        });

        // 1. Kiểm tra TẤT CẢ dự thảo trong database
        console.log('\n📋 1. TẤT CẢ DỰ THẢO TRONG DATABASE:');
        const allDrafts = await pool.request().query(`
            SELECT DraftID, Title, Status, CreatedDate, CreatedBy, IsDeleted, DeletedDate,
                   CommentPeriod, ViewerType,
                   DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) as EndDate,
                   CASE 
                     WHEN DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE() THEN 'ĐANG GÓP Ý'
                     ELSE 'ĐÃ KẾT THÚC'
                   END as TrangThai
            FROM Drafts 
            ORDER BY CreatedDate DESC
        `);
        
        console.log(`Tổng số dự thảo trong DB: ${allDrafts.recordset.length}`);
        allDrafts.recordset.forEach((draft, index) => {
            console.log(`${index + 1}. ID=${draft.DraftID} | "${draft.Title}" | ${draft.TrangThai} | IsDeleted=${draft.IsDeleted}`);
            console.log(`   Created: ${draft.CreatedDate} | EndDate: ${draft.EndDate}`);
        });

        // 2. Dự thảo ĐANG hoạt động (IsDeleted = 0)
        console.log('\n📊 2. DỰ THẢO ĐANG HOẠT ĐỘNG (IsDeleted = 0):');
        const activeDrafts = await pool.request().query(`
            SELECT DraftID, Title, 
                   CASE 
                     WHEN DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE() THEN 'ĐANG GÓP Ý'
                     ELSE 'ĐÃ KẾT THÚC'
                   END as TrangThai
            FROM Drafts 
            WHERE IsDeleted = 0
            ORDER BY CreatedDate DESC
        `);
        
        console.log(`Số dự thảo đang hoạt động: ${activeDrafts.recordset.length}`);
        activeDrafts.recordset.forEach((draft, index) => {
            console.log(`${index + 1}. "${draft.Title}" - ${draft.TrangThai}`);
        });

        // 3. Phân loại theo trạng thái
        console.log('\n🎯 3. PHÂN LOẠI THEO TRẠNG THÁI:');
        const statusCount = await pool.request().query(`
            SELECT 
                CASE 
                  WHEN DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE() THEN 'ĐANG GÓP Ý'
                  ELSE 'ĐÃ KẾT THÚC'
                END as TrangThai,
                COUNT(*) as SoLuong
            FROM Drafts 
            WHERE IsDeleted = 0
            GROUP BY 
                CASE 
                  WHEN DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE() THEN 'ĐANG GÓP Ý'
                  ELSE 'ĐÃ KẾT THÚC'
                END
        `);
        
        statusCount.recordset.forEach(item => {
            console.log(`${item.TrangThai}: ${item.SoLuong} dự thảo`);
        });

        // 4. Kiểm tra query hiện tại của API
        console.log('\n🔧 4. TEST QUERY API HIỆN TẠI:');
        const apiQuery = await pool.request().query(`
            SELECT d.DraftID, d.Title, d.Content, d.CreatedDate, d.Status, 
                   d.CommentPeriod, d.CreatedBy, d.ViewerType,
                   u.FullName as CreatedByName,
                   (SELECT COUNT(*) FROM DraftComments dc WHERE dc.DraftID = d.DraftID) as CommentCount,
                   DATEADD(day, ISNULL(d.CommentPeriod, 7), d.CreatedDate) as CalculatedEndDate,
                   CASE 
                     WHEN DATEADD(day, ISNULL(d.CommentPeriod, 7), d.CreatedDate) > GETDATE() THEN 'active'
                     ELSE 'closed'
                   END as CommentStatus
            FROM Drafts d
            INNER JOIN Users u ON d.CreatedBy = u.UserID
            WHERE d.IsDeleted = 0
            ORDER BY d.CreatedDate DESC
        `);
        
        console.log(`API query trả về: ${apiQuery.recordset.length} dự thảo`);

        // 5. Kiểm tra người tạo dự thảo
        console.log('\n👥 5. NGƯỜI TẠO DỰ THẢO:');
        const creators = await pool.request().query(`
            SELECT u.FullName, COUNT(*) as SoDuThao
            FROM Drafts d
            INNER JOIN Users u ON d.CreatedBy = u.UserID
            WHERE d.IsDeleted = 0
            GROUP BY u.FullName
            ORDER BY SoDuThao DESC
        `);
        
        creators.recordset.forEach(creator => {
            console.log(`${creator.FullName}: ${creator.SoDuThao} dự thảo`);
        });

        await pool.close();

        console.log('\n💡 KẾT LUẬN:');
        if (activeDrafts.recordset.length === 0) {
            console.log('❌ KHÔNG CÓ DỮ LIỆU DỰ THẢO THỰC TẾ TRONG DATABASE!');
            console.log('🔧 Cần tạo dữ liệu mẫu hoặc kiểm tra dữ liệu gốc');
        } else {
            console.log('✅ Có dữ liệu trong database');
            console.log('🔧 Cần kiểm tra tại sao frontend không hiển thị');
        }

    } catch (error) {
        console.error('❌ Lỗi kết nối database:', error.message);
    }
}

checkRealData();

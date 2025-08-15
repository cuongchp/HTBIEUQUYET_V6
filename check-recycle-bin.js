const sql = require('mssql');

async function checkRecycleBin() {
    console.log('='.repeat(60));
    console.log('   KIỂM TRA HỆ THỐNG THÙNG RÁC');
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

        // 1. Check RecycleBin table
        console.log('\n📊 Kiểm tra bảng RecycleBin:');
        const recycleBin = await pool.request().query('SELECT TOP 10 * FROM RecycleBin ORDER BY DeletedDate DESC');
        console.log(`Số bản ghi: ${recycleBin.recordset.length}`);
        
        if (recycleBin.recordset.length > 0) {
            recycleBin.recordset.forEach((item, index) => {
                console.log(`${index + 1}. ${item.TableName} ID ${item.RecordID}: "${item.RecordTitle}"`);
                console.log(`   Xóa bởi: ${item.DeletedBy}, Ngày: ${item.DeletedDate}`);
                console.log(`   Có thể khôi phục: ${item.CanRestore ? 'Có' : 'Không'}`);
            });
        } else {
            console.log('❌ Thùng rác trống - không có dữ liệu nào được soft delete');
        }

        // 2. Check soft deleted drafts
        console.log('\n📋 Kiểm tra dự thảo đã xóa mềm:');
        const deletedDrafts = await pool.request().query(`
            SELECT DraftID, Title, IsDeleted, DeletedDate, DeletedBy 
            FROM Drafts 
            WHERE IsDeleted = 1 
            ORDER BY DeletedDate DESC
        `);
        console.log(`Số dự thảo soft deleted: ${deletedDrafts.recordset.length}`);
        
        if (deletedDrafts.recordset.length > 0) {
            deletedDrafts.recordset.forEach((draft, index) => {
                console.log(`${index + 1}. Draft ${draft.DraftID}: "${draft.Title}"`);
                console.log(`   Xóa bởi: ${draft.DeletedBy}, Ngày: ${draft.DeletedDate}`);
            });
        }

        // 3. Check if soft delete columns exist
        console.log('\n🔧 Kiểm tra cấu trúc database:');
        const draftsColumns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Drafts' 
            AND COLUMN_NAME IN ('IsDeleted', 'DeletedDate', 'DeletedBy')
            ORDER BY COLUMN_NAME
        `);
        
        console.log('Các cột soft delete trong bảng Drafts:');
        if (draftsColumns.recordset.length > 0) {
            draftsColumns.recordset.forEach(col => {
                console.log(`✓ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
            });
        } else {
            console.log('❌ Chưa có cột soft delete trong bảng Drafts');
        }

        // 4. Check RecycleBin table structure
        const recycleBinExists = await pool.request().query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'RecycleBin'
        `);
        
        if (recycleBinExists.recordset.length > 0) {
            console.log('✓ Bảng RecycleBin đã tồn tại');
        } else {
            console.log('❌ Bảng RecycleBin chưa tồn tại');
        }

        // 5. Recent delete activity
        console.log('\n📈 Hoạt động xóa gần đây:');
        const recentActivity = await pool.request().query(`
            SELECT TableName, COUNT(*) as Count, MAX(DeletedDate) as LatestDelete
            FROM RecycleBin 
            WHERE DeletedDate >= DATEADD(day, -7, GETDATE())
            GROUP BY TableName
            ORDER BY Count DESC
        `);
        
        if (recentActivity.recordset.length > 0) {
            recentActivity.recordset.forEach(activity => {
                console.log(`- ${activity.TableName}: ${activity.Count} mục (gần nhất: ${activity.LatestDelete})`);
            });
        } else {
            console.log('Không có hoạt động xóa nào trong 7 ngày qua');
        }

        await pool.close();

        console.log('\n💡 HƯỚNG DẪN:');
        if (recycleBin.recordset.length === 0) {
            console.log('1. Thử xóa một dự thảo để test soft delete');
            console.log('2. Kiểm tra xem API delete có gọi đúng stored procedure không');
            console.log('3. Mở browser vào http://localhost:3000 -> Admin -> Thùng rác');
        }

    } catch (error) {
        console.error('❌ Lỗi kiểm tra:', error.message);
    }
}

checkRecycleBin();

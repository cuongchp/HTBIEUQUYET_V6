const sql = require('mssql');

async function checkStoredProcedures() {
    try {
        const pool = await sql.connect({
            server: 'localhost',
            user: 'sa', 
            password: '123456',
            database: 'BIEUQUYET_CHP',
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log('🔍 Kiểm tra stored procedures...');
        
        const procedures = await pool.request().query(`
            SELECT name, create_date, modify_date 
            FROM sys.objects 
            WHERE type = 'P' AND name IN ('sp_SoftDeleteRecord', 'sp_RestoreRecord')
            ORDER BY name
        `);
        
        console.log(`Found ${procedures.recordset.length} stored procedures:`);
        procedures.recordset.forEach(proc => {
            console.log(`✓ ${proc.name} (created: ${proc.create_date})`);
        });
        
        if (procedures.recordset.length === 0) {
            console.log('❌ Không tìm thấy stored procedures cho soft delete');
            console.log('💡 Cần chạy script: database/soft_delete_upgrade.sql');
        }
        
        // Check RecycleBin table
        const tables = await pool.request().query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'RecycleBin'
        `);
        
        if (tables.recordset.length > 0) {
            console.log('✓ Bảng RecycleBin đã tồn tại');
        } else {
            console.log('❌ Bảng RecycleBin chưa tồn tại');
        }
        
        await pool.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkStoredProcedures();

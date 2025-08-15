const sql = require('mssql');
require('dotenv').config();

async function addTestData() {
    try {
        const config = {
            server: process.env.DB_SERVER || 'localhost',
            database: process.env.DB_NAME || 'HTBIEUQUYET',
            user: process.env.DB_USER || 'sa',
            password: process.env.DB_PASSWORD || '123456',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };

        console.log('Connecting to database...');
        const pool = await sql.connect(config);

        // Thêm dữ liệu AttachedFiles cho draft đầu tiên
        console.log('Updating first draft with attached files...');
        
        const result = await pool.request()
            .input('files', sql.NVarChar(1000), 'document1.pdf,presentation.pptx,report.docx')
            .query(`
                UPDATE Drafts 
                SET AttachedFiles = @files 
                WHERE DraftID = (SELECT TOP 1 DraftID FROM Drafts ORDER BY DraftID)
            `);

        console.log('✅ Updated drafts:', result.rowsAffected);

        // Kiểm tra kết quả
        const check = await pool.request().query(`
            SELECT TOP 3 DraftID, Title, AttachedFiles 
            FROM Drafts 
            ORDER BY DraftID
        `);

        console.log('📊 Current data:');
        check.recordset.forEach(draft => {
            console.log(`- Draft ${draft.DraftID}: ${draft.Title}`);
            console.log(`  Files: ${draft.AttachedFiles || 'NULL'}`);
        });

        await pool.close();
        console.log('✅ Done!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

addTestData();

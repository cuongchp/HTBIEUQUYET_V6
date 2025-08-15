const sql = require('mssql');

async function fixRecycleBinIssue() {
    console.log('🔧 FIXING RECYCLE BIN ISSUES');
    console.log('='.repeat(50));
    
    try {
        const pool = await sql.connect({
            server: 'localhost',
            user: 'sa',
            password: '123456',
            database: 'BIEUQUYET_CHP',
            options: { encrypt: false, trustServerCertificate: true }
        });

        // 1. Clear existing test data
        console.log('\n🧹 Step 1: Clear old test data...');
        await pool.request().query(`
            DELETE FROM RecycleBin WHERE RecordTitle LIKE '%test%' OR RecordTitle IS NULL
        `);
        
        await pool.request().query(`
            UPDATE Drafts SET IsDeleted = 0, DeletedDate = NULL, DeletedBy = NULL 
            WHERE IsDeleted = 1 AND Title LIKE '%test%'
        `);
        
        console.log('✅ Cleared old test data');

        // 2. Create a new test draft
        console.log('\n📝 Step 2: Create new test draft...');
        const createResult = await pool.request().query(`
            INSERT INTO Drafts (Title, Content, CreatedBy, CreatedDate, Status, CommentPeriod, ViewerType, IsDeleted)
            OUTPUT inserted.DraftID
            VALUES (N'Test Draft - Xóa Mềm', N'Dự thảo này để test tính năng xóa mềm và thùng rác', 1, GETDATE(), N'Đang mở góp ý', 7, 'all', 0)
        `);
        
        const testDraftId = createResult.recordset[0].DraftID;
        console.log(`✅ Created test draft ID: ${testDraftId}`);

        // 3. Test soft delete with title
        console.log('\n🗑️ Step 3: Test soft delete with title...');
        try {
            await pool.request()
                .input('tableName', sql.NVarChar, 'Drafts')
                .input('recordID', sql.Int, testDraftId)
                .input('deletedBy', sql.Int, 1)
                .input('recordTitle', sql.NVarChar, 'Test Draft - Xóa Mềm')
                .query(`
                    EXEC sp_SoftDeleteRecord 
                        @TableName = @tableName,
                        @RecordID = @recordID,
                        @DeletedBy = @deletedBy,
                        @RecordTitle = @recordTitle
                `);
            
            console.log('✅ Soft delete with title successful!');
            
        } catch (spError) {
            console.log('❌ Stored procedure failed:', spError.message);
        }

        // 4. Verify results
        console.log('\n🔍 Step 4: Verify results...');
        
        // Check RecycleBin has title
        const recycleCheck = await pool.request()
            .input('draftID', sql.Int, testDraftId)
            .query('SELECT * FROM RecycleBin WHERE TableName = \'Drafts\' AND RecordID = @draftID');
        
        if (recycleCheck.recordset.length > 0) {
            const recycleItem = recycleCheck.recordset[0];
            console.log('✅ RecycleBin entry:');
            console.log(`   ID: ${recycleItem.RecordID}`);
            console.log(`   Title: "${recycleItem.RecordTitle}"`);
            console.log(`   DeletedBy: ${recycleItem.DeletedBy}`);
            console.log(`   DeletedDate: ${recycleItem.DeletedDate}`);
        } else {
            console.log('❌ No RecycleBin entry found');
        }

        // Check draft is hidden from main list
        const mainListCheck = await pool.request().query(`
            SELECT COUNT(*) as Count FROM Drafts WHERE IsDeleted = 0
        `);
        
        console.log(`✅ Active drafts in main list: ${mainListCheck.recordset[0].Count}`);

        // Check soft deleted drafts
        const deletedCheck = await pool.request().query(`
            SELECT COUNT(*) as Count FROM Drafts WHERE IsDeleted = 1
        `);
        
        console.log(`✅ Soft deleted drafts: ${deletedCheck.recordset[0].Count}`);

        await pool.close();

        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Go to http://localhost:3000');
        console.log('2. Login as admin');
        console.log('3. Check "Dự thảo tờ trình" - should NOT see deleted drafts');
        console.log('4. Go to "Thùng rác" - should see deleted drafts WITH titles');
        console.log('5. Click "Chi tiết" to view deleted draft details');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixRecycleBinIssue();

const sql = require('mssql');

async function testRecycleBinFlow() {
    console.log('🧪 TESTING FULL RECYCLE BIN FLOW');
    console.log('='.repeat(50));
    
    try {
        const pool = await sql.connect({
            server: 'localhost',
            user: 'sa',
            password: '123456',
            database: 'BIEUQUYET_CHP',
            options: { encrypt: false, trustServerCertificate: true }
        });

        // 1. Tạo dự thảo test
        console.log('\n📝 Step 1: Tạo dự thảo test...');
        const createResult = await pool.request().query(`
            INSERT INTO Drafts (Title, Content, CreatedBy, CreatedDate, Status, CommentPeriod, ViewerType, IsDeleted)
            OUTPUT inserted.DraftID
            VALUES (N'Test Draft for Soft Delete', N'Nội dung test để xóa mềm', 1, GETDATE(), N'Đang mở góp ý', 7, 'all', 0)
        `);
        
        const testDraftId = createResult.recordset[0].DraftID;
        console.log(`✅ Tạo dự thảo test thành công! ID: ${testDraftId}`);

        // 2. Test stored procedure soft delete
        console.log('\n🔄 Step 2: Test stored procedure soft delete...');
        try {
            await pool.request()
                .input('tableName', sql.NVarChar, 'Drafts')
                .input('recordID', sql.Int, testDraftId)
                .input('deletedBy', sql.Int, 1)
                .query(`
                    EXEC sp_SoftDeleteRecord 
                        @TableName = @tableName,
                        @RecordID = @recordID,
                        @DeletedBy = @deletedBy
                `);
            
            console.log('✅ Stored procedure thành công!');
            
        } catch (spError) {
            console.log('❌ Stored procedure thất bại:', spError.message);
            
            // Manual soft delete
            console.log('🔄 Thử manual soft delete...');
            await pool.request()
                .input('draftID', sql.Int, testDraftId)
                .input('deletedBy', sql.Int, 1)
                .query(`
                    UPDATE Drafts 
                    SET IsDeleted = 1, DeletedDate = GETDATE(), DeletedBy = @deletedBy 
                    WHERE DraftID = @draftID
                `);

            // Insert into RecycleBin
            await pool.request()
                .input('draftID', sql.Int, testDraftId)
                .input('deletedBy', sql.Int, 1)
                .input('recordTitle', sql.NVarChar, 'Test Draft for Soft Delete')
                .query(`
                    INSERT INTO RecycleBin (TableName, RecordID, RecordTitle, DeletedBy, DeletedDate, CanRestore)
                    VALUES ('Drafts', @draftID, @recordTitle, @deletedBy, GETDATE(), 1)
                `);
            
            console.log('✅ Manual soft delete thành công!');
        }

        // 3. Verify results
        console.log('\n🔍 Step 3: Verify kết quả...');
        
        // Check draft is soft deleted
        const draftCheck = await pool.request()
            .input('draftID', sql.Int, testDraftId)
            .query('SELECT IsDeleted, DeletedDate, DeletedBy FROM Drafts WHERE DraftID = @draftID');
        
        if (draftCheck.recordset.length > 0 && draftCheck.recordset[0].IsDeleted) {
            console.log('✅ Draft đã được soft delete thành công');
            console.log(`   IsDeleted: ${draftCheck.recordset[0].IsDeleted}`);
            console.log(`   DeletedDate: ${draftCheck.recordset[0].DeletedDate}`);
            console.log(`   DeletedBy: ${draftCheck.recordset[0].DeletedBy}`);
        } else {
            console.log('❌ Draft không được soft delete');
        }

        // Check RecycleBin
        const recycleCheck = await pool.request()
            .input('draftID', sql.Int, testDraftId)
            .query('SELECT * FROM RecycleBin WHERE TableName = \'Drafts\' AND RecordID = @draftID');
        
        if (recycleCheck.recordset.length > 0) {
            console.log('✅ Record đã được thêm vào RecycleBin');
            console.log('   RecycleBin entry:', recycleCheck.recordset[0]);
        } else {
            console.log('❌ Record KHÔNG có trong RecycleBin');
        }

        // 4. Test restore
        console.log('\n♻️ Step 4: Test khôi phục...');
        try {
            await pool.request()
                .input('tableName', sql.NVarChar, 'Drafts')
                .input('recordID', sql.Int, testDraftId)
                .input('restoredBy', sql.Int, 1)
                .query(`
                    EXEC sp_RestoreRecord 
                        @TableName = @tableName,
                        @RecordID = @recordID,
                        @RestoredBy = @restoredBy
                `);
            
            console.log('✅ Khôi phục thành công!');
            
            // Verify restore
            const restoreCheck = await pool.request()
                .input('draftID', sql.Int, testDraftId)
                .query('SELECT IsDeleted FROM Drafts WHERE DraftID = @draftID');
            
            if (restoreCheck.recordset[0].IsDeleted === false) {
                console.log('✅ Draft đã được khôi phục: IsDeleted = false');
            }
            
        } catch (restoreError) {
            console.log('❌ Lỗi khôi phục:', restoreError.message);
        }

        // 5. Cleanup
        console.log('\n🧹 Step 5: Cleanup...');
        await pool.request()
            .input('draftID', sql.Int, testDraftId)
            .query('DELETE FROM Drafts WHERE DraftID = @draftID');
        
        await pool.request()
            .input('draftID', sql.Int, testDraftId)
            .query('DELETE FROM RecycleBin WHERE TableName = \'Drafts\' AND RecordID = @draftID');
        
        console.log('✅ Cleanup hoàn tất');

        await pool.close();

        console.log('\n🎉 TEST HOÀN TẤT!');
        console.log('Bây giờ bạn có thể test trên browser:');
        console.log('1. Vào http://localhost:3000');
        console.log('2. Đăng nhập admin');
        console.log('3. Tạo dự thảo và thử xóa');
        console.log('4. Kiểm tra thùng rác');

    } catch (error) {
        console.error('❌ Test thất bại:', error.message);
    }
}

testRecycleBinFlow();

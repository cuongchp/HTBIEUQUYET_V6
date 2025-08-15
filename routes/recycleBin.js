// Recycle Bin API Routes
// Quản lý thùng rác và khôi phục dữ liệu đã xóa mềm

const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Middleware to check admin permissions
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.Role !== 'Admin') {
    return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập thùng rác' });
  }
  next();
}

// Get all items in recycle bin
router.get('/', requireAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const request = pool.request();

    const result = await request.query(`
      SELECT 
        rb.RecycleBinID,
        rb.TableName,
        rb.RecordID,
        rb.RecordTitle,
        rb.DeletedDate,
        rb.CanRestore,
        u.FullName as DeletedBy,
        CASE rb.TableName
          WHEN 'Users' THEN N'Người dùng'
          WHEN 'Drafts' THEN N'Dự thảo tờ trình'
          WHEN 'Votes' THEN N'Phiếu biểu quyết'
          WHEN 'DraftComments' THEN N'Góp ý dự thảo'
          WHEN 'VoteResults' THEN N'Kết quả biểu quyết'
          WHEN 'Documents' THEN N'Tài liệu'
          WHEN 'Resolutions' THEN N'Nghị quyết'
          ELSE rb.TableName
        END as TypeName
      FROM RecycleBin rb
      INNER JOIN Users u ON rb.DeletedBy = u.UserID
      WHERE rb.CanRestore = 1
      ORDER BY rb.DeletedDate DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Get recycle bin error:', err);
    res.status(500).json({ error: 'Lỗi tải thùng rác' });
  }
});

// Get detailed info about a deleted item
router.get('/:tableName/:recordId', requireAdmin, async (req, res) => {
  try {
    const { tableName, recordId } = req.params;
    const pool = req.app.locals.pool;
    const request = pool.request();

    // Validate table name for security
    const allowedTables = ['Users', 'Drafts', 'Votes', 'DraftComments', 'VoteResults', 'Documents', 'Resolutions'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Bảng không hợp lệ' });
    }

    let query = '';
    let primaryKey = '';

    switch (tableName) {
      case 'Users':
        query = 'SELECT * FROM Users WHERE UserID = @recordId AND IsDeleted = 1';
        primaryKey = 'UserID';
        break;
      case 'Drafts':
        query = 'SELECT d.*, u.FullName as CreatedBy FROM Drafts d INNER JOIN Users u ON d.CreatedBy = u.UserID WHERE d.DraftID = @recordId AND d.IsDeleted = 1';
        primaryKey = 'DraftID';
        break;
      case 'Votes':
        query = 'SELECT v.*, u.FullName as CreatedBy FROM Votes v INNER JOIN Users u ON v.CreatedBy = u.UserID WHERE v.VoteID = @recordId AND v.IsDeleted = 1';
        primaryKey = 'VoteID';
        break;
      case 'DraftComments':
        query = 'SELECT dc.*, u.FullName as CommenterName FROM DraftComments dc INNER JOIN Users u ON dc.UserID = u.UserID WHERE dc.CommentID = @recordId AND dc.IsDeleted = 1';
        primaryKey = 'CommentID';
        break;
      case 'VoteResults':
        query = 'SELECT vr.*, u.FullName as VoterName FROM VoteResults vr INNER JOIN Users u ON vr.UserID = u.UserID WHERE vr.ResultID = @recordId AND vr.IsDeleted = 1';
        primaryKey = 'ResultID';
        break;
      default:
        return res.status(400).json({ error: 'Loại dữ liệu không được hỗ trợ' });
    }

    const result = await request
      .input('recordId', sql.Int, recordId)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dữ liệu đã xóa' });
    }

    res.json({
      tableName,
      primaryKey,
      data: result.recordset[0]
    });

  } catch (err) {
    console.error('Get deleted item details error:', err);
    res.status(500).json({ error: 'Lỗi tải chi tiết dữ liệu đã xóa' });
  }
});

// Restore an item from recycle bin
router.post('/restore/:tableName/:recordId', requireAdmin, async (req, res) => {
  try {
    const { tableName, recordId } = req.params;
    const userId = req.session.user.UserID;
    const pool = req.app.locals.pool;
    const request = pool.request();

    // Validate table name for security
    const allowedTables = ['Users', 'Drafts', 'Votes', 'DraftComments', 'VoteResults', 'Documents', 'Resolutions'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Bảng không hợp lệ' });
    }

    // Check if item exists and is deleted
    let checkQuery = '';
    switch (tableName) {
      case 'Users':
        checkQuery = 'SELECT Username FROM Users WHERE UserID = @recordId AND IsDeleted = 1';
        break;
      case 'Drafts':
        checkQuery = 'SELECT Title FROM Drafts WHERE DraftID = @recordId AND IsDeleted = 1';
        break;
      case 'Votes':
        checkQuery = 'SELECT Title FROM Votes WHERE VoteID = @recordId AND IsDeleted = 1';
        break;
      case 'DraftComments':
        checkQuery = 'SELECT Comment FROM DraftComments WHERE CommentID = @recordId AND IsDeleted = 1';
        break;
      case 'VoteResults':
        checkQuery = 'SELECT Choice FROM VoteResults WHERE ResultID = @recordId AND IsDeleted = 1';
        break;
      default:
        return res.status(400).json({ error: 'Loại dữ liệu không được hỗ trợ' });
    }

    const checkResult = await request
      .input('recordId', sql.Int, recordId)
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dữ liệu đã xóa hoặc dữ liệu đã được khôi phục' });
    }

    // Restore using stored procedure
    await request
      .input('tableName', sql.NVarChar, tableName)
      .input('restoredBy', sql.Int, userId)
      .query(`
        EXEC sp_RestoreRecord 
          @TableName = @tableName,
          @RecordID = @recordId,
          @RestoredBy = @restoredBy
      `);

    res.json({ 
      success: true, 
      message: `Đã khôi phục thành công ${tableName === 'Users' ? 'người dùng' : 
                                        tableName === 'Drafts' ? 'dự thảo' : 
                                        tableName === 'Votes' ? 'phiếu biểu quyết' : 'dữ liệu'}`
    });

  } catch (err) {
    console.error('Restore item error:', err);
    res.status(500).json({ error: 'Lỗi khôi phục dữ liệu' });
  }
});

// Permanently delete an item (hard delete)
router.delete('/permanent/:tableName/:recordId', requireAdmin, async (req, res) => {
  try {
    const { tableName, recordId } = req.params;
    const pool = req.app.locals.pool;
    const request = pool.request();

    // Validate table name for security
    const allowedTables = ['Users', 'Drafts', 'Votes', 'DraftComments', 'VoteResults', 'Documents', 'Resolutions'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Bảng không hợp lệ' });
    }

    // Build delete query based on table
    let deleteQuery = '';
    let primaryKey = '';

    switch (tableName) {
      case 'Users':
        deleteQuery = 'DELETE FROM Users WHERE UserID = @recordId AND IsDeleted = 1';
        primaryKey = 'UserID';
        break;
      case 'Drafts':
        deleteQuery = 'DELETE FROM Drafts WHERE DraftID = @recordId AND IsDeleted = 1';
        primaryKey = 'DraftID';
        break;
      case 'Votes':
        deleteQuery = 'DELETE FROM Votes WHERE VoteID = @recordId AND IsDeleted = 1';
        primaryKey = 'VoteID';
        break;
      case 'DraftComments':
        deleteQuery = 'DELETE FROM DraftComments WHERE CommentID = @recordId AND IsDeleted = 1';
        primaryKey = 'CommentID';
        break;
      case 'VoteResults':
        deleteQuery = 'DELETE FROM VoteResults WHERE ResultID = @recordId AND IsDeleted = 1';
        primaryKey = 'ResultID';
        break;
      default:
        return res.status(400).json({ error: 'Loại dữ liệu không được hỗ trợ' });
    }

    // Execute permanent delete
    const result = await request
      .input('recordId', sql.Int, recordId)
      .query(deleteQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dữ liệu để xóa vĩnh viễn' });
    }

    // Remove from recycle bin
    await request.query(`
      DELETE FROM RecycleBin 
      WHERE TableName = '${tableName}' AND RecordID = @recordId
    `);

    res.json({ 
      success: true, 
      message: 'Đã xóa vĩnh viễn dữ liệu. Hành động này không thể hoàn tác.' 
    });

  } catch (err) {
    console.error('Permanent delete error:', err);
    res.status(500).json({ error: 'Lỗi xóa vĩnh viễn dữ liệu' });
  }
});

// Empty entire recycle bin (hard delete all)
router.delete('/empty', requireAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const request = pool.request();

    // Get all items in recycle bin
    const recycleBinItems = await request.query(`
      SELECT TableName, RecordID FROM RecycleBin WHERE CanRestore = 1
    `);

    let deletedCount = 0;

    // Delete each item permanently
    for (const item of recycleBinItems.recordset) {
      try {
        let deleteQuery = '';
        
        switch (item.TableName) {
          case 'Users':
            deleteQuery = `DELETE FROM Users WHERE UserID = ${item.RecordID} AND IsDeleted = 1`;
            break;
          case 'Drafts':
            deleteQuery = `DELETE FROM Drafts WHERE DraftID = ${item.RecordID} AND IsDeleted = 1`;
            break;
          case 'Votes':
            deleteQuery = `DELETE FROM Votes WHERE VoteID = ${item.RecordID} AND IsDeleted = 1`;
            break;
          case 'DraftComments':
            deleteQuery = `DELETE FROM DraftComments WHERE CommentID = ${item.RecordID} AND IsDeleted = 1`;
            break;
          case 'VoteResults':
            deleteQuery = `DELETE FROM VoteResults WHERE ResultID = ${item.RecordID} AND IsDeleted = 1`;
            break;
          default:
            continue;
        }

        await pool.request().query(deleteQuery);
        deletedCount++;
      } catch (itemErr) {
        console.error(`Error deleting ${item.TableName} ID ${item.RecordID}:`, itemErr);
      }
    }

    // Clear recycle bin
    await request.query('DELETE FROM RecycleBin WHERE CanRestore = 1');

    res.json({ 
      success: true, 
      message: `Đã làm trống thùng rác. Xóa vĩnh viễn ${deletedCount} mục.` 
    });

  } catch (err) {
    console.error('Empty recycle bin error:', err);
    res.status(500).json({ error: 'Lỗi làm trống thùng rác' });
  }
});

// Get recycle bin statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const request = pool.request();

    const result = await request.query(`
      SELECT 
        TableName,
        COUNT(*) as Count,
        CASE TableName
          WHEN 'Users' THEN N'Người dùng'
          WHEN 'Drafts' THEN N'Dự thảo tờ trình'
          WHEN 'Votes' THEN N'Phiếu biểu quyết'
          WHEN 'DraftComments' THEN N'Góp ý dự thảo'
          WHEN 'VoteResults' THEN N'Kết quả biểu quyết'
          WHEN 'Documents' THEN N'Tài liệu'
          WHEN 'Resolutions' THEN N'Nghị quyết'
          ELSE TableName
        END as TypeName
      FROM RecycleBin 
      WHERE CanRestore = 1
      GROUP BY TableName
      ORDER BY Count DESC
    `);

    const totalCount = await request.query(`
      SELECT COUNT(*) as Total FROM RecycleBin WHERE CanRestore = 1
    `);

    res.json({
      summary: result.recordset,
      total: totalCount.recordset[0].Total
    });

  } catch (err) {
    console.error('Get recycle bin stats error:', err);
    res.status(500).json({ error: 'Lỗi tải thống kê thùng rác' });
  }
});

module.exports = router;

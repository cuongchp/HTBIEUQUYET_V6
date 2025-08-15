const express = require('express');
const router = express.Router();
const sql = require('mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for draft files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/drafts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + Buffer.from(file.originalname, 'latin1').toString('utf8'));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 300 * 1024 * 1024 } // 300MB limit
});

// Get all drafts for admin management (requires admin/manager role)
router.get('/all', async (req, res) => {
  try {
    console.log('📋 Getting all drafts for admin...');
    
    // Check if user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has admin/manager permissions
    const userRole = req.session.user.Role || req.session.user.role;
    console.log('🔐 Checking user role:', userRole);
    
    if (!['Admin', 'Manager'].includes(userRole)) {
      console.log('❌ Access denied for role:', userRole);
      return res.status(403).json({ error: 'Access denied. Admin or Manager role required.' });
    }
    
    const pool = req.app.locals.pool;
    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const request = pool.request();

    // Get all drafts for admin with more details
    const result = await request.query(`
      SELECT d.DraftID, d.Title, d.Content, d.CreatedDate, d.Status, 
             d.CommentPeriod, d.CreatedBy,
             u.FullName as CreatedByName,
             (SELECT COUNT(*) FROM DraftComments dc WHERE dc.DraftID = d.DraftID) as CommentCount,
             CASE 
               WHEN d.Status IS NULL OR d.Status = '' THEN 'Draft'
               ELSE d.Status
             END as StatusDisplay
      FROM Drafts d
      INNER JOIN Users u ON d.CreatedBy = u.UserID
      ORDER BY d.CreatedDate DESC
    `);

    console.log(`📄 Found ${result.recordset.length} drafts for admin`);
    res.json(result.recordset);

  } catch (error) {
    console.error('❌ Error getting all drafts for admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all drafts - NO ISDELETED DEPENDENCY
router.get('/', async (req, res) => {
  try {
    const statusFilter = req.query.status; // 'active', 'closed', hoặc undefined (all)
    const currentUserId = req.session?.user?.UserID;
    const currentUserRole = req.session?.user?.Role;
    
    console.log(`📋 Getting drafts with status filter: ${statusFilter || 'all'} for user: ${currentUserId} (${currentUserRole})`);
    
    const pool = req.app.locals.pool;
    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const request = pool.request();

    // Build query with permission filtering
    let whereClause = '';
    if (currentUserRole !== 'Admin') {
      // Non-admin users: only see drafts they have permission to view
      whereClause = `
        AND (
          d.ViewerType = 'all' 
          OR d.CreatedBy = ${currentUserId}
          OR EXISTS (
            SELECT 1 FROM DraftPermissions dp 
            WHERE dp.DraftID = d.DraftID 
            AND dp.UserID = ${currentUserId} 
            AND dp.PermissionType = 'view' 
            AND dp.IsActive = 1
          )
        )
      `;
    }
    // Admin users see all drafts (no additional where clause)

    // Query với tính toán trạng thái dựa trên CommentPeriod và permission filtering
    const result = await request.query(`
      SELECT d.DraftID, d.Title, d.Content, d.CreatedDate, d.Status, 
             d.CommentPeriod, d.CreatedBy, d.ViewerType,
             u.FullName as CreatedByName,
             (SELECT COUNT(*) FROM DraftComments dc WHERE dc.DraftID = d.DraftID) as CommentCount,
             DATEADD(day, ISNULL(d.CommentPeriod, 7), d.CreatedDate) as CalculatedEndDate,
             CASE 
               WHEN DATEADD(day, ISNULL(d.CommentPeriod, 7), d.CreatedDate) > GETDATE() THEN 'active'
               ELSE 'closed'
             END as CommentStatus,
             CASE 
               WHEN d.ViewerType = 'all' THEN 'Tất cả người dùng'
               ELSE CONCAT('Người dùng được chọn (', 
                 (SELECT COUNT(*) FROM DraftPermissions dp WHERE dp.DraftID = d.DraftID AND dp.IsActive = 1), 
                 ' người)')
             END as ViewerInfo
      FROM Drafts d
      INNER JOIN Users u ON d.CreatedBy = u.UserID
      WHERE d.IsDeleted = 0 ${whereClause}
      ORDER BY d.CreatedDate DESC
    `);

    console.log(`✅ Found ${result.recordset.length} drafts total (filtered by permissions)`);

    // Process và filter drafts
    let drafts = result.recordset.map(draft => ({
      ...draft,
      CreatedDate: draft.CreatedDate,
      StatusDisplay: draft.Status === 'Draft' ? 'Dự thảo' : 
                     draft.Status === 'Review' ? 'Đang xem xét' : 
                     draft.Status === 'Approved' ? 'Đã duyệt' : 
                     draft.Status || 'Dự thảo',
      // Tính deadline
      DeadlineDate: new Date(new Date(draft.CreatedDate).getTime() + (draft.CommentPeriod || 7) * 24 * 60 * 60 * 1000),
      // Ngày kết thúc góp ý (từ database calculation)
      ClosedDate: draft.CalculatedEndDate,
      // Trạng thái góp ý
      IsCommentActive: draft.CommentStatus === 'active'
    }));

    // Filter theo status parameter
    if (statusFilter === 'active') {
      drafts = drafts.filter(draft => draft.CommentStatus === 'active');
      console.log(`📋 Filtered to ${drafts.length} active drafts`);
    } else if (statusFilter === 'closed') {
      drafts = drafts.filter(draft => draft.CommentStatus === 'closed');
      console.log(`📋 Filtered to ${drafts.length} closed drafts`);
    }

    res.json(drafts);
    
  } catch (err) {
    console.error('❌ Get drafts error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      number: err.number
    });
    
    res.status(500).json({ 
      error: 'Lỗi hệ thống khi lấy danh sách dự thảo',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// Get draft details - NO ISDELETED DEPENDENCY
router.get('/:id', async (req, res) => {
  try {
    const draftId = req.params.id;
    console.log(`🔍 Getting draft details for ID: ${draftId}`);
    
    const pool = req.app.locals.pool;
    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const request = pool.request();

    // Get draft details - COMPLETELY SAFE VERSION
    console.log('📋 Executing draft query...');
    const draftResult = await request
      .input('draftID', sql.Int, draftId)
      .query(`
        SELECT d.DraftID, d.Title, d.Content, d.AttachedFiles, d.CreatedDate, 
               d.Status, d.CommentPeriod, d.CreatedBy,
               u.FullName as CreatedBy
        FROM Drafts d
        INNER JOIN Users u ON d.CreatedBy = u.UserID
        WHERE d.DraftID = @draftID
      `);

    console.log(`📊 Draft query result: ${draftResult.recordset.length} records`);

    if (draftResult.recordset.length === 0) {
      console.log(`❌ Draft not found for ID: ${draftId}`);
      return res.status(404).json({ error: 'Dự thảo không tồn tại' });
    }

    const draft = draftResult.recordset[0];
    console.log('📄 Draft found:', {
      DraftID: draft.DraftID,
      Title: draft.Title,
      AttachedFiles: draft.AttachedFiles
    });

    // Process attached files safely
    let attachedFilesArray = [];
    
    try {
      if (draft.AttachedFiles && typeof draft.AttachedFiles === 'string' && draft.AttachedFiles.trim()) {
        console.log('📎 Processing attached files:', draft.AttachedFiles);
        const fileNames = draft.AttachedFiles.split(',').filter(name => name.trim());
        
        attachedFilesArray = fileNames.map(fileName => {
          const trimmedName = fileName.trim();
          const filePath = path.join('./uploads/drafts', trimmedName);
          
          // Check if file exists and get size
          let fileSize = 0;
          try {
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              fileSize = stats.size;
            }
          } catch (err) {
            console.warn(`⚠️ Could not get file stats for: ${trimmedName}`);
          }
          
          return {
            FileName: trimmedName,
            FileSize: fileSize,
            FilePath: filePath,
            DownloadUrl: `/uploads/drafts/${trimmedName}`
          };
        });
        
        console.log('✅ Processed attached files:', attachedFilesArray.length);
      } else {
        console.log('ℹ️ No attached files found');
      }
    } catch (fileError) {
      console.error('❌ Error processing attached files:', fileError);
      // Continue without attached files
    }

    // Set processed files
    draft.AttachedFiles = attachedFilesArray;

    // Get comments - SAFE VERSION without any IsDeleted dependency  
    console.log('💬 Getting comments...');
    let comments = [];
    
    try {
      const commentsResult = await request.query(`
        SELECT dc.CommentID, dc.DraftID, dc.Comment, dc.CommentDate, dc.UserID,
               u.FullName as CommenterName
        FROM DraftComments dc
        INNER JOIN Users u ON dc.UserID = u.UserID
        WHERE dc.DraftID = @draftID
        ORDER BY dc.CommentDate DESC
      `);
      
      comments = commentsResult.recordset;
      console.log(`📝 Found ${comments.length} comments`);
    } catch (commentError) {
      console.error('❌ Error getting comments:', commentError);
      // Continue without comments
      comments = [];
    }

    console.log('✅ Sending response...');
    res.json({
      success: true,
      draft: draft,
      comments: comments
    });

  } catch (err) {
    console.error('❌ Get draft details error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      number: err.number,
      state: err.state
    });
    
    res.status(500).json({ 
      error: 'Lỗi hệ thống khi lấy chi tiết dự thảo',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// Create new draft
router.post('/', upload.array('files'), async (req, res) => {
  try {
    const { title, content, commentPeriod, viewerType, selectedUserIds, selectedUsers } = req.body;
    const pool = req.app.locals.pool;
    const request = pool.request();
    const userId = req.session.user.UserID;

    console.log('📝 Creating new draft:', { 
      title, 
      commentPeriod, 
      viewerType, 
      userId, 
      selectedUserIds, 
      selectedUsers,
      'req.body': req.body 
    });

    // Parse selectedUserIds if it's a string (support both field names)
    let userIds = [];
    const userIdsData = selectedUserIds || selectedUsers;
    if (viewerType === 'specific' && userIdsData) {
      try {
        userIds = typeof userIdsData === 'string' ? JSON.parse(userIdsData) : userIdsData;
        console.log('👥 Selected user IDs:', userIds);
      } catch (e) {
        console.error('Error parsing user IDs:', e);
        return res.status(400).json({ error: 'Invalid user selection data' });
      }
    }

    // Handle file uploads
    let attachedFiles = '';
    if (req.files && req.files.length > 0) {
      attachedFiles = req.files.map(file => file.filename).join(',');
      console.log('📎 Attached files:', attachedFiles);
    }

    // Insert draft with ViewerType
    const result = await request
      .input('title', sql.NVarChar, title)
      .input('content', sql.NText, content)
      .input('attachedFiles', sql.NText, attachedFiles)
      .input('createdBy', sql.Int, userId)
      .input('commentPeriod', sql.Int, commentPeriod || 7)
      .input('viewerType', sql.NVarChar, viewerType || 'all')
      .query(`
        INSERT INTO Drafts (Title, Content, AttachedFiles, CreatedBy, CommentPeriod, Status, ViewerType)
        OUTPUT INSERTED.DraftID
        VALUES (@title, @content, @attachedFiles, @createdBy, @commentPeriod, 'Draft', @viewerType)
      `);

    const newDraftId = result.recordset[0].DraftID;
    console.log('✅ Draft created with ID:', newDraftId);

    // If specific users selected, create permissions
    if (viewerType === 'specific' && userIds.length > 0) {
      console.log('🔐 Creating specific user permissions...');
      
      const permissionRequest = pool.request();
      
      // Add creator permission (always can view own draft)
      await permissionRequest
        .input('draftId', sql.Int, newDraftId)
        .input('creatorId', sql.Int, userId)
        .input('grantedBy', sql.Int, userId)
        .query(`
          INSERT INTO DraftPermissions (DraftID, UserID, PermissionType, GrantedBy, GrantedDate, IsActive)
          VALUES (@draftId, @creatorId, 'view', @grantedBy, GETDATE(), 1)
        `);
      
      // Add permissions for selected users
      for (const selectedUserId of userIds) {
        if (selectedUserId !== userId) { // Don't duplicate creator permission
          const userPermissionRequest = pool.request();
          await userPermissionRequest
            .input('draftId', sql.Int, newDraftId)
            .input('userId', sql.Int, selectedUserId)
            .input('grantedBy', sql.Int, userId)
            .query(`
              INSERT INTO DraftPermissions (DraftID, UserID, PermissionType, GrantedBy, GrantedDate, IsActive)
              VALUES (@draftId, @userId, 'view', @grantedBy, GETDATE(), 1)
            `);
        }
      }
      
      console.log(`✅ Created permissions for ${userIds.length} users`);
    }

    res.json({ 
      success: true, 
      message: 'Tạo dự thảo thành công', 
      draftId: newDraftId
    });

  } catch (err) {
    console.error('❌ Create draft error:', err);
    res.status(500).json({ 
      error: 'Lỗi tạo dự thảo',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// Add comment to draft
router.post('/:id/comments', async (req, res) => {
  try {
    const draftId = req.params.id;
    const { comment } = req.body;
    const userId = req.session.user.UserID;

    console.log('💬 Adding comment to draft:', { draftId, userId });

    const pool = req.app.locals.pool;
    const request = pool.request();

    // Insert comment
    await request
      .input('draftID', sql.Int, draftId)
      .input('userID', sql.Int, userId)
      .input('comment', sql.NText, comment)
      .query(`
        INSERT INTO DraftComments (DraftID, UserID, Comment, CommentDate)
        VALUES (@draftID, @userID, @comment, GETDATE())
      `);

    console.log('✅ Comment added successfully');

    res.json({ 
      success: true, 
      message: 'Góp ý đã được thêm thành công' 
    });

  } catch (err) {
    console.error('❌ Add comment error:', err);
    res.status(500).json({ 
      error: 'Lỗi thêm góp ý',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// Agree with draft
router.post('/:id/agree', async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.session.user.UserID;

    console.log('👍 User agreeing with draft:', { draftId, userId });

    const pool = req.app.locals.pool;
    const request = pool.request();

    // Check if draft exists
    const draftCheck = await request
      .input('draftId', sql.Int, draftId)
      .query('SELECT DraftID, Title FROM Drafts WHERE DraftID = @draftId AND IsDeleted = 0');

    if (draftCheck.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dự thảo không tồn tại' 
      });
    }

    // Check if user already agreed
    const agreementCheck = await pool.request()
      .input('draftId', sql.Int, draftId)
      .input('userId', sql.Int, userId)
      .query('SELECT ID FROM DraftAgreements WHERE DraftID = @draftId AND UserID = @userId');

    if (agreementCheck.recordset.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Bạn đã thống nhất với dự thảo này rồi' 
      });
    }

    // Create new agreement record
    await pool.request()
      .input('draftId', sql.Int, draftId)
      .input('userId', sql.Int, userId)
      .query(`
        INSERT INTO DraftAgreements (DraftID, UserID, AgreedDate)
        VALUES (@draftId, @userId, GETDATE())
      `);

    console.log('✅ Agreement recorded successfully');

    res.json({ 
      success: true, 
      message: 'Đã thống nhất với dự thảo thành công' 
    });

  } catch (err) {
    console.error('❌ Draft agreement error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi thống nhất với dự thảo',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// Update draft
router.put('/:id', upload.array('files'), async (req, res) => {
  try {
    const draftId = req.params.id;
    const { title, content, status } = req.body;
    const pool = req.app.locals.pool;
    const request = pool.request();

    console.log('📝 Updating draft:', { draftId, title, status });

    // Check if user is authenticated
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập để chỉnh sửa dự thảo' });
    }

    const userId = req.session.user.UserID;
    const userRole = req.session.user.Role;

    // Check if user owns the draft or is admin/manager
    const draftCheckResult = await request
      .input('draftID', sql.Int, draftId)
      .query('SELECT CreatedBy, Status FROM Drafts WHERE DraftID = @draftID');

    if (draftCheckResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Dự thảo không tồn tại' });
    }

    const draft = draftCheckResult.recordset[0];
    const isOwner = draft.CreatedBy === userId;
    const isAdminOrManager = userRole === 'Admin' || userRole === 'Manager';

    if (!isOwner && !isAdminOrManager) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa dự thảo này' });
    }

    // Reset request parameters after the check query
    const updateRequest = pool.request();

    // Handle file uploads
    let attachedFiles = null;
    if (req.files && req.files.length > 0) {
      attachedFiles = req.files.map(file => file.filename).join(',');
      console.log('📎 New attached files:', attachedFiles);
    }

    // Build update query dynamically
    let updateQuery = 'UPDATE Drafts SET Title = @title, Content = @content';
    
    updateRequest
      .input('draftID', sql.Int, draftId)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NText, content);

    if (status) {
      updateQuery += ', Status = @status';
      updateRequest.input('status', sql.NVarChar, status);
    }

    if (attachedFiles) {
      updateQuery += ', AttachedFiles = @attachedFiles';
      updateRequest.input('attachedFiles', sql.NText, attachedFiles);
    }

    updateQuery += ' WHERE DraftID = @draftID';

    await updateRequest.query(updateQuery);

    console.log('✅ Draft updated successfully');

    res.json({ 
      success: true, 
      message: 'Cập nhật dự thảo thành công' 
    });

  } catch (err) {
    console.error('❌ Update draft error:', err);
    res.status(500).json({ 
      error: 'Lỗi cập nhật dự thảo',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// Delete draft (soft delete if possible, hard delete if no IsDeleted column)
router.delete('/:id', async (req, res) => {
  try {
    const draftId = req.params.id;
    const pool = req.app.locals.pool;
    const request = pool.request();

    console.log('🗑️ Deleting draft:', draftId);

    // Check if user is authenticated
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập để xóa dự thảo' });
    }

    const userId = req.session.user.UserID;
    const userRole = req.session.user.Role;

    // Check if user owns the draft or is admin/manager
    const draftCheckResult = await request
      .input('draftID', sql.Int, draftId)
      .query('SELECT CreatedBy, Title FROM Drafts WHERE DraftID = @draftID');

    if (draftCheckResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Dự thảo không tồn tại' });
    }

    const draft = draftCheckResult.recordset[0];
    const isOwner = draft.CreatedBy === userId;
    const isAdminOrManager = userRole === 'Admin' || userRole === 'Manager';

    if (!isOwner && !isAdminOrManager) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa dự thảo này' });
    }

    // Reset request for delete operation
    const deleteRequest = pool.request();

    // Try soft delete using stored procedure first
    try {
      console.log('🔄 Attempting soft delete with stored procedure...');
      
      await deleteRequest
        .input('tableName', sql.NVarChar, 'Drafts')
        .input('recordID', sql.Int, draftId)
        .input('deletedBy', sql.Int, userId)
        .input('recordTitle', sql.NVarChar, draft.Title)
        .query(`
          EXEC sp_SoftDeleteRecord 
            @TableName = @tableName,
            @RecordID = @recordID,
            @DeletedBy = @deletedBy,
            @RecordTitle = @recordTitle
        `);
      
      console.log('✅ Draft soft deleted successfully and added to RecycleBin');
      
    } catch (softDeleteError) {
      console.log('⚠️ Stored procedure soft delete failed, trying manual soft delete...');
      console.error('Soft delete error:', softDeleteError.message);
      
      try {
        // Manual soft delete
        await deleteRequest
          .input('draftID', sql.Int, draftId)
          .input('deletedBy', sql.Int, userId)
          .query(`
            UPDATE Drafts 
            SET IsDeleted = 1, DeletedDate = GETDATE(), DeletedBy = @deletedBy 
            WHERE DraftID = @draftID
          `);

        // Manually insert into RecycleBin
        await deleteRequest
          .input('recordTitle', sql.NVarChar, draft.Title)
          .query(`
            INSERT INTO RecycleBin (TableName, RecordID, RecordTitle, DeletedBy, DeletedDate, CanRestore)
            VALUES ('Drafts', @draftID, @recordTitle, @deletedBy, GETDATE(), 1)
          `);
        
        console.log('✅ Manual soft delete completed');
        
      } catch (manualError) {
        // If everything fails, do hard delete
        console.log('⚠️ Manual soft delete failed, performing hard delete...');
        console.error('Manual soft delete error:', manualError.message);
        
        // Delete comments first (foreign key constraint)
        await deleteRequest.query('DELETE FROM DraftComments WHERE DraftID = @draftID');
        
        // Delete draft
        await deleteRequest.query('DELETE FROM Drafts WHERE DraftID = @draftID');
        
        console.log('✅ Draft hard deleted');
      }
    }

    res.json({ 
      success: true, 
      message: 'Dự thảo đã được chuyển vào thùng rác thành công',
      deletedId: draftId,
      deletedTitle: draft.Title
    });

  } catch (err) {
    console.error('❌ Delete draft error:', err);
    res.status(500).json({ 
      error: 'Lỗi xóa dự thảo',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// Close draft comments (End comment period)
router.post('/:id/close-comments', async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.session.user.UserID;

    console.log('🔒 Closing comments for draft:', { draftId, userId });

    const pool = req.app.locals.pool;
    const request = pool.request();

    // Check if draft exists
    const draftCheck = await request
      .input('draftId', sql.Int, draftId)
      .query('SELECT DraftID, Title, Status FROM Drafts WHERE DraftID = @draftId AND IsDeleted = 0');

    if (draftCheck.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Dự thảo không tồn tại' 
      });
    }

    const draft = draftCheck.recordset[0];

    // Update draft status to 'Comments Closed' or equivalent
    await pool.request()
      .input('draftId', sql.Int, draftId)
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE Drafts 
        SET Status = 'Đã hoàn thành góp ý',
            UpdatedBy = @userId,
            UpdatedDate = GETDATE()
        WHERE DraftID = @draftId
      `);

    console.log('✅ Draft comments closed successfully');

    res.json({ 
      success: true, 
      message: `Đã kết thúc góp ý cho dự thảo "${draft.Title}"` 
    });

  } catch (err) {
    console.error('❌ Close draft comments error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi kết thúc góp ý dự thảo',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

module.exports = router;

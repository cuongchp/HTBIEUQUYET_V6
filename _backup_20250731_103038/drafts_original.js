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

// Get all drafts - WITH STATUS FILTERING
router.get('/', async (req, res) => {
  try {
    console.log('📋 Getting drafts with filters...');
    
    const { status } = req.query;
    console.log('🔍 Filter status:', status);
    
    const pool = req.app.locals.pool;
    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const request = pool.request();

    // Build query based on status filter
    let whereClause = '';
    if (status === 'active') {
      // Active drafts: NULL, empty string, or 'Draft' status
      whereClause = "WHERE (d.Status IS NULL OR d.Status = '' OR d.Status = 'Draft')";
    } else if (status === 'closed') {
      // Closed drafts: only 'Comments Closed' status
      whereClause = "WHERE d.Status = 'Comments Closed'";
    }
    // If no status filter, return all drafts
    
    console.log('🔍 Using where clause:', whereClause);

    const query = `
      SELECT d.DraftID, d.Title, d.Content, d.CreatedDate, d.Status, 
             d.CommentPeriod, d.CreatedBy, d.ClosedBy, d.ClosedDate,
             u.FullName as CreatedByName,
             cb.FullName as ClosedByName,
             (SELECT COUNT(*) FROM DraftComments dc WHERE dc.DraftID = d.DraftID) as CommentCount
      FROM Drafts d
      INNER JOIN Users u ON d.CreatedBy = u.UserID
      LEFT JOIN Users cb ON d.ClosedBy = cb.UserID
      ${whereClause}
      ORDER BY d.CreatedDate DESC
    `;

    console.log('🔍 Executing query:', query);
    const result = await request.query(query);

    console.log(`✅ Found ${result.recordset.length} drafts for status: ${status || 'all'}`);
    
    // Debug: Log each draft's status
    result.recordset.forEach(draft => {
      console.log(`📄 Draft ${draft.DraftID}: "${draft.Title}" - Status: "${draft.Status}"`);
    });

    // Process each draft
    const drafts = result.recordset.map(draft => ({
      ...draft,
      // Format dates
      CreatedDate: draft.CreatedDate,
      // Add status display
      StatusDisplay: draft.Status === 'Draft' ? 'Dự thảo' : 
                     draft.Status === 'Review' ? 'Đang xem xét' : 
                     draft.Status === 'Approved' ? 'Đã duyệt' : 
                     draft.Status || 'Dự thảo'
    }));

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
    const { title, content, commentPeriod } = req.body;
    const pool = req.app.locals.pool;
    const request = pool.request();
    const userId = req.session.user.UserID;

    console.log('📝 Creating new draft:', { title, commentPeriod, userId });

    // Handle file uploads
    let attachedFiles = '';
    if (req.files && req.files.length > 0) {
      attachedFiles = req.files.map(file => file.filename).join(',');
      console.log('📎 Attached files:', attachedFiles);
    }

    // Insert draft
    const result = await request
      .input('title', sql.NVarChar, title)
      .input('content', sql.NText, content)
      .input('attachedFiles', sql.NText, attachedFiles)
      .input('createdBy', sql.Int, userId)
      .input('commentPeriod', sql.Int, commentPeriod || 7)
      .query(`
        INSERT INTO Drafts (Title, Content, AttachedFiles, CreatedBy, CommentPeriod, Status)
        OUTPUT INSERTED.DraftID
        VALUES (@title, @content, @attachedFiles, @createdBy, @commentPeriod, 'Draft')
      `);

    const newDraftId = result.recordset[0].DraftID;
    console.log('✅ Draft created with ID:', newDraftId);

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

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập để thực hiện chức năng này' });
  }
  next();
};

// Test session endpoint
router.get('/test-session', (req, res) => {
  res.json({
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    user: req.session?.user || null
  });
});

// Get comments for a draft
router.get('/:id/comments', async (req, res) => {
  try {
    const draftId = req.params.id;
    console.log('💬 Getting comments for draft:', draftId);

    const pool = req.app.locals.pool;
    const request = pool.request();

    // Get comments for this draft
    const commentResult = await request
      .input('draftID', sql.Int, draftId)
      .query(`
        SELECT 
          dc.CommentID,
          dc.Comment,
          dc.CommentDate,
          u.FullName as UserName
        FROM DraftComments dc
        INNER JOIN Users u ON dc.UserID = u.UserID
        WHERE dc.DraftID = @draftID
        ORDER BY dc.CommentDate DESC
      `);

    console.log('✅ Found comments:', commentResult.recordset.length);
    res.json(commentResult.recordset);

  } catch (error) {
    console.error('❌ Error getting comments:', error);
    res.status(500).json({ error: 'Lỗi khi tải góp ý' });
  }
});

// Add comment to draft
router.post('/:id/comments', requireAuth, async (req, res) => {
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

// Close draft comments (Kết thúc góp ý) - MOVED UP TO AVOID ROUTE CONFLICTS
router.post('/:id/close-comments', requireAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.session.user.UserID;

    console.log('🔒 Closing comments for draft:', { draftId, userId });

    const pool = req.app.locals.pool;
    const request = pool.request();

    // Update draft status to 'Comments Closed'
    await request
      .input('draftID', sql.Int, draftId)
      .input('closedBy', sql.Int, userId)
      .query(`
        UPDATE Drafts 
        SET Status = 'Comments Closed', 
            ClosedBy = @closedBy, 
            ClosedDate = GETDATE()
        WHERE DraftID = @draftID
      `);

    console.log('✅ Draft comments closed successfully');

    res.json({ 
      success: true, 
      message: 'Đã kết thúc góp ý cho dự thảo thành công. Dự thảo chuyển sang trạng thái "Đã hoàn thành góp ý".' 
    });

  } catch (error) {
    console.error('❌ Error closing draft comments:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi kết thúc góp ý dự thảo: ' + error.message 
    });
  }
});

// Approve draft (Thống nhất dự thảo)
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.session.user.UserID;

    console.log('✅ Approving draft:', { draftId, userId });

    const pool = req.app.locals.pool;
    const request = pool.request();

    // Update draft status to Approved
    await request
      .input('draftID', sql.Int, draftId)
      .input('approvedBy', sql.Int, userId)
      .query(`
        UPDATE Drafts 
        SET Status = 'Approved', 
            ApprovedBy = @approvedBy, 
            ApprovedDate = GETDATE()
        WHERE DraftID = @draftID
      `);

    console.log('✅ Draft approved successfully');

    res.json({ 
      success: true, 
      message: 'Dự thảo đã được thống nhất thành công' 
    });

  } catch (error) {
    console.error('❌ Error approving draft:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi thống nhất dự thảo' 
    });
  }
});

// Finalize draft (Hoàn thiện dự thảo) - DEPRECATED
router.post('/:id/finalize', requireAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.session.user.UserID;

    console.log('🏁 Finalizing draft:', { draftId, userId });

    const pool = req.app.locals.pool;
    const request = pool.request();

    // Update draft status to Finalized
    await request
      .input('draftID', sql.Int, draftId)
      .input('finalizedBy', sql.Int, userId)
      .query(`
        UPDATE Drafts 
        SET Status = 'Finalized', 
            FinalizedBy = @finalizedBy, 
            FinalizedDate = GETDATE()
        WHERE DraftID = @draftID
      `);

    console.log('✅ Draft finalized successfully');

    res.json({ 
      success: true, 
      message: 'Dự thảo đã được hoàn thiện thành công' 
    });

  } catch (error) {
    console.error('❌ Error finalizing draft:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi hoàn thiện dự thảo' 
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

    // Handle file uploads
    let attachedFiles = null;
    if (req.files && req.files.length > 0) {
      attachedFiles = req.files.map(file => file.filename).join(',');
      console.log('📎 New attached files:', attachedFiles);
    }

    // Build update query dynamically
    let updateQuery = 'UPDATE Drafts SET Title = @title, Content = @content';
    
    request
      .input('draftID', sql.Int, draftId)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NText, content);

    if (status) {
      updateQuery += ', Status = @status';
      request.input('status', sql.NVarChar, status);
    }

    if (attachedFiles) {
      updateQuery += ', AttachedFiles = @attachedFiles';
      request.input('attachedFiles', sql.NText, attachedFiles);
    }

    updateQuery += ' WHERE DraftID = @draftID';

    await request.query(updateQuery);

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

    // Try soft delete first, fall back to hard delete
    try {
      await request
        .input('draftID', sql.Int, draftId)
        .query('UPDATE Drafts SET IsDeleted = 1 WHERE DraftID = @draftID');
      
      console.log('✅ Draft soft deleted');
    } catch (softDeleteError) {
      // If IsDeleted column doesn't exist, do hard delete
      console.log('⚠️ Soft delete failed, trying hard delete...');
      
      // Delete comments first (foreign key constraint)
      await request.query('DELETE FROM DraftComments WHERE DraftID = @draftID');
      
      // Delete draft
      await request.query('DELETE FROM Drafts WHERE DraftID = @draftID');
      
      console.log('✅ Draft hard deleted');
    }

    res.json({ 
      success: true, 
      message: 'Xóa dự thảo thành công' 
    });

  } catch (err) {
    console.error('❌ Delete draft error:', err);
    res.status(500).json({ 
      error: 'Lỗi xóa dự thảo',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// Export Draft Summary
router.get('/:id/export', requireAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    console.log('📊 Exporting draft summary for ID:', draftId);

    const pool = req.app.locals.pool;
    const request = pool.request();

    // Get draft details with comments
    const draftResult = await request
      .input('draftID', sql.Int, draftId)
      .query(`
        SELECT d.DraftID, d.Title, d.Content, d.CreatedDate, d.Status,
               d.ClosedDate, d.CommentPeriod,
               u.FullName as CreatedByName,
               cb.FullName as ClosedByName
        FROM Drafts d
        INNER JOIN Users u ON d.CreatedBy = u.UserID
        LEFT JOIN Users cb ON d.ClosedBy = cb.UserID
        WHERE d.DraftID = @draftID
      `);

    if (draftResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dự thảo' });
    }

    const draft = draftResult.recordset[0];

    // Get comments
    const commentsResult = await request
      .input('draftID', sql.Int, draftId)
      .query(`
        SELECT dc.CommentText, dc.CreatedDate,
               u.FullName as CommentorName
        FROM DraftComments dc
        INNER JOIN Users u ON dc.UserID = u.UserID
        WHERE dc.DraftID = @draftID
        ORDER BY dc.CreatedDate ASC
      `);

    const comments = commentsResult.recordset;

    // Create simple text summary (in a real app, you'd generate PDF)
    const summary = `
===== BÁO CÁO TÓM TẮT DỰ THẢO TỜ TRÌNH =====

Tiêu đề: ${draft.Title}
Ngày tạo: ${new Date(draft.CreatedDate).toLocaleDateString('vi-VN')}
Người tạo: ${draft.CreatedByName}
Trạng thái: ${draft.Status === 'Comments Closed' ? 'Đã kết thúc góp ý' : 'Đang mở góp ý'}
${draft.ClosedDate ? `Ngày kết thúc: ${new Date(draft.ClosedDate).toLocaleDateString('vi-VN')}` : ''}
${draft.ClosedByName ? `Người kết thúc: ${draft.ClosedByName}` : ''}

===== NỘI DUNG DỰ THẢO =====
${draft.Content}

===== TỔNG HỢP GÓP Ý (${comments.length} góp ý) =====
${comments.length === 0 ? 'Chưa có góp ý nào.' : ''}
${comments.map((comment, index) => `
${index + 1}. Người góp ý: ${comment.CommentorName}
   Thời gian: ${new Date(comment.CreatedDate).toLocaleString('vi-VN')}
   Nội dung: ${comment.CommentText}
`).join('\n')}

===== KẾT THÚC BÁO CÁO =====
Tạo lúc: ${new Date().toLocaleString('vi-VN')}
    `;

    // Return as downloadable text file
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Du_thao_tom_tat_${draftId}_${Date.now()}.txt"`);
    res.send(summary);

  } catch (error) {
    console.error('❌ Error exporting draft summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi xuất báo cáo tóm tắt: ' + error.message 
    });
  }
});

module.exports = router;

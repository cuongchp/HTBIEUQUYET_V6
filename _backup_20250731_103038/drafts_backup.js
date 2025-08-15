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

// Get all drafts - FIXED VERSION
router.get('/', async (req, res) => {
  try {
    console.log('📋 Getting all drafts...');
    
    const pool = req.app.locals.pool;
    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const request = pool.request();

    // Safe query without IsDeleted dependency
    const result = await request.query(`
      SELECT d.DraftID, d.Title, d.Content, d.CreatedDate, d.Status, 
             d.CommentPeriod, d.CreatedBy,
             u.FullName as CreatedByName,
             (SELECT COUNT(*) FROM DraftComments dc WHERE dc.DraftID = d.DraftID) as CommentCount
      FROM Drafts d
      INNER JOIN Users u ON d.CreatedBy = u.UserID
      ORDER BY d.CreatedDate DESC
    `);

    console.log(`✅ Found ${result.recordset.length} drafts`);

    // Process each draft to add additional info
    const drafts = result.recordset.map(draft => ({
      ...draft,
      CreatedBy: draft.CreatedByName,
      // Format dates
      CreatedDate: draft.CreatedDate,
      // Add status display
      StatusDisplay: draft.Status === 'Draft' ? 'Dự thảo' : 
                     draft.Status === 'Review' ? 'Đang xem xét' : 
                     draft.Status === 'Approved' ? 'Đã duyệt' : draft.Status
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

// Get draft details with comments - FIXED VERSION
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

    // Get draft details - SAFE VERSION without IsDeleted dependency
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

    // Get comments - SAFE VERSION without IsDeleted dependency
    console.log('� Getting comments...');
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

    // Handle file uploads
    let attachedFiles = '';
    if (req.files && req.files.length > 0) {
      attachedFiles = req.files.map(file => file.filename).join(',');
    }

    // Insert draft
    const result = await request
      .input('title', sql.NVarChar, title)
      .input('content', sql.NText, content)
      .input('attachedFiles', sql.NText, attachedFiles)
      .input('createdBy', sql.Int, userId)
      .input('commentPeriod', sql.Int, commentPeriod || 7)
      .query(`
        INSERT INTO Drafts (Title, Content, AttachedFiles, CreatedBy, CommentPeriod)
        OUTPUT INSERTED.DraftID
        VALUES (@title, @content, @attachedFiles, @createdBy, @commentPeriod)
      `);

    res.json({ 
      success: true, 
      message: 'Tạo dự thảo thành công', 
      draftId: result.recordset[0].DraftID 
    });

  } catch (err) {
    console.error('Create draft error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add comment to draft
router.post('/:id/comment', async (req, res) => {
  try {
    const draftId = req.params.id;
    const { comment } = req.body;
    const userId = req.session.user.UserID;
    const pool = req.app.locals.pool;
    const request = pool.request();

    // Check if draft exists and is still open for comments
    const draftCheck = await request
      .input('draftID', sql.Int, draftId)
      .query(`
        SELECT Status, CreatedDate, CommentPeriod
        FROM Drafts 
        WHERE DraftID = @draftID
      `);

    if (draftCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Dự thảo không tồn tại' });
    }

    const draft = draftCheck.recordset[0];
    const createdDate = new Date(draft.CreatedDate);
    const commentDeadline = new Date(createdDate.getTime() + (draft.CommentPeriod * 24 * 60 * 60 * 1000));

    if (new Date() > commentDeadline && draft.Status === 'Draft') {
      return res.status(400).json({ error: 'Thời gian góp ý đã hết' });
    }

    // Insert comment
    await request
      .input('userID', sql.Int, userId)
      .input('comment', sql.NText, comment)
      .query(`
        INSERT INTO DraftComments (DraftID, UserID, Comment)
        VALUES (@draftID, @userID, @comment)
      `);

    res.json({ success: true, message: 'Góp ý thành công' });

  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Approve draft (Secretary only)
router.post('/:id/approve', async (req, res) => {
  try {
    const draftId = req.params.id;
    const pool = req.app.locals.pool;
    const request = pool.request();

    // Update draft status
    await request
      .input('draftID', sql.Int, draftId)
      .query(`
        UPDATE Drafts 
        SET Status = 'Approved' 
        WHERE DraftID = @draftID
      `);

    res.json({ success: true, message: 'Thống nhất dự thảo thành công' });

  } catch (err) {
    console.error('Approve draft error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Finalize draft (close comment period)
router.post('/:id/finalize', async (req, res) => {
  try {
    const draftId = req.params.id;
    const pool = req.app.locals.pool;
    const request = pool.request();

    // Update draft status
    await request
      .input('draftID', sql.Int, draftId)
      .query(`
        UPDATE Drafts 
        SET Status = 'Finalized' 
        WHERE DraftID = @draftID
      `);

    res.json({ success: true, message: 'Hoàn thiện dự thảo thành công' });

  } catch (err) {
    console.error('Finalize draft error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update draft
router.put('/:id', upload.array('attachedFiles'), async (req, res) => {
  try {
    console.log('PUT /api/drafts/:id called with ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const pool = req.app.locals.pool;
    const request = pool.request();
    const draftId = req.params.id;
    const { title, content, commentPeriod } = req.body;

    // Validate input
    if (!title || !content) {
      return res.status(400).json({ error: 'Tiêu đề và nội dung là bắt buộc' });
    }

    // Update draft in database
    request.input('draftId', sql.Int, draftId);
    request.input('title', sql.NVarChar, title);
    request.input('content', sql.NText, content);
    request.input('commentPeriod', sql.Int, commentPeriod || 7);

    const updateResult = await request.query(`
      UPDATE Drafts 
      SET Title = @title, 
          Content = @content, 
          CommentPeriod = @commentPeriod,
          ModifiedDate = GETDATE()
      WHERE DraftID = @draftId
    `);
    
    console.log('Update result:', updateResult.rowsAffected);

    // Handle file uploads if any
    let attachedFiles = [];
    if (req.files && req.files.length > 0) {
      // Delete old files first
      await request.query(`DELETE FROM DraftFiles WHERE DraftID = @draftId`);

      // Add new files
      for (const file of req.files) {
        const fileRequest = pool.request();
        fileRequest.input('draftId', sql.Int, draftId);
        fileRequest.input('fileName', sql.NVarChar, file.originalname);
        fileRequest.input('filePath', sql.NVarChar, file.path);
        fileRequest.input('fileSize', sql.BigInt, file.size);

        await fileRequest.query(`
          INSERT INTO DraftFiles (DraftID, FileName, FilePath, FileSize, UploadDate)
          VALUES (@draftId, @fileName, @filePath, @fileSize, GETDATE())
        `);

        attachedFiles.push({
          name: file.originalname,
          size: file.size
        });
      }
    }

    res.json({ 
      success: true, 
      message: 'Cập nhật dự thảo thành công',
      attachedFiles 
    });

  } catch (err) {
    console.error('Update draft error:', err);
    res.status(500).json({ error: 'Lỗi cập nhật dự thảo' });
  }
});

// Delete draft (debug version)
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== DELETE DRAFT DEBUG ===');
    console.log('Session user:', req.session.user);
    console.log('Draft ID:', req.params.id);
    console.log('Pool available:', !!req.app.locals.pool);

    const pool = req.app.locals.pool;
    if (!pool) {
      console.log('❌ No database pool available');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const request = pool.request();
    const draftId = req.params.id;
    
    console.log('🔄 Starting delete process for draft ID:', draftId);

    request.input('draftId', sql.Int, draftId);

    // Check if draft exists
    console.log('🔍 Checking if draft exists...');
    const checkResult = await request.query(`
      SELECT DraftID, Title FROM Drafts WHERE DraftID = @draftId
    `);

    if (checkResult.recordset.length === 0) {
      console.log('❌ Draft not found:', draftId);
      return res.status(404).json({ error: 'Không tìm thấy dự thảo' });
    }

    const draft = checkResult.recordset[0];
    console.log('✅ Found draft:', draft.Title);

    // Delete related comments first (to avoid foreign key constraint)
    console.log('🔄 Deleting related comments...');
    const deleteCommentsResult = await request.query(`
      DELETE FROM DraftComments WHERE DraftID = @draftId
    `);
    console.log('✅ Deleted comments:', deleteCommentsResult.rowsAffected[0]);

    // Delete the draft
    console.log('🔄 Deleting draft...');
    const deleteDraftResult = await request.query(`
      DELETE FROM Drafts WHERE DraftID = @draftId
    `);
    console.log('✅ Delete result:', deleteDraftResult.rowsAffected[0]);

    if (deleteDraftResult.rowsAffected[0] === 0) {
      console.log('❌ No draft was deleted');
      return res.status(404).json({ error: 'Không thể xóa dự thảo' });
    }

    console.log('🎉 Draft deleted successfully');
    res.json({ 
      success: true, 
      message: 'Dự thảo đã được xóa thành công',
      deletedId: draftId,
      deletedTitle: draft.Title
    });

  } catch (err) {
    console.error('❌ Delete draft error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      number: err.number,
      state: err.state,
      procedure: err.procedure,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Lỗi xóa dự thảo', 
      details: err.message,
      code: err.code
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const sql = require('mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for vote files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/votes';
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

// Get all open votes for user
router.get('/', async (req, res) => {
  try {
    console.log('🔄 API /api/votes được gọi');
    
    if (!req.session || !req.session.user) {
      console.log('❌ Không có session user');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const pool = req.app.locals.pool;
    if (!pool) {
      console.log('❌ Không có database pool');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const request = pool.request();
    const userId = req.session.user.UserID;
    const userRole = req.session.user.Role;
    const statusFilter = req.query.status; // Get status from query parameter

    console.log('👤 User:', { userId, userRole, statusFilter });

    let query = `
      SELECT v.VoteID, v.VoteNumber, v.Title, v.Content, v.CreatedDate, 
             v.StartDate, v.EndDate, v.AutoClose,
             u.FullName as CreatedBy, v.Status,
             CASE WHEN vr.ResultID IS NOT NULL THEN 1 ELSE 0 END as HasVoted,
             CASE 
               WHEN v.EndDate IS NULL THEN NULL
               WHEN v.EndDate <= GETDATE() THEN 0
               ELSE DATEDIFF(minute, GETDATE(), v.EndDate)
             END as MinutesRemaining,
             CASE 
               WHEN v.StartDate > GETDATE() THEN 'Not Started'
               WHEN v.EndDate <= GETDATE() THEN 'Expired'
               ELSE 'Active'
             END as TimeStatus
      FROM Votes v
      INNER JOIN Users u ON v.CreatedBy = u.UserID
      LEFT JOIN VoteResults vr ON v.VoteID = vr.VoteID AND vr.UserID = @userID
      WHERE v.IsDeleted = 0
    `;

    // Add status filter based on query parameter
    if (statusFilter === 'closed') {
      query += ` AND v.Status = 'Closed'`;
    } else {
      query += ` AND v.Status = 'Open'`;
    }

    if (userRole !== 'Admin') {
      query += `
        AND (v.AssigneeType = 'All' OR EXISTS (
          SELECT 1 FROM VoteAssignees va WHERE va.VoteID = v.VoteID AND va.UserID = @userID
        ))
      `;
    }

    query += ' ORDER BY v.CreatedDate DESC';

    console.log('📝 SQL Query:', query);
    console.log('🔢 UserID parameter:', userId);

    const result = await request
      .input('userID', sql.Int, userId)
      .query(query);

    console.log('✅ Query thành công, số records:', result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Lỗi API /api/votes:', err.message);
    console.error('📋 Error details:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get vote details
router.get('/:id', async (req, res) => {
  try {
    const voteId = req.params.id;
    console.log('🔄 Getting vote details for ID:', voteId);
    
    const pool = req.app.locals.pool;
    const request = pool.request();

    // Get vote details
    const voteResult = await request
      .input('voteID', sql.Int, voteId)
      .query(`
        SELECT v.VoteID, v.VoteNumber, v.Title, v.Content, v.AttachedFiles,
               v.CreatedDate, v.Status, v.AssigneeType, u.FullName as CreatedBy
        FROM Votes v
        INNER JOIN Users u ON v.CreatedBy = u.UserID
        WHERE v.VoteID = @voteID AND v.IsDeleted = 0
      `);

    if (voteResult.recordset.length === 0) {
      console.log('❌ Vote not found for ID:', voteId);
      return res.status(404).json({ error: 'Phiếu biểu quyết không tồn tại' });
    }

    const vote = voteResult.recordset[0];
    console.log('✅ Vote found:', vote.Title);

    // Get vote results
    const resultsQuery = await request.query(`
      SELECT vr.*, u.FullName as VoterName
      FROM VoteResults vr
      INNER JOIN Users u ON vr.UserID = u.UserID
      WHERE vr.VoteID = @voteID AND vr.IsDeleted = 0
      ORDER BY vr.VotedDate DESC
    `);

    // Get assignees
    const assigneesQuery = await request.query(`
      SELECT u.UserID, u.FullName, 
             CASE WHEN vr.ResultID IS NOT NULL THEN 1 ELSE 0 END as HasVoted
      FROM Users u
      LEFT JOIN VoteResults vr ON u.UserID = vr.UserID AND vr.VoteID = @voteID AND vr.IsDeleted = 0
      WHERE u.IsActive = 1 AND u.IsDeleted = 0 AND (
        '${vote.AssigneeType}' = 'All' OR 
        EXISTS (SELECT 1 FROM VoteAssignees va WHERE va.VoteID = @voteID AND va.UserID = u.UserID)
      )
      ORDER BY u.FullName
    `);

    console.log('📊 Results:', resultsQuery.recordset.length);
    console.log('👥 Assignees:', assigneesQuery.recordset.length);

    res.json({
      vote: vote,
      results: resultsQuery.recordset,
      assignees: assigneesQuery.recordset
    });

  } catch (err) {
    console.error('❌ Get vote details error:', err.message);
    console.error('📋 Full error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Create new vote
router.post('/', upload.array('files'), async (req, res) => {
  try {
    const { voteNumber, title, content, assigneeType, assignees, startDate, endDate, autoClose } = req.body;
    const pool = req.app.locals.pool;
    const userId = req.session.user.UserID;

    console.log('🗳️ Creating vote with timing:', { voteNumber, startDate, endDate, autoClose, assigneeType });

    // Chuẩn hóa assigneeType
    const normalizedAssigneeType = assigneeType === 'all' ? 'All' : 'Specific';

    // Generate full vote number
    const currentYear = new Date().getFullYear();
    const fullVoteNumber = `${voteNumber}/${currentYear}/CHP-HĐQT`;

    // Check if vote number exists
    const checkRequest = pool.request();
    const existingVote = await checkRequest
      .input('voteNumber', sql.NVarChar, fullVoteNumber)
      .query('SELECT COUNT(*) as count FROM Votes WHERE VoteNumber = @voteNumber');

    if (existingVote.recordset[0].count > 0) {
      return res.status(400).json({ error: 'Số phiếu đã tồn tại' });
    }

    // Validate thời gian
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Thiếu thông tin thời gian biểu quyết' });
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set về đầu ngày để so sánh

    // Validation: Ngày bắt đầu phải từ hôm nay trở đi
    if (startDateTime < today) {
      return res.status(400).json({ error: 'Ngày bắt đầu phải từ hôm nay trở đi' });
    }

    // Validation: Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày
    if (endDateTime <= startDateTime) {
      return res.status(400).json({ error: 'Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày' });
    }

    // Kiểm tra khoảng cách tối thiểu (ít nhất 1 ngày)
    const timeDiff = endDateTime - startDateTime;
    const minTime = 24 * 60 * 60 * 1000; // 1 ngày
    
    if (timeDiff < minTime) {
      return res.status(400).json({ error: 'Thời gian biểu quyết phải ít nhất 1 ngày' });
    }

    // Handle file uploads
    let attachedFiles = '';
    if (req.files && req.files.length > 0) {
      attachedFiles = req.files.map(file => file.filename).join(',');
    }

    // Insert vote với thời gian
    const insertRequest = pool.request();
    const insertResult = await insertRequest
      .input('voteNumber', sql.NVarChar, fullVoteNumber)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NText, content)
      .input('attachedFiles', sql.NText, attachedFiles)
      .input('createdBy', sql.Int, userId)
      .input('assigneeType', sql.NVarChar, normalizedAssigneeType)
      .input('startDate', sql.DateTime, startDateTime)
      .input('endDate', sql.DateTime, endDateTime)
      .input('autoClose', sql.Bit, autoClose === 'true' || autoClose === true)
      .query(`
        INSERT INTO Votes (VoteNumber, Title, Content, AttachedFiles, CreatedBy, AssigneeType, StartDate, EndDate, AutoClose)
        OUTPUT INSERTED.VoteID
        VALUES (@voteNumber, @title, @content, @attachedFiles, @createdBy, @assigneeType, @startDate, @endDate, @autoClose)
      `);

    const newVoteId = insertResult.recordset[0].VoteID;
    console.log('✅ Vote created successfully with ID:', newVoteId);

    // Insert assignees if specific
    if (normalizedAssigneeType === 'Specific' && assignees) {
      console.log('📋 Inserting assignees:', assignees);
      const assigneeList = Array.isArray(assignees) ? assignees : [assignees];
      for (const assigneeId of assigneeList) {
        // Create new request for each assignee to avoid parameter conflicts
        const assigneeRequest = pool.request();
        await assigneeRequest
          .input('voteID', sql.Int, newVoteId)
          .input('assigneeID', sql.Int, assigneeId)
          .query('INSERT INTO VoteAssignees (VoteID, UserID) VALUES (@voteID, @assigneeID)');
      }
      console.log('✅ Assignees inserted successfully');
    }

    console.log('🎉 Vote creation completed successfully');
    res.json({ success: true, message: 'Tạo phiếu biểu quyết thành công', voteId: newVoteId });

  } catch (err) {
    console.error('❌ Create vote error:', err.message);
    console.error('📋 Full create vote error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Function to check if all users have completed voting and auto-close if needed
async function checkAndAutoCloseVote(pool, voteId) {
  try {
    console.log('🔍 Checking if vote should auto-close:', voteId);
    
    const request = pool.request();
    
    // Get vote details
    const voteResult = await request
      .input('voteID', sql.Int, voteId)
      .query(`
        SELECT VoteID, Status, AssigneeType, Title
        FROM Votes 
        WHERE VoteID = @voteID AND Status = 'Open' AND IsDeleted = 0
      `);
    
    if (voteResult.recordset.length === 0) {
      console.log('⚠️ Vote not found or already closed:', voteId);
      return false;
    }
    
    const vote = voteResult.recordset[0];
    console.log('📊 Vote details:', { id: vote.VoteID, type: vote.AssigneeType, title: vote.Title });
    
    // Get list of users who should vote
    let expectedVotersQuery;
    if (vote.AssigneeType === 'All') {
      expectedVotersQuery = `
        SELECT u.UserID, u.FullName
        FROM Users u
        WHERE u.IsActive = 1 AND u.IsDeleted = 0 AND u.Role != 'Admin'
      `;
    } else {
      expectedVotersQuery = `
        SELECT u.UserID, u.FullName
        FROM Users u
        INNER JOIN VoteAssignees va ON u.UserID = va.UserID
        WHERE va.VoteID = @voteID AND u.IsActive = 1 AND u.IsDeleted = 0
      `;
    }
    
    const expectedVotersRequest = pool.request();
    if (vote.AssigneeType !== 'All') {
      expectedVotersRequest.input('voteID', sql.Int, voteId);
    }
    const expectedVotersResult = await expectedVotersRequest.query(expectedVotersQuery);
    
    // Get list of users who have already voted
    const actualVotersRequest = pool.request();
    const actualVotersResult = await actualVotersRequest
      .input('voteID', sql.Int, voteId)
      .query(`
        SELECT DISTINCT vr.UserID, u.FullName
        FROM VoteResults vr
        INNER JOIN Users u ON vr.UserID = u.UserID
        WHERE vr.VoteID = @voteID AND vr.IsDeleted = 0
      `);
    
    const expectedCount = expectedVotersResult.recordset.length;
    const actualCount = actualVotersResult.recordset.length;
    
    console.log(`📈 Voting progress: ${actualCount}/${expectedCount} users have voted`);
    
    // Check if all expected users have voted
    if (actualCount >= expectedCount && expectedCount > 0) {
      console.log('🎉 All users have completed voting! Auto-closing vote...');
      
      // Close the vote
      const closeRequest = pool.request();
      await closeRequest
        .input('voteID', sql.Int, voteId)
        .query(`
          UPDATE Votes 
          SET Status = 'Closed' 
          WHERE VoteID = @voteID AND Status = 'Open'
        `);
      
      console.log('✅ Vote automatically closed:', voteId);
      return true; // Vote was auto-closed
    } else {
      console.log(`⏳ Waiting for more votes: ${expectedCount - actualCount} users remaining`);
      return false; // Vote remains open
    }
    
  } catch (error) {
    console.error('❌ Error in auto-close check:', error.message);
    return false;
  }
}

// Submit vote
router.post('/:id/vote', async (req, res) => {
  try {
    const voteId = req.params.id;
    const { choice, reason } = req.body;
    const userId = req.session.user.UserID;
    const pool = req.app.locals.pool;
    const request = pool.request();

    // Check if user already voted
    const existingVote = await request
      .input('voteID', sql.Int, voteId)
      .input('userID', sql.Int, userId)
      .query('SELECT COUNT(*) as count FROM VoteResults WHERE VoteID = @voteID AND UserID = @userID');

    if (existingVote.recordset[0].count > 0) {
      return res.status(400).json({ error: 'Bạn đã biểu quyết cho phiếu này' });
    }

    // Insert vote result
    await request
      .input('choice', sql.NVarChar, choice)
      .input('reason', sql.NText, reason || '')
      .query(`
        INSERT INTO VoteResults (VoteID, UserID, Choice, Reason)
        VALUES (@voteID, @userID, @choice, @reason)
      `);

    console.log('✅ Vote submitted successfully by user:', userId);

    // Check if all users have voted and auto-close if needed
    const wasAutoClosed = await checkAndAutoCloseVote(pool, voteId);
    
    // Return response with auto-close information
    const response = {
      success: true,
      message: 'Biểu quyết thành công',
      autoClosed: wasAutoClosed
    };
    
    if (wasAutoClosed) {
      response.message = 'Biểu quyết thành công! Phiếu đã được tự động đóng vì tất cả người dùng đã hoàn thành biểu quyết.';
      response.redirectTo = 'dashboard'; // Redirect to dashboard instead
    }

    res.json(response);

  } catch (err) {
    console.error('Submit vote error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get vote results
router.get('/:id/results', async (req, res) => {
  try {
    const voteId = req.params.id;
    console.log('🔄 Getting vote results for ID:', voteId);
    
    const pool = req.app.locals.pool;
    const request = pool.request();

    // Get vote results summary
    const resultsQuery = `
      SELECT 
        v.VoteID,
        v.Title,
        v.VoteNumber,
        COUNT(vr.ResultID) as TotalVotes,
        SUM(CASE WHEN vr.Choice = 'Agree' THEN 1 ELSE 0 END) as AgreeCount,
        SUM(CASE WHEN vr.Choice = 'Disagree' THEN 1 ELSE 0 END) as DisagreeCount,
        SUM(CASE WHEN vr.Choice = 'Abstain' THEN 1 ELSE 0 END) as AbstainCount
      FROM Votes v
      LEFT JOIN VoteResults vr ON v.VoteID = vr.VoteID AND (vr.IsDeleted IS NULL OR vr.IsDeleted = 0)
      WHERE v.VoteID = @voteID AND v.IsDeleted = 0
      GROUP BY v.VoteID, v.Title, v.VoteNumber
    `;

    const result = await request
      .input('voteID', sql.Int, voteId)
      .query(resultsQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Phiếu biểu quyết không tồn tại' });
    }

    const voteData = result.recordset[0];
    
    // Get detailed results with user names (if admin)
    let detailedResults = [];
    if (req.session.user.Role === 'Admin') {
      const detailQuery = `
        SELECT 
          u.FullName,
          u.Username,
          vr.Choice,
          vr.Reason,
          vr.VotedDate as SubmittedDate
        FROM VoteResults vr
        INNER JOIN Users u ON vr.UserID = u.UserID
        WHERE vr.VoteID = @voteID AND (vr.IsDeleted IS NULL OR vr.IsDeleted = 0)
        ORDER BY vr.VotedDate DESC
      `;

      const detailRequest = pool.request();
      const detailResult = await detailRequest
        .input('voteID', sql.Int, voteId)
        .query(detailQuery);

      detailedResults = detailResult.recordset;
    }

    const response = {
      voteId: voteData.VoteID,
      title: voteData.Title,
      voteNumber: voteData.VoteNumber,
      totalVotes: voteData.TotalVotes || 0,
      agreeCount: voteData.AgreeCount || 0,
      disagreeCount: voteData.DisagreeCount || 0,
      abstainCount: voteData.AbstainCount || 0,
      detailedResults: detailedResults
    };

    console.log('✅ Vote results loaded successfully');
    res.json(response);
    
  } catch (err) {
    console.error('Get vote results error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Close vote (Admin only) - for testing purposes
router.post('/:id/close', async (req, res) => {
  try {
    if (!req.session.user || req.session.user.Role !== 'Admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có thể đóng phiếu biểu quyết' });
    }

    const voteId = req.params.id;
    const pool = req.app.locals.pool;
    const request = pool.request();

    await request
      .input('voteID', sql.Int, voteId)
      .query(`
        UPDATE Votes 
        SET Status = 'Closed' 
        WHERE VoteID = @voteID AND IsDeleted = 0
      `);

    console.log(`✅ Vote ${voteId} has been closed`);
    res.json({ success: true, message: 'Phiếu biểu quyết đã được đóng' });
    
  } catch (err) {
    console.error('Close vote error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;

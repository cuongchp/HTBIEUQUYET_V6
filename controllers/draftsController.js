// Drafts controller
const sql = require('mssql');
const db = require('../config/database');

// Get all drafts
exports.getAllDrafts = async (req, res) => {
  try {
    const pool = await db.connect();
    const result = await pool.request()
      .query('SELECT * FROM Drafts WHERE IsDeleted = 0 ORDER BY CreatedDate DESC');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting drafts:', error);
    res.status(500).json({ error: 'An error occurred while fetching drafts' });
  }
};

// Get draft by ID
exports.getDraftById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await db.connect();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Drafts WHERE DraftID = @id AND IsDeleted = 0');
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error getting draft:', error);
    res.status(500).json({ error: 'An error occurred while fetching draft' });
  }
};

// Create new draft
exports.createDraft = async (req, res) => {
  try {
    const { title, content, draftType } = req.body;
    const userId = req.user.UserID;
    const pool = await db.connect();
    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('content', sql.NText, content)
      .input('draftType', sql.NVarChar, draftType)
      .input('createdBy', sql.Int, userId)
      .query(`INSERT INTO Drafts (Title, Content, DraftType, CreatedBy, CreatedDate, Status)
              VALUES (@title, @content, @draftType, @createdBy, GETDATE(), 'Draft')
              SELECT SCOPE_IDENTITY() as DraftID`);
    res.json({ success: true, draftId: result.recordset[0].DraftID });
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ error: 'An error occurred while creating draft' });
  }
};

// Update draft
exports.updateDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;
    const pool = await db.connect();
    await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NText, content)
      .input('status', sql.NVarChar, status)
      .query(`UPDATE Drafts SET Title = @title, Content = @content, Status = @status, 
              ModifiedDate = GETDATE() WHERE DraftID = @id AND IsDeleted = 0`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ error: 'An error occurred while updating draft' });
  }
};

// Delete draft (soft delete)
exports.deleteDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await db.connect();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Drafts SET IsDeleted = 1, DeletedDate = GETDATE() WHERE DraftID = @id');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ error: 'An error occurred while deleting draft' });
  }
};

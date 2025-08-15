const sql = require('mssql');
require('dotenv').config();

class DatabaseService {
  constructor() {
    this.pool = null;
    this.config = {
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT) || 1433,
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
        enableArithAbort: true
      }
    };
  }

  async connect() {
    try {
      if (!this.pool) {
        this.pool = await sql.connect(this.config);
        console.log('✅ Database connected successfully');
      }
      return this.pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
        console.log('✅ Database disconnected');
      }
    } catch (error) {
      console.error('❌ Database disconnect error:', error);
    }
  }

  getPool() {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  // User Management with parameterized queries
  async createUser(userData) {
    try {
      const request = this.pool.request();
      const result = await request
        .input('username', sql.NVarChar(50), userData.username)
        .input('password', sql.NVarChar(255), userData.password)
        .input('fullName', sql.NVarChar(100), userData.fullName)
        .input('role', sql.NVarChar(20), userData.role || 'User')
        .query(`
          INSERT INTO Users (Username, Password, FullName, Role, IsActive, IsDeleted)
          OUTPUT INSERTED.UserID
          VALUES (@username, @password, @fullName, @role, 1, 0)
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('❌ Create user error:', error);
      throw error;
    }
  }

  async getUserByUsername(username) {
    try {
      const request = this.pool.request();
      const result = await request
        .input('username', sql.NVarChar(50), username)
        .query(`
          SELECT UserID, Username, Password, FullName, Role, IsActive
          FROM Users 
          WHERE Username = @username AND IsDeleted = 0
        `);
      
      return result.recordset[0] || null;
    } catch (error) {
      console.error('❌ Get user by username error:', error);
      throw error;
    }
  }

  async getUserPermissions(userId) {
    try {
      const request = this.pool.request();
      const result = await request
        .input('userId', sql.Int, userId)
        .query(`
          SELECT ModuleName, CanAccess 
          FROM Permissions 
          WHERE UserID = @userId AND CanAccess = 1
        `);
      
      return result.recordset.map(p => p.ModuleName);
    } catch (error) {
      console.error('❌ Get user permissions error:', error);
      throw error;
    }
  }

  async getAllUsers(filters = {}) {
    try {
      const request = this.pool.request();
      let query = `
        SELECT UserID, Username, FullName, Role, CreatedDate, IsActive
        FROM Users 
        WHERE IsDeleted = 0
      `;
      
      if (filters.role) {
        query += ' AND Role = @role';
        request.input('role', sql.NVarChar(20), filters.role);
      }
      
      if (filters.isActive !== undefined) {
        query += ' AND IsActive = @isActive';
        request.input('isActive', sql.Bit, filters.isActive);
      }
      
      query += ' ORDER BY CreatedDate DESC';
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('❌ Get all users error:', error);
      throw error;
    }
  }

  // Vote Management
  async createVote(voteData) {
    try {
      const request = this.pool.request();
      const result = await request
        .input('voteNumber', sql.NVarChar(50), voteData.voteNumber)
        .input('title', sql.NVarChar(255), voteData.title)
        .input('content', sql.NText, voteData.content)
        .input('attachedFiles', sql.NText, voteData.attachedFiles || '')
        .input('createdBy', sql.Int, voteData.createdBy)
        .input('assigneeType', sql.NVarChar(20), voteData.assigneeType || 'All')
        .query(`
          INSERT INTO Votes (VoteNumber, Title, Content, AttachedFiles, CreatedBy, AssigneeType, Status, IsDeleted)
          OUTPUT INSERTED.VoteID
          VALUES (@voteNumber, @title, @content, @attachedFiles, @createdBy, @assigneeType, 'Open', 0)
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('❌ Create vote error:', error);
      throw error;
    }
  }

  async getOpenVotes(userId, userRole) {
    try {
      const request = this.pool.request();
      let query = `
        SELECT v.VoteID, v.VoteNumber, v.Title, v.Content, v.CreatedDate, 
               u.FullName as CreatedBy, v.Status,
               CASE WHEN vr.ResultID IS NOT NULL THEN 1 ELSE 0 END as HasVoted
        FROM Votes v
        INNER JOIN Users u ON v.CreatedBy = u.UserID AND u.IsDeleted = 0
        LEFT JOIN VoteResults vr ON v.VoteID = vr.VoteID AND vr.UserID = @userId AND vr.IsDeleted = 0
        WHERE v.Status = 'Open' AND v.IsDeleted = 0
      `;

      if (userRole !== 'Admin') {
        query += `
          AND (v.AssigneeType = 'All' OR EXISTS (
            SELECT 1 FROM VoteAssignees va WHERE va.VoteID = v.VoteID AND va.UserID = @userId
          ))
        `;
      }

      query += ' ORDER BY v.CreatedDate DESC';

      const result = await request
        .input('userId', sql.Int, userId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('❌ Get open votes error:', error);
      throw error;
    }
  }

  // Check if entity exists
  async checkVoteNumberExists(voteNumber) {
    try {
      const request = this.pool.request();
      const result = await request
        .input('voteNumber', sql.NVarChar(50), voteNumber)
        .query('SELECT COUNT(*) as count FROM Votes WHERE VoteNumber = @voteNumber AND IsDeleted = 0');
      
      return result.recordset[0].count > 0;
    } catch (error) {
      console.error('❌ Check vote number exists error:', error);
      throw error;
    }
  }

  async checkUsernameExists(username, excludeUserId = null) {
    try {
      const request = this.pool.request();
      let query = 'SELECT COUNT(*) as count FROM Users WHERE Username = @username AND IsDeleted = 0';
      
      request.input('username', sql.NVarChar(50), username);
      
      if (excludeUserId) {
        query += ' AND UserID != @excludeUserId';
        request.input('excludeUserId', sql.Int, excludeUserId);
      }
      
      const result = await request.query(query);
      return result.recordset[0].count > 0;
    } catch (error) {
      console.error('❌ Check username exists error:', error);
      throw error;
    }
  }

  // Soft delete functions
  async softDeleteUser(userId) {
    try {
      const request = this.pool.request();
      await request
        .input('userId', sql.Int, userId)
        .query('UPDATE Users SET IsDeleted = 1, IsActive = 0 WHERE UserID = @userId');
      
      return true;
    } catch (error) {
      console.error('❌ Soft delete user error:', error);
      throw error;
    }
  }

  // Transaction support
  async executeTransaction(operations) {
    const transaction = new sql.Transaction(this.pool);
    
    try {
      await transaction.begin();
      
      const results = [];
      for (const operation of operations) {
        const request = new sql.Request(transaction);
        const result = await operation(request);
        results.push(result);
      }
      
      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();

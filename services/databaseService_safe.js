const sql = require('mssql');

class DatabaseService {
  constructor(pool) {
    this.pool = pool;
  }

  // Safe query helper - checks if column exists before using it
  async safeQuery(query, params = {}) {
    try {
      const request = this.pool.request();
      
      // Add parameters if provided
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'string') {
          request.input(key, sql.NVarChar, value);
        } else if (typeof value === 'number') {
          request.input(key, sql.Int, value);
        } else if (typeof value === 'boolean') {
          request.input(key, sql.Bit, value);
        } else {
          request.input(key, value);
        }
      }
      
      return await request.query(query);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Check if a column exists in a table
  async columnExists(tableName, columnName) {
    try {
      const result = await this.safeQuery(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = @tableName AND COLUMN_NAME = @columnName
      `, { tableName, columnName });
      
      return result.recordset[0].count > 0;
    } catch (error) {
      console.error(`Error checking column ${columnName} in ${tableName}:`, error);
      return false;
    }
  }

  // Get user by username - SAFE VERSION
  async getUserByUsername(username) {
    try {
      console.log('🔍 Getting user by username:', username);
      
      // Check if IsDeleted column exists
      const hasIsDeleted = await this.columnExists('Users', 'IsDeleted');
      
      let query = 'SELECT * FROM Users WHERE Username = @username';
      if (hasIsDeleted) {
        query += ' AND IsDeleted = 0';
      }
      
      const result = await this.safeQuery(query, { username });
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  // Create new user - SAFE VERSION
  async createUser(userData) {
    try {
      const { username, password, fullName, role = 'User' } = userData;
      console.log('👤 Creating new user:', { username, fullName, role });
      
      // Check if IsDeleted column exists
      const hasIsDeleted = await this.columnExists('Users', 'IsDeleted');
      
      let query, values;
      if (hasIsDeleted) {
        query = `
          INSERT INTO Users (Username, Password, FullName, Role, IsActive, IsDeleted)
          OUTPUT INSERTED.UserID
          VALUES (@username, @password, @fullName, @role, 1, 0)
        `;
      } else {
        query = `
          INSERT INTO Users (Username, Password, FullName, Role, IsActive)
          OUTPUT INSERTED.UserID
          VALUES (@username, @password, @fullName, @role, 1)
        `;
      }
      
      const result = await this.safeQuery(query, {
        username, password, fullName, role
      });
      
      return result.recordset[0].UserID;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get all users - SAFE VERSION
  async getAllUsers() {
    try {
      console.log('👥 Getting all users');
      
      const hasIsDeleted = await this.columnExists('Users', 'IsDeleted');
      
      let query = 'SELECT UserID, Username, FullName, Role, IsActive, CreatedDate FROM Users';
      if (hasIsDeleted) {
        query += ' WHERE IsDeleted = 0';
      }
      query += ' ORDER BY CreatedDate DESC';
      
      const result = await this.safeQuery(query);
      return result.recordset;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Create new vote - SAFE VERSION
  async createVote(voteData) {
    try {
      const { 
        voteNumber, title, content, attachedFiles = '', 
        createdBy, assigneeType = 'All', status = 'Open' 
      } = voteData;
      
      console.log('🗳️ Creating new vote:', { voteNumber, title, assigneeType });
      
      const hasIsDeleted = await this.columnExists('Votes', 'IsDeleted');
      
      let query;
      if (hasIsDeleted) {
        query = `
          INSERT INTO Votes (VoteNumber, Title, Content, AttachedFiles, CreatedBy, AssigneeType, Status, IsDeleted)
          OUTPUT INSERTED.VoteID
          VALUES (@voteNumber, @title, @content, @attachedFiles, @createdBy, @assigneeType, @status, 0)
        `;
      } else {
        query = `
          INSERT INTO Votes (VoteNumber, Title, Content, AttachedFiles, CreatedBy, AssigneeType, Status)
          OUTPUT INSERTED.VoteID
          VALUES (@voteNumber, @title, @content, @attachedFiles, @createdBy, @assigneeType, @status)
        `;
      }
      
      const result = await this.safeQuery(query, {
        voteNumber, title, content, attachedFiles, createdBy, assigneeType, status
      });
      
      return result.recordset[0].VoteID;
    } catch (error) {
      console.error('Error creating vote:', error);
      throw error;
    }
  }

  // Get open votes for user - SAFE VERSION
  async getOpenVotes(userId) {
    try {
      console.log('🗳️ Getting open votes for user:', userId);
      
      const hasVotesIsDeleted = await this.columnExists('Votes', 'IsDeleted');
      const hasUsersIsDeleted = await this.columnExists('Users', 'IsDeleted');
      const hasVoteResultsIsDeleted = await this.columnExists('VoteResults', 'IsDeleted');
      
      let query = `
        SELECT v.VoteID, v.VoteNumber, v.Title, v.Content, v.AttachedFiles, 
               v.CreatedDate, v.AssigneeType, v.CreatedBy,
               u.FullName as CreatedByName,
               vr.VoteResultID, vr.Decision, vr.Comments as VoteComments
        FROM Votes v
        INNER JOIN Users u ON v.CreatedBy = u.UserID
      `;
      
      if (hasUsersIsDeleted) {
        query += ' AND u.IsDeleted = 0';
      }
      
      query += ' LEFT JOIN VoteResults vr ON v.VoteID = vr.VoteID AND vr.UserID = @userId';
      
      if (hasVoteResultsIsDeleted) {
        query += ' AND vr.IsDeleted = 0';
      }
      
      query += ' WHERE v.Status = \'Open\'';
      
      if (hasVotesIsDeleted) {
        query += ' AND v.IsDeleted = 0';
      }
      
      query += ' ORDER BY v.CreatedDate DESC';
      
      const result = await this.safeQuery(query, { userId });
      return result.recordset;
    } catch (error) {
      console.error('Error getting open votes:', error);
      throw error;
    }
  }

  // Check if vote number exists - SAFE VERSION
  async voteNumberExists(voteNumber, excludeVoteId = null) {
    try {
      const hasIsDeleted = await this.columnExists('Votes', 'IsDeleted');
      
      let query = 'SELECT COUNT(*) as count FROM Votes WHERE VoteNumber = @voteNumber';
      
      if (hasIsDeleted) {
        query += ' AND IsDeleted = 0';
      }
      
      if (excludeVoteId) {
        query += ' AND VoteID != @excludeVoteId';
      }
      
      const params = { voteNumber };
      if (excludeVoteId) {
        params.excludeVoteId = excludeVoteId;
      }
      
      const result = await this.safeQuery(query, params);
      return result.recordset[0].count > 0;
    } catch (error) {
      console.error('Error checking vote number:', error);
      throw error;
    }
  }

  // Check if username exists - SAFE VERSION
  async usernameExists(username, excludeUserId = null) {
    try {
      const hasIsDeleted = await this.columnExists('Users', 'IsDeleted');
      
      let query = 'SELECT COUNT(*) as count FROM Users WHERE Username = @username';
      
      if (hasIsDeleted) {
        query += ' AND IsDeleted = 0';
      }
      
      if (excludeUserId) {
        query += ' AND UserID != @excludeUserId';
      }
      
      const params = { username };
      if (excludeUserId) {
        params.excludeUserId = excludeUserId;
      }
      
      const result = await this.safeQuery(query, params);
      return result.recordset[0].count > 0;
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  }

  // Soft delete user - SAFE VERSION
  async deleteUser(userId) {
    try {
      console.log('🗑️ Deleting user:', userId);
      
      const hasIsDeleted = await this.columnExists('Users', 'IsDeleted');
      
      if (hasIsDeleted) {
        // Soft delete
        await this.safeQuery(
          'UPDATE Users SET IsDeleted = 1, IsActive = 0 WHERE UserID = @userId',
          { userId }
        );
        console.log('✅ User soft deleted');
      } else {
        // Hard delete - be careful!
        await this.safeQuery('DELETE FROM Users WHERE UserID = @userId', { userId });
        console.log('✅ User hard deleted');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get vote statistics - SAFE VERSION
  async getVoteStatistics() {
    try {
      console.log('📊 Getting vote statistics');
      
      const hasIsDeleted = await this.columnExists('Votes', 'IsDeleted');
      
      let openVotesQuery = "SELECT COUNT(*) as count FROM Votes WHERE Status = 'Open'";
      let closedVotesQuery = `
        SELECT COUNT(*) as count FROM Votes 
        WHERE Status = 'Closed' AND YEAR(CreatedDate) = YEAR(GETDATE())
      `;
      
      if (hasIsDeleted) {
        openVotesQuery += ' AND IsDeleted = 0';
        closedVotesQuery += ' AND IsDeleted = 0';
      }
      
      const [openResult, closedResult] = await Promise.all([
        this.safeQuery(openVotesQuery),
        this.safeQuery(closedVotesQuery)
      ]);
      
      return {
        openVotes: openResult.recordset[0].count,
        closedVotesThisYear: closedResult.recordset[0].count
      };
    } catch (error) {
      console.error('Error getting vote statistics:', error);
      throw error;
    }
  }

  // Transaction helper
  async executeTransaction(operations) {
    const transaction = new sql.Transaction(this.pool);
    
    try {
      await transaction.begin();
      const request = new sql.Request(transaction);
      
      const results = [];
      for (const operation of operations) {
        const result = await request.query(operation);
        results.push(result);
      }
      
      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error('Transaction failed:', error);
      throw error;
    }
  }
}

module.exports = DatabaseService;

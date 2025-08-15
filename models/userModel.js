// User model
const sql = require('mssql');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  static async findByUsername(username) {
    try {
      const pool = await db.connect();
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .query('SELECT * FROM Users WHERE Username = @username AND IsDeleted = 0');
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getUserPermissions(userId) {
    try {
      const pool = await db.connect();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`SELECT p.PermissionName FROM UserPermissions up
                JOIN Permissions p ON up.PermissionID = p.PermissionID
                WHERE up.UserID = @userId AND up.IsActive = 1`);
      return result.recordset.map(row => row.PermissionName);
    } catch (error) {
      console.error('Error getting user permissions:', error);
      throw error;
    }
  }

  static async createUser(userData) {
    try {
      const { username, password, fullName, email, role } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);
      const pool = await db.connect();
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .input('password', sql.NVarChar, hashedPassword)
        .input('fullName', sql.NVarChar, fullName)
        .input('email', sql.NVarChar, email)
        .input('role', sql.NVarChar, role)
        .query(`INSERT INTO Users (Username, Password, FullName, Email, Role, IsActive, CreatedDate)
                VALUES (@username, @password, @fullName, @email, @role, 1, GETDATE())
                SELECT SCOPE_IDENTITY() as UserID`);
      return result.recordset[0].UserID;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getAllUsers() {
    try {
      const pool = await db.connect();
      const result = await pool.request()
        .query('SELECT UserID, Username, FullName, Email, Role, IsActive, CreatedDate FROM Users WHERE IsDeleted = 0');
      return result.recordset;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  static async updateUser(userId, userData) {
    try {
      const { fullName, email, role, isActive } = userData;
      const pool = await db.connect();
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('fullName', sql.NVarChar, fullName)
        .input('email', sql.NVarChar, email)
        .input('role', sql.NVarChar, role)
        .input('isActive', sql.Bit, isActive)
        .query(`UPDATE Users SET FullName = @fullName, Email = @email, Role = @role, 
                IsActive = @isActive, ModifiedDate = GETDATE() 
                WHERE UserID = @userId AND IsDeleted = 0`);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(userId) {
    try {
      const pool = await db.connect();
      await pool.request()
        .input('userId', sql.Int, userId)
        .query('UPDATE Users SET IsDeleted = 1, DeletedDate = GETDATE() WHERE UserID = @userId');
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = UserModel;

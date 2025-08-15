const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Middleware to check authentication
function requireAuth(req, res, next) {
    console.log('🔐 RequireAuth middleware - Session check');
    console.log('Session user:', req.session?.user);
    console.log('Session ID:', req.sessionID);
    
    if (!req.session || !req.session.user) {
        console.log('❌ No user session found');
        return res.status(401).json({ 
            error: 'Authentication required',
            redirect: '/login'
        });
    }
    
    console.log('✅ User authenticated:', req.session.user.FullName);
    next();
}

// Async error handler wrapper
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Test route for debugging (add auth)
router.get('/test', (req, res) => {
  console.log('🧪 Admin test route called');
  res.json({
    success: true,
    message: 'Admin routes working',
    session: !!req.session,
    user: req.session?.user || null,
    timestamp: new Date().toISOString()
  });
});

// Test route with auth
router.get('/test-auth', requireAuth, (req, res) => {
  console.log('🔐 Admin test auth route called');
  res.json({
    success: true,
    message: 'Admin auth working',
    user: req.session.user,
    timestamp: new Date().toISOString()
  });
});

// Test database operations
router.get('/test-db-ops', requireAuth, async (req, res) => {
  try {
    console.log('🔍 Testing database operations...');
    
    if (req.session.user.Role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ error: 'No database pool' });
    }
    
    const request = pool.request();
    
    // Test 1: Basic query
    const basicTest = await request.query('SELECT 1 as TestValue');
    console.log('Basic query test:', basicTest.recordset);
    
    // Test 2: Users table structure
    const tableStructure = await request.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('Users table structure:', tableStructure.recordset);
    
    // Test 3: Current users count
    const userCount = await request.query('SELECT COUNT(*) as UserCount FROM Users');
    console.log('Current users count:', userCount.recordset);
    
    // Test 4: Try a simple insert (rollback)
    const transaction = pool.transaction();
    await transaction.begin();
    
    try {
      const testInsert = transaction.request();
      await testInsert
        .input('username', sql.NVarChar, 'test_user_' + Date.now())
        .input('password', sql.NVarChar, 'test_password')
        .input('fullName', sql.NVarChar, 'Test User')
        .input('role', sql.NVarChar, 'User')
        .query(`
          INSERT INTO Users (Username, Password, FullName, Role) 
          VALUES (@username, @password, @fullName, @role)
        `);
      
      // Rollback the test insert
      await transaction.rollback();
      console.log('Test insert successful (rolled back)');
      
    } catch (insertError) {
      await transaction.rollback();
      console.error('Test insert failed:', insertError);
      throw insertError;
    }
    
    res.json({
      success: true,
      message: 'Database operations test successful',
      basicQuery: basicTest.recordset[0],
      tableStructure: tableStructure.recordset,
      userCount: userCount.recordset[0].UserCount,
      testInsert: 'Successful (rolled back)'
    });
    
  } catch (error) {
    console.error('Database operations test error:', error);
    res.status(500).json({
      error: 'Database operations test failed',
      message: error.message,
      code: error.code,
      number: error.number
    });
  }
});

// Original test route for debugging (add auth)
router.get('/test', requireAuth, async (req, res) => {
  try {
    console.log('=== ADMIN TEST ROUTE ===');
    console.log('Session user:', req.session.user);
    console.log('App locals pool:', !!req.app.locals.pool);
    
    if (!req.app.locals.pool) {
      return res.json({ error: 'No database pool', pool: false });
    }
    
    const pool = req.app.locals.pool;
    const request = pool.request();
    
    // Test users query
    const usersResult = await request.query('SELECT COUNT(*) as userCount FROM Users');
    console.log('User count query result:', usersResult.recordset);
    
    // Test permissions query
    const permissionsResult = await request.query('SELECT COUNT(*) as permCount FROM Permissions');
    console.log('Permissions count query result:', permissionsResult.recordset);
    
    // Test specific permissions query
    const specificPerms = await request.query(`
      SELECT TOP 5 u.FullName, p.ModuleName, p.CanAccess 
      FROM Users u 
      JOIN Permissions p ON u.UserID = p.UserID 
      ORDER BY u.UserID, p.ModuleName
    `);
    console.log('Sample permissions:', specificPerms.recordset);
    
    res.json({ 
      success: true, 
      pool: true,
      userCount: usersResult.recordset[0].userCount,
      permissionCount: permissionsResult.recordset[0].permCount,
      samplePermissions: specificPerms.recordset,
      sessionUser: req.session.user ? req.session.user.username : 'none'
    });
    
  } catch (error) {
    console.error('Test route error:', {
      message: error.message,
      code: error.code,
      number: error.number,
      state: error.state
    });
    res.status(500).json({ 
      error: 'Database test failed', 
      details: error.message,
      code: error.code,
      number: error.number
    });
  }
});

// Get all users (for admin)
router.get('/users', requireAuth, async (req, res) => {
  try {
    console.log('=== GET /admin/users called ===');
    console.log('Session exists:', !!req.session);
    console.log('Session user:', req.session.user);
    
    if (req.session.user.Role !== 'Admin') {
      console.log('❌ User is not admin:', req.session.user.Role);
      return res.status(403).json({ error: 'Access denied', role: req.session.user.Role });
    }

    // Check database connection
    const pool = req.app.locals.pool;
    console.log('Pool from app.locals:', !!pool);
    
    if (!pool) {
      console.log('❌ No database pool available');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    console.log('✅ Database pool available, creating request...');
    const request = pool.request();
    
    // Simple query without complex column checking for now
    console.log('🔄 Executing basic users query...');
    const query = `
      SELECT UserID, Username, FullName, Role, CreatedDate, IsActive
      FROM Users
      ORDER BY CreatedDate DESC
    `;
    
    const result = await request.query(query);
    
    console.log('✅ Users query result:', result.recordset.length, 'users found');
    
    // Ensure we return an array
    const users = result.recordset || [];
    res.json(users);
    
  } catch (err) {
    console.error('❌ Get users error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      number: err.number,
      state: err.state
    });
    res.status(500).json({ 
      error: 'Database error', 
      details: err.message,
      code: err.code 
    });
  }
});

// Add new user (admin only)
router.post('/users', requireAuth, async (req, res) => {
  try {
    console.log('=== ADD USER REQUEST ===');
    console.log('Session user:', req.session.user);
    console.log('Request body:', req.body);
    
    if (req.session.user.Role !== 'Admin') {
      console.log('Access denied - not admin');
      return res.status(403).json({ error: 'Access denied' });
    }

    const { username, fullName, password, role, email } = req.body;
    
    console.log('Received user data:', { username, fullName, role, email }); // Debug log
    
    if (!username || !fullName || !password || !role) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Check database connection
    const pool = req.app.locals.pool;
    console.log('Pool from app.locals:', !!pool);
    
    if (!pool) {
      console.log('No database pool available');
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    const request = pool.request();
    
    // Check if username exists
    console.log('Checking if username exists...');
    const existingUser = await request
      .input('username', sql.NVarChar, username)
      .query('SELECT COUNT(*) as count FROM Users WHERE Username = @username');
    
    console.log('Existing user count:', existingUser.recordset[0].count);
    
    if (existingUser.recordset[0].count > 0) {
      console.log('Username already exists');
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    // Insert new user
    console.log('Inserting new user...');
    const insertRequest = pool.request();
    const insertResult = await insertRequest
      .input('username', sql.NVarChar, username)
      .input('fullName', sql.NVarChar, fullName)
      .input('hashedPassword', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, role)
      .query(`
        INSERT INTO Users (Username, Password, FullName, Role) 
        OUTPUT INSERTED.UserID
        VALUES (@username, @hashedPassword, @fullName, @role)
      `);

    const newUserID = insertResult.recordset[0].UserID;
    console.log('New user inserted with ID:', newUserID);

    // Set default permissions
    console.log('Setting permissions...');
    const modules = ['DraftManagement', 'CreateVote', 'Vote', 'EndVote', 'History', 'Documents', 'DigitalSign', 'Admin'];
    
    for (const module of modules) {
      let canAccess = 0;
      
      if (role === 'Admin') {
        canAccess = 1; // Admin có tất cả quyền
      } else {
        // User thường có quyền cơ bản
        if (['Vote', 'History', 'Documents', 'DigitalSign'].includes(module)) {
          canAccess = 1;
        }
      }
      
      console.log(`Setting permission for ${module}: ${canAccess}`);
      
      const permissionRequest = pool.request();
      await permissionRequest
        .input('userID', sql.Int, newUserID)
        .input('moduleName', sql.NVarChar, module)
        .input('canAccess', sql.Bit, canAccess)
        .query(`
          INSERT INTO Permissions (UserID, ModuleName, CanAccess) 
          VALUES (@userID, @moduleName, @canAccess)
        `);
    }

    console.log('User added successfully');
    res.json({ success: true, message: 'Thêm người dùng thành công' });
    
  } catch (err) {
    console.error('Add user error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      number: err.number,
      state: err.state,
      class: err.class
    });
    res.status(500).json({ 
      error: 'Database error', 
      details: err.message 
    });
  }
});

// Test DELETE endpoint
router.get('/test-delete/:id', requireAuth, async (req, res) => {
  try {
    console.log('=== TEST DELETE ENDPOINT ===');
    console.log('Session exists:', !!req.session);
    console.log('Session user:', req.session.user);
    console.log('User ID to test:', req.params.id);
    console.log('User role:', req.session.user?.Role);
    
    res.json({
      success: true,
      sessionExists: !!req.session,
      user: req.session.user,
      userRole: req.session.user?.Role,
      isAdmin: req.session.user?.Role === 'Admin',
      targetUserId: req.params.id
    });
  } catch (error) {
    console.error('Test delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', requireAuth, async (req, res) => {
  try {
    console.log('=== DELETE USER REQUEST ===');
    console.log('Session exists:', !!req.session);
    console.log('Session user:', req.session.user);
    console.log('User ID to delete:', req.params.id);
    console.log('Request headers:', req.headers);
    
    if (req.session.user.Role !== 'Admin') {
      console.log('Access denied - not admin, role:', req.session.user.Role);
      return res.status(403).json({ error: 'Access denied' });
    }

    const userId = req.params.id;
    const pool = req.app.locals.pool;
    
    if (!pool) {
      console.log('No database pool available');
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    // Check if user exists and is admin
    console.log('Checking if user exists...');
    const checkRequest = pool.request();
    const userCheck = await checkRequest
      .input('userID', sql.Int, userId)
      .query('SELECT Username FROM Users WHERE UserID = @userID');
    
    console.log('User check result:', userCheck.recordset);
    
    if (userCheck.recordset.length === 0) {
      console.log('User not found');
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    if (userCheck.recordset[0]?.Username === 'admin') {
      console.log('Cannot delete admin user');
      return res.status(400).json({ error: 'Không thể xóa tài khoản admin' });
    }

    // Simple delete instead of stored procedure for now
    console.log('Performing simple delete...');
    
    const deleteRequest = pool.request();
    await deleteRequest
      .input('userID', sql.Int, userId)
      .query('UPDATE Users SET IsActive = 0 WHERE UserID = @userID');

    console.log('User deleted successfully');

    res.json({ 
      success: true, 
      message: 'Người dùng đã được xóa thành công.' 
    });
    
  } catch (err) {
    console.error('Delete user error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      number: err.number,
      state: err.state,
      class: err.class
    });
    res.status(500).json({ 
      error: 'Database error', 
      details: err.message 
    });
  }
});

// Update single permission
router.post('/permissions', requireAuth, async (req, res) => {
  try {
    if (req.session.user.Role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { userId, module, hasPermission } = req.body;

    if (!userId || !module) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pool = req.app.locals.pool;
    const request = pool.request();

    if (hasPermission) {
      // Add or update permission
      await request
        .input('UserID', sql.Int, userId)
        .input('ModuleName', sql.NVarChar(50), module)
        .query(`
          IF EXISTS (SELECT 1 FROM Permissions WHERE UserID = @UserID AND ModuleName = @ModuleName)
            UPDATE Permissions SET CanAccess = 1 WHERE UserID = @UserID AND ModuleName = @ModuleName
          ELSE
            INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, @ModuleName, 1)
        `);
    } else {
      // Remove permission
      await request
        .input('UserID', sql.Int, userId)
        .input('ModuleName', sql.NVarChar(50), module)
        .query(`
          UPDATE Permissions SET CanAccess = 0 WHERE UserID = @UserID AND ModuleName = @ModuleName
        `);
    }

    res.json({ success: true, message: 'Permission updated successfully' });
  } catch (err) {
    console.error('Update permission error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Bulk update permissions
router.post('/permissions/bulk', async (req, res) => {
  try {
    if (req.session.user.Role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Invalid permissions data' });
    }

    const pool = req.app.locals.pool;
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Clear all existing permissions (set CanAccess = 0)
      const clearRequest = transaction.request();
      await clearRequest.query('UPDATE Permissions SET CanAccess = 0');

      // Insert/Update new permissions
      for (const perm of permissions) {
        const upsertRequest = transaction.request();
        await upsertRequest
          .input('UserID', sql.Int, perm.userId)
          .input('ModuleName', sql.NVarChar(50), perm.module)
          .query(`
            IF EXISTS (SELECT 1 FROM Permissions WHERE UserID = @UserID AND ModuleName = @ModuleName)
              UPDATE Permissions SET CanAccess = 1 WHERE UserID = @UserID AND ModuleName = @ModuleName
            ELSE
              INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, @ModuleName, 1)
          `);
      }

      await transaction.commit();
      res.json({ success: true, message: 'All permissions updated successfully' });

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (err) {
    console.error('Bulk update permissions error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all users with permissions for permission management
router.get('/permissions', requireAuth, async (req, res) => {
  try {
    console.log('🔑 Getting users with permissions...');
    
    if (req.session.user.Role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const pool = req.app.locals.pool;
    const request = pool.request();
    
    // Get users with their permissions
    const result = await request.query(`
      SELECT 
        u.UserID,
        u.Username,
        u.FullName,
        u.Role,
        u.IsActive,
        u.CreatedDate,
        COALESCE(STRING_AGG(p.ModuleName, ','), '') as PermissionModules
      FROM Users u
      LEFT JOIN Permissions p ON u.UserID = p.UserID AND p.CanAccess = 1
      WHERE u.IsActive = 1
      GROUP BY u.UserID, u.Username, u.FullName, u.Role, u.IsActive, u.CreatedDate
      ORDER BY u.FullName
    `);
    
    // Process permissions into arrays
    const users = result.recordset.map(user => ({
      ...user,
      Permissions: user.PermissionModules && user.PermissionModules.trim() ? user.PermissionModules.split(',') : []
    }));
    
    console.log('✅ Found users with permissions:', users.length);
    res.json(users);
    
  } catch (err) {
    console.error('❌ Get permissions error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update user permissions
router.put('/permissions/:userId', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Updating user permissions...');
    
    if (req.session.user.Role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const userId = req.params.userId;
    const { role, permissions } = req.body;
    
    const pool = req.app.locals.pool;
    const transaction = pool.transaction();
    
    await transaction.begin();
    
    try {
      // Update user role if provided
      if (role) {
        await transaction.request()
          .input('userId', sql.Int, userId)
          .input('role', sql.NVarChar, role)
          .query('UPDATE Users SET Role = @role WHERE UserID = @userId');
      }
      
      // Clear existing permissions
      await transaction.request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM Permissions WHERE UserID = @userId');
      
      // Add new permissions
      if (permissions && permissions.length > 0) {
        for (const permission of permissions) {
          await transaction.request()
            .input('userId', sql.Int, userId)
            .input('moduleName', sql.NVarChar, permission)
            .input('canAccess', sql.Bit, 1)
            .query(`
              INSERT INTO Permissions (UserID, ModuleName, CanAccess, CreatedDate, CreatedBy)
              VALUES (@userId, @moduleName, @canAccess, GETDATE(), ${req.session.user.UserID})
            `);
        }
      }
      
      await transaction.commit();
      
      console.log('✅ User permissions updated successfully');
      res.json({ success: true, message: 'Permissions updated successfully' });
      
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
    
  } catch (err) {
    console.error('❌ Update permissions error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Bulk update permissions
router.post('/permissions/bulk', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Bulk updating permissions...');
    
    if (req.session.user.Role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { userIds, role, permissions, action } = req.body;
    
    if (!userIds || userIds.length === 0) {
      return res.status(400).json({ error: 'No users selected' });
    }
    
    const pool = req.app.locals.pool;
    const transaction = pool.transaction();
    
    await transaction.begin();
    
    try {
      let updatedCount = 0;
      
      for (const userId of userIds) {
        // Update role if provided
        if (role) {
          await transaction.request()
            .input('userId', sql.Int, userId)
            .input('role', sql.NVarChar, role)
            .query('UPDATE Users SET Role = @role WHERE UserID = @userId');
        }
        
        // Handle permissions based on action
        if (permissions && permissions.length > 0) {
          if (action === 'replace') {
            // Clear existing permissions
            await transaction.request()
              .input('userId', sql.Int, userId)
              .query('DELETE FROM Permissions WHERE UserID = @userId');
            
            // Add new permissions
            for (const permission of permissions) {
              await transaction.request()
                .input('userId', sql.Int, userId)
                .input('moduleName', sql.NVarChar, permission)
                .input('canAccess', sql.Bit, 1)
                .query(`
                  INSERT INTO Permissions (UserID, ModuleName, CanAccess, CreatedDate, CreatedBy)
                  VALUES (@userId, @moduleName, @canAccess, GETDATE(), ${req.session.user.UserID})
                `);
            }
          } else if (action === 'add') {
            // Add permissions (skip if already exists)
            for (const permission of permissions) {
              await transaction.request()
                .input('userId', sql.Int, userId)
                .input('moduleName', sql.NVarChar, permission)
                .input('canAccess', sql.Bit, 1)
                .query(`
                  IF NOT EXISTS (SELECT 1 FROM Permissions WHERE UserID = @userId AND ModuleName = @moduleName)
                  INSERT INTO Permissions (UserID, ModuleName, CanAccess, CreatedDate, CreatedBy)
                  VALUES (@userId, @moduleName, @canAccess, GETDATE(), ${req.session.user.UserID})
                `);
            }
          } else if (action === 'remove') {
            // Remove specific permissions
            for (const permission of permissions) {
              await transaction.request()
                .input('userId', sql.Int, userId)
                .input('moduleName', sql.NVarChar, permission)
                .query('DELETE FROM Permissions WHERE UserID = @userId AND ModuleName = @moduleName');
            }
          }
        }
        
        updatedCount++;
      }
      
      await transaction.commit();
      
      console.log('✅ Bulk permissions updated successfully');
      res.json({ success: true, message: 'Bulk permissions updated', updatedCount });
      
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
    
  } catch (err) {
    console.error('❌ Bulk update permissions error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get permission history for a user
router.get('/permissions/:userId/history', requireAuth, async (req, res) => {
  try {
    console.log('📋 Getting permission history...');
    
    if (req.session.user.Role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const userId = req.params.userId;
    const pool = req.app.locals.pool;
    const request = pool.request();
    
    // Get permission change history (simplified - would need audit table in real implementation)
    const result = await request
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          p.CreatedDate as changeDate,
          'Granted' as action,
          p.ModuleName as permissions,
          u.FullName as changedBy
        FROM Permissions p
        JOIN Users u ON p.CreatedBy = u.UserID
        WHERE p.UserID = @userId
        ORDER BY p.CreatedDate DESC
      `);
    
    console.log('✅ Permission history retrieved');
    res.json(result.recordset);
    
  } catch (err) {
    console.error('❌ Get permission history error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;
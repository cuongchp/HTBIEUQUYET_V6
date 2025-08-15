const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Middleware to check authentication
function requireAuth(req, res, next) {
    console.log('🔐 RequireAuth middleware - Session check');
    console.log('Session user:', req.session.user);
    console.log('Session ID:', req.sessionID);
    
    if (!req.session || !req.session.user) {
        console.log('❌ No session or user found');
        return res.status(401).json({ error: 'Not authenticated', session: false });
    }
    
    console.log('✅ User authenticated:', req.session.user.Username);
    next();
}

// Get all users for admin management
router.get('/users', requireAuth, async (req, res) => {
  try {
    console.log('🔍 Getting all users...');
    console.log('👤 Request user session:', JSON.stringify(req.session, null, 2));
    
    if (!req.session.user) {
      console.log('❌ No user in session');
      return res.status(401).json({ error: 'No user session found' });
    }
    
    console.log('👤 Session user object:', JSON.stringify(req.session.user, null, 2));
    
    // Allow admin users OR users with create_draft permission to access user list
    const isAdmin = req.session.user.Role === 'Admin';
    const userPermissions = req.session.user.Permissions || [];
    const hasCreateDraftPermission = userPermissions.includes('create_draft');
    
    console.log('🔐 Authorization check:');
    console.log('  - User Role:', req.session.user.Role);
    console.log('  - isAdmin:', isAdmin);
    console.log('  - userPermissions array:', userPermissions);
    console.log('  - hasCreateDraftPermission:', hasCreateDraftPermission);
    
    if (!isAdmin && !hasCreateDraftPermission) {
      console.log('⚠️ Access denied - user has no admin role or create_draft permission');
      return res.status(403).json({ 
        error: 'Admin access or create_draft permission required',
        userRole: req.session.user.Role,
        userPermissions: userPermissions,
        hasCreateDraft: hasCreateDraftPermission
      });
    }
    
    if (!isAdmin && !hasCreateDraftPermission) {
      console.log('⚠️ Access denied - user has no admin role or create_draft permission');
      return res.status(403).json({ error: 'Admin access or create_draft permission required' });
    }
    
    console.log('✅ User access granted - Admin:', isAdmin, 'CreateDraft:', hasCreateDraftPermission);
    
    const pool = req.app.locals.pool;
    const request = pool.request();
    
    const result = await request.query(`
      SELECT UserID, Username, FullName, Role, IsActive, CreatedDate
      FROM Users
      WHERE IsActive = 1
      ORDER BY FullName
    `);
    
    console.log('✅ Found users:', result.recordset.length);
    console.log('📋 User list:', result.recordset.map(u => `${u.FullName} (@${u.Username})`));
    res.json(result.recordset);
    
  } catch (err) {
    console.error('❌ Get users error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
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
              INSERT INTO Permissions (UserID, ModuleName, CanAccess)
              VALUES (@userId, @moduleName, @canAccess)
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
                  INSERT INTO Permissions (UserID, ModuleName, CanAccess)
                  VALUES (@userId, @moduleName, @canAccess)
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
                  INSERT INTO Permissions (UserID, ModuleName, CanAccess)
                  VALUES (@userId, @moduleName, @canAccess)
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
          GETDATE() as changeDate,
          'Active' as action,
          p.ModuleName as permissions,
          'System' as changedBy
        FROM Permissions p
        WHERE p.UserID = @userId AND p.CanAccess = 1
        ORDER BY p.ModuleName
      `);
    
    console.log('✅ Permission history retrieved');
    res.json(result.recordset);
    
  } catch (err) {
    console.error('❌ Get permission history error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Add new user
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
    
    console.log('Received user data:', { username, fullName, role, email });
    
    if (!username || !fullName || !password || !role) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

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
        INSERT INTO Users (Username, Password, FullName, Role, IsActive) 
        OUTPUT INSERTED.UserID
        VALUES (@username, @hashedPassword, @fullName, @role, 1)
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
    console.error('Add user error:', err);
    res.status(500).json({ 
      error: 'Database error', 
      details: err.message 
    });
  }
});

// Delete user
router.delete('/users/:id', requireAuth, async (req, res) => {
  try {
    console.log('=== DELETE USER REQUEST ===');
    console.log('Session exists:', !!req.session);
    console.log('Session user:', req.session.user);
    console.log('User ID to delete:', req.params.id);
    
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

    // Soft delete - set IsActive to 0
    console.log('Performing soft delete...');
    
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

// Simple test delete endpoint (for debugging)
router.delete('/test-delete/:id', (req, res) => {
    console.log('🧪 Test delete endpoint called with ID:', req.params.id);
    res.json({
        success: true,
        message: 'Test delete endpoint working',
        userId: req.params.id,
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint - list all available routes
router.get('/debug-routes', (req, res) => {
    console.log('🔍 Debug routes endpoint called');
    
    const routes = [];
    
    // Get all routes from this router
    router.stack.forEach(layer => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods);
            routes.push({
                path: layer.route.path,
                methods: methods,
                stack: layer.route.stack.length
            });
        }
    });
    
    res.json({
        message: 'Admin routes debug info',
        timestamp: new Date().toISOString(),
        totalRoutes: routes.length,
        routes: routes,
        availableEndpoints: [
            'GET /api/admin/test',
            'GET /api/admin/debug-routes', 
            'DELETE /api/admin/test-delete/:id',
            'GET /api/admin/users',
            'POST /api/admin/users',
            'DELETE /api/admin/users/:id',
            'GET /api/admin/permissions',
            'PUT /api/admin/permissions/:userId',
            'POST /api/admin/permissions/bulk'
        ]
    });
});

// Test route
router.get('/test', (req, res) => {
    console.log('🧪 Admin test route hit');
    console.log('Session exists:', !!req.session);
    console.log('Session user:', req.session.user);
    
    res.json({ 
        message: 'Admin routes working',
        session: !!req.session,
        user: req.session.user || null,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

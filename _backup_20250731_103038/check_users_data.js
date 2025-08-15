const sql = require('mssql');

async function checkUsersData() {
    try {
        // Database configuration - matching server.js
        const config = {
            server: 'DUONGVIETCUONG\\SQLEXPRESS',
            database: 'BIEUQUYET_CHP',
            user: 'sa',
            password: '123456',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            },
            port: 1433
        };

        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        
        // Check Users table structure
        console.log('\n=== USERS TABLE STRUCTURE ===');
        const columns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('Columns:', columns.recordset);
        
        // Check all users
        console.log('\n=== ALL USERS ===');
        const allUsers = await pool.request().query('SELECT UserID, Username, FullName, Role, IsActive FROM Users');
        console.log('Total users:', allUsers.recordset.length);
        allUsers.recordset.forEach(user => {
            console.log(`${user.UserID}: ${user.Username} (${user.FullName}) - Role: ${user.Role}, Active: ${user.IsActive}`);
        });
        
        // Check active users only
        console.log('\n=== ACTIVE USERS ONLY ===');
        const activeUsers = await pool.request().query('SELECT UserID, Username, FullName, Role FROM Users WHERE IsActive = 1');
        console.log('Active users:', activeUsers.recordset.length);
        activeUsers.recordset.forEach(user => {
            console.log(`${user.UserID}: ${user.Username} (${user.FullName}) - Role: ${user.Role}`);
        });
        
        // Check permissions
        console.log('\n=== PERMISSIONS TABLE ===');
        const permissions = await pool.request().query('SELECT TOP 10 UserID, ModuleName, CanAccess FROM Permissions');
        console.log('Sample permissions:', permissions.recordset);
        
        await pool.close();
        
    } catch (error) {
        console.error('Database error:', error);
    }
}

checkUsersData();

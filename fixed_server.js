const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3002; // Port khác

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: 'evnchp-voting-system-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// SQL Config
const config = {
  server: 'DUONGVIETCUONG\\SQLEXPRESS',
  database: 'BIEUQUYET_CHP',
  user: 'sa',
  password: '123456',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

let pool;

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Initialize DB
async function initDB() {
  try {
    pool = await sql.connect(config);
    app.locals.pool = pool;
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ DB Error:', err);
  }
}

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM Users WHERE Username = @username AND IsActive = 1');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.recordset[0];
    const isValidPassword = await bcrypt.compare(password, user.Password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.user = {
      UserID: user.UserID,
      Username: user.Username,
      FullName: user.FullName,
      Role: user.Role
    };
    
    res.json({ success: true, user: req.session.user });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Fixed Votes API
app.get('/api/votes', requireAuth, async (req, res) => {
  try {
    console.log('🔄 API /api/votes called');
    
    const request = pool.request();
    const userId = req.session.user.UserID;
    const userRole = req.session.user.Role;

    console.log('👤 User:', { userId, userRole });

    // FIXED QUERY - Removed DISTINCT
    let query = `
      SELECT v.VoteID, v.VoteNumber, v.Title, v.Content, v.CreatedDate, 
             u.FullName as CreatedBy, v.Status,
             CASE WHEN vr.ResultID IS NOT NULL THEN 1 ELSE 0 END as HasVoted
      FROM Votes v
      INNER JOIN Users u ON v.CreatedBy = u.UserID
      LEFT JOIN VoteResults vr ON v.VoteID = vr.VoteID AND vr.UserID = @userID
      WHERE v.Status = 'Open'
    `;

    if (userRole !== 'Admin') {
      query += `
        AND (v.AssigneeType = 'All' OR EXISTS (
          SELECT 1 FROM VoteAssignees va WHERE va.VoteID = v.VoteID AND va.UserID = @userID
        ))
      `;
    }

    query += ' ORDER BY v.CreatedDate DESC';

    console.log('📝 Executing fixed query...');
    const result = await request
      .input('userID', sql.Int, userId)
      .query(query);

    console.log('✅ Success! Records:', result.recordset.length);
    res.json(result.recordset);

  } catch (err) {
    console.error('❌ Votes API Error:', err.message);
    console.error('📋 Full error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Start
app.listen(PORT, async () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  await initDB();
});

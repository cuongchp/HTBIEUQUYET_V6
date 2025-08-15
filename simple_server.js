const express = require('express');
const app = express();
const PORT = 3000;

// Simple ping endpoint
app.get('/api/ping', (req, res) => {
  console.log('Ping endpoint called');
  res.json({ 
    status: 'success', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
  console.log(`Test ping: http://localhost:${PORT}/api/ping`);
});

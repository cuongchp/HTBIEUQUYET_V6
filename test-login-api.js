// Test login API trực tiếp
async function testUserLogin() {
  const testAccounts = [
    { username: 'tuanlqa', password: '123456' },
    { username: 'tuanlqa', password: '123' },
    { username: 'tuanlqa', password: 'user123' },
    { username: 'admin', password: 'admin123' }
  ];
  
  for (const account of testAccounts) {
    console.log(`\n🔑 Testing login: ${account.username} / ${account.password}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(account)
      });
      
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, data);
      
      if (data.success) {
        console.log(`✅ SUCCESS for ${account.username}`);
        break;
      } else {
        console.log(`❌ FAILED for ${account.username}: ${data.error}`);
      }
    } catch (error) {
      console.log(`💥 ERROR for ${account.username}:`, error.message);
    }
  }
}

testUserLogin();

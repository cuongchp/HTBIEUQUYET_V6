const sql = require('mssql');
const cron = require('node-cron');

let dbPool = null;

// Set database pool từ app chính
function setDatabasePool(pool) {
  dbPool = pool;
}

// Cron job chạy mỗi giờ để kiểm tra và đóng phiếu hết hạn
async function autoCloseExpiredVotes() {
  try {
    console.log('🕐 [CRON] Kiểm tra phiếu biểu quyết hết hạn...', new Date().toISOString());
    
    if (!dbPool) {
      console.error('❌ [CRON] Database pool chưa được khởi tạo');
      return;
    }
    
    // Tìm các phiếu biểu quyết đã hết hạn nhưng vẫn đang mở
    const expiredVotes = await dbPool.request().query(`
      SELECT VoteID, VoteNumber, Title, EndDate
      FROM Votes 
      WHERE Status = 'Open' 
        AND EndDate IS NOT NULL 
        AND EndDate <= GETDATE()
        AND AutoClose = 1
        AND IsDeleted = 0
    `);
    
    if (expiredVotes.recordset.length === 0) {
      console.log('✅ [CRON] Không có phiếu nào cần đóng');
      return;
    }
    
    console.log(`🔒 [CRON] Tìm thấy ${expiredVotes.recordset.length} phiếu cần đóng:`);
    
    // Đóng từng phiếu
    for (const vote of expiredVotes.recordset) {
      await dbPool.request().query(`
        UPDATE Votes 
        SET Status = 'Closed', 
            UpdatedDate = GETDATE(),
            UpdatedBy = 1
        WHERE VoteID = ${vote.VoteID}
      `);
      
      console.log(`  ✅ Đã đóng phiếu: ${vote.VoteNumber} - ${vote.Title}`);
      
      // Ghi log vào bảng VoteLogs nếu có
      try {
        await dbPool.request().query(`
          INSERT INTO VoteLogs (VoteID, Action, ActionBy, ActionDate, Notes)
          VALUES (${vote.VoteID}, 'Auto Closed', 1, GETDATE(), 'Automatically closed due to expiration')
        `);
      } catch (logError) {
        console.log('⚠️ Không thể ghi log (bảng VoteLogs có thể chưa tồn tại)');
      }
    }
    
    console.log(`🎉 [CRON] Đã đóng ${expiredVotes.recordset.length} phiếu biểu quyết`);
    
  } catch (error) {
    console.error('❌ [CRON] Lỗi auto close votes:', error.message);
  }
}

// Khởi chạy cron job
function startVoteAutoCloseService() {
  console.log('🚀 Khởi động dịch vụ tự động đóng phiếu biểu quyết...');
  
  // Chạy mỗi giờ tại phút 0 (0 * * * *)
  cron.schedule('0 * * * *', autoCloseExpiredVotes, {
    name: 'auto-close-expired-votes',
    timezone: 'Asia/Ho_Chi_Minh'
  });
  
  console.log('✅ Dịch vụ tự động đóng phiếu đã được kích hoạt (chạy mỗi giờ)');
  
  // Chạy ngay lần đầu
  autoCloseExpiredVotes();
}

// Dừng cron job
function stopVoteAutoCloseService() {
  const task = cron.getTasks().get('auto-close-expired-votes');
  if (task) {
    task.stop();
    console.log('⏹️ Đã dừng dịch vụ tự động đóng phiếu');
  }
}

module.exports = {
  setDatabasePool,
  startVoteAutoCloseService,
  stopVoteAutoCloseService,
  autoCloseExpiredVotes
};

// Nếu chạy trực tiếp file này
if (require.main === module) {
  startVoteAutoCloseService();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Đang dừng dịch vụ...');
    stopVoteAutoCloseService();
    process.exit(0);
  });
}

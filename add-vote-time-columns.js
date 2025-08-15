const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'BIEUQUYET_CHP',
  user: 'sa',
  password: '123456',
  options: { 
    encrypt: false, 
    trustServerCertificate: true 
  }
};

(async () => {
  try {
    await sql.connect(config);
    console.log('🔧 Thêm cột thời gian vào bảng Votes...');
    
    // Kiểm tra và thêm cột StartDate
    try {
      const checkStartDate = await sql.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Votes' AND COLUMN_NAME = 'StartDate'
      `);
      
      if (checkStartDate.recordset.length === 0) {
        await sql.query(`
          ALTER TABLE Votes ADD StartDate DATETIME DEFAULT GETDATE()
        `);
        console.log('✅ Đã thêm cột StartDate');
      } else {
        console.log('ℹ️ Cột StartDate đã tồn tại');
      }
    } catch (err) {
      console.log('⚠️ Lỗi khi thêm StartDate:', err.message);
    }

    // Kiểm tra và thêm cột EndDate
    try {
      const checkEndDate = await sql.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Votes' AND COLUMN_NAME = 'EndDate'
      `);
      
      if (checkEndDate.recordset.length === 0) {
        await sql.query(`
          ALTER TABLE Votes ADD EndDate DATETIME NULL
        `);
        console.log('✅ Đã thêm cột EndDate');
      } else {
        console.log('ℹ️ Cột EndDate đã tồn tại');
      }
    } catch (err) {
      console.log('⚠️ Lỗi khi thêm EndDate:', err.message);
    }

    // Kiểm tra và thêm cột AutoClose
    try {
      const checkAutoClose = await sql.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Votes' AND COLUMN_NAME = 'AutoClose'
      `);
      
      if (checkAutoClose.recordset.length === 0) {
        await sql.query(`
          ALTER TABLE Votes ADD AutoClose BIT DEFAULT 1
        `);
        console.log('✅ Đã thêm cột AutoClose');
      } else {
        console.log('ℹ️ Cột AutoClose đã tồn tại');
      }
    } catch (err) {
      console.log('⚠️ Lỗi khi thêm AutoClose:', err.message);
    }

    // Cập nhật dữ liệu hiện có - set StartDate = CreatedDate cho các phiếu cũ
    await sql.query(`
      UPDATE Votes 
      SET StartDate = CreatedDate, 
          EndDate = DATEADD(day, 7, CreatedDate)
      WHERE StartDate IS NULL
    `);
    console.log('✅ Đã cập nhật dữ liệu cũ với thời gian mặc định (7 ngày)');

    // Kiểm tra kết quả
    console.log('\n📋 Cấu trúc bảng sau khi cập nhật:');
    const finalCheck = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Votes'
      ORDER BY ORDINAL_POSITION
    `);
    
    finalCheck.recordset.forEach(col => {
      if (['StartDate', 'EndDate', 'AutoClose'].includes(col.COLUMN_NAME)) {
        console.log(`  ✨ ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT || ''}`);
      }
    });

    // Kiểm tra dữ liệu mẫu
    console.log('\n🗳️ Dữ liệu mẫu với thời gian:');
    const sampleData = await sql.query(`
      SELECT TOP 3 VoteNumber, Title, StartDate, EndDate, 
             CASE 
               WHEN EndDate > GETDATE() THEN DATEDIFF(hour, GETDATE(), EndDate)
               ELSE 0 
             END as HoursRemaining
      FROM Votes 
      WHERE IsDeleted = 0
      ORDER BY CreatedDate DESC
    `);
    
    sampleData.recordset.forEach(vote => {
      console.log(`  - ${vote.VoteNumber}: ${vote.HoursRemaining} giờ còn lại`);
    });
    
    await sql.close();
    console.log('\n🎉 Hoàn thành cập nhật cấu trúc database!');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();

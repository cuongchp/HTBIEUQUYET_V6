const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'HTBIEUQUYET_V6',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        integratedSecurity: true
    }
};

async function createTestData() {
    try {
        console.log('🔄 Connecting to database...');
        const pool = new sql.ConnectionPool(config);
        await pool.connect();
        
        const request = pool.request();
        
        // Tạo phiếu biểu quyết đã đóng
        console.log('📝 Creating closed vote...');
        const voteResult = await request.query(`
            INSERT INTO Votes (VoteNumber, Title, Content, CreatedBy, AssigneeType, Status, StartDate, EndDate, AutoClose, IsDeleted)
            OUTPUT INSERTED.VoteID
            VALUES 
            ('CLOSED-001', 'Phiếu Test Đã Đóng', 'Đây là phiếu biểu quyết test đã đóng để kiểm tra module Kết thúc Biểu quyết', 1, 'All', 'Closed', DATEADD(day, -2, GETDATE()), DATEADD(day, -1, GETDATE()), 1, 0);
        `);
        
        const voteId = voteResult.recordset[0].VoteID;
        console.log('✅ Created test vote with ID:', voteId);
        
        // Tạo một số kết quả biểu quyết test
        console.log('📊 Creating vote results...');
        await request.query(`
            INSERT INTO VoteResults (VoteID, UserID, Choice, Reason, VotedDate)
            VALUES 
            (${voteId}, 1, 'Agree', 'Tôi đồng ý với đề xuất này', DATEADD(hour, -12, GETDATE())),
            (${voteId}, 2, 'Disagree', 'Cần xem xét thêm', DATEADD(hour, -10, GETDATE())),
            (${voteId}, 3, 'Agree', 'Phù hợp với tình hình hiện tại', DATEADD(hour, -8, GETDATE()));
        `);
        
        console.log('✅ Created test vote results');
        
        // Tạo thêm một phiếu đã kết thúc khác
        console.log('📝 Creating second closed vote...');
        const vote2Result = await request.query(`
            INSERT INTO Votes (VoteNumber, Title, Content, CreatedBy, AssigneeType, Status, StartDate, EndDate, AutoClose, IsDeleted)
            OUTPUT INSERTED.VoteID
            VALUES 
            ('CLOSED-002', 'Phiếu Test Thứ 2 Đã Đóng', 'Phiếu biểu quyết test thứ hai để có nhiều dữ liệu test', 1, 'All', 'Closed', DATEADD(day, -3, GETDATE()), DATEADD(hour, -6, GETDATE()), 1, 0);
        `);
        
        const vote2Id = vote2Result.recordset[0].VoteID;
        console.log('✅ Created second test vote with ID:', vote2Id);
        
        await request.query(`
            INSERT INTO VoteResults (VoteID, UserID, Choice, Reason, VotedDate)
            VALUES 
            (${vote2Id}, 1, 'Disagree', 'Không phù hợp', DATEADD(hour, -4, GETDATE())),
            (${vote2Id}, 4, 'Agree', 'Tôi ủng hộ', DATEADD(hour, -3, GETDATE()));
        `);
        
        console.log('🎉 Test data created successfully!');
        
        // Kiểm tra dữ liệu vừa tạo
        const checkResult = await request.query(`
            SELECT v.VoteID, v.VoteNumber, v.Title, v.Status, COUNT(vr.ResultID) as ResultCount
            FROM Votes v
            LEFT JOIN VoteResults vr ON v.VoteID = vr.VoteID
            WHERE v.Status = 'Closed'
            GROUP BY v.VoteID, v.VoteNumber, v.Title, v.Status
            ORDER BY v.VoteID DESC
        `);
        
        console.log('📋 Closed votes in database:');
        checkResult.recordset.forEach(vote => {
            console.log(`- ID: ${vote.VoteID}, Number: ${vote.VoteNumber}, Results: ${vote.ResultCount}`);
        });
        
        await pool.close();
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createTestData();

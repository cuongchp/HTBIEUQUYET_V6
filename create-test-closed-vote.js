const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'HTBIEUQUYET_V6',
    user: '',
    password: '',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        integratedSecurity: true
    }
};

async function createTestClosedVote() {
    try {
        console.log('🔄 Connecting to database...');
        await sql.connect(config);
        
        const request = new sql.Request();
        
        // Tạo phiếu biểu quyết đã kết thúc
        const voteResult = await request.query(`
            INSERT INTO Votes (VoteNumber, Title, Content, CreatedBy, AssigneeType, Status, StartDate, EndDate, AutoClose, IsDeleted)
            VALUES 
            ('TEST-001', 'Phiếu test đã kết thúc', 'Đây là phiếu biểu quyết test đã kết thúc để kiểm tra module Kết thúc Biểu quyết', 1, 'All', 'Closed', DATEADD(day, -2, GETDATE()), DATEADD(day, -1, GETDATE()), 1, 0);
            
            SELECT SCOPE_IDENTITY() as VoteID;
        `);
        
        const voteId = voteResult.recordset[0].VoteID;
        console.log('✅ Created test vote with ID:', voteId);
        
        // Tạo một số kết quả biểu quyết test
        await request.query(`
            INSERT INTO VoteResults (VoteID, UserID, Choice, Reason, SubmittedDate)
            VALUES 
            (${voteId}, 1, 'Agree', 'Tôi đồng ý với đề xuất này', DATEADD(day, -1, GETDATE())),
            (${voteId}, 2, 'Disagree', 'Cần xem xét thêm', DATEADD(day, -1, GETDATE()));
        `);
        
        console.log('✅ Created test vote results');
        
        // Tạo thêm một phiếu đã kết thúc khác
        const vote2Result = await request.query(`
            INSERT INTO Votes (VoteNumber, Title, Content, CreatedBy, AssigneeType, Status, StartDate, EndDate, AutoClose, IsDeleted)
            VALUES 
            ('TEST-002', 'Phiếu test thứ 2 đã kết thúc', 'Phiếu biểu quyết test thứ hai để có nhiều dữ liệu test', 1, 'All', 'Closed', DATEADD(day, -3, GETDATE()), DATEADD(hour, -12, GETDATE()), 1, 0);
            
            SELECT SCOPE_IDENTITY() as VoteID;
        `);
        
        const vote2Id = vote2Result.recordset[0].VoteID;
        console.log('✅ Created second test vote with ID:', vote2Id);
        
        console.log('🎉 Test data created successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.close();
    }
}

createTestClosedVote();

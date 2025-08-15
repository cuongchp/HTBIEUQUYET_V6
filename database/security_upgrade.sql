-- SCRIPT CẬP NHẬT DATABASE CHO SECURITY IMPROVEMENTS
-- Chạy script này để đảm bảo tất cả bảng có IsDeleted column

USE BIEUQUYET_CHP;
GO

-- Kiểm tra và thêm IsDeleted column cho tất cả bảng chính
PRINT 'Checking and adding IsDeleted columns...';

-- Users table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'IsDeleted')
BEGIN
    ALTER TABLE Users ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Added IsDeleted to Users table';
END
ELSE
    PRINT 'ℹ️ Users.IsDeleted already exists';

-- Votes table  
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Votes' AND COLUMN_NAME = 'IsDeleted')
BEGIN
    ALTER TABLE Votes ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Added IsDeleted to Votes table';
END
ELSE
    PRINT 'ℹ️ Votes.IsDeleted already exists';

-- VoteResults table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'VoteResults' AND COLUMN_NAME = 'IsDeleted')
BEGIN
    ALTER TABLE VoteResults ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Added IsDeleted to VoteResults table';
END
ELSE
    PRINT 'ℹ️ VoteResults.IsDeleted already exists';

-- Drafts table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Drafts' AND COLUMN_NAME = 'IsDeleted')
BEGIN
    ALTER TABLE Drafts ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Added IsDeleted to Drafts table';
END
ELSE
    PRINT 'ℹ️ Drafts.IsDeleted already exists';

-- DraftComments table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DraftComments' AND COLUMN_NAME = 'IsDeleted')
BEGIN
    ALTER TABLE DraftComments ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Added IsDeleted to DraftComments table';
END
ELSE
    PRINT 'ℹ️ DraftComments.IsDeleted already exists';

-- Documents table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Documents' AND COLUMN_NAME = 'IsDeleted')
BEGIN
    ALTER TABLE Documents ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Added IsDeleted to Documents table';
END
ELSE
    PRINT 'ℹ️ Documents.IsDeleted already exists';

-- DigitalSignatures table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DigitalSignatures' AND COLUMN_NAME = 'IsDeleted')
BEGIN
    ALTER TABLE DigitalSignatures ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Added IsDeleted to DigitalSignatures table';
END
ELSE
    PRINT 'ℹ️ DigitalSignatures.IsDeleted already exists';

-- VoteAssignees table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'VoteAssignees' AND COLUMN_NAME = 'IsDeleted')
BEGIN
    ALTER TABLE VoteAssignees ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Added IsDeleted to VoteAssignees table';
END
ELSE
    PRINT 'ℹ️ VoteAssignees.IsDeleted already exists';

-- Permissions table (không cần IsDeleted vì liên quan đến security)

PRINT '';
PRINT 'Creating performance indexes...';

-- Tạo indexes cho performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_IsDeleted_IsActive')
BEGIN
    CREATE INDEX IX_Users_IsDeleted_IsActive ON Users (IsDeleted, IsActive);
    PRINT '✅ Created index IX_Users_IsDeleted_IsActive';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Votes_IsDeleted_Status')
BEGIN
    CREATE INDEX IX_Votes_IsDeleted_Status ON Votes (IsDeleted, Status);
    PRINT '✅ Created index IX_Votes_IsDeleted_Status';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VoteResults_IsDeleted_VoteID')
BEGIN
    CREATE INDEX IX_VoteResults_IsDeleted_VoteID ON VoteResults (IsDeleted, VoteID);
    PRINT '✅ Created index IX_VoteResults_IsDeleted_VoteID';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Drafts_IsDeleted_Status')
BEGIN
    CREATE INDEX IX_Drafts_IsDeleted_Status ON Drafts (IsDeleted, Status);
    PRINT '✅ Created index IX_Drafts_IsDeleted_Status';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Username')
BEGIN
    CREATE UNIQUE INDEX IX_Users_Username ON Users (Username) WHERE IsDeleted = 0;
    PRINT '✅ Created unique index IX_Users_Username';
END

PRINT '';
PRINT 'Adding security constraints...';

-- Thêm constraints cho data integrity
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Users_Role')
BEGIN
    ALTER TABLE Users ADD CONSTRAINT CK_Users_Role CHECK (Role IN ('Admin', 'User'));
    PRINT '✅ Added role constraint';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Votes_Status')
BEGIN
    ALTER TABLE Votes ADD CONSTRAINT CK_Votes_Status CHECK (Status IN ('Open', 'Closed', 'Draft'));
    PRINT '✅ Added vote status constraint';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_VoteResults_Choice')
BEGIN
    ALTER TABLE VoteResults ADD CONSTRAINT CK_VoteResults_Choice CHECK (Choice IN ('agree', 'disagree', 'other'));
    PRINT '✅ Added vote choice constraint';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Votes_AssigneeType')
BEGIN
    ALTER TABLE Votes ADD CONSTRAINT CK_Votes_AssigneeType CHECK (AssigneeType IN ('All', 'specific'));
    PRINT '✅ Added assignee type constraint';
END

-- Cập nhật tất cả records hiện tại để IsDeleted = 0
PRINT '';
PRINT 'Updating existing records...';

UPDATE Users SET IsDeleted = 0 WHERE IsDeleted IS NULL;
UPDATE Votes SET IsDeleted = 0 WHERE IsDeleted IS NULL;
UPDATE VoteResults SET IsDeleted = 0 WHERE IsDeleted IS NULL;
UPDATE Drafts SET IsDeleted = 0 WHERE IsDeleted IS NULL;
UPDATE DraftComments SET IsDeleted = 0 WHERE IsDeleted IS NULL;
UPDATE Documents SET IsDeleted = 0 WHERE IsDeleted IS NULL;
UPDATE DigitalSignatures SET IsDeleted = 0 WHERE IsDeleted IS NULL;
UPDATE VoteAssignees SET IsDeleted = 0 WHERE IsDeleted IS NULL;

PRINT '✅ Updated all existing records';

-- Tạo audit table để track changes
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLog' AND xtype='U')
BEGIN
    CREATE TABLE AuditLog (
        AuditID INT IDENTITY(1,1) PRIMARY KEY,
        TableName NVARCHAR(50) NOT NULL,
        RecordID INT NOT NULL,
        Action NVARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
        OldValues NTEXT,
        NewValues NTEXT,
        ChangedBy INT,
        ChangedDate DATETIME DEFAULT GETDATE(),
        IPAddress NVARCHAR(45),
        UserAgent NVARCHAR(500)
    );
    
    CREATE INDEX IX_AuditLog_TableName_RecordID ON AuditLog (TableName, RecordID);
    CREATE INDEX IX_AuditLog_ChangedDate ON AuditLog (ChangedDate);
    
    PRINT '✅ Created AuditLog table for security tracking';
END

PRINT '';
PRINT '🎉 Database security update completed successfully!';
PRINT '';
PRINT 'Summary:';
PRINT '- Added IsDeleted columns to all main tables';
PRINT '- Created performance indexes';
PRINT '- Added data integrity constraints';
PRINT '- Created audit log table';
PRINT '- Updated existing records';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Test the secure server: start_secure.bat';
PRINT '2. Verify all features work with new security layer';
PRINT '3. Monitor logs in ./logs/ directory';

GO

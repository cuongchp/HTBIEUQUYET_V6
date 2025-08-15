-- HỆ THỐNG BIỂU QUYẾT EVNCHP - DATABASE SCRIPT
-- Tạo database và các bảng cần thiết

USE master;
GO

-- Tạo database nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'BIEUQUYET_CHP')
BEGIN
    CREATE DATABASE BIEUQUYET_CHP;
    PRINT 'Database BIEUQUYET_CHP đã được tạo thành công';
END
ELSE
BEGIN
    PRINT 'Database BIEUQUYET_CHP đã tồn tại';
END
GO

USE BIEUQUYET_CHP;
GO

-- Tạo bảng Users
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL UNIQUE,
        Password NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        Role NVARCHAR(20) NOT NULL DEFAULT 'User',
        CreatedDate DATETIME DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );
    PRINT 'Bảng Users đã được tạo';
END
GO

-- Tạo bảng Permissions
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Permissions' AND xtype='U')
BEGIN
    CREATE TABLE Permissions (
        PermissionID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT FOREIGN KEY REFERENCES Users(UserID),
        ModuleName NVARCHAR(50) NOT NULL,
        CanAccess BIT DEFAULT 0
    );
    PRINT 'Bảng Permissions đã được tạo';
END
GO

-- Tạo bảng Drafts (Dự thảo tờ trình)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Drafts' AND xtype='U')
BEGIN
    CREATE TABLE Drafts (
        DraftID INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(255) NOT NULL,
        Content NTEXT NOT NULL,
        AttachedFiles NTEXT,
        CreatedBy INT FOREIGN KEY REFERENCES Users(UserID),
        CreatedDate DATETIME DEFAULT GETDATE(),
        Status NVARCHAR(20) DEFAULT 'Draft',
        CommentPeriod INT DEFAULT 7
    );
    PRINT 'Bảng Drafts đã được tạo';
END
GO

-- Tạo bảng DraftComments (Góp ý dự thảo)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DraftComments' AND xtype='U')
BEGIN
    CREATE TABLE DraftComments (
        CommentID INT IDENTITY(1,1) PRIMARY KEY,
        DraftID INT FOREIGN KEY REFERENCES Drafts(DraftID),
        UserID INT FOREIGN KEY REFERENCES Users(UserID),
        Comment NTEXT,
        CommentDate DATETIME DEFAULT GETDATE()
    );
    PRINT 'Bảng DraftComments đã được tạo';
END
GO

-- Tạo bảng Votes (Phiếu biểu quyết)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Votes' AND xtype='U')
BEGIN
    CREATE TABLE Votes (
        VoteID INT IDENTITY(1,1) PRIMARY KEY,
        VoteNumber NVARCHAR(50) NOT NULL UNIQUE,
        Title NVARCHAR(255) NOT NULL,
        Content NTEXT NOT NULL,
        AttachedFiles NTEXT,
        CreatedBy INT FOREIGN KEY REFERENCES Users(UserID),
        CreatedDate DATETIME DEFAULT GETDATE(),
        Status NVARCHAR(20) DEFAULT 'Open',
        AssigneeType NVARCHAR(20) DEFAULT 'All'
    );
    PRINT 'Bảng Votes đã được tạo';
END
GO

-- Tạo bảng VoteAssignees (Người được chỉ định biểu quyết)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VoteAssignees' AND xtype='U')
BEGIN
    CREATE TABLE VoteAssignees (
        AssigneeID INT IDENTITY(1,1) PRIMARY KEY,
        VoteID INT FOREIGN KEY REFERENCES Votes(VoteID),
        UserID INT FOREIGN KEY REFERENCES Users(UserID)
    );
    PRINT 'Bảng VoteAssignees đã được tạo';
END
GO

-- Tạo bảng VoteResults (Kết quả biểu quyết)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VoteResults' AND xtype='U')
BEGIN
    CREATE TABLE VoteResults (
        ResultID INT IDENTITY(1,1) PRIMARY KEY,
        VoteID INT FOREIGN KEY REFERENCES Votes(VoteID),
        UserID INT FOREIGN KEY REFERENCES Users(UserID),
        Choice NVARCHAR(20) NOT NULL,
        Reason NTEXT,
        VotedDate DATETIME DEFAULT GETDATE(),
        SignedDocument NVARCHAR(255)
    );
    PRINT 'Bảng VoteResults đã được tạo';
END
GO

-- Tạo bảng Documents (Tủ tài liệu)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Documents' AND xtype='U')
BEGIN
    CREATE TABLE Documents (
        DocumentID INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(255) NOT NULL,
        FileName NVARCHAR(255) NOT NULL,
        FilePath NVARCHAR(500) NOT NULL,
        FileSize BIGINT,
        UploadedBy INT FOREIGN KEY REFERENCES Users(UserID),
        UploadedDate DATETIME DEFAULT GETDATE(),
        Year INT NOT NULL
    );
    PRINT 'Bảng Documents đã được tạo';
END
GO

-- Tạo bảng DigitalSignatures (Ký số)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DigitalSignatures' AND xtype='U')
BEGIN
    CREATE TABLE DigitalSignatures (
        SignatureID INT IDENTITY(1,1) PRIMARY KEY,
        DocumentType NVARCHAR(50) NOT NULL,
        DocumentID INT NOT NULL,
        SignerID INT FOREIGN KEY REFERENCES Users(UserID),
        SignedDate DATETIME DEFAULT GETDATE(),
        SignatureFile NVARCHAR(255),
        Status NVARCHAR(20) DEFAULT 'Pending'
    );
    PRINT 'Bảng DigitalSignatures đã được tạo';
END
GO

-- Tạo bảng VoteSummaries (Phiếu tổng hợp)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VoteSummaries' AND xtype='U')
BEGIN
    CREATE TABLE VoteSummaries (
        SummaryID INT IDENTITY(1,1) PRIMARY KEY,
        VoteID INT FOREIGN KEY REFERENCES Votes(VoteID),
        TotalVoters INT NOT NULL,
        AgreeCount INT DEFAULT 0,
        DisagreeCount INT DEFAULT 0,
        OtherCount INT DEFAULT 0,
        SummaryContent NTEXT,
        CreatedBy INT FOREIGN KEY REFERENCES Users(UserID),
        CreatedDate DATETIME DEFAULT GETDATE(),
        Status NVARCHAR(20) DEFAULT 'Draft'
    );
    PRINT 'Bảng VoteSummaries đã được tạo';
END
GO

-- Tạo bảng Resolutions (Nghị quyết)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Resolutions' AND xtype='U')
BEGIN
    CREATE TABLE Resolutions (
        ResolutionID INT IDENTITY(1,1) PRIMARY KEY,
        VoteID INT FOREIGN KEY REFERENCES Votes(VoteID),
        ResolutionNumber NVARCHAR(50) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Content NTEXT NOT NULL,
        AttachedFile NVARCHAR(255),
        CreatedBy INT FOREIGN KEY REFERENCES Users(UserID),
        CreatedDate DATETIME DEFAULT GETDATE(),
        Status NVARCHAR(20) DEFAULT 'Draft'
    );
    PRINT 'Bảng Resolutions đã được tạo';
END
GO

-- Tạo indexes để tối ưu hiệu suất
CREATE NONCLUSTERED INDEX IX_Users_Username ON Users(Username);
CREATE NONCLUSTERED INDEX IX_Votes_Status ON Votes(Status);
CREATE NONCLUSTERED INDEX IX_Votes_CreatedDate ON Votes(CreatedDate);
CREATE NONCLUSTERED INDEX IX_VoteResults_VoteID ON VoteResults(VoteID);
CREATE NONCLUSTERED INDEX IX_VoteResults_UserID ON VoteResults(UserID);
CREATE NONCLUSTERED INDEX IX_Permissions_UserID ON Permissions(UserID);
GO

PRINT 'Tất cả bảng và indexes đã được tạo thành công!';
PRINT 'Hệ thống đã sẵn sàng để sử dụng.';

-- Hiển thị thông tin các bảng đã tạo
SELECT 
    t.name AS 'Tên Bảng',
    p.rows AS 'Số dòng'
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0,1)
ORDER BY t.name;

GO

-- Soft Delete Upgrade Script
-- Thêm các trường soft delete cho tất cả bảng quan trọng
-- Phương án 2: Soft Delete nâng cao

USE BIEUQUYET_CHP;
GO

PRINT '=== SOFT DELETE UPGRADE ===';
PRINT 'Bắt đầu thêm các trường soft delete...';

-- Thêm trường soft delete cho bảng Users
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE Users ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Đã thêm trường IsDeleted cho bảng Users';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'DeletedDate')
BEGIN
    ALTER TABLE Users ADD DeletedDate DATETIME NULL;
    PRINT '✅ Đã thêm trường DeletedDate cho bảng Users';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'DeletedBy')
BEGIN
    ALTER TABLE Users ADD DeletedBy INT NULL;
    ALTER TABLE Users ADD CONSTRAINT FK_Users_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES Users(UserID);
    PRINT '✅ Đã thêm trường DeletedBy cho bảng Users';
END

-- Thêm trường soft delete cho bảng Drafts
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Drafts') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE Drafts ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Đã thêm trường IsDeleted cho bảng Drafts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Drafts') AND name = 'DeletedDate')
BEGIN
    ALTER TABLE Drafts ADD DeletedDate DATETIME NULL;
    PRINT '✅ Đã thêm trường DeletedDate cho bảng Drafts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Drafts') AND name = 'DeletedBy')
BEGIN
    ALTER TABLE Drafts ADD DeletedBy INT NULL;
    ALTER TABLE Drafts ADD CONSTRAINT FK_Drafts_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES Users(UserID);
    PRINT '✅ Đã thêm trường DeletedBy cho bảng Drafts';
END

-- Thêm trường soft delete cho bảng DraftComments
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('DraftComments') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE DraftComments ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Đã thêm trường IsDeleted cho bảng DraftComments';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('DraftComments') AND name = 'DeletedDate')
BEGIN
    ALTER TABLE DraftComments ADD DeletedDate DATETIME NULL;
    PRINT '✅ Đã thêm trường DeletedDate cho bảng DraftComments';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('DraftComments') AND name = 'DeletedBy')
BEGIN
    ALTER TABLE DraftComments ADD DeletedBy INT NULL;
    ALTER TABLE DraftComments ADD CONSTRAINT FK_DraftComments_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES Users(UserID);
    PRINT '✅ Đã thêm trường DeletedBy cho bảng DraftComments';
END

-- Thêm trường soft delete cho bảng Votes
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Votes') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE Votes ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Đã thêm trường IsDeleted cho bảng Votes';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Votes') AND name = 'DeletedDate')
BEGIN
    ALTER TABLE Votes ADD DeletedDate DATETIME NULL;
    PRINT '✅ Đã thêm trường DeletedDate cho bảng Votes';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Votes') AND name = 'DeletedBy')
BEGIN
    ALTER TABLE Votes ADD DeletedBy INT NULL;
    ALTER TABLE Votes ADD CONSTRAINT FK_Votes_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES Users(UserID);
    PRINT '✅ Đã thêm trường DeletedBy cho bảng Votes';
END

-- Thêm trường soft delete cho bảng VoteResults
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VoteResults') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE VoteResults ADD IsDeleted BIT DEFAULT 0;
    PRINT '✅ Đã thêm trường IsDeleted cho bảng VoteResults';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VoteResults') AND name = 'DeletedDate')
BEGIN
    ALTER TABLE VoteResults ADD DeletedDate DATETIME NULL;
    PRINT '✅ Đã thêm trường DeletedDate cho bảng VoteResults';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VoteResults') AND name = 'DeletedBy')
BEGIN
    ALTER TABLE VoteResults ADD DeletedBy INT NULL;
    ALTER TABLE VoteResults ADD CONSTRAINT FK_VoteResults_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES Users(UserID);
    PRINT '✅ Đã thêm trường DeletedBy cho bảng VoteResults';
END

-- Thêm trường soft delete cho bảng Documents
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Documents')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Documents') AND name = 'IsDeleted')
    BEGIN
        ALTER TABLE Documents ADD IsDeleted BIT DEFAULT 0;
        PRINT '✅ Đã thêm trường IsDeleted cho bảng Documents';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Documents') AND name = 'DeletedDate')
    BEGIN
        ALTER TABLE Documents ADD DeletedDate DATETIME NULL;
        PRINT '✅ Đã thêm trường DeletedDate cho bảng Documents';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Documents') AND name = 'DeletedBy')
    BEGIN
        ALTER TABLE Documents ADD DeletedBy INT NULL;
        ALTER TABLE Documents ADD CONSTRAINT FK_Documents_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES Users(UserID);
        PRINT '✅ Đã thêm trường DeletedBy cho bảng Documents';
    END
END

-- Thêm trường soft delete cho bảng Resolutions
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Resolutions')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Resolutions') AND name = 'IsDeleted')
    BEGIN
        ALTER TABLE Resolutions ADD IsDeleted BIT DEFAULT 0;
        PRINT '✅ Đã thêm trường IsDeleted cho bảng Resolutions';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Resolutions') AND name = 'DeletedDate')
    BEGIN
        ALTER TABLE Resolutions ADD DeletedDate DATETIME NULL;
        PRINT '✅ Đã thêm trường DeletedDate cho bảng Resolutions';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Resolutions') AND name = 'DeletedBy')
    BEGIN
        ALTER TABLE Resolutions ADD DeletedBy INT NULL;
        ALTER TABLE Resolutions ADD CONSTRAINT FK_Resolutions_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES Users(UserID);
        PRINT '✅ Đã thêm trường DeletedBy cho bảng Resolutions';
    END
END

-- Tạo bảng RecycleBin để theo dõi các item đã xóa mềm
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RecycleBin')
BEGIN
    CREATE TABLE RecycleBin (
        RecycleBinID INT IDENTITY(1,1) PRIMARY KEY,
        TableName NVARCHAR(50) NOT NULL,
        RecordID INT NOT NULL,
        RecordTitle NVARCHAR(255),
        DeletedBy INT NOT NULL,
        DeletedDate DATETIME NOT NULL DEFAULT GETDATE(),
        CanRestore BIT DEFAULT 1,
        FOREIGN KEY (DeletedBy) REFERENCES Users(UserID)
    );
    PRINT '✅ Đã tạo bảng RecycleBin để quản lý thùng rác';
END

-- Tạo index cho hiệu suất truy vấn
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_IsDeleted')
BEGIN
    CREATE INDEX IX_Users_IsDeleted ON Users(IsDeleted);
    PRINT '✅ Đã tạo index IX_Users_IsDeleted';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Drafts_IsDeleted')
BEGIN
    CREATE INDEX IX_Drafts_IsDeleted ON Drafts(IsDeleted);
    PRINT '✅ Đã tạo index IX_Drafts_IsDeleted';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Votes_IsDeleted')
BEGIN
    CREATE INDEX IX_Votes_IsDeleted ON Votes(IsDeleted);
    PRINT '✅ Đã tạo index IX_Votes_IsDeleted';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_DraftComments_IsDeleted')
BEGIN
    CREATE INDEX IX_DraftComments_IsDeleted ON DraftComments(IsDeleted);
    PRINT '✅ Đã tạo index IX_DraftComments_IsDeleted';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VoteResults_IsDeleted')
BEGIN
    CREATE INDEX IX_VoteResults_IsDeleted ON VoteResults(IsDeleted);
    PRINT '✅ Đã tạo index IX_VoteResults_IsDeleted';
END

-- Tạo stored procedures để quản lý soft delete
IF OBJECT_ID('sp_SoftDeleteRecord', 'P') IS NOT NULL
    DROP PROCEDURE sp_SoftDeleteRecord;
GO

CREATE PROCEDURE sp_SoftDeleteRecord
    @TableName NVARCHAR(50),
    @RecordID INT,
    @DeletedBy INT,
    @RecordTitle NVARCHAR(255) = NULL
AS
BEGIN
    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @ErrorMessage NVARCHAR(500);

    BEGIN TRY
        -- Kiểm tra bảng có tồn tại không
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = @TableName)
        BEGIN
            RAISERROR('Bảng không tồn tại', 16, 1);
            RETURN;
        END

        -- Thực hiện soft delete
        SET @SQL = N'UPDATE ' + QUOTENAME(@TableName) + 
                   N' SET IsDeleted = 1, DeletedDate = GETDATE(), DeletedBy = @DeletedBy' +
                   N' WHERE ' + 
                   CASE 
                       WHEN @TableName = 'Users' THEN 'UserID'
                       WHEN @TableName = 'Drafts' THEN 'DraftID'
                       WHEN @TableName = 'Votes' THEN 'VoteID'
                       WHEN @TableName = 'DraftComments' THEN 'CommentID'
                       WHEN @TableName = 'VoteResults' THEN 'ResultID'
                       WHEN @TableName = 'Documents' THEN 'DocumentID'
                       WHEN @TableName = 'Resolutions' THEN 'ResolutionID'
                       ELSE 'ID'
                   END + ' = @RecordID AND IsDeleted = 0';

        EXEC sp_executesql @SQL, 
             N'@RecordID INT, @DeletedBy INT', 
             @RecordID = @RecordID, 
             @DeletedBy = @DeletedBy;

        -- Thêm vào RecycleBin
        INSERT INTO RecycleBin (TableName, RecordID, RecordTitle, DeletedBy)
        VALUES (@TableName, @RecordID, @RecordTitle, @DeletedBy);

        PRINT '✅ Đã thực hiện soft delete cho ' + @TableName + ' ID: ' + CAST(@RecordID AS VARCHAR);

    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- Tạo stored procedure để khôi phục dữ liệu
IF OBJECT_ID('sp_RestoreRecord', 'P') IS NOT NULL
    DROP PROCEDURE sp_RestoreRecord;
GO

CREATE PROCEDURE sp_RestoreRecord
    @TableName NVARCHAR(50),
    @RecordID INT,
    @RestoredBy INT
AS
BEGIN
    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @ErrorMessage NVARCHAR(500);

    BEGIN TRY
        -- Kiểm tra bảng có tồn tại không
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = @TableName)
        BEGIN
            RAISERROR('Bảng không tồn tại', 16, 1);
            RETURN;
        END

        -- Thực hiện restore
        SET @SQL = N'UPDATE ' + QUOTENAME(@TableName) + 
                   N' SET IsDeleted = 0, DeletedDate = NULL, DeletedBy = NULL' +
                   N' WHERE ' + 
                   CASE 
                       WHEN @TableName = 'Users' THEN 'UserID'
                       WHEN @TableName = 'Drafts' THEN 'DraftID'
                       WHEN @TableName = 'Votes' THEN 'VoteID'
                       WHEN @TableName = 'DraftComments' THEN 'CommentID'
                       WHEN @TableName = 'VoteResults' THEN 'ResultID'
                       WHEN @TableName = 'Documents' THEN 'DocumentID'
                       WHEN @TableName = 'Resolutions' THEN 'ResolutionID'
                       ELSE 'ID'
                   END + ' = @RecordID AND IsDeleted = 1';

        EXEC sp_executesql @SQL, 
             N'@RecordID INT', 
             @RecordID = @RecordID;

        -- Xóa khỏi RecycleBin
        DELETE FROM RecycleBin 
        WHERE TableName = @TableName AND RecordID = @RecordID;

        PRINT '✅ Đã khôi phục ' + @TableName + ' ID: ' + CAST(@RecordID AS VARCHAR);

    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- Tạo view để xem thùng rác
IF OBJECT_ID('vw_RecycleBin', 'V') IS NOT NULL
    DROP VIEW vw_RecycleBin;
GO

CREATE VIEW vw_RecycleBin
AS
SELECT 
    rb.RecycleBinID,
    rb.TableName,
    rb.RecordID,
    rb.RecordTitle,
    rb.DeletedDate,
    rb.CanRestore,
    u.FullName as DeletedBy
FROM RecycleBin rb
INNER JOIN Users u ON rb.DeletedBy = u.UserID
WHERE rb.CanRestore = 1;
GO

PRINT '';
PRINT '=== SOFT DELETE UPGRADE HOÀN TẤT ===';
PRINT 'Đã thêm thành công các trường soft delete cho tất cả bảng';
PRINT 'Đã tạo stored procedures và views để quản lý soft delete';
PRINT 'Hệ thống đã sẵn sàng sử dụng Soft Delete nâng cao';
PRINT '';

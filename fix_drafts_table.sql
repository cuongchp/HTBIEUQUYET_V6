-- SCRIPT SỬA LỖI ISDELETED CHO DRAFTS TABLE
USE BIEUQUYET_CHP;
GO

-- Kiểm tra và thêm IsDeleted column cho bảng Drafts
PRINT 'Checking Drafts table structure...';

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Drafts'
ORDER BY ORDINAL_POSITION;

-- Thêm IsDeleted column nếu chưa có
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Drafts' AND COLUMN_NAME = 'IsDeleted')
BEGIN
    PRINT 'Adding IsDeleted column to Drafts table...';
    ALTER TABLE Drafts ADD IsDeleted BIT DEFAULT 0;
    PRINT 'IsDeleted column added successfully';
END
ELSE
BEGIN
    PRINT 'IsDeleted column already exists in Drafts table';
END

-- Thêm IsDeleted column cho DraftComments nếu chưa có
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DraftComments' AND COLUMN_NAME = 'IsDeleted')
BEGIN
    PRINT 'Adding IsDeleted column to DraftComments table...';
    ALTER TABLE DraftComments ADD IsDeleted BIT DEFAULT 0;
    PRINT 'IsDeleted column added to DraftComments successfully';
END
ELSE
BEGIN
    PRINT 'IsDeleted column already exists in DraftComments table';
END

-- Cập nhật tất cả records hiện tại
UPDATE Drafts SET IsDeleted = 0 WHERE IsDeleted IS NULL;
UPDATE DraftComments SET IsDeleted = 0 WHERE IsDeleted IS NULL;

PRINT 'Database update completed!';

-- Hiển thị cấu trúc cuối cùng
PRINT 'Final Drafts table structure:';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Drafts'
ORDER BY ORDINAL_POSITION;

GO

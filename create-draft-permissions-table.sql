-- Create DraftPermissions table for draft viewing permissions
-- This table stores which users can view specific drafts

USE BIEUQUYET_CHP;

-- Drop table if exists (for clean setup)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DraftPermissions')
    DROP TABLE DraftPermissions;

-- Create DraftPermissions table
CREATE TABLE DraftPermissions (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    DraftID INT NOT NULL,
    UserID INT NOT NULL,
    PermissionType NVARCHAR(20) NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin'
    GrantedBy INT NOT NULL, -- UserID who granted this permission
    GrantedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    
    -- Foreign key constraints
    CONSTRAINT FK_DraftPermissions_DraftID FOREIGN KEY (DraftID) REFERENCES Drafts(DraftID),
    CONSTRAINT FK_DraftPermissions_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_DraftPermissions_GrantedBy FOREIGN KEY (GrantedBy) REFERENCES Users(UserID),
    
    -- Unique constraint to prevent duplicate permissions
    CONSTRAINT UK_DraftPermissions_Draft_User UNIQUE (DraftID, UserID, PermissionType)
);

-- Create indexes for performance
CREATE INDEX IX_DraftPermissions_DraftID ON DraftPermissions(DraftID);
CREATE INDEX IX_DraftPermissions_UserID ON DraftPermissions(UserID);
CREATE INDEX IX_DraftPermissions_Active ON DraftPermissions(IsActive, DraftID, UserID);

-- Add ViewerType column to Drafts table to track permission type
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Drafts' AND COLUMN_NAME = 'ViewerType')
    ALTER TABLE Drafts ADD ViewerType NVARCHAR(20) DEFAULT 'all'; -- 'all' or 'specific'

PRINT 'DraftPermissions table created successfully!';
PRINT 'ViewerType column added to Drafts table!';

-- Sample usage examples:
PRINT 'Usage examples:';
PRINT '1. Grant view permission: INSERT INTO DraftPermissions (DraftID, UserID, PermissionType, GrantedBy) VALUES (1, 5, ''view'', 1)';
PRINT '2. Check permissions: SELECT * FROM DraftPermissions WHERE DraftID = 1 AND UserID = 5 AND IsActive = 1';
PRINT '3. Revoke permission: UPDATE DraftPermissions SET IsActive = 0 WHERE DraftID = 1 AND UserID = 5';

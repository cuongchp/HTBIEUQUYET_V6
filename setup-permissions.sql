-- Thêm permissions cho tất cả users
DECLARE @UserID INT, @Role NVARCHAR(20)
DECLARE user_cursor CURSOR FOR SELECT UserID, Role FROM Users

OPEN user_cursor
FETCH NEXT FROM user_cursor INTO @UserID, @Role

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Xóa permissions cũ của user này
    DELETE FROM Permissions WHERE UserID = @UserID
    
    -- Thêm permissions mới
    IF @Role = 'Admin'
    BEGIN
        -- Admin có tất cả quyền
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'draft', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'create', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'vote', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'result', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'history', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'document', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'admin', 1)
    END
    ELSE
    BEGIN
        -- User thường có quyền hạn chế
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'draft', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'create', 0)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'vote', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'result', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'history', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'document', 1)
        INSERT INTO Permissions (UserID, ModuleName, CanAccess) VALUES (@UserID, 'admin', 0)
    END
    
    FETCH NEXT FROM user_cursor INTO @UserID, @Role
END

CLOSE user_cursor
DEALLOCATE user_cursor

-- Kiểm tra kết quả
SELECT u.FullName, u.Role, p.ModuleName, p.CanAccess 
FROM Users u 
LEFT JOIN Permissions p ON u.UserID = p.UserID 
ORDER BY u.UserID, p.ModuleName

# Fix Admin API 500 Error - Summary

## 🐛 **Lỗi được báo cáo:**
```
GET http://localhost:3000/api/drafts/all
500 (Internal Server Error)
at loadAllDraftsForAdmin (app.js:5413:19)
```

## 🔍 **Nguyên nhân:**

### 1. **SQL Column Conflict** (routes/drafts.js)
```sql
-- ❌ PROBLEMATIC QUERY
SELECT d.CreatedBy, u.FullName as CreatedBy  -- Conflict: same alias!
```

### 2. **Wrong API Endpoint** (modules/drafts.js)
```javascript
// ❌ WRONG
const response = await fetch('/api/drafts');  // Should be /all

// ✅ CORRECT  
const response = await fetch('/api/drafts/all');
```

### 3. **User Role Case Sensitivity**
```javascript
// ❌ POTENTIAL ISSUE
const userRole = req.session.user.role;  // might be undefined

// ✅ FIXED
const userRole = req.session.user.Role || req.session.user.role;
```

## ✅ **Fixes Applied:**

### 1. **Fixed SQL Query** - `routes/drafts.js`
```sql
-- ✅ FIXED QUERY
SELECT d.DraftID, d.Title, d.Content, d.CreatedDate, d.Status, 
       d.CommentPeriod, d.CreatedBy,
       u.FullName as CreatedByName,  -- ✅ Different alias
       (SELECT COUNT(*) FROM DraftComments dc WHERE dc.DraftID = d.DraftID) as CommentCount,
       CASE 
         WHEN d.Status IS NULL OR d.Status = '' THEN 'Draft'
         ELSE d.Status
       END as StatusDisplay  -- ✅ Different alias
FROM Drafts d
INNER JOIN Users u ON d.CreatedBy = u.UserID
ORDER BY d.CreatedDate DESC
```

### 2. **Fixed API Endpoint** - `modules/drafts.js`
```javascript
// ✅ CORRECTED loadAllDraftsForAdmin()
async function loadAllDraftsForAdmin() {
    try {
        console.log('📋 Loading all drafts for admin...');
        const response = await fetch('/api/drafts/all');  // ✅ Correct endpoint
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Bạn không có quyền truy cập chức năng này');
            } else if (response.status === 401) {
                throw new Error('Vui lòng đăng nhập lại');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        // ...
    }
}
```

### 3. **Enhanced Role Checking** - `routes/drafts.js`
```javascript
// ✅ IMPROVED ROLE CHECK
const userRole = req.session.user.Role || req.session.user.role;
console.log('🔐 Checking user role:', userRole);

if (!['Admin', 'Manager'].includes(userRole)) {
    console.log('❌ Access denied for role:', userRole);
    return res.status(403).json({ error: 'Access denied. Admin or Manager role required.' });
}
```

### 4. **Updated Frontend Display** - `modules/drafts.js`
```javascript
// ✅ USE CreatedByName in display
<small>${escapeHtml(draft.CreatedByName || draft.CreatedBy || 'N/A')}</small>

// ✅ USE CreatedByName in filtering
row.dataset.creator = String(draft.CreatedByName || draft.CreatedBy || '').toLowerCase();

// ✅ USE CreatedByName in filter options
const creators = [...new Set(drafts.map(draft => draft.CreatedByName || draft.CreatedBy).filter(creator => creator))];
```

## 🎯 **Expected Results:**

### Before Fix:
- ❌ 500 Internal Server Error
- ❌ Admin drafts table doesn't load
- ❌ Console full of errors
- ❌ Can't access admin draft management

### After Fix:
- ✅ No 500 errors
- ✅ Admin drafts table loads properly
- ✅ Full names display correctly (CreatedByName)
- ✅ Edit/Delete functions work
- ✅ Proper error messages for unauthorized access
- ✅ Clean console logs

## 🧪 **Testing Steps:**

1. **Run test script:** `test-admin-api-fix.bat`
2. **Login as Admin/Manager**
3. **Navigate to:** "Quản trị hệ thống" → "Quản lý Dự thảo"
4. **Verify:**
   - No 500 errors in console
   - Table loads with data
   - Full names display properly
   - Edit/Delete buttons functional

## 📝 **Files Modified:**

1. **`routes/drafts.js`**
   - Fixed SQL column aliases
   - Enhanced role checking
   - Added debug logging

2. **`public/js/modules/drafts.js`**
   - Fixed API endpoint path
   - Enhanced error handling
   - Updated CreatedByName usage
   - Improved console logging

3. **`test-admin-api-fix.bat`**
   - New test script for verification

## 🚀 **Deployment Notes:**
- Backend changes require server restart
- Frontend changes take effect immediately
- No database schema changes needed

# API Reference 
 
## Authentication 
 
### Login 
 
`POST /api/login` 
 
**Request Body:** 
 
```json 
{ 
  "username": "string", 
  "password": "string" 
} 
``` 
 
**Response:** 
 
```json 
{ 
  "success": true, 
  "token": "jwt_token", 
  "user": { 
    "UserID": 1, 
    "Username": "admin", 
    "FullName": "Administrator", 
    "Role": "Admin", 
    "Permissions": ["draft_management", "vote_management", "user_management"] 
  } 
} 
``` 

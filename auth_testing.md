# Auth Testing — The Cat Drop

Admin-only JWT cookie auth (no public register).

- Login: POST /api/auth/login {"email":"admin@thecatdrop.com","password":"catdrop2026"} — expect 200 + httpOnly cookies access_token/refresh_token
- Me: GET /api/auth/me with cookies — expect user object
- Refresh: POST /api/auth/refresh with refresh_token cookie — new access_token cookie
- Logout: POST /api/auth/logout — cookies cleared
- Brute force: 5 failed logins on same ip:email = 429 for 15 min
- Products: GET /api/products public; POST/PUT/DELETE require admin cookie

Chain test:
```
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s -c /tmp/cj -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@thecatdrop.com","password":"catdrop2026"}'
curl -s -b /tmp/cj "$API_URL/api/auth/me"
```

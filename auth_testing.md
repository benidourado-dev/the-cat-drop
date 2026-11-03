# Auth Testing — The Cat Drop

## JWT (email/senha)
- Login: POST /api/auth/login {"email":"admin@thecatdrop.com","password":"catdrop2026"} — 200 + httpOnly cookies access_token/refresh_token
- Me: GET /api/auth/me com cookie access_token OU session_token
- Refresh: POST /api/auth/refresh
- Logout: POST /api/auth/logout — limpa session_token, access_token, refresh_token e remove sessão do banco
- Brute force: 5 falhas em ip:email = 429 por 15 min

## Emergent Google OAuth
- Botão "Entrar com Google" em /admin redireciona para https://auth.emergentagent.com/?redirect=<window.location.origin>/admin (NUNCA hardcodar o redirect)
- Callback: URL #session_id=... detectada sincronamente em AppRouter (useLocation().hash) → AuthCallback → POST /api/auth/google {session_id}
- POST /api/auth/google: troca session_id em https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data (header X-Session-ID), cria/atualiza usuário (user_id custom uuid, _id excluído com {"_id": 0}), role=admin se email == ADMIN_EMAIL senão viewer, grava sessão em user_sessions (7 dias), seta cookie httpOnly session_token
- get_current_user: tenta session_token (cookie/header) primeiro, depois JWT access_token

## Teste manual Google (browser)
Criar sessão de teste:
```
mongosh --eval "
use('test_database');
var userId = 'user_testgoogle1';
var sessionToken = 'test_session_google1';
db.users.insertOne({user_id: userId, email: 'google.tester@example.com', name: 'Google Tester', picture: '', role: 'admin', password_hash: '', created_at: new Date()});
db.user_sessions.insertOne({user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(), created_at: new Date().toISOString()});
print(sessionToken);
"
```
Depois: GET /api/auth/me -H "Authorization: Bearer test_session_google1" → espera user object.
Limpar: db.users.deleteMany({email:/google\.tester/}); db.user_sessions.deleteMany({session_token:/test_session/})

## Chain test
```
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s -c /tmp/cj -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@thecatdrop.com","password":"catdrop2026"}'
curl -s -b /tmp/cj "$API_URL/api/auth/me"
```

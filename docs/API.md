# WallCanva API

Base URL: `/api`. Send `Authorization: Bearer <token>` on protected routes.

| Method | Path | Access | Description |
|---|---|---|---|
| GET | /health | public | Health check |
| POST | /auth/register | public | Create account |
| POST | /auth/login | public | Log in, returns token |
| GET | /auth/me | user | Current user |
| GET | /colors, /colors/:id | user | List or get colours |
| POST/PUT/DELETE | /colors, /colors/:id | admin | Manage colours |
| GET | /patterns, /patterns/:id | user | List or get patterns |
| POST/PUT/DELETE | /patterns, /patterns/:id | admin | Manage patterns (POST takes an image file) |
| POST | /projects/upload | user | Upload room photo (multipart, field `image`) |
| GET | /projects | user | My projects |
| GET/PUT/DELETE | /projects/:id | owner | Get, save areas, delete |
| POST | /projects/:id/duplicate | owner | Make a new trial |
| GET | /users/favourites/colors | user | My favourite colours |
| POST | /users/favourites/colors/:id | user | Toggle a favourite |
| GET | /admin/users | admin | All users with design counts |
| GET | /admin/users/:id/projects | admin | A user's designs |
| POST | /analytics/session, /analytics/session/:id/ping | user | Session tracking |
| POST | /analytics/feedback | user | Send 1-5 star feedback |
| GET | /analytics/stats, /analytics/feedback | admin | Dashboard data |
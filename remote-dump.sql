PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE data_api_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
  	expired_at TEXT NOT NULL, created_at datetime);
INSERT INTO "data_api_tokens" ("id","token","expired_at","created_at") VALUES(155,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImFkbWluIiwicm9sZSI6IkFkbWluIiwianRpIjoiYjljMmYxMDgtZTk2NS00ZWJkLWEzNjYtNTgyYjc4MzRlMjgwIiwibmJmIjoxNzgwMDkxNTc0LCJleHAiOjE3ODAwOTMzNzQsImlhdCI6MTc4MDA5MTU3NCwiaXNzIjoiUERJLUFwaVNlY3VyaXR5IiwiYXVkIjoiUERJLUFwaVNlY3VyaXR5In0.zYk4IOinwxhaU2JQPmgtr5Gh28VFm0AriVpD_XRwPTI','2026-05-29T22:22:54.1472682Z','2026-05-29T21:52:53.551Z');
INSERT INTO "data_api_tokens" ("id","token","expired_at","created_at") VALUES(156,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImFkbWluIiwicm9sZSI6IkFkbWluIiwianRpIjoiOTNkMDUxNTUtY2U4MC00OWY2LTk0NDktZWUzZjFlNTg1NWYxIiwibmJmIjoxNzgwMDkxNTk1LCJleHAiOjE3ODAwOTMzOTUsImlhdCI6MTc4MDA5MTU5NSwiaXNzIjoiUERJLUFwaVNlY3VyaXR5IiwiYXVkIjoiUERJLUFwaVNlY3VyaXR5In0.442-R2WIew4aRcr4HyAbUm2zsE2nVD8cdw4u_M8hFMg','2026-05-29T22:23:15.2731514Z','2026-05-29T21:53:14.676Z');
INSERT INTO "data_api_tokens" ("id","token","expired_at","created_at") VALUES(157,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImFkbWluIiwicm9sZSI6IkFkbWluIiwianRpIjoiY2NlZmZkNjUtZWIxZi00YjJiLWJiYTItODBlNGRlYmJmYjRiIiwibmJmIjoxNzgwMDkxNjMzLCJleHAiOjE3ODAwOTM0MzMsImlhdCI6MTc4MDA5MTYzMywiaXNzIjoiUERJLUFwaVNlY3VyaXR5IiwiYXVkIjoiUERJLUFwaVNlY3VyaXR5In0.-PxvRg-mCN-geoZmo3SLCZO4d5Yzx5vM1LKloXx9fjc','2026-05-29T22:23:53.4529856Z','2026-05-29T21:53:52.859Z');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('data_api_tokens',157);

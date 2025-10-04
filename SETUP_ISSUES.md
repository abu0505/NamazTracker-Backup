# Replit Setup Guide

This document outlines how the NamazTracker application was successfully set up in the Replit environment and serves as a reference for future setups.

## Issues Encountered

### 1. Missing Cross-Env Package
**Issue:** The application failed to start with the error:
```
sh: 1: cross-env: not found
```

**Root Cause:** The `node_modules` directory was not present because dependencies weren't installed after the GitHub import.

**Solution:** Ran `npm install` to install all dependencies listed in `package.json`, including the `cross-env` package needed for cross-platform environment variable management.

---

### 2. Vite Configuration for Replit Proxy
**Issue:** The application needed to work within Replit's iframe proxy environment where the frontend is not directly accessible at `localhost:5000`.

**Root Cause:** By default, Vite's development server has host restrictions that would block requests coming from Replit's proxy domain.

**Solution:** The Vite configuration in `server/vite.ts` was already properly set up with:
```typescript
const serverOptions = {
  middlewareMode: true,
  hmr: { server },
  allowedHosts: true, // This allows all hosts including Replit's proxy
};
```

This configuration was already in place, so no changes were needed.

---

### 3. Server Binding to Correct Host and Port
**Issue:** The server needed to bind to the correct host and port for Replit's environment.

**Root Cause:** Replit requires servers to bind to `0.0.0.0:5000` to be accessible through their proxy system. Port 5000 is the only port not firewalled.

**Solution:** The server was already correctly configured in `server/index.ts`:
```typescript
const port = parseInt(process.env.PORT || '5000', 10);
server.listen(port, "0.0.0.0", () => {
  log(`IslamIC Prayer Tracker running at http://0.0.0.0:${port}`);
});
```

---

### 4. Workflow Configuration
**Issue:** The workflow needed to be properly configured with the correct output type and port.

**Root Cause:** Frontend applications in Replit require the `webview` output type and must wait for port 5000 to be ready.

**Solution:** Configured the workflow with:
- Name: "Start application"
- Command: `npm run dev`
- Output Type: `webview`
- Wait for Port: `5000`

---

### 5. Database Connection Without Demo User
**Issue:** The application connected to the PostgreSQL database successfully, but the API returned 500 errors when trying to fetch user stats:
```
GET /api/stats 500 in 62ms :: {"message":"insert or update on table \"user_stat...
```

**Root Cause:** The database tables existed but the demo user (`id: 'demo-user'`) wasn't present in the database. When the API tried to create user stats for a non-existent user, it violated the foreign key constraint.

**Solution:** 
1. Verified database connection and checked that all tables existed:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   -- Result: users, achievements, prayer_records, user_stats
   ```

2. Checked for demo user and found none existed:
   ```sql
   SELECT id, username, email FROM users WHERE id = 'demo-user';
   -- Result: 0 rows
   ```

3. Created the demo user and initial stats:
   ```sql
   INSERT INTO users (id, username, email, password_hash, first_name, last_name, is_active, created_at, updated_at)
   VALUES ('demo-user', 'demo', 'demo@example.com', '', 'Demo', 'User', true, NOW(), NOW())
   ON CONFLICT (id) DO NOTHING;

   INSERT INTO user_stats (user_id, total_prayers, on_time_prayers, qaza_prayers, current_streak, best_streak, perfect_weeks, last_streak_update, updated_at)
   VALUES ('demo-user', 0, 0, 0, 0, 0, 0, NULL, NOW())
   ON CONFLICT (user_id) DO NOTHING;
   ```

4. After inserting the demo user, the API started working correctly with status 200 responses.

---

## LSP Diagnostic Warning (Non-Critical)

**Warning:** TypeScript LSP shows an error in `server/vite.ts`:
```
Module '"vite"' has no exported member 'createServer'.
```

**Impact:** This is a TypeScript definition issue that doesn't affect runtime. The application runs successfully because `createServer` is available at runtime from the Vite package.

**Status:** Non-critical - no action needed. The code works correctly despite the LSP warning.

---

## Verification Steps

After resolving all issues, the following verification was performed:

1. ✅ Server starts successfully on port 5000
2. ✅ Database connection established to heliumdb
3. ✅ All API endpoints return successful responses
4. ✅ Frontend loads without console errors
5. ✅ All pages accessible and functional:
   - Dashboard - Shows today's prayers with prayer times
   - Qaza - Historical prayer management
   - Achievements - Streak tracking and badges
   - Analytics - Prayer completion trends

---

## Final Configuration Summary

**Environment Variables:**
- `DATABASE_URL`: Automatically configured by Replit PostgreSQL service
- `NODE_ENV`: Set to `development` via cross-env in npm scripts
- `PORT`: Set to 5000 (required by Replit)

**Workflow:**
- Name: "Start application"
- Command: `npm run dev`
- Port: 5000
- Output Type: webview
- Status: Running successfully

**Deployment:**
- Target: autoscale (for stateless web applications)
- Build: `npm run build` (Vite frontend + esbuild backend)
- Run: `npm run start` (production server)

**Database:**
- Type: PostgreSQL (Replit's built-in database service)
- Tables: users, prayer_records, achievements, user_stats
- Demo User: Created with ID 'demo-user' for authentication-disabled mode
- Schema Management: Drizzle ORM with `npm run db:push` for migrations

---

## Lessons Learned

1. **Always run npm install after GitHub imports** - Dependencies aren't included in repositories.

2. **Replit requires specific server configuration** - Must bind to `0.0.0.0:5000` and allow all hosts in Vite config.

3. **Database setup requires initial data** - Even with correct schema, foreign key constraints require parent records to exist first.

4. **Workflow configuration is critical** - Frontend applications must use `webview` output type and wait for port 5000.

5. **LSP warnings don't always indicate runtime issues** - TypeScript type definitions can lag behind actual package exports.

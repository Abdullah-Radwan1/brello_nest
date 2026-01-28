# 🛠️ STEP-BY-STEP FIX COMMANDS

Run these commands in order to apply all security fixes:

## Step 1: Install Required Dependency (5 minutes)

```bash
cd d:\Work\projects\apex\apex_nest
npm install @nestjs/helmet
```

**What this does:** Installs security headers middleware

---

## Step 2: Generate JWT Secret (2 minutes)

```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Output will look like:**

```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3
```

💾 **COPY this value** - you'll need it in next step

---

## Step 3: Create .env.production File (5 minutes)

Create a new file: `d:\Work\projects\apex\apex_nest\.env.production`

Content template:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=<PASTE_YOUR_GENERATED_SECRET_HERE>
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require
FRONTEND_URL=https://yourdomain.com
```

⚠️ **CRITICAL:** Replace these values:

- `JWT_SECRET` - Paste from Step 2
- `DATABASE_URL` - Your actual PostgreSQL connection string with NEW password
- `FRONTEND_URL` - Your production frontend domain

---

## Step 4: Rotate Database Password (10 minutes)

**Your current password was exposed in package.json. You MUST change it:**

### For Neon PostgreSQL:

1. Go to https://console.neon.tech
2. Find your project
3. Go to "Connection Details"
4. Reset password for the user
5. Copy new connection string
6. Update DATABASE_URL in .env.production

### For AWS RDS:

1. Go to RDS Console
2. Select your database
3. Modify → Change Master Password
4. Get new endpoint and password
5. Update DATABASE_URL in .env.production

### For Other Providers:

Contact your provider's documentation for password rotation

---

## Step 5: Verify Configuration (5 minutes)

Check that your .env.production has all required values:

```bash
cd d:\Work\projects\apex\apex_nest

# Check file exists
type .env.production

# Should show:
# NODE_ENV=production
# PORT=3000
# JWT_SECRET=<long_hex_string>
# DATABASE_URL=postgresql://...
# FRONTEND_URL=https://...
```

---

## Step 6: Build Application (10 minutes)

```bash
npm run build
```

**Expected output:**

```
✔ Webpack successfully compiled with 0 warning(s)
```

---

## Step 7: Run Tests (10 minutes)

```bash
npm run test:e2e
```

**Should pass all tests**

---

## Step 8: Test Production Build Locally (5 minutes)

```bash
NODE_ENV=production npm run start:prod
```

**Expected output:**

```
Nest application successfully started [PORT]
```

Test the API:

```bash
# In another terminal
curl http://localhost:3000/auth/me

# Should return 401 (unauthorized) - that's correct!
# Means authentication is enforced
```

Press `Ctrl+C` to stop the server

---

## Step 9: Clean Git History (if you pushed secrets) (10 minutes)

⚠️ **Only if you committed to GitHub with exposed secrets:**

```bash
# Install git-filter-repo if not already installed
npm install --save-dev git-filter-repo

# See what branches exist
git branch -a

# Remove package.json from entire history (CAREFUL!)
git filter-repo --invert-paths --path package.json

# Force push (be careful with this!)
git push --force-all

# Notify your team to re-clone the repo
```

⚠️ This is a destructive operation - only do it if you exposed secrets!

---

## Step 10: Deploy to Production (varies)

### For Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# When prompted, add environment variables:
# NODE_ENV=production
# JWT_SECRET=<from step 2>
# DATABASE_URL=<from step 4>
# FRONTEND_URL=<your domain>
```

### For AWS Lambda/EC2/Other:

1. Set environment variables in your hosting platform
2. Deploy your build
3. Verify all env vars are set

---

## Step 11: Post-Deployment Verification (15 minutes)

### Test Authentication

```bash
# Try to register with weak password (should fail)
curl -X POST https://yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"weak",
    "name":"Test",
    "color":"VIOLET"
  }'
# Should return error about password requirements

# Try with strong password (should work)
curl -X POST https://yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"SecurePass123!@#",
    "name":"Test",
    "color":"VIOLET"
  }'
```

### Test Rate Limiting

```bash
# Try username check multiple times
for i in {1..6}; do
  curl "https://yourdomain.com/users/check-name?name=testuser"
  echo "Attempt $i"
done
# 6th attempt should be throttled

# Try login 6 times with wrong password
# 6th attempt should be throttled
```

### Test CORS

```bash
# From unauthorized domain (should fail)
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: GET" \
     https://yourdomain.com/auth/me

# From your domain (should work)
curl -H "Origin: https://yourdomain.com" \
     https://yourdomain.com/auth/me
```

### Test Error Messages

```bash
# Request invalid endpoint
curl https://yourdomain.com/invalid

# Should return generic error, not stack trace
# Should look like: {"statusCode":404,"message":"Resource not found"}
```

---

## ✅ Completion Checklist

- [ ] Helmet installed
- [ ] JWT secret generated
- [ ] .env.production created with all values
- [ ] Database password rotated
- [ ] Build successful (`npm run build`)
- [ ] Tests pass (`npm run test:e2e`)
- [ ] Local production test works
- [ ] Git history cleaned (if needed)
- [ ] Deployed to production
- [ ] All post-deployment tests pass
- [ ] Team notified about fixes
- [ ] Monitoring set up for production
- [ ] Backups verified

---

## 🆘 Troubleshooting

### "Module not found: helmet"

```bash
npm install @nestjs/helmet
npm run build
```

### "JWT_SECRET not defined"

- Make sure .env.production exists
- Make sure NODE_ENV=production is set before running
- Verify file is not in .gitignore accidentally

### "Database connection failed"

- Verify DATABASE_URL is correct
- Make sure new password is used (not old exposed one)
- Test connection manually:

```bash
psql "postgresql://user:password@host:port/dbname?sslmode=require"
```

### "Tests still failing"

- Rebuild: `npm run build`
- Clear cache: `npm run clean` (if available)
- Reinstall: `rm -rf node_modules && npm install`

### "Rate limiting too aggressive"

- Adjust limits in `src/app.module.ts`
- Current: 100/min global, 5/15min login
- Test thoroughly before adjusting

### "CORS still blocked"

- Verify FRONTEND_URL is set correctly
- Check exact domain (www. vs no www, https only)
- No trailing slashes

---

## 📞 Final Notes

1. **Never** commit `.env.production` to git
2. **Always** verify all environment variables are set before deploying
3. **Test** everything locally before production deployment
4. **Monitor** error logs after deployment
5. **Rotate** secrets quarterly
6. **Update** dependencies monthly

---

**Estimated Total Time:** 60-90 minutes
**Difficulty:** Easy to Medium
**Risk:** Low (if following steps carefully)

**Good luck! Your backend is now secure! 🔐**

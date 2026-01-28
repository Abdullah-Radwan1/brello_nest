# 🚀 DEPLOYMENT SECURITY CHECKLIST

## Pre-Deployment Verification

### 1. Environment Variables ✅

- [ ] Create `.env.production` with all required secrets
- [ ] Ensure `NODE_ENV=production` is set
- [ ] Generate new strong `JWT_SECRET` (at least 32 random characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Update `DATABASE_URL` with production database credentials
- [ ] Set `FRONTEND_URL` to your production domain

### 2. Database Security ✅

- [ ] Rotate database password immediately (your old password was exposed)
- [ ] Verify SSL/TLS is enabled (`sslmode=require`)
- [ ] Check database backups are configured
- [ ] Verify database user has only necessary permissions

### 3. Code Review ✅

- [ ] Remove any remaining hardcoded secrets
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Verify all fixes from the security audit are applied
- [ ] Check `.env.production` is in `.gitignore`
- [ ] Do NOT commit `.env.production` to version control

### 4. Dependencies ✅

- [ ] Ensure Helmet is installed: `npm install @nestjs/helmet`
- [ ] Update all packages: `npm audit fix`
- [ ] Remove any unused dependencies

### 5. Testing ✅

- [ ] Run unit tests: `npm run test`
- [ ] Run e2e tests: `npm run test:e2e`
- [ ] Test authentication flow
- [ ] Test CORS with production domain
- [ ] Verify rate limiting works
- [ ] Test password validation (strong requirements)

### 6. Secrets Management ✅

- [ ] Never store secrets in code or version control
- [ ] Use environment variables or secret management service
- [ ] Rotate secrets regularly
- [ ] Consider using:
  - AWS Secrets Manager (if AWS)
  - GitHub Secrets (for CI/CD)
  - Vercel Secrets (if using Vercel)
  - HashiCorp Vault

### 7. Monitoring & Logging ✅

- [ ] Set up error tracking (Sentry, DataDog, etc.)
- [ ] Enable request logging
- [ ] Set up alerts for suspicious activities
- [ ] Monitor failed login attempts
- [ ] Track API rate limit violations

### 8. API Security ✅

- [ ] Verify CORS only allows production domain
- [ ] Ensure all sensitive endpoints require authentication
- [ ] Test authorization (manager vs contributor roles)
- [ ] Verify SQL injection protection (you use Drizzle ORM - good!)
- [ ] Check XSS protection via Helmet

### 9. HTTPS/TLS ✅

- [ ] Ensure your domain has valid SSL certificate
- [ ] Configure HSTS headers (Helmet handles this)
- [ ] Test with https:// only
- [ ] Redirect http:// to https://

### 10. Deployment ✅

- [ ] Build application: `npm run build`
- [ ] Test production build locally: `npm run start:prod`
- [ ] Deploy with `NODE_ENV=production`
- [ ] Verify environment variables are set in production
- [ ] Test all endpoints in production
- [ ] Monitor for errors immediately after deployment

## Deployment Commands

```bash
# Install dependencies
npm install

# Build application
npm run build

# Run tests
npm run test:e2e

# Start in production (with NODE_ENV=production)
NODE_ENV=production node dist/main
```

## Production Environment Setup Example (Vercel)

In your Vercel dashboard, add these environment variables:

```
NODE_ENV=production
JWT_SECRET=<your-secure-random-secret>
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
FRONTEND_URL=https://yourdomain.com
PORT=3000
```

## Post-Deployment

- [ ] Monitor application logs for errors
- [ ] Check API response times
- [ ] Verify rate limiting is working
- [ ] Test CORS restrictions with curl from different origins
- [ ] Verify HTTPS is enforced
- [ ] Check error messages don't expose sensitive info
- [ ] Monitor database performance
- [ ] Set up automated backups

## Security Headers (Helmet provides)

Your API now includes:

- `Content-Security-Policy`: Prevents XSS
- `Strict-Transport-Security`: Enforces HTTPS
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- And more...

## Regular Maintenance

- [ ] Run `npm audit` monthly
- [ ] Review and rotate secrets quarterly
- [ ] Review access logs for suspicious activity
- [ ] Update dependencies regularly
- [ ] Test disaster recovery procedures

## Rollback Plan

If something goes wrong:

1. Revert to previous version
2. Use database backups to restore
3. Notify users of incident
4. Post-mortem analysis
5. Fix and redeploy

## Contact Security Issues

If you discover security issues, handle them responsibly:

1. Don't disclose publicly
2. Email security@yourcompany.com
3. Allow time for fix before disclosure

# Troubleshooting Guide - Cloudflare S3 Image Uploads

## Error: 413 Request Entity Too Large

### What it means
The file you're trying to upload is too large for the server to handle.

### Solutions

#### 1. Fixed in this update
- Next.js `bodyParser.sizeLimit` increased to **50MB** in `next.config.mjs`
- Images are automatically **compressed and resized** before upload
- Large images are downsampled to **1200px** width maximum

#### 2. Verify Image Size
- Check the image dimensions (should be reasonable)
- Test with a smaller image first (< 5MB)
- Use modern formats: PNG, JPEG, or WebP

#### 3. Browser Cache
Clear your browser cache and try again:
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear cookies/cache in DevTools

---

## Error: Invalid Response / JSON Parse Error

### What it means
The server responded with an error, but the error message wasn't properly formatted JSON.

### Solutions

#### 1. Check Cloudflare S3 Configuration
Verify all environment variables are set correctly:
```
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ACCESS_KEY_ID=
CLOUDFLARE_SECRET_ACCESS_KEY=
CLOUDFLARE_BUCKET_NAME=
CLOUDFLARE_ENDPOINT_URL=
CLOUDFLARE_PUBLIC_URL=
```

#### 2. Check Server Logs
Look for `[v0]` debug messages in your server logs:
- `[v0] Upload API called` - API reached
- `[v0] Image validation passed` - Image is valid
- `[v0] Image processed` - Compression successful
- `[v0] Uploading to S3` - Attempting S3 upload

#### 3. Test S3 Connection
Run this command to verify Cloudflare credentials:
```bash
aws s3 ls s3://your-bucket-name --endpoint-url https://your-account-id.r2.cloudflarestorage.com
```

---

## Error: Unauthorized (401)

### What it means
You're not authenticated as an admin.

### Solutions

#### 1. Check Admin Role
Verify in Supabase that your user has `role = 'admin'`

#### 2. Login Again
Logout and login with your admin account

#### 3. Check Session
Open DevTools → Application → Cookies, verify session cookie exists

---

## Error: Cloudflare S3 Not Found (404)

### What it means
Bucket doesn't exist or credentials are wrong.

### Solutions

#### 1. Verify Bucket Exists
- Go to Cloudflare R2 dashboard
- Check bucket name matches `CLOUDFLARE_BUCKET_NAME`

#### 2. Check Endpoint URL
Verify format:
```
https://[ACCOUNT-ID].r2.cloudflarestorage.com
```

#### 3. Verify Credentials
- Account ID: From R2 dashboard
- Access Key ID & Secret: From token creation (regenerate if needed)
- Bucket Name: Exact name from R2 dashboard

---

## Image Not Showing After Upload

### What it means
Image uploaded successfully but can't be accessed via public URL.

### Solutions

#### 1. Check Public URL Configuration
```
CLOUDFLARE_PUBLIC_URL should be:
https://abc123.r2.cloudflarestorage.com
OR your custom domain:
https://cdn.yourdomain.com
```

#### 2. Verify Bucket Public Access
- Go to Cloudflare R2 dashboard
- Check bucket settings allow public read access

#### 3. Use Custom Domain for Production
For best results, connect a custom domain:
- R2 Dashboard → Buckets → Your Bucket → Settings
- Add Custom Domain (e.g., `cdn.yourdomain.com`)
- Update `CLOUDFLARE_PUBLIC_URL` to use it

---

## Slow Image Uploads

### Why it happens
- Large images before compression
- Network latency to Cloudflare
- Rate limiting on free R2 tier

### Solutions

#### 1. Upgrade Cloudflare Plan
R2 free tier has rate limits. Consider upgrading for production.

#### 2. Use Smaller Source Images
Images are resized to 1200px, so no need for larger originals

#### 3. Wait for Custom Domain Setup
Connected custom domains have better caching and performance

---

## Rate Limiting Warnings

### What it means
> "This URL is rate-limited and not recommended for production"

This is normal for Cloudflare's default R2 URL. For production:

1. **Connect a Custom Domain**
   - Enables Cloudflare caching
   - Removes rate limiting
   - Better performance globally

2. **Setup Instructions**
   - Go to R2 dashboard
   - Select your bucket
   - Add custom domain (e.g., `cdn.yourdomain.com`)
   - Add CNAME in your domain DNS
   - Update `CLOUDFLARE_PUBLIC_URL` env var

---

## Still Not Working?

### Enable Debug Logging

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try uploading an image
4. Check the request/response details
5. Look for `[v0]` messages in server logs

### Check Server Logs

```bash
# In your terminal running the Next.js dev server
# Look for lines starting with [v0]
```

### Contact Support

If you're still having issues:
1. Note the exact error message
2. Check Cloudflare R2 dashboard for API errors
3. Verify all environment variables are set
4. Try with a different image file

---

## Performance Tips

### For Best Results:

1. **Recommended Image Sizes**
   - Width: 1200px+ (will be resized if smaller)
   - Format: PNG, JPEG, or WebP
   - Size: < 5MB (will be compressed to ~100-300KB)

2. **Upload Settings**
   - Use drag & drop for faster uploads
   - Multiple uploads are sequential (one at a time)
   - Progress bar shows real-time upload status

3. **Cloudflare Configuration**
   - Use R2 with custom domain for production
   - Enable caching on your custom domain
   - Consider R2 paid tier for high-traffic sites

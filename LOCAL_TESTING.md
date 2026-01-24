# Local Testing with Netlify Dev

This guide helps you test your API routes locally before deploying to Netlify.

## Quick Start

### Option 1: Test with Netlify Dev (Recommended for API debugging)

1. **Navigate to the app directory:**
   ```powershell
   cd "5d-character-creator-app/app"
   ```

2. **Start Netlify Dev:**
   ```powershell
   netlify dev
   ```

3. **Test your API:**
   - The app will be available at `http://localhost:8888`
   - Test the connection in Settings page
   - Check console for detailed error messages

### Option 2: Test with Next.js Dev (Faster for UI development)

1. **Navigate to the app directory:**
   ```powershell
   cd "5d-character-creator-app/app"
   ```

2. **Start Next.js dev server:**
   ```powershell
   npm run dev
   ```

3. **Test your API:**
   - The app will be available at `http://localhost:3000`
   - Test the connection in Settings page

## Testing API Endpoints Directly

### Test Basic Endpoint
```powershell
# Test the basic test endpoint
curl http://localhost:8888/api/test
```

### Test Chat Endpoint (with your API key)
```powershell
curl -X POST http://localhost:8888/api/chat `
  -H "Content-Type: application/json" `
  -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Say hello\"}],\"provider\":\"anthropic\",\"apiKey\":\"YOUR_API_KEY_HERE\"}'
```

## Debugging Tips

1. **Check Terminal Output:**
   - When you test the connection, watch the terminal where `netlify dev` is running
   - You'll see detailed error messages and stack traces

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look at the Console and Network tabs
   - Check the actual error response

3. **Common Issues:**
   - **Port already in use:** Change the port in `netlify.toml` or kill the process using port 8888
   - **Module not found:** Run `npm install` in the app directory
   - **API key errors:** Make sure your API key is correct and has proper permissions

## What to Look For

When testing locally, you should see:
- ✅ Detailed error messages in the terminal
- ✅ Stack traces showing exactly where the error occurs
- ✅ Request/response logs
- ✅ API key validation errors (if any)

This will help identify if the issue is:
- API key format/validity
- Network/connectivity
- Code errors
- Configuration issues

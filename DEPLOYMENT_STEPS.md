# Deployment Steps

## The Problem
The GitHub repo still has the old `vercel.json` file. You need to push the updated configuration.

## Updated Vercel Configuration
I've simplified the `vercel.json` to use the more reliable `builds` syntax instead of `functions`:

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    },
    {
      "src": "api/index.ts", 
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/public/$1"
    }
  ]
}
```

## Next Steps

1. **Push the changes to GitHub** - The updated `vercel.json` needs to be in your repo
2. **Verify Environment Variables** in Vercel:
   - `DATABASE_URL` = your Supabase connection string
3. **Redeploy** once the new config is pushed

This simplified configuration should resolve the runtime version error.
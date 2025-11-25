# How to Export Your Data from Supabase

## Video Guide (Easiest)
1. Log in to your Supabase project at https://supabase.io
2. Go to the SQL Editor
3. Run these queries one by one to export your data as JSON:

```sql
-- Export users
SELECT json_agg(row_to_json(t)) FROM public.users t;

-- Export admins  
SELECT json_agg(row_to_json(t)) FROM public.admins t;

-- Export messages
SELECT json_agg(row_to_json(t)) FROM public.messages t;

-- Export replies
SELECT json_agg(row_to_json(t)) FROM public.replies t;
```

4. Copy the result from each query
5. Create a file in this directory:
   - `users.json` (paste users query result)
   - `admins.json` (paste admins query result)
   - `messages.json` (paste messages query result)
   - `replies.json` (paste replies query result)

## Manual Export via Supabase UI
1. Go to Supabase Dashboard → Your Project
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Paste one of the SQL queries above
5. Click "Run"
6. Click "Copy" on the results
7. Create a `.json` file with that name in this directory
8. Paste the result

## After You Have Files:
1. Copy all `.json` files into this `data-exports/` folder
2. From the root directory, run:
   ```bash
   node scripts/import-data.mjs
   ```
3. Your data will be imported!

## What the files should look like:
```json
[
  {
    "id": 1,
    "username": "user123",
    "display_name": "User Display",
    "bio": "My bio",
    ...
  },
  {
    "id": 2,
    ...
  }
]
```

That's it! Questions? Check the DATABASE or ask me for help.

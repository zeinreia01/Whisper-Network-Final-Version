# Data Import Guide

Your Whisper Network app is now running on Replit with a fresh database. To restore your old data, follow these steps:

## Step 1: Export Data from Supabase

1. Go to your Supabase dashboard
2. For each table below, export as JSON:
   - **users** table
   - **admins** table
   - **messages** table
   - **replies** table
   - (Optional) other tables like reactions, notifications, etc.

**Export Instructions:**
- Click on the table name
- Click the `↙` download icon (top right)
- Select "JSON" format
- Save the file

## Step 2: Prepare Import Files

Create a `data-exports` folder in your project root with these JSON files:
```
data-exports/
├── users.json
├── admins.json
├── messages.json
├── replies.json
└── (other tables as needed)
```

## Step 3: Run the Import

Execute the import script:
```bash
npm run import-data
```

The script will:
1. Read your JSON files from `data-exports/`
2. Insert all data into the database
3. Skip duplicates if needed
4. Show you a progress report

## What Gets Imported

The import script handles these tables:
- ✅ Users (accounts)
- ✅ Admins (staff accounts)
- ✅ Messages (public & private messages)
- ✅ Replies (threaded replies)

For other tables (reactions, notifications, follows, etc.), you can:
1. Export them the same way as JSON
2. Add them to `data-exports/`
3. They'll be detected and imported automatically

## Troubleshooting

**"No data-exports directory found"**
- Create the directory: `mkdir data-exports`
- Add your JSON files

**Import fails with type errors**
- Make sure your JSON fields match the app schema
- Check that IDs are integers (not UUIDs)

**Data not showing up**
- Restart the app: refresh your browser
- Check database directly: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"`

## Database Connection

Your database is already configured via `DATABASE_URL` environment variable. No additional setup needed!

---

Need help? Your app is running at: http://localhost:5000

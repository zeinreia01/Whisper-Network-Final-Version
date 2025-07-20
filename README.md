# 🌸 Whispering Network

A compassionate digital sanctuary for anonymous emotional expression. Built with React, TypeScript, Express.js, and PostgreSQL.

## ✨ Features

- **Anonymous Messaging** - Share thoughts without revealing identity
- **Category System** - Organize messages by type (Love, Advice, Confession, etc.)
- **Spotify Integration** - Attach music to express emotions
- **User Accounts** - Optional "Silent Messenger" accounts with profiles
- **Admin System** - "Whisper Listeners" for content moderation
- **Real-time Reactions** - Heart reactions and notifications
- **Social Features** - Follow users, view profiles, get notifications
- **Search & Filter** - Find messages by content or category
- **Mobile Responsive** - Perfect on all devices
- **Dark Mode** - Discord-style dark theme
- **Message Viewer** - Download beautiful message images

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whispering-network.git
   cd whispering-network
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase database URL:
   ```
   DATABASE_URL=your_supabase_postgresql_url
   ```

4. **Set up database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5000` to see the app!

## 📦 Deployment

### Vercel + Supabase (Recommended)

This app is optimized for Vercel's free plan with Supabase:

1. **Deploy to Vercel:**
   - Connect your GitHub repo to Vercel
   - Add `DATABASE_URL` environment variable
   - Deploy automatically builds and serves the app

2. **Database:**
   - Uses Supabase PostgreSQL (free tier)
   - Connection pooling for serverless compatibility
   - All tables auto-created via Drizzle migrations

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Shadcn/ui
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Supabase), Drizzle ORM
- **Deployment:** Vercel (frontend + serverless functions)
- **Authentication:** Custom auth with bcrypt
- **State Management:** TanStack Query

## 📁 Project Structure

```
whispering-network/
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types & schemas
├── api/              # Vercel serverless functions
└── dist/             # Build output
```

## 🎯 User Types

- **Anonymous Users** - Can send messages and read public content
- **Silent Messengers** - Registered users with profiles and social features
- **Whisper Listeners** - Admins with moderation capabilities

## 🔒 Privacy & Safety

- Anonymous messaging by default
- Optional user accounts with username-only registration
- Admin moderation system
- Content filtering and safety resources
- No personal data collection beyond usernames

## 📱 Mobile Support

Fully responsive design optimized for mobile devices with touch-friendly interface and mobile-specific optimizations.

## 🌙 Dark Mode

Beautiful Discord-style dark mode with smooth transitions and consistent theming across all components.

## 📄 License

MIT License - feel free to use for your own projects!

## 💝 Contributing

Contributions welcome! Please read the contributing guidelines and submit pull requests.

---

*Built with 💜 by the community, for the community*
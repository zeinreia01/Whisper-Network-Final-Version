
# 🌸 Whispering Network

A compassionate digital sanctuary for anonymous emotional expression. Built with React, TypeScript, Express.js, and PostgreSQL.

## ✨ Features

### Core Messaging
- **Anonymous Messaging** - Share thoughts without revealing identity
- **Category System** - Organize messages by type (Confession, Rant, Reflection, Writing, Love, Advice, Support, etc.)
- **Threaded Replies** - Full nested comment system with proper reply threading
- **Message Viewer** - Download beautiful message images with elegant dark mode styling
- **Spotify Integration** - Attach music to express emotions with rich Spotify track previews

### User System
- **Anonymous Users** - Can send messages and read public content
- **Silent Messenger Accounts** - Registered users with usernames and enhanced features
- **User Profiles** - View message history, statistics, and social connections
- **Verification System** - Verified user badges with admin approval process
- **Follow System** - Follow other Silent Messengers and build connections

### Social Features
- **Real-time Reactions** - Heart reactions on messages and replies
- **Notification System** - Get notified of reactions, follows, and admin actions
- **User Statistics** - Track message count, reply count, total reactions, followers/following
- **Profile Customization** - Upload profile pictures with drag-and-drop interface
- **Personal Archive** - View your own message history and manage content

### Admin System
- **Whisper Listeners** - Admin accounts with comprehensive moderation tools
- **Message Moderation** - Review and approve private messages
- **User Management** - Manage user accounts, verification status, and permissions
- **Reply Management** - Delete inappropriate replies and moderate discussions
- **Admin Dashboard** - Overview of platform statistics and activity
- **Admin Profiles** - Dedicated admin profile pages with moderation history

### Technical Features
- **Search & Filter** - Find messages by content, category, or user
- **Mobile Responsive** - Perfect experience on all devices with touch-friendly interface
- **Dark Mode** - Beautiful Discord-style dark theme with smooth transitions
- **Real-time Updates** - Live updates using TanStack Query for seamless experience
- **Image Processing** - Professional message image generation with HTML2Canvas
- **File Upload System** - Secure profile picture uploads with validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)

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
   Edit `.env` and add your database URL:
   ```
   DATABASE_URL=your_postgresql_database_url
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

### Replit Deployment (Recommended)

This app is optimized for Replit deployment:

1. **Fork or Import to Replit**
   - Import the GitHub repository to Replit
   - Add `DATABASE_URL` to Replit Secrets
   - The app automatically builds and runs

2. **Database Setup**
   - Uses PostgreSQL (Supabase free tier recommended)
   - Connection pooling for serverless compatibility
   - All tables auto-created via Drizzle migrations

3. **Environment Configuration**
   - Set `DATABASE_URL` in Replit Secrets
   - App runs on port 5000 by default
   - Automatic HTTPS in production

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Shadcn/ui
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL, Drizzle ORM
- **State Management:** TanStack Query (React Query)
- **Authentication:** Custom auth system with bcrypt
- **File Processing:** HTML2Canvas for image generation
- **Deployment:** Replit (full-stack hosting)
- **UI Components:** Radix UI primitives with custom styling

## 📁 Project Structure

```
whispering-network/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Express backend
│   ├── routes.ts         # API route handlers
│   ├── storage.ts        # Database operations
│   └── index.ts          # Server entry point
├── shared/               # Shared types & schemas
│   └── schema.ts         # Database schema definitions
├── api/                  # Serverless function entry points
└── dist/                 # Build output
```

## 🎯 User Types & Permissions

### Anonymous Users
- Create and view public messages
- Reply to messages with any nickname
- Browse all public content
- Use all message categories

### Silent Messengers (Registered Users)
- All anonymous user features
- Persistent username identity
- Send private messages to admins
- Manage replies on own messages
- Follow other users and get notifications
- Upload profile pictures
- View detailed profile statistics
- Access personal message archive

### Whisper Listeners (Admins)
- All Silent Messenger features
- Review and approve private messages
- Delete inappropriate content
- Manage user accounts and verification
- Access admin dashboard with platform statistics
- Moderate threaded discussions
- Grant verification badges

## 🔒 Privacy & Safety

- **Anonymous by Default** - No personal information required
- **Optional Registration** - Username-only accounts for enhanced features
- **Content Moderation** - Active admin oversight and community guidelines
- **Privacy Controls** - Users control their own content and visibility
- **Safety Resources** - Built-in crisis support information and resources
- **Secure Authentication** - Bcrypt password hashing and session management
- **No Data Mining** - Minimal data collection focused on core functionality

## 📱 Mobile Experience

- **Responsive Design** - Optimized layouts for all screen sizes
- **Touch-Friendly Interface** - Large tap targets and smooth interactions
- **Mobile Navigation** - Collapsible menus and accessible controls
- **Fast Loading** - Optimized bundle sizes and efficient rendering
- **Offline Resilience** - Graceful handling of connection issues

## 🌙 Dark Mode

- **System Integration** - Respects user's system preference
- **Manual Toggle** - Easy switching between light and dark themes
- **Consistent Theming** - All components styled for both modes
- **Smooth Transitions** - Elegant animations when switching themes
- **Accessibility Compliant** - Proper contrast ratios and readable text

## 🎨 Design Philosophy

The Whispering Network embodies a philosophy of authentic connection through anonymity. Our design creates a sanctuary where:

- **Vulnerability meets Safety** - Express yourself without fear of judgment
- **Anonymity enables Authenticity** - Be your true self without social pressure
- **Community fosters Healing** - Support others while finding your own peace
- **Technology serves Humanity** - Tools that enhance rather than exploit human connection

## 🔧 Advanced Features

### Threaded Conversations
- **Nested Replies** - Full comment threading like Reddit/Twitter
- **Visual Hierarchy** - Clear parent-child relationship indicators
- **Smart Notifications** - Get notified when someone replies to your messages
- **Moderation Tools** - Admins can manage entire conversation threads

### Rich Content Support
- **Spotify Integration** - Share songs that express your emotions
- **Message Categories** - Organized content discovery
- **Image Generation** - Beautiful downloadable message cards
- **Content Filtering** - Find exactly what you're looking for

### Social Connections
- **Follow System** - Build meaningful connections with other users
- **Profile Insights** - View user statistics and message history
- **Verification Badges** - Distinguish trusted community members
- **Notification Center** - Stay updated on all your interactions

## 📊 Platform Statistics

The admin dashboard provides comprehensive insights:
- Total messages and replies
- User engagement metrics
- Content moderation statistics
- Growth and activity trends

## 🎵 Spotify Integration

Share the soundtrack to your emotions:
- **Rich Previews** - See track details and album artwork
- **Direct Links** - Easy access to full songs on Spotify
- **Emotional Context** - Music that matches your message's mood
- **Discovery** - Find new music through others' shares

## 🏆 Verification System

Earn your verified status:
- **Admin Review** - Thoughtful evaluation of community contributions
- **Special Badges** - Visual recognition of trusted members
- **Enhanced Features** - Additional capabilities for verified users
- **Community Trust** - Build reputation through positive interactions

## 📄 License

MIT License - feel free to use for your own projects!

## 💝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🙏 Acknowledgments

Special thanks to all the Silent Messengers and Whisper Listeners who make this community a safe and supportive space for authentic expression.

---

*Built with 💜 by the community, for the community*

### 🌟 "In every whisper shared, in every heart that listens, in every moment of genuine connection—we prove that humanity's greatest strength lies not in being seen, but in truly seeing others."

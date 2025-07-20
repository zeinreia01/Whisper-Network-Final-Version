# Whispering Network

## Overview

Whispering Network is a comprehensive full-stack web application designed as a compassionate digital sanctuary for anonymous emotional expression. Built with React/TypeScript frontend and Express.js backend, using PostgreSQL with Drizzle ORM, the platform enables secure anonymous messaging with robust moderation, user identity protection, and comprehensive safety features. Ready for deployment on Render with complete admin oversight capabilities and user-friendly onboarding.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 20, 2025 - Vercel + Supabase Migration
- ✅ **Database migration**: Successfully migrated from Neon to Supabase PostgreSQL
- ✅ **Environment setup**: Added dotenv support with override configuration for database URL
- ✅ **Vercel deployment configuration**: Created complete vercel.json for full-stack deployment
- ✅ **Serverless API setup**: Created /api/index.ts for Vercel serverless functions
- ✅ **Build optimization**: Verified build process works for production deployment
- ✅ **Database schema verification**: Confirmed all tables and data are preserved in Supabase
- ✅ **Deployment guide**: Created comprehensive VERCEL_SUPABASE_DEPLOYMENT_GUIDE.md
- ✅ **File structure optimization**: Added .vercelignore and .env.example for deployment
- ✅ **Testing verification**: Confirmed all existing features work with new infrastructure

### July 19, 2025 - Final Feature Implementation
- ✅ **Search functionality**: Full-text search for public messages by content, category, and sender name with real-time results
  - Advanced search with fallback support for database compatibility
  - Clean search interface with result count display
  - Category filter integration (hides during search)
  - Search bar with clear button and loading states
- ✅ **Admin permission tags system**: Whisper Listeners now show "Whisper Listener" badges on all their comments/replies with purple styling
- ✅ **Auto-filled nicknames**: Registered users (Silent Messengers and Whisper Listeners) no longer need to manually enter nicknames when replying - system auto-fills and disables the input field
- ✅ **Username uniqueness protection**: Comprehensive validation prevents identity theft by checking usernames across both Silent Messengers and Whisper Listeners tables
- ✅ **Real-time username availability**: Added visual indicators (green checkmark/red X) with instant feedback during registration
- ✅ **Comprehensive information dialog**: Added "I" button with complete platform information including:
  - Platform introduction and purpose explanation
  - Detailed usage guide for all user types
  - Community guidelines (do's and don'ts)
  - Safety resources and crisis support information
  - Privacy policy and data collection transparency
  - Terms of agreement and platform rules
- ✅ **Enhanced database schema**: Added `adminId` field to replies table to track admin authorship
- ✅ **Full TypeScript compliance**: Fixed all compilation errors for production deployment
- ✅ **Git preparation**: Project prepared for transfer to your own repository (git history can be reset)
- ✅ **Render deployment ready**: All features tested and validated for full-stack deployment

### Previous July 19, 2025 Updates
- ✅ Fixed messaging system - resolved category selection and API response handling issues
- ✅ Added comprehensive admin moderation features
- ✅ Implemented message ownership features with Shield icons
- ✅ Enhanced mobile navigation UI with responsive design
- ✅ Enhanced message cards with dropdown menus for admin actions
- ✅ Added proper cache invalidation for all CRUD operations

### July 18, 2025  
- Updated user terminology: Users are now called "Silent Messengers" and admins are "Whisper Listeners"
- Redesigned navigation bar with cleaner, professional styling and improved button states
- Updated landing page with elegant gradient background and improved typography
- Removed water background from landing page for cleaner appearance
- Updated all UI components to use new terminology consistently
- Enhanced navigation with better spacing and responsive design

### December 18, 2025
- Fixed database connection issues by creating PostgreSQL database
- Applied database schema successfully using drizzle-kit push
- Resolved TypeScript compilation error in authentication hook by changing file extension from .ts to .tsx
- Created ZEKE001 admin account with simplified login (username: ZEKE001, password: ZEKE001)
- Removed password hints from admin login interfaces
- Application now running successfully on port 5000

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Custom auth system with localStorage persistence

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL (Render-compatible)
- **API Style**: RESTful API with JSON responses
- **Authentication**: Bcrypt password hashing, separate user/admin systems

### Monorepo Structure
The application follows a monorepo structure with clear separation:
- `client/` - React frontend application
- `server/` - Express.js backend application
- `shared/` - Shared TypeScript types and database schema

## Key Components

### Database Schema
- **Users Table**: Anonymous user accounts with unique usernames (no email required)
- **Messages Table**: Stores user messages with content, category, optional Spotify links, and public/private visibility
- **Replies Table**: Stores replies to messages with content and nickname (threaded comments)
- **Admins Table**: Admin accounts with display names for recipient options, special ZEKE001 account
- **Relations**: One-to-many relationships between users/messages/replies

### Frontend Components
- **Landing Page**: Welcome screen with local storage-based first visit tracking
- **Home Page**: Message creation form with category selection
- **Dashboard**: Public message display with filtering capabilities
- **Admin Panel**: Private message management interface
- **Message Cards**: Reusable components for displaying messages and replies
- **Category Filter**: Dynamic filtering system for message categories
- **Accessibility Menu**: Built-in accessibility features

### Backend Services
- **Storage Layer**: Abstracted database operations with interface-based design
- **Route Handlers**: RESTful endpoints for messages and replies
- **Database Connection**: Neon serverless PostgreSQL with connection pooling

## Data Flow

1. **Message Creation**: Users create messages through the home page form, selecting categories and optional Spotify links
2. **Public/Private Flow**: Messages can be created as public (immediately visible) or private (admin review required)
3. **Reply System**: Users can reply to public messages with nicknames
4. **Admin Management**: Admins can view private messages and make them public
5. **Real-time Updates**: React Query handles automatic refetching and cache invalidation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI components for accessibility
- **wouter**: Lightweight React router
- **zod**: Runtime type validation and schema validation

### Development Tools
- **Vite**: Build tool with TypeScript support
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Static type checking
- **ESLint**: Code linting and formatting

### Database Tools
- **drizzle-kit**: Database migrations and schema management
- **connect-pg-simple**: PostgreSQL session store for Express

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` using Vite
- Backend builds to `dist/` using esbuild with Node.js targeting
- Single deployment artifact containing both client and server

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable for Neon PostgreSQL
- **Development**: Uses `NODE_ENV=development` for local development
- **Production**: Uses `NODE_ENV=production` for optimized builds

### Development Workflow
- **Local Development**: `npm run dev` starts both frontend and backend with hot reloading
- **Database Management**: `npm run db:push` applies schema changes to database
- **Type Checking**: `npm run check` validates TypeScript across the entire project
- **Categories**: Anything, Love, Advice, Confession, Rant, Reflection, Writing (with color coding)

### Production Considerations
- Static file serving for the React frontend
- API routes prefixed with `/api/`
- Database migrations managed through Drizzle Kit
- Environment-specific configuration for database connections
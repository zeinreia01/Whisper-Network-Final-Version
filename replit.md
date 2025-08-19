# Whisper Network

## Overview
Whisper Network is a comprehensive full-stack web application designed as a compassionate digital sanctuary for anonymous emotional expression. The platform enables secure anonymous messaging with robust moderation, user identity protection, and comprehensive safety features. It allows users to send anonymous messages, engage in threaded replies, and utilize social features like heart reactions and following other users. The project aims to provide a safe space for emotional expression, ready for deployment with complete admin oversight and user-friendly onboarding.

## Recent Changes

### August 19, 2025 - Enhanced Spotify Integration & Admin Features ✅ COMPLETED
- ✅ **Fixed Spotify Track Display Error**: Resolved undefined track.preview_url crashes with proper null checking
- ✅ **Photo Attachments for Admin Updates**: Added photo attachment capability to admin announcements with URL input field
- ✅ **Enhanced Music Playback**: Enabled 30-second music previews throughout the site (messages, profiles, music lists)
- ✅ **Smart Music List Display**: Implemented 5-song limit with "View More" expansion for better UX and performance
- ✅ **Spotify API Integration**: Fully integrated Spotify Web API with proper credentials for rich music features

### August 18, 2025 - Migration to Replit Environment & Instagram-style Navigation ✅ COMPLETED
- ✅ **Successfully Migrated**: Migrated project from Replit Agent to standard Replit environment
- ✅ **Database Setup**: Created PostgreSQL database and pushed schema successfully 
- ✅ **Instagram-style Navigation**: Redesigned navigation with bottom tab bar for mobile users only
- ✅ **Modern UI**: Clean, minimal top navigation with rounded buttons and backdrop blur effects
- ✅ **Mobile-first Design**: Bottom navigation includes Home, Dashboard, Search, and Notifications tabs

### August 15, 2025 - Enhanced UI & Image Download Fixes ✅ COMPLETED
- ✅ **Fixed Image Download Transparency**: Resolved saved images having transparent backgrounds by setting proper solid background colors
- ✅ **UI Consistency Improved**: Made home page styling consistent with rest of app using standard theme colors instead of custom gradients  
- ✅ **Calming UX Enhanced**: Transformed main interface to be more gentle and umamin-inspired with collapsible message creation
- ✅ **Enhanced Image Quality**: Improved downloaded image accuracy to perfectly match modal preview with proper contrast

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Authentication**: Custom auth system with localStorage persistence
- **UI/UX Decisions**: Elegant gradient backgrounds, professional typography (serif fonts for whispers), consistent badging for user types ("Silent Messenger," "Whisper Listener"), and comprehensive dark mode theme. Responsive design is prioritized across all components, including mobile UI optimizations for touch targets and element spacing.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **API Style**: RESTful API with JSON responses
- **Authentication**: Bcrypt password hashing, separate user/admin systems

### Monorepo Structure
- `client/` - React frontend application
- `server/` - Express.js backend application
- `shared/` - Shared TypeScript types and database schema

### Key Features and Implementations
- **Anonymous Messaging**: Core functionality allowing users to send messages anonymously.
- **Threaded Reply System**: Supports nested conversations up to 5 levels deep, with parent-child relationships and collapse/expand functionality.
- **User Authentication & Profiles**: Secure user registration/login, user profiles with customizable display names and profile pictures, and personal archives for saved messages.
- **Social Features**: Heart reactions on messages with real-time counts, follow/unfollow system between users, and a comprehensive notification center.
- **Admin Dashboard & Moderation**: Admin accounts (e.g., ZEKE001) for managing private messages, user accounts, and content moderation, including message and user deletion with cascading data cleanup.
- **"View Whisper" Feature**: Generates downloadable, shareable PNG images of messages with aesthetic gradient backgrounds, useful for social sharing.
- **Search Functionality**: Full-text search for public messages by content, category, and sender.
- **Dynamic Categories**: Predefined categories for messages (Anything, Love, Advice, Confession, Rant, Reflection, Writing) with color coding.

## External Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection.
- **drizzle-orm**: Type-safe database ORM.
- **@tanstack/react-query**: Server state management and caching.
- **@radix-ui/***: Headless UI components.
- **wouter**: Lightweight React router.
- **zod**: Runtime type validation and schema validation.
- **html2canvas**: Used for generating PNG images of "Whispers."
- **Supabase PostgreSQL**: Used as a backend database service.
- **Vercel**: Deployment platform for the full-stack application.
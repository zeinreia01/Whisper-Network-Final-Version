
export function generateUserProfileOG(user: any) {
  const imageUrl = user.profilePicture || `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(user.displayName || user.username)}&backgroundColor=6366f1&fontSize=40`;
  
  return {
    title: `${user.displayName || user.username} - Whisper Network`,
    description: `View ${user.displayName || user.username}'s profile on Whisper Network. ${user.bio || 'Connect anonymously and share your thoughts.'}`,
    image: imageUrl,
    url: `/user/${user.username}`
  };
}

export function generateUserBoardOG(user: any) {
  const imageUrl = user.boardBanner || user.profilePicture || `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(user.displayName || user.username)}&backgroundColor=16a34a&fontSize=40`;
  
  return {
    title: `${user.displayName || user.username}'s Board - Whisper Network`,
    description: `Post messages to ${user.displayName || user.username}'s board on Whisper Network. Share your thoughts anonymously.`,
    image: imageUrl,
    url: `/board/${user.username}`
  };
}

export function generateMessageOG(message: any) {
  const imageUrl = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(message.senderName)}&backgroundColor=8b5cf6&fontSize=40`;
  
  return {
    title: `Message by ${message.senderName} - Whisper Network`,
    description: message.content.substring(0, 150) + (message.content.length > 150 ? '...' : ''),
    image: imageUrl,
    url: `/message/${message.id}`
  };
}

export function generateAnonymousLinkOG(username: string) {
  const imageUrl = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(username)}&backgroundColor=dc2626&fontSize=40`;
  
  return {
    title: `Send Anonymous Message to ${username} - Whisper Network`,
    description: `Share your thoughts anonymously with ${username} on Whisper Network. Your identity will remain hidden.`,
    image: imageUrl,
    url: `/anonymous/${username}`
  };
}

export function generateLandingPageOG() {
  const imageUrl = 'https://api.dicebear.com/7.x/initials/png?seed=Whisper%20Network&backgroundColor=3b82f6&fontSize=40';
  
  return {
    title: 'Whisper Network - Anonymous Messaging Platform',
    description: 'Connect anonymously and share your thoughts. A safe space for authentic conversations.',
    image: imageUrl,
    url: '/'
  };
}

export function generateDashboardOG() {
  const imageUrl = 'https://api.dicebear.com/7.x/initials/png?seed=Dashboard&backgroundColor=059669&fontSize=40';
  
  return {
    title: 'Community Dashboard - Whisper Network',
    description: 'Discover messages from the community. A place where voices unite and hearts connect.',
    image: imageUrl,
    url: '/dashboard'
  };
}

export function generateLeaderboardOG() {
  const imageUrl = 'https://api.dicebear.com/7.x/initials/png?seed=Leaderboard&backgroundColor=ca8a04&fontSize=40';
  
  return {
    title: 'Community Leaderboard - Whisper Network',
    description: 'See the most active community members and top contributors on Whisper Network.',
    image: imageUrl,
    url: '/leaderboard'
  };
}

export function generatePersonalArchiveOG() {
  const imageUrl = 'https://api.dicebear.com/7.x/initials/png?seed=Personal&backgroundColor=7c3aed&fontSize=40';
  
  return {
    title: 'Personal Archive - Whisper Network',
    description: 'View your personal message archive and saved conversations.',
    image: imageUrl,
    url: '/personal'
  };
}

export function generateAdminDashboardOG() {
  const imageUrl = 'https://api.dicebear.com/7.x/initials/png?seed=Admin&backgroundColor=dc2626&fontSize=40';
  
  return {
    title: 'Admin Dashboard - Whisper Network',
    description: 'Administrative interface for managing the Whisper Network community.',
    image: imageUrl,
    url: '/admin'
  };
}

export function generateAdminProfileOG(admin: any) {
  const imageUrl = admin.profilePicture || `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(admin.displayName || admin.username)}&backgroundColor=dc2626&fontSize=40`;
  
  return {
    title: `${admin.displayName || admin.username} - Admin Profile`,
    description: `View ${admin.displayName || admin.username}'s admin profile on Whisper Network.`,
    image: imageUrl,
    url: `/admin/${admin.username}`
  };
}

export function generateHomePageOG() {
  const imageUrl = 'https://api.dicebear.com/7.x/initials/png?seed=Home&backgroundColor=3b82f6&fontSize=40';
  
  return {
    title: 'Home - Whisper Network',
    description: 'Your personal hub on Whisper Network. Check notifications, messages, and updates.',
    image: imageUrl,
    url: '/home'
  };
}

export function generatePasswordManagementOG() {
  const imageUrl = 'https://api.dicebear.com/7.x/initials/png?seed=Password&backgroundColor=dc2626&fontSize=40';
  
  return {
    title: 'Password Management - Whisper Network',
    description: 'Secure password management interface for administrators.',
    image: imageUrl,
    url: '/password-management'
  };
}

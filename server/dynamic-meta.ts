
export function generateUserProfileOG(user: any) {
  return {
    title: `${user.displayName || user.username} - Whisper Network`,
    description: `View ${user.displayName || user.username}'s profile on Whisper Network. ${user.bio || 'Connect anonymously and share your thoughts.'}`,
    image: user.profilePicture || '/default-profile.png',
    url: `/user/${user.username}`
  };
}

export function generateUserBoardOG(user: any) {
  return {
    title: `${user.displayName || user.username}'s Board - Whisper Network`,
    description: `Post messages to ${user.displayName || user.username}'s board on Whisper Network. Share your thoughts anonymously.`,
    image: user.boardBanner || user.profilePicture || '/default-board.png',
    url: `/board/${user.username}`
  };
}

export function generateMessageOG(message: any) {
  return {
    title: `Message by ${message.senderName} - Whisper Network`,
    description: message.content.substring(0, 150) + (message.content.length > 150 ? '...' : ''),
    image: '/message-preview.png',
    url: `/message/${message.id}`
  };
}

export function generateAnonymousLinkOG(username: string) {
  return {
    title: `Send Anonymous Message to ${username} - Whisper Network`,
    description: `Share your thoughts anonymously with ${username} on Whisper Network. Your identity will remain hidden.`,
    image: '/anonymous-link.png',
    url: `/anonymous/${username}`
  };
}

export function generateLandingPageOG() {
  return {
    title: 'Whisper Network - Anonymous Messaging Platform',
    description: 'Connect anonymously and share your thoughts. A safe space for authentic conversations.',
    image: '/whisper-network-logo.png',
    url: '/'
  };
}

export function generateDashboardOG() {
  return {
    title: 'Community Dashboard - Whisper Network',
    description: 'Discover messages from the community. A place where voices unite and hearts connect.',
    image: '/dashboard-preview.png',
    url: '/dashboard'
  };
}

export function generateLeaderboardOG() {
  return {
    title: 'Community Leaderboard - Whisper Network',
    description: 'See the most active community members and top contributors on Whisper Network.',
    image: '/leaderboard-preview.png',
    url: '/leaderboard'
  };
}

export function generatePersonalArchiveOG() {
  return {
    title: 'Personal Archive - Whisper Network',
    description: 'View your personal message archive and saved conversations.',
    image: '/archive-preview.png',
    url: '/personal'
  };
}

export function generateAdminDashboardOG() {
  return {
    title: 'Admin Dashboard - Whisper Network',
    description: 'Administrative interface for managing the Whisper Network community.',
    image: '/admin-preview.png',
    url: '/admin'
  };
}

export function generateAdminProfileOG(admin: any) {
  return {
    title: `${admin.displayName || admin.username} - Admin Profile`,
    description: `View ${admin.displayName || admin.username}'s admin profile on Whisper Network.`,
    image: admin.profilePicture || '/default-admin.png',
    url: `/admin/${admin.username}`
  };
}

export function generateHomePageOG() {
  return {
    title: 'Home - Whisper Network',
    description: 'Your personal hub on Whisper Network. Check notifications, messages, and updates.',
    image: '/home-preview.png',
    url: '/home'
  };
}

export function generatePasswordManagementOG() {
  return {
    title: 'Password Management - Whisper Network',
    description: 'Secure password management interface for administrators.',
    image: '/password-preview.png',
    url: '/password-management'
  };
}

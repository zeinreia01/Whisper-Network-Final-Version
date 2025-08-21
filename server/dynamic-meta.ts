// Dynamic meta tag generation for social sharing
export function generateUserProfileOG(user: { username: string; displayName: string | null; profilePicture: string | null; backgroundPhoto?: string | null }) {
  const title = `${user.displayName || user.username}'s Profile - Whisper Network`;
  const description = `Connect with ${user.displayName || user.username} on Whisper Network. Send anonymous messages and join the conversation.`;
  
  // Create a dynamic OG image URL that includes user info
  const imageUrl = user.profilePicture 
    ? `https://res.cloudinary.com/whisper-network/image/fetch/w_1200,h_630,c_fill,g_center/f_auto,q_auto/${encodeURIComponent(user.profilePicture)}`
    : `https://og-image-generator.vercel.app/api/user-profile?username=${encodeURIComponent(user.username)}&displayName=${encodeURIComponent(user.displayName || user.username)}&background=${encodeURIComponent(user.backgroundPhoto || '')}.png`;
  
  return {
    title,
    description,
    image: imageUrl,
    url: `/user/${user.username}`,
    type: 'profile',
  };
}

export function generateUserBoardOG(user: { username: string; displayName: string | null; boardName: string | null; boardBanner: string | null; profilePicture?: string | null }) {
  const boardDisplayName = user.boardName || `${user.displayName || user.username}'s Board`;
  const title = `${boardDisplayName} - Whisper Network`;
  const description = `Post on ${user.displayName || user.username}'s board - Share thoughts, advice, and connect anonymously on Whisper Network.`;
  
  // Create dynamic board preview image
  const imageUrl = user.boardBanner 
    ? `https://res.cloudinary.com/whisper-network/image/fetch/w_1200,h_630,c_fill,g_center/f_auto,q_auto/${encodeURIComponent(user.boardBanner)}`
    : `https://og-image-generator.vercel.app/api/user-board?username=${encodeURIComponent(user.username)}&displayName=${encodeURIComponent(user.displayName || user.username)}&boardName=${encodeURIComponent(boardDisplayName)}&profilePicture=${encodeURIComponent(user.profilePicture || '')}.png`;
  
  return {
    title,
    description,
    image: imageUrl,
    url: `/board/${user.username}`,
    type: 'website',
    boardName: boardDisplayName,
    ownerName: user.displayName || user.username,
  };
}

export function generateMessageOG(message: { id: number; content: string; senderName: string; category: string }) {
  const title = `Message by ${message.senderName} - Whisper Network`;
  const description = `"${message.content.substring(0, 150)}${message.content.length > 150 ? '...' : ''}"`;
  const imageUrl = `/og-message-${message.id}.png`;
  
  return {
    title,
    description,
    image: imageUrl,
    url: `/message/${message.id}`,
    category: message.category,
  };
}

export function generateAnonymousLinkOG(username: string) {
  const title = `Send Anonymous Message to ${username} - Whisper Network`;
  const description = `Share your thoughts anonymously with ${username}. Express yourself safely and compassionately.`;
  const imageUrl = `https://og-image-generator.vercel.app/api/anonymous-link?username=${encodeURIComponent(username)}.png`;
  
  return {
    title,
    description,
    image: imageUrl,
    url: `/u/${username}`,
    type: 'website',
  };
}

export function generateLandingPageOG() {
  const title = "Whisper Network - Safe Anonymous Messaging Platform";
  const description = "Express yourself safely on Whisper Network. Anonymous messaging, threaded conversations, and compassionate community interactions in a secure environment.";
  const imageUrl = "https://og-image-generator.vercel.app/api/landing-page?title=Whisper%20Network&description=Safe%20Anonymous%20Messaging%20Platform.png";
  
  return {
    title,
    description,
    image: imageUrl,
    url: "/",
    type: 'website',
  };
}
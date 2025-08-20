// Dynamic meta tag generation for social sharing
export function generateUserProfileOG(user: { username: string; displayName: string | null; profilePicture: string | null }) {
  const title = `${user.displayName || user.username}'s Profile - Whisper Network`;
  const description = `Connect with ${user.displayName || user.username} on Whisper Network. Send anonymous messages and join the conversation.`;
  const imageUrl = user.profilePicture || `/og-profile-${user.username}.png`;
  
  return {
    title,
    description,
    image: imageUrl,
    url: `/user/${user.username}`,
  };
}

export function generateUserBoardOG(user: { username: string; displayName: string | null; boardName: string | null; boardBanner: string | null }) {
  const boardDisplayName = user.boardName || `${user.displayName || user.username}'s Board`;
  const title = `${boardDisplayName} - Whisper Network`;
  const description = `Post messages to ${user.displayName || user.username}'s board. Share thoughts, advice, and connect anonymously.`;
  const imageUrl = user.boardBanner || `/og-board-${user.username}.png`;
  
  return {
    title,
    description,
    image: imageUrl,
    url: `/board/${user.username}`,
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
  const imageUrl = `/og-anonymous-${username}.png`;
  
  return {
    title,
    description,
    image: imageUrl,
    url: `/u/${username}`,
  };
}
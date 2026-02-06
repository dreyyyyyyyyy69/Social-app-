
export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  avatarStyle?: string;
  friends: string[]; 
  sentRequests: string[]; 
  receivedRequests: string[]; 
  likedProfiles: string[]; // Tinder-style likes
  bio?: string;
  isBot?: boolean;
  persona?: string;
  chatSettings?: Record<string, { wallpaper?: string }>;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  content: string;
  image?: string;
  timestamp: number;
  likes: string[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  image?: string;
  voiceNote?: string; 
  timestamp: number;
  isEphemeral?: boolean;
  isGame?: boolean;
  gameType?: 'truthdare' | 'astro' | 'report';
  status?: 'pending' | 'completed' | 'failed';
  hasBeenSeen?: boolean;
}

export type AppView = 'feed' | 'chat' | 'people' | 'profile' | 'discover' | 'astrology' | 'liked' | 'edit-profile';

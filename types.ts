
export interface User {
  id: string;
  name: string;
  avatar: string;
  level: number;
  vip?: boolean;
}

export interface Room {
  id: string;
  title: string;
  owner: User;
  participantsCount: number;
  tags: string[];
  coverImage: string;
}

export interface Gift {
  id: string;
  name: string;
  price: number;
  icon: string;
  animation?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  type: 'text' | 'gift';
  giftName?: string;
  image?: string; // Support for GIF emojis
}

// Added Artifact interface used by ArtifactCard component
export interface Artifact {
  id: string;
  styleName: string;
  html: string;
  status: 'streaming' | 'completed' | string;
}

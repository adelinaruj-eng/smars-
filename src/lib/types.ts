export interface Profile {
  id: string;
  full_name: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
  is_active: boolean;
  chat_theme: string;
  public_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  iv: string | null;
  read_at: string | null;
  created_at: string;
}

export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface GroupChatMember {
  id: string;
  group_chat_id: string;
  user_id: string;
  joined_at: string;
}

export interface GroupMessage {
  id: string;
  group_chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Status {
  id: string;
  user_id: string;
  content: string;
  type: 'text' | 'photo' | 'video';
  background_color: string;
  created_at: string;
}

export interface StatusView {
  id: string;
  status_id: string;
  viewer_id: string;
  viewed_at: string;
}

export interface ClassPhoto {
  id: string;
  uploaded_by: string;
  image_url: string;
  caption: string;
  media_type: 'image' | 'video';
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ClassPhotoLike {
  id: string;
  photo_id: string;
  user_id: string;
  created_at: string;
}

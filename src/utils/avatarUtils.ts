// src/utils/avatarUtils.ts

export const generateAvatarColor = (name: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#10AC84', '#EE5A24', '#0652DD', '#9980FA', '#D63031'
  ];
  
  // Generate a hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Return a color based on the hash
  return colors[Math.abs(hash) % colors.length];
};

export const getInitials = (name: string): string => {
  if (!name || name.trim() === '') return '?';
  return name.charAt(0).toUpperCase();
};

export const generateAvatarStyle = (name: string) => {
  const backgroundColor = generateAvatarColor(name);
  return {
    backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
  };
};

// src/utils/avatarUtils.ts
import type { ViewStyle } from 'react-native';
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

export const generateAvatarStyle = (name: string): ViewStyle => {
  const backgroundColor = generateAvatarColor(name);
  const style: ViewStyle = {
    backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
  };
  return style;
};

// Returns '#FFFFFF' or '#111827' depending on background contrast
export const getContrastingTextColorForName = (name: string): string => {
  const hex = generateAvatarColor(name).replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // YIQ formula for contrast
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 186 ? '#111827' : '#FFFFFF';
};

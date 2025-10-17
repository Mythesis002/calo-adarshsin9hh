// Generate consistent avatar colors based on user ID
export const getAvatarColor = (userId: string): string => {
  const colors = [
    'hsl(142 76% 36%)', // Green (Move ring)
    'hsl(180 100% 50%)', // Cyan (Exercise ring)
    'hsl(330 100% 60%)', // Pink (Stand ring)
    'hsl(25 95% 53%)', // Orange (Calories)
    'hsl(280 100% 60%)', // Purple
    'hsl(45 100% 55%)', // Yellow
  ];
  
  // Generate a consistent index from the user ID
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

// Get user initials from email
export const getUserInitials = (email: string): string => {
  if (!email) return '?';
  
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  return email.substring(0, 2).toUpperCase();
};

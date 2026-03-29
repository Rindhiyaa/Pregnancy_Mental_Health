export const getAvatarColor = (name) => {
  const AVATAR_COLORS = [
    '#0D9488', '#0891B2', '#4F46E5', '#7C3AED', 
    '#C026D3', '#DB2777', '#E11D48', '#EA580C', 
    '#D97706', '#65A30D', '#059669', '#10B981'
  ];
  if (!name) return AVATAR_COLORS[0];
  const charCode = name.charCodeAt(0);
  return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
};

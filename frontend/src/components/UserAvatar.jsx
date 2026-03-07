const UserAvatar = ({ name, src, size = 'small' }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getColor = (name) => {
    if (!name) return '#e50914';
    const colors = [
      '#e50914', '#b00610', '#5c0308', 
      '#21d07a', '#1a9e5a', '#0d703e',
      '#2196f3', '#1976d2', '#0d47a1',
      '#9c27b0', '#7b1fa2', '#4a148c',
      '#ff9800', '#f57c00', '#e65100'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const sizeClass = `avatar-${size}`;
  const backgroundColor = getColor(name);

  if (src && src !== 'https://via.placeholder.com/150' && !src.includes('placeholder')) {
    return (
      <div className={`user-avatar ${sizeClass}`}>
        <img 
          src={src} 
          alt={name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
    );
  }

  return (
    <div 
      className={`user-avatar ${sizeClass}`} 
      style={{ backgroundColor }}
    >
      {getInitials(name)}
    </div>
  );
};

export default UserAvatar;

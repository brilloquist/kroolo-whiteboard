import React from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar = ({ src, name, size = 'md', className = '' }: AvatarProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
  };

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}>
      {src ? (
        <img 
          src={src} 
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span className="text-white font-medium">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
};

export default Avatar;
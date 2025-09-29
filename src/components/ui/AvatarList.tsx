import React from 'react';
import Avatar from './Avatar';

interface User {
  id: string;
  full_name: string;
  avatar_url?: string | null;
}

interface AvatarListProps {
  users: User[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  className?: string;
}

const AvatarList = ({ users, maxVisible = 3, size = 'sm', onClick, className = '' }: AvatarListProps) => {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div 
      className={`flex -space-x-1 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {visibleUsers.map(user => (
        <div
          key={user.id}
          className="border-2 border-gray-800 rounded-full"
          title={user.full_name}
        >
          <Avatar
            src={user.avatar_url}
            name={user.full_name}
            size={size}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className={`${size === 'sm' ? 'w-6 h-6 text-xs' : size === 'md' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'} bg-gray-600 border-2 border-gray-800 rounded-full flex items-center justify-center`}>
          <span className="text-white font-medium">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default AvatarList;
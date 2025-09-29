import React from 'react';
import { Users, MoreVertical, UserPlus } from 'lucide-react';
import { Group } from './Dashboard';

interface GroupsSectionProps {
  groups: Group[];
  currentUserId: string;
}

const GroupsSection = ({ groups, currentUserId }: GroupsSectionProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Users className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">No groups yet</p>
        <p className="text-sm">Create your first group to organize your team</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map(group => (
        <div
          key={group.id}
          className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors group p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">
                  {group.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {group.created_by === currentUserId && (
              <button className="text-gray-400 hover:text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Description */}
          {group.description && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {group.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <span className="text-gray-500 text-xs">
              Created {formatDate(group.created_at)}
            </span>

            {group.created_by === currentUserId && (
              <button className="text-gray-400 hover:text-blue-400 transition-colors">
                <UserPlus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupsSection;
import React from 'react';
import { Share, Trash2, MoreVertical, Users, LayoutGrid as Layout } from 'lucide-react';
import { Whiteboard } from './Dashboard';

interface WhiteboardGridProps {
  whiteboards: Whiteboard[];
  currentUserId: string;
  onShare: (whiteboardId: string) => void;
  onDelete: (whiteboardId: string) => void;
}

const WhiteboardGrid = ({ whiteboards, currentUserId, onShare, onDelete }: WhiteboardGridProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (whiteboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Layout className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">No whiteboards yet</p>
        <p className="text-sm">Create your first whiteboard to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {whiteboards.map(whiteboard => (
        <div
          key={whiteboard.id}
          className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors group"
        >
          {/* Whiteboard Preview */}
          <div className="h-32 bg-gradient-to-br from-blue-600 to-purple-700 rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
              <div className="text-white text-sm opacity-60">Whiteboard Preview</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate mb-1">
                  {whiteboard.title}
                </h3>
                {whiteboard.description && (
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {whiteboard.description}
                  </p>
                )}
              </div>
              
              {whiteboard.owner_id === currentUserId && (
                <div className="relative">
                  <button className="text-gray-400 hover:text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Owner & Collaborators */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {whiteboard.owner?.avatar_url ? (
                    <img 
                      src={whiteboard.owner.avatar_url} 
                      alt={whiteboard.owner.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-medium">
                      {getInitials(whiteboard.owner?.full_name || 'U')}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">
                  {whiteboard.owner?.full_name}
                </span>
              </div>

              {whiteboard.collaborators && whiteboard.collaborators.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-400 text-xs">
                    +{whiteboard.collaborators.length}
                  </span>
                </div>
              )}
            </div>

            {/* Collaborator Avatars */}
            {whiteboard.collaborators && whiteboard.collaborators.length > 0 && (
              <div className="flex items-center space-x-1 mb-3">
                <div className="flex -space-x-1">
                  {whiteboard.collaborators.slice(0, 3).map(collaborator => (
                    <div
                      key={collaborator.id}
                      className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-full border-2 border-gray-800 flex items-center justify-center"
                      title={collaborator.full_name}
                    >
                      {collaborator.avatar_url ? (
                        <img 
                          src={collaborator.avatar_url} 
                          alt={collaborator.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-medium">
                          {getInitials(collaborator.full_name)}
                        </span>
                      )}
                    </div>
                  ))}
                  {whiteboard.collaborators.length > 3 && (
                    <div className="w-6 h-6 bg-gray-600 rounded-full border-2 border-gray-800 flex items-center justify-center">
                      <span className="text-white text-xs">
                        +{whiteboard.collaborators.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <span className="text-gray-500 text-xs">
                Updated {formatDate(whiteboard.updated_at)}
              </span>

              {whiteboard.owner_id === currentUserId && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onShare(whiteboard.id)}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    title="Share whiteboard"
                  >
                    <Share className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(whiteboard.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete whiteboard"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WhiteboardGrid;
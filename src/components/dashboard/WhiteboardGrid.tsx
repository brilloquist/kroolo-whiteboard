import React, { useState } from 'react';
import { Plus, MoreVertical, Users, Calendar, Layout } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { AvatarList } from '../ui/AvatarList';

interface Whiteboard {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  updated_at: string;
  owner?: {
    full_name: string;
    avatar_url?: string;
  };
  collaborators?: Array<{
    id: string;
    full_name: string;
    avatar_url?: string;
  }>;
}

interface WhiteboardGridProps {
  whiteboards: Whiteboard[];
  onCreateWhiteboard: () => void;
  onShareWhiteboard: (whiteboardId: string) => void;
  onDeleteWhiteboard: (whiteboardId: string) => void;
  loading?: boolean;
}

const WhiteboardGrid = ({
  whiteboards,
  onCreateWhiteboard,
  onShareWhiteboard,
  onDeleteWhiteboard,
  loading = false
}: WhiteboardGridProps) => {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="h-3 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Create New Whiteboard Card */}
      <button
        onClick={onCreateWhiteboard}
        className="bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 hover:border-blue-500 transition-all duration-200 p-6 flex flex-col items-center justify-center min-h-[200px] group"
      >
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
          <Plus className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-white font-medium mb-2">Create Whiteboard</h3>
        <p className="text-gray-400 text-sm text-center">
          Start a new collaborative whiteboard
        </p>
      </button>

      {/* Whiteboard Cards */}
      {whiteboards.map((whiteboard) => (
        <div
          key={whiteboard.id}
          className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg group cursor-pointer"
        >
          <div className="p-6">
            {/* Header with menu */}
            <div className="flex items-start justify-between mb-4">
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
              <div className="relative ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === whiteboard.id ? null : whiteboard.id);
                  }}
                  className="p-1 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                
                {menuOpen === whiteboard.id && (
                  <div className="absolute right-0 top-8 bg-gray-700 border border-gray-600 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareWhiteboard(whiteboard.id);
                        setMenuOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Share
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWhiteboard(whiteboard.id);
                        setMenuOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-600 hover:text-red-300 flex items-center"
                    >
                      <Layout className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Collaborators */}
            <div className="mb-3">
              <AvatarList
                users={whiteboard.collaborators || []}
                maxVisible={3}
                size="sm"
                onClick={() => onShareWhiteboard(whiteboard.id)}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex-1 min-w-0">
                <div className="text-gray-500 text-xs truncate">
                  {whiteboard.owner?.full_name}
                </div>
                <div className="text-gray-500 text-xs">
                  {formatDate(whiteboard.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WhiteboardGrid;
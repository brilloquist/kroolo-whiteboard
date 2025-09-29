import React from 'react';
import { Layers3, LayoutGrid as Layout, Users, LogOut, Settings } from 'lucide-react';
import { Profile, Domain } from '../../hooks/useAuth';

interface SidebarProps {
  profile: Profile;
  domain: Domain;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
}

const Sidebar = ({ profile, domain, activeTab, onTabChange, onSignOut }: SidebarProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    { id: 'whiteboards', label: 'Whiteboards', icon: Layout },
    { id: 'groups', label: 'Groups', icon: Users },
  ];

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Layers3 className="h-8 w-8 text-blue-500" />
          <span className="text-xl font-bold text-white">kroolo</span>
        </div>
      </div>

      {/* Domain Info */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="text-sm text-gray-400">Workspace</div>
        <div className="text-white font-medium">{domain.display_name}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-medium text-sm">
                {getInitials(profile.full_name)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">
              {profile.full_name}
            </div>
            <div className="text-gray-400 text-sm truncate">
              {profile.email}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors">
            <Settings className="h-4 w-4" />
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={onSignOut}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
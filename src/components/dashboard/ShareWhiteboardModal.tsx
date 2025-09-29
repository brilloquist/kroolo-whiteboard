import React, { useState, useEffect } from 'react';
import { X, Mail, Users, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface ShareWhiteboardModalProps {
  whiteboardId: string;
  onClose: () => void;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface GroupMember {
  id: string;
  name: string;
  member_count: number;
}

interface SharedUser {
  id: string;
  full_name: string;
  email: string;
  permission: 'editor' | 'viewer' | 'commenter';
}

const ShareWhiteboardModal = ({ whiteboardId, onClose }: ShareWhiteboardModalProps) => {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [groups, setGroups] = useState<GroupMember[]>([]);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'editor' | 'viewer' | 'commenter'>('viewer');

  const fetchData = async () => {
    if (!profile) return;

    try {
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('domain_id', profile.domain_id)
        .neq('id', profile.id);

      if (membersError) throw membersError;
      setTeamMembers(members || []);

      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          group_members (count)
        `)
        .eq('domain_id', profile.domain_id);

      if (groupsError) throw groupsError;
      
      const groupsWithCounts = groupsData.map(group => ({
        id: group.id,
        name: group.name,
        member_count: group.group_members?.[0]?.count || 0,
      }));
      setGroups(groupsWithCounts || []);

      // Fetch current shares
      const { data: shares, error: sharesError } = await supabase
        .from('whiteboard_shares')
        .select(`
          user_id,
          permission,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .eq('whiteboard_id', whiteboardId);

      if (sharesError) throw sharesError;
      
      const currentShares = shares.map(share => ({
        id: share.profiles.id,
        full_name: share.profiles.full_name,
        email: share.profiles.email,
        permission: share.permission,
      }));
      setSharedUsers(currentShares || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithUser = async (userId: string, permission: 'editor' | 'viewer' | 'commenter') => {
    try {
      const { error } = await supabase
        .from('whiteboard_shares')
        .upsert({
          whiteboard_id: whiteboardId,
          user_id: userId,
          permission,
        });

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error sharing with user:', error);
    }
  };

  const handleRemoveShare = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('whiteboard_shares')
        .delete()
        .eq('whiteboard_id', whiteboardId)
        .eq('user_id', userId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error removing share:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'editor':
        return 'text-green-400';
      case 'commenter':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile, whiteboardId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-2xl p-6">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Share Whiteboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Share by Email */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Share by Email</span>
            </h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
              />
              <div className="flex space-x-2">
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value as any)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Viewer</option>
                  <option value="commenter">Commenter</option>
                  <option value="editor">Editor</option>
                </select>
                <button 
                  disabled={!shareEmail.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Invite
                </button>
              </div>
            </div>
          </div>

          {/* Current Shares */}
          {sharedUsers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3">Current Collaborators</h3>
              <div className="space-y-2">
                {sharedUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {getInitials(user.full_name)}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.full_name}</div>
                        <div className="text-gray-400 text-sm">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm font-medium capitalize ${getPermissionColor(user.permission)}`}>
                        {user.permission}
                      </span>
                      <button
                        onClick={() => handleRemoveShare(user.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Team Members</span>
            </h3>
            <div className="space-y-2">
              {teamMembers
                .filter(member => !sharedUsers.find(shared => shared.id === member.id))
                .map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                      {member.avatar_url ? (
                        <img 
                          src={member.avatar_url} 
                          alt={member.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">
                          {getInitials(member.full_name)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{member.full_name}</div>
                      <div className="text-gray-400 text-sm">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      onChange={(e) => handleShareWithUser(member.id, e.target.value as any)}
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="" disabled>Share as...</option>
                      <option value="viewer">Viewer</option>
                      <option value="commenter">Commenter</option>
                      <option value="editor">Editor</option>
                    </select>
                  </div>
                </div>
              ))}
              {teamMembers.filter(member => !sharedUsers.find(shared => shared.id === member.id)).length === 0 && (
                <p className="text-gray-400 text-sm">All team members have been invited</p>
              )}
            </div>
          </div>

          {/* Groups */}
          {groups.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Groups</span>
              </h3>
              <div className="space-y-2">
                {groups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{group.name}</div>
                        <div className="text-gray-400 text-sm">
                          {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        defaultValue=""
                      >
                        <option value="" disabled>Share as...</option>
                        <option value="viewer">Viewer</option>
                        <option value="commenter">Commenter</option>
                        <option value="editor">Editor</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareWhiteboardModal;
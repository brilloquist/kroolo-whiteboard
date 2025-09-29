import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import UserSearchDropdown from '../ui/UserSearchDropdown';
import Avatar from '../ui/Avatar';

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface Share {
  id: string;
  user_id: string;
  permission: 'editor' | 'viewer' | 'commenter';
  user: User;
}

interface GroupShare {
  id: string;
  group_id: string;
  permission: 'editor' | 'viewer' | 'commenter';
  group: Group;
}

interface ShareWhiteboardModalProps {
  whiteboardId: string;
  onClose: () => void;
}

const ShareWhiteboardModal = ({ whiteboardId, onClose }: ShareWhiteboardModalProps) => {
  const { profile } = useAuth();
  const [shares, setShares] = useState<Share[]>([]);
  const [groupShares, setGroupShares] = useState<GroupShare[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');

  useEffect(() => {
    loadData();
  }, [whiteboardId]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadShares(),
        loadGroupShares(),
        loadGroups(),
        generateInviteLink()
      ]);
    } catch (error) {
      console.error('Error loading share data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadShares = async () => {
    const { data, error } = await supabase
      .from('whiteboard_shares')
      .select(`
        *,
        user:profiles!whiteboard_shares_user_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('whiteboard_id', whiteboardId);

    if (error) throw error;
    setShares(data || []);
  };

  const loadGroupShares = async () => {
    const { data, error } = await supabase
      .from('group_whiteboard_shares')
      .select(`
        *,
        group:groups!group_whiteboard_shares_group_id_fkey(id, name, description)
      `)
      .eq('whiteboard_id', whiteboardId);

    if (error) throw error;
    setGroupShares(data || []);
  };

  const loadGroups = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('groups')
      .select('id, name, description')
      .eq('domain_id', profile.domain_id)
      .order('name');

    if (error) throw error;
    setGroups(data || []);
  };

  const generateInviteLink = async () => {
    try {
      // Generate a unique token for the invite link
      const token = crypto.randomUUID();
      
      const { error } = await supabase
        .from('invite_tokens')
        .insert({
          token,
          domain_id: profile?.domain_id,
          whiteboard_id: whiteboardId,
          permission: 'viewer',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          created_by: profile?.id
        });

      if (error) throw error;
      
      setInviteLink(`${window.location.origin}/invite/${token}`);
    } catch (error) {
      console.error('Error generating invite link:', error);
    }
  };

  const handleAddUser = async (user: User) => {
    try {
      const { error } = await supabase
        .from('whiteboard_shares')
        .insert({
          whiteboard_id: whiteboardId,
          user_id: user.id,
          permission: 'viewer'
        });

      if (error) throw error;
      await loadShares();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleAddGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('group_whiteboard_shares')
        .insert({
          whiteboard_id: whiteboardId,
          group_id: groupId,
          permission: 'viewer'
        });

      if (error) throw error;
      await loadGroupShares();
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const handleUpdatePermission = async (shareId: string, permission: string, isGroup = false) => {
    try {
      const table = isGroup ? 'group_whiteboard_shares' : 'whiteboard_shares';
      const { error } = await supabase
        .from(table)
        .update({ permission })
        .eq('id', shareId);

      if (error) throw error;
      
      if (isGroup) {
        await loadGroupShares();
      } else {
        await loadShares();
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const handleRemoveShare = async (shareId: string, isGroup = false) => {
    try {
      const table = isGroup ? 'group_whiteboard_shares' : 'whiteboard_shares';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', shareId);

      if (error) throw error;
      
      if (isGroup) {
        await loadGroupShares();
      } else {
        await loadShares();
      }
    } catch (error) {
      console.error('Error removing share:', error);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'editor': return 'text-green-400';
      case 'commenter': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  const excludedUserIds = shares.map(share => share.user_id);
  const availableGroups = groups.filter(group => 
    !groupShares.some(gs => gs.group_id === group.id)
  );

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

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Invite Link */}
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white mb-3">Invite Link</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              />
              <button
                onClick={copyInviteLink}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1"
              >
                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="text-sm">{linkCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Anyone with this link can view the whiteboard
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Users ({shares.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'groups'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Groups ({groupShares.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'users' ? (
              <div className="space-y-4">
                {/* Add User */}
                <div>
                  <h4 className="text-white font-medium mb-3">Add People</h4>
                  <UserSearchDropdown
                    onSelect={handleAddUser}
                    excludeIds={excludedUserIds}
                    placeholder="Search for users to add..."
                  />
                </div>

                {/* Current Shares */}
                {shares.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3">Current Access</h4>
                    <div className="space-y-3">
                      {shares.map(share => (
                        <div key={share.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar
                              src={share.user.avatar_url}
                              name={share.user.full_name}
                              size="sm"
                            />
                            <div>
                              <div className="text-white font-medium">
                                {share.user.full_name}
                              </div>
                              <div className="text-gray-400 text-sm">
                                {share.user.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={share.permission}
                              onChange={(e) => handleUpdatePermission(share.id, e.target.value)}
                              className={`bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm ${getPermissionColor(share.permission)}`}
                            >
                              <option value="viewer">Viewer</option>
                              <option value="commenter">Commenter</option>
                              <option value="editor">Editor</option>
                            </select>
                            <button
                              onClick={() => handleRemoveShare(share.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add Group */}
                {availableGroups.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3">Add Groups</h4>
                    <div className="space-y-2">
                      {availableGroups.map(group => (
                        <button
                          key={group.id}
                          onClick={() => handleAddGroup(group.id)}
                          className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <div className="text-left">
                              <div className="text-white font-medium">{group.name}</div>
                              {group.description && (
                                <div className="text-gray-400 text-sm">{group.description}</div>
                              )}
                            </div>
                          </div>
                          <UserPlus className="h-4 w-4 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Group Shares */}
                {groupShares.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3">Groups with Access</h4>
                    <div className="space-y-3">
                      {groupShares.map(groupShare => (
                        <div key={groupShare.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {groupShare.group.name}
                              </div>
                              {groupShare.group.description && (
                                <div className="text-gray-400 text-sm">
                                  {groupShare.group.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={groupShare.permission}
                              onChange={(e) => handleUpdatePermission(groupShare.id, e.target.value, true)}
                              className={`bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm ${getPermissionColor(groupShare.permission)}`}
                            >
                              <option value="viewer">Viewer</option>
                              <option value="commenter">Commenter</option>
                              <option value="editor">Editor</option>
                            </select>
                            <button
                              onClick={() => handleRemoveShare(groupShare.id, true)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {availableGroups.length === 0 && groupShares.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No groups available</p>
                    <p className="text-sm">Create groups to share with teams</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareWhiteboardModal;
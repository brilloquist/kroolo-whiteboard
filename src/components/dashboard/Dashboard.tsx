import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import WhiteboardGrid from './WhiteboardGrid';
import GroupsSection from './GroupsSection';
import CreateWhiteboardModal from './CreateWhiteboardModal';
import ShareWhiteboardModal from './ShareWhiteboardModal';
import CreateGroupModal from './CreateGroupModal';
import { supabase } from '../../lib/supabase';

export interface Whiteboard {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  domain_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  collaborators?: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    permission: 'editor' | 'viewer' | 'commenter';
  }>;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  domain_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

const Dashboard = () => {
  const { profile, domain, signOut } = useAuth();
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('whiteboards');
  
  // Modal states
  const [showCreateWhiteboard, setShowCreateWhiteboard] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [shareWhiteboardId, setShareWhiteboardId] = useState<string | null>(null);

  const fetchWhiteboards = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('whiteboards')
        .select(`
          *,
          profiles:owner_id (
            id,
            full_name,
            avatar_url
          ),
          whiteboard_shares (
            user_id,
            permission,
            profiles (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('domain_id', profile.domain_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const whiteboardsWithCollaborators = data.map(whiteboard => ({
        ...whiteboard,
        owner: whiteboard.profiles,
        collaborators: whiteboard.whiteboard_shares.map((share: any) => ({
          ...share.profiles,
          permission: share.permission,
        })),
      }));

      setWhiteboards(whiteboardsWithCollaborators);
    } catch (error) {
      console.error('Error fetching whiteboards:', error);
    }
  };

  const fetchGroups = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members (count)
        `)
        .eq('domain_id', profile.domain_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupsWithCounts = data.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0,
      }));

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleCreateWhiteboard = async (title: string, description: string) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('whiteboards')
        .insert({
          title,
          description,
          owner_id: profile.id,
          domain_id: profile.domain_id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchWhiteboards();
      setShowCreateWhiteboard(false);
    } catch (error) {
      console.error('Error creating whiteboard:', error);
    }
  };

  const handleDeleteWhiteboard = async (whiteboardId: string) => {
    try {
      const { error } = await supabase
        .from('whiteboards')
        .delete()
        .eq('id', whiteboardId);

      if (error) throw error;

      setWhiteboards(whiteboards.filter(wb => wb.id !== whiteboardId));
    } catch (error) {
      console.error('Error deleting whiteboard:', error);
    }
  };

  const handleCreateGroup = async (name: string, description: string) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          domain_id: profile.domain_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchGroups();
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;
      
      setLoading(true);
      await Promise.all([fetchWhiteboards(), fetchGroups()]);
      setLoading(false);
    };

    loadData();
  }, [profile]);

  if (!profile || !domain) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar 
        profile={profile}
        domain={domain}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white capitalize">
                {activeTab}
              </h1>
              <p className="text-gray-400 mt-1">
                {activeTab === 'whiteboards' 
                  ? 'Manage your whiteboards and collaborate with your team'
                  : 'Organize your team into groups for easier collaboration'
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {activeTab === 'whiteboards' && (
                <button
                  onClick={() => setShowCreateWhiteboard(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <span>+</span>
                  <span>Create Whiteboard</span>
                </button>
              )}
              
              {activeTab === 'groups' && (
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <span>+</span>
                  <span>Create Group</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : (
            <>
              {activeTab === 'whiteboards' && (
                <WhiteboardGrid
                  whiteboards={whiteboards}
                  currentUserId={profile.id}
                  onShare={setShareWhiteboardId}
                  onDelete={handleDeleteWhiteboard}
                />
              )}
              
              {activeTab === 'groups' && (
                <GroupsSection
                  groups={groups}
                  currentUserId={profile.id}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreateWhiteboard && (
        <CreateWhiteboardModal
          onClose={() => setShowCreateWhiteboard(false)}
          onCreate={handleCreateWhiteboard}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {shareWhiteboardId && (
        <ShareWhiteboardModal
          whiteboardId={shareWhiteboardId}
          onClose={() => setShareWhiteboardId(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
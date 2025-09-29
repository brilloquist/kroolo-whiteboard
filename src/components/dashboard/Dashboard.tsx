import React, { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Sidebar from './Sidebar';
import WhiteboardGrid from './WhiteboardGrid';
import GroupsSection from './GroupsSection';
import CreateWhiteboardModal from './CreateWhiteboardModal';
import CreateGroupModal from './CreateGroupModal';
import ShareWhiteboardModal from './ShareWhiteboardModal';
import DeleteWhiteboardModal from './DeleteWhiteboardModal';

export interface Whiteboard {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  domain_id: string;
  data: Record<string, any>;
  created_at: string;
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

export interface Group {
  id: string;
  name: string;
  description?: string;
  domain_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
}

const Dashboard = () => {
  const { profile, domain, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('whiteboards');
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateWhiteboard, setShowCreateWhiteboard] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [shareWhiteboardId, setShareWhiteboardId] = useState<string | null>(null);
  const [deleteWhiteboardId, setDeleteWhiteboardId] = useState<string | null>(null);

  useEffect(() => {
    if (profile && domain) {
      loadData();
    }
  }, [profile, domain, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'whiteboards') {
        await loadWhiteboards();
      } else if (activeTab === 'groups') {
        await loadGroups();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWhiteboards = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('whiteboards')
      .select(`
        *,
        owner:profiles!whiteboards_owner_id_fkey(full_name, avatar_url)
      `)
      .eq('domain_id', profile.domain_id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    setWhiteboards(data || []);
  };

  const loadGroups = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members(count)
      `)
      .eq('domain_id', profile.domain_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const groupsWithCount = data?.map(group => ({
      ...group,
      member_count: group.group_members?.[0]?.count || 0
    })) || [];
    
    setGroups(groupsWithCount);
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
          data: {}
        })
        .select(`
          *,
          owner:profiles!whiteboards_owner_id_fkey(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setWhiteboards(prev => [data, ...prev]);
      setShowCreateWhiteboard(false);
    } catch (error) {
      console.error('Error creating whiteboard:', error);
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
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      const newGroup = { ...data, member_count: 0 };
      setGroups(prev => [newGroup, ...prev]);
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleDeleteWhiteboard = async (whiteboardId: string) => {
    try {
      const { error } = await supabase
        .from('whiteboards')
        .delete()
        .eq('id', whiteboardId);

      if (error) throw error;

      setWhiteboards(prev => prev.filter(w => w.id !== whiteboardId));
      setDeleteWhiteboardId(null);
    } catch (error) {
      console.error('Error deleting whiteboard:', error);
    }
  };

  if (!profile || !domain) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
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

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white capitalize">
                {activeTab}
              </h1>
              <p className="text-gray-400 mt-1">
                {activeTab === 'whiteboards' 
                  ? 'Create and manage your collaborative whiteboards'
                  : 'Organize your team into groups for easier collaboration'
                }
              </p>
            </div>
            <button
              onClick={() => {
                if (activeTab === 'whiteboards') {
                  setShowCreateWhiteboard(true);
                } else {
                  setShowCreateGroup(true);
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>
                {activeTab === 'whiteboards' ? 'New Whiteboard' : 'New Group'}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          {activeTab === 'whiteboards' ? (
            <WhiteboardGrid
              whiteboards={whiteboards}
              onCreateWhiteboard={() => setShowCreateWhiteboard(true)}
              onShareWhiteboard={setShareWhiteboardId}
              onDeleteWhiteboard={setDeleteWhiteboardId}
              loading={loading}
            />
          ) : (
            <GroupsSection
              groups={groups}
              currentUserId={profile.id}
            />
          )}
        </div>
      </div>

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

      {deleteWhiteboardId && (
        <DeleteWhiteboardModal
          whiteboardId={deleteWhiteboardId}
          onClose={() => setDeleteWhiteboardId(null)}
          onConfirm={() => handleDeleteWhiteboard(deleteWhiteboardId)}
        />
      )}
    </div>
  );
};

export default Dashboard;
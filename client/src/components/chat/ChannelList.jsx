import React, { useState } from 'react';
import { Hash, Lock, Plus, MessageSquare } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';
import { Modal } from '../common/Modal.jsx';
import { chatApi } from '../../api/chatApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const ChannelList = ({
  channels = [],
  activeChannel,
  onSelectChannel,
  workspaceMembers = [],
  onChannelCreated,
}) => {
  const { user } = useAuth();
  const { onlineUserIds } = useSocket();
  const toast = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelTopic, setNewChannelTopic] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Separate channels into public/private group and direct messages group
  const publicChannels = channels.filter((c) => c.type !== 'direct');
  const directChannels = channels.filter((c) => c.type === 'direct');

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      setLoading(true);
      const res = await chatApi.createChannel({
        name: newChannelName.trim(),
        topic: newChannelTopic.trim(),
        type: isPrivate ? 'private' : 'public',
      });
      toast.success(`Channel #${res.data.channel.name} created`);
      if (onChannelCreated) onChannelCreated(res.data.channel);
      onSelectChannel(res.data.channel);
      setCreateModalOpen(false);
      setNewChannelName('');
      setNewChannelTopic('');
      setIsPrivate(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDM = async (targetUser) => {
    try {
      const res = await chatApi.getOrCreateDirectChannel(targetUser._id || targetUser.id);
      if (onChannelCreated) onChannelCreated(res.data.channel);
      onSelectChannel(res.data.channel);
    } catch (err) {
      toast.error(err.message || 'Failed to start direct message');
    }
  };

  const getDMPartner = (channel) => {
    return channel.members?.find((m) => String(m._id || m) !== String(user?._id || user?.id));
  };

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0">
      {/* Channels Group */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Channels</span>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Create channel"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-0.5">
          {publicChannels.map((c) => {
            const isSelected = activeChannel?._id === c._id;
            return (
              <button
                key={c._id}
                onClick={() => onSelectChannel(c)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {c.type === 'private' ? (
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Direct Messages Group */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Direct Messages</span>
        </div>

        {/* Existing DMs */}
        <div className="space-y-0.5 mb-4">
          {directChannels.map((c) => {
            const partner = getDMPartner(c);
            const partnerId = partner?._id || partner;
            const isOnline = onlineUserIds.includes(String(partnerId));
            const isSelected = activeChannel?._id === c._id;

            return (
              <button
                key={c._id}
                onClick={() => onSelectChannel(c)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Avatar name={partner?.name || 'User'} src={partner?.avatar} size="xs" isOnline={isOnline} />
                <span className="truncate">{partner?.name || 'Direct Message'}</span>
              </button>
            );
          })}
        </div>

        {/* Start new DM from workspace members */}
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
          Workspace Teammates
        </p>
        <div className="space-y-0.5">
          {workspaceMembers
            .filter((m) => String(m.user?._id || m.user) !== String(user?._id || user?.id))
            .map((m) => {
              const u = m.user;
              const isOnline = onlineUserIds.includes(String(u?._id || u));
              return (
                <button
                  key={u?._id || u}
                  onClick={() => handleStartDM(u)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={u?.name} src={u?.avatar} size="xs" isOnline={isOnline} />
                    <span className="truncate">{u?.name}</span>
                  </div>
                  <MessageSquare className="w-3 h-3 text-slate-400 opacity-60" />
                </button>
              );
            })}
        </div>
      </div>

      {/* Create Channel Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Channel"
      >
        <form onSubmit={handleCreateChannel} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Channel Name *
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3">
              <Hash className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                required
                placeholder="e.g. sprint-planning"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="w-full py-2 text-sm bg-transparent border-none focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="What is this channel about?"
              value={newChannelTopic}
              onChange={(e) => setNewChannelTopic(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Make this channel private (invitation only)
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


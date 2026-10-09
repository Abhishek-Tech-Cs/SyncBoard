import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatApi } from '../api/chatApi.js';
import { workspaceApi } from '../api/workspaceApi.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { ChannelList } from '../components/chat/ChannelList.jsx';
import { ChatContainer } from '../components/chat/ChatContainer.jsx';

export const ChatPage = () => {
  const { currentWorkspace } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const channelIdFromUrl = searchParams.get('channel');

  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadChatData = async () => {
    if (!currentWorkspace?._id) return;
    try {
      setLoading(true);
      const [chanRes, memRes] = await Promise.all([
        chatApi.getChannels(),
        workspaceApi.getMembers(currentWorkspace._id),
      ]);

      const chList = chanRes.data.channels || [];
      setChannels(chList);
      setMembers(memRes.data.members || []);

      if (channelIdFromUrl) {
        const found = chList.find((c) => c._id === channelIdFromUrl);
        if (found) {
          setActiveChannel(found);
          return;
        }
      }

      if (chList.length > 0 && !activeChannel) {
        setActiveChannel(chList[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatData();
  }, [currentWorkspace?._id]);

  const handleSelectChannel = (channel) => {
    setActiveChannel(channel);
    setSearchParams({ channel: channel._id });
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <ChannelList
        channels={channels}
        activeChannel={activeChannel}
        onSelectChannel={handleSelectChannel}
        workspaceMembers={members}
        onChannelCreated={(newChan) => {
          setChannels((prev) => [...prev, newChan]);
        }}
      />

      {activeChannel ? (
        <ChatContainer channel={activeChannel} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
          Select a channel or direct message to start chatting
        </div>
      )}
    </div>
  );
};


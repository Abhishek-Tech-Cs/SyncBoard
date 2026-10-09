import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { workspaceApi } from '../api/workspaceApi.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await workspaceApi.getWorkspaces();
      const list = res.data.workspaces || [];
      setWorkspaces(list);

      const savedId = localStorage.getItem('currentWorkspaceId');
      const found = list.find((w) => w._id === savedId);

      if (found) {
        setCurrentWorkspace(found);
      } else if (list.length > 0) {
        setCurrentWorkspace(list[0]);
        localStorage.setItem('currentWorkspaceId', list[0]._id);
      } else {
        setCurrentWorkspace(null);
        localStorage.removeItem('currentWorkspaceId');
      }
    } catch (err) {
      console.error('[WorkspaceContext] Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const switchWorkspace = (workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspaceId', workspace._id);
    toast.info(`Switched to ${workspace.name}`);
  };

  const createWorkspace = async (data) => {
    try {
      const res = await workspaceApi.createWorkspace(data);
      const newWs = res.data.workspace;
      toast.success('Workspace created successfully!');
      await loadWorkspaces();
      switchWorkspace(newWs);
      return newWs;
    } catch (err) {
      toast.error(err.message || 'Failed to create workspace');
      throw err;
    }
  };

  const userRole = currentWorkspace?.role || 'MEMBER';

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        userRole,
        loading,
        switchWorkspace,
        createWorkspace,
        refreshWorkspaces: loadWorkspaces,
        setCurrentWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};


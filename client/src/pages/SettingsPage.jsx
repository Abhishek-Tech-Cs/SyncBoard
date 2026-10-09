import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Shield, Trash2, LogOut, Save } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { workspaceApi } from '../api/workspaceApi.js';
import { MembersTable } from '../components/workspace/MembersTable.jsx';

export const SettingsPage = () => {
  const { currentWorkspace, userRole, refreshWorkspaces } = useWorkspace();
  const [members, setMembers] = useState([]);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const isOwner = userRole === 'OWNER';
  const isAdmin = isOwner || userRole === 'ADMIN';

  const loadMembers = async () => {
    if (!currentWorkspace?._id) return;
    try {
      const res = await workspaceApi.getMembers(currentWorkspace._id);
      setMembers(res.data.members || []);
      setWsName(currentWorkspace.name);
      setWsDesc(currentWorkspace.description || '');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [currentWorkspace?._id]);

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    try {
      setLoading(true);
      await workspaceApi.updateWorkspace(currentWorkspace._id, {
        name: wsName.trim(),
        description: wsDesc.trim(),
      });
      toast.success('Workspace updated successfully');
      refreshWorkspaces();
    } catch (err) {
      toast.error(err.message || 'Failed to update workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!window.confirm('Are you sure you want to leave this workspace?')) return;
    try {
      await workspaceApi.leaveWorkspace(currentWorkspace._id);
      toast.success('You have left the workspace');
      await refreshWorkspaces();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to leave workspace');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm(`Are you absolutely certain you want to delete "${currentWorkspace.name}"? This action cannot be undone.`)) return;
    try {
      await workspaceApi.deleteWorkspace(currentWorkspace._id);
      toast.success('Workspace deleted');
      await refreshWorkspaces();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to delete workspace');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Workspace Settings
        </h2>
        <p className="text-xs text-slate-400">
          Configure organization settings, access control, and team members
        </p>
      </div>

      {/* General Settings Card */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            General Information
          </h3>

          <form onSubmit={handleUpdateDetails} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                required
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={wsDesc}
                onChange={(e) => setWsDesc(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members & RBAC Table */}
      <MembersTable members={members} onMemberUpdated={loadMembers} />

      {/* Danger Zone */}
      <div className="bg-rose-50/40 dark:bg-rose-950/20 rounded-3xl p-6 border border-rose-200 dark:border-rose-900/40">
        <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 mb-2">Danger Zone</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          Irreversible workspace actions and departure controls.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {!isOwner && (
            <button
              onClick={handleLeaveWorkspace}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-rose-600 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-semibold hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Leave Workspace
            </button>
          )}

          {isOwner && (
            <button
              onClick={handleDeleteWorkspace}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Delete Entire Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


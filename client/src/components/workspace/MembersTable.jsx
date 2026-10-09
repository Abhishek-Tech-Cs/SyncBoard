import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, MoreVertical } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';
import { RoleBadge } from '../common/Badge.jsx';
import { Modal } from '../common/Modal.jsx';
import { workspaceApi } from '../../api/workspaceApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const MembersTable = ({ members = [], onMemberUpdated }) => {
  const { user } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  const toast = useToast();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);

  const canManageRoles = userRole === 'OWNER' || userRole === 'ADMIN';

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await workspaceApi.updateMemberRole(currentWorkspace._id, memberId, newRole);
      toast.success('Member role updated');
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      toast.error(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    try {
      await workspaceApi.removeMember(currentWorkspace._id, memberId);
      toast.success(`${memberName} removed from workspace`);
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setLoading(true);
      await workspaceApi.inviteMember(currentWorkspace._id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
    } catch (err) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Team Members</h3>
          <p className="text-xs text-slate-400">Manage member permissions and workspace invitations</p>
        </div>

        {canManageRoles && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th className="px-5 py-3.5">Member</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Status</th>
              {canManageRoles && <th className="px-5 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
            {members.map((m) => {
              const isSelf = String(m.user?._id || m.user) === String(user?._id || user?.id);
              const isOwner = m.role === 'OWNER';

              return (
                <tr key={m._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.user?.name} src={m.user?.avatar} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {m.user?.name}
                          {isSelf && <span className="text-[10px] text-indigo-500 font-bold">(You)</span>}
                        </p>
                        <p className="text-xs text-slate-400">{m.user?.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {canManageRoles && !isOwner && !isSelf ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m._id, e.target.value)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="MEMBER">Member</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>

                  {canManageRoles && (
                    <td className="px-5 py-4 text-right">
                      {!isOwner && !isSelf && (
                        <button
                          onClick={() => handleRemoveMember(m._id, m.user?.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove from workspace"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Teammate"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Colleague Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role in Workspace
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
            >
              <option value="ADMIN">Admin (Full project and settings management)</option>
              <option value="MANAGER">Manager (Create projects, manage tasks)</option>
              <option value="MEMBER">Member (Create and update tasks, chat)</option>
              <option value="VIEWER">Viewer (Read-only access to boards)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? 'Sending Invite...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

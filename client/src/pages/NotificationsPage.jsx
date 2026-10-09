import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, CheckCircle2, XCircle, Trash2, ArrowRight } from 'lucide-react';
import { notificationApi } from '../api/notificationApi.js';
import { workspaceApi } from '../api/workspaceApi.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDistanceToNow } from 'date-fns';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { refreshWorkspaces, switchWorkspace } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications({
        unreadOnly: unreadOnly ? 'true' : 'false',
        limit: 50,
      });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      if (unreadOnly) {
        setNotifications([]);
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark notifications read');
    }
  };

  const handleClickNotification = async (n) => {
    if (!n.read) {
      try {
        await notificationApi.markAsRead(n._id);
        if (unreadOnly) {
          setNotifications((prev) => prev.filter((item) => item._id !== n._id));
        } else {
          setNotifications((prev) =>
            prev.map((item) => (item._id === n._id ? { ...item, read: true } : item))
          );
        }
      } catch (err) {
        // ignore
      }
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item._id !== id));
      toast.success('Notification removed');
    } catch (err) {
      toast.error('Failed to remove notification');
    }
  };

  const handleAcceptInvite = async (e, n) => {
    e.stopPropagation();
    const token = n.data?.token || n.link?.replace('/invitations/', '');
    if (!token) return;

    try {
      setActionLoading(n._id);
      const res = await workspaceApi.acceptInvitation(token);
      const ws = res.data.workspace;

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === n._id
            ? {
                ...item,
                read: true,
                title: 'Workspace Invitation (Accepted)',
                message: `You accepted the invitation to join ${ws?.name || n.workspace?.name || 'the workspace'}`,
                data: { ...item.data, status: 'accepted' },
              }
            : item
        )
      );

      toast.success(`Joined ${ws?.name || 'workspace'} successfully!`);
      await refreshWorkspaces();
      if (ws) {
        switchWorkspace(ws);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to accept invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineInvite = async (e, n) => {
    e.stopPropagation();
    const token = n.data?.token || n.link?.replace('/invitations/', '');
    if (!token) return;

    try {
      setActionLoading(n._id);
      await workspaceApi.declineInvitation(token);

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === n._id
            ? {
                ...item,
                read: true,
                title: 'Workspace Invitation (Declined)',
                message: `You declined the invitation to join ${n.workspace?.name || 'the workspace'}`,
                data: { ...item.data, status: 'declined' },
              }
            : item
        )
      );

      toast.info('Invitation declined');
    } catch (err) {
      toast.error(err.message || 'Failed to decline invitation');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h2>
          <p className="text-xs text-slate-400">Activity and updates directed to your account</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              unreadOnly
                ? 'bg-indigo-600 text-white border-transparent'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            Unread only
          </button>
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => {
            const isInvite = n.type === 'WORKSPACE_INVITE';
            const isAccepted = n.data?.status === 'accepted';
            const isDeclined = n.data?.status === 'declined';
            const isPendingInvite = isInvite && !isAccepted && !isDeclined;

            return (
              <div
                key={n._id}
                onClick={() => handleClickNotification(n)}
                className={`group p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors relative ${
                  !n.read ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                }`}
              >
                <Avatar name={n.sender?.name || 'System'} src={n.sender?.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        {n.title}
                      </h4>
                      {isAccepted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Accepted
                        </span>
                      )}
                      {isDeclined && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <XCircle className="w-3 h-3" /> Declined
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>

                  {/* Actions for Workspace Invite */}
                  {isPendingInvite && (
                    <div className="mt-3 flex items-center gap-2.5">
                      <button
                        onClick={(e) => handleAcceptInvite(e, n)}
                        disabled={actionLoading === n._id}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {actionLoading === n._id ? 'Joining...' : 'Accept Invitation'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeclineInvite(e, n)}
                        disabled={actionLoading === n._id}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {n.workspace && (
                    <span className="inline-block mt-2 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {n.workspace.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center">
                  {!n.read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(e, n._id)}
                    title="Remove notification"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-slate-400">
            <Bell className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs font-semibold">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};


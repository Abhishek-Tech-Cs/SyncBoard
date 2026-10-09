import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, Building, Users } from 'lucide-react';
import { workspaceApi } from '../api/workspaceApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const AcceptInvitationPage = () => {
  const { token } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { refreshWorkspaces, switchWorkspace } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [acceptedWorkspace, setAcceptedWorkspace] = useState(null);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const res = await workspaceApi.acceptInvitation(token);
      const ws = res.data.workspace;

      setAcceptedWorkspace(ws);
      setSuccess(true);
      if (res.data.alreadyMember) {
        toast.info(`You are already a member of ${ws?.name || 'this workspace'}`);
      } else {
        toast.success(`Welcome to ${ws?.name || 'the workspace'}!`);
      }

      // Refresh workspaces in context and switch to this workspace
      await refreshWorkspaces();
      if (ws) {
        switchWorkspace(ws);
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Invalid or expired invitation token');
    } finally {
      setLoading(false);
    }
  };

  // If user is logged in, offer 1-click or auto-trigger
  useEffect(() => {
    if (isAuthenticated && token && !success && !error && !loading) {
      handleAccept();
    }
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-2xl flex items-center justify-center mx-auto mb-4">
            <Building className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Workspace Invitation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            You've been invited to collaborate in a workspace on SyncBoard. Please sign in or create an account to accept the invitation.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
              Sign In to Accept <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
        {success ? (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Invitation Accepted!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You are now an active member of <strong>{acceptedWorkspace?.name || 'the workspace'}</strong>.
              Redirecting you to the dashboard...
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-2 w-full py-2.5 px-4 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
            >
              Go to Dashboard
            </button>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-black text-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Unable to Accept Invitation
            </h2>
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {error}
            </p>
            <p className="text-xs text-slate-400">
              This invitation token may be invalid, expired, or has already been used.
            </p>
            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={() => {
                  setError('');
                  handleAccept();
                }}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-500/20"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
              >
                Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Joining Workspace...
            </h2>
            <p className="text-xs text-slate-400">
              Verifying your invitation token and setting up your workspace access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


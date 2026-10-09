import React, { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  Tag,
  CheckSquare,
  Paperclip,
  MessageSquare,
  Trash2,
  Send,
  Upload,
  AlertTriangle,
  History,
  X,
  Check
} from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { StatusBadge, PriorityBadge } from '../common/Badge.jsx';
import { TASK_STATUSES, STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/constants.js';
import { taskApi } from '../../api/taskApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { format } from 'date-fns';

export const TaskDetailModal = ({
  isOpen,
  onClose,
  taskId,
  onTaskUpdated,
  onTaskDeleted,
  members = [],
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Todo');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'comments' | 'attachments'

  // Load task and comments
  useEffect(() => {
    if (!isOpen || !taskId) return;

    const loadTask = async () => {
      try {
        setLoading(true);
        const res = await taskApi.getTaskById(taskId);
        const t = res.data.task;
        setTask(t);
        setComments(res.data.comments || []);
        setTitle(t.title);
        setDescription(t.description || '');
        setStatus(t.status);
        setPriority(t.priority);
        setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '');
        setSelectedAssignees(t.assignees?.map((a) => a._id || a) || []);
      } catch (err) {
        toast.error('Failed to load task details');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [isOpen, taskId]);

  const handleSaveDetails = async () => {
    try {
      const res = await taskApi.updateTask(taskId, {
        title,
        description,
        status,
        priority,
        dueDate: dueDate || null,
        assignees: selectedAssignees,
      });
      setTask(res.data.task);
      toast.success('Task updated');
      if (onTaskUpdated) onTaskUpdated(res.data.task);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskApi.deleteTask(taskId);
      toast.success('Task deleted');
      if (onTaskDeleted) onTaskDeleted(taskId);
      onClose();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    try {
      const res = await taskApi.addChecklistItem(taskId, newChecklistText.trim());
      setTask((prev) => ({ ...prev, checklist: res.data.checklist }));
      setNewChecklistText('');
      if (onTaskUpdated) onTaskUpdated({ ...task, checklist: res.data.checklist });
    } catch (err) {
      toast.error('Failed to add checklist item');
    }
  };

  const handleToggleChecklist = async (itemId, completed) => {
    try {
      const res = await taskApi.toggleChecklistItem(taskId, itemId, !completed);
      setTask((prev) => ({ ...prev, checklist: res.data.checklist }));
      if (onTaskUpdated) onTaskUpdated({ ...task, checklist: res.data.checklist });
    } catch (err) {
      toast.error('Failed to toggle checklist item');
    }
  };

  const handleDeleteChecklistItem = async (itemId) => {
    try {
      const res = await taskApi.deleteChecklistItem(taskId, itemId);
      setTask((prev) => ({ ...prev, checklist: res.data.checklist }));
      if (onTaskUpdated) onTaskUpdated({ ...task, checklist: res.data.checklist });
    } catch (err) {
      toast.error('Failed to remove checklist item');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      const res = await taskApi.addComment(taskId, { content: commentContent.trim() });
      setComments((prev) => [...prev, res.data.comment]);
      setCommentContent('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);
    formData.append('projectId', task.project?._id || task.project);

    try {
      const res = await taskApi.uploadAttachment(formData);
      setTask((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), res.data.attachment],
      }));
      toast.success('File uploaded');
      if (onTaskUpdated) onTaskUpdated(task);
    } catch (err) {
      toast.error('Failed to upload file: ' + err.message);
    }
  };

  if (!task) return null;

  const completedChecklistCount = task.checklist?.filter((c) => c.completed).length || 0;
  const totalChecklistCount = task.checklist?.length || 0;
  const checklistPercentage = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.taskKey} maxWidth="max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Column (Left 2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveDetails}
              className="w-full text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition-all py-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDetails}
              placeholder="Add detailed task instructions, specifications, or notes..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                Checklist ({completedChecklistCount}/{totalChecklistCount})
              </label>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {checklistPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${checklistPercentage}%` }}
              />
            </div>

            <div className="space-y-1.5 mb-3">
              {task.checklist?.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm group"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(item._id, item.completed)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                    />
                    <span
                      className={`truncate ${
                        item.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.text}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDeleteChecklistItem(item._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklist} className="flex gap-2">
              <input
                type="text"
                placeholder="Add checklist item..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100"
              >
                Add
              </button>
            </form>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Discussion ({comments.length})
            </h4>

            {/* Comment List */}
            <div className="space-y-3 max-h-56 overflow-y-auto mb-4 pr-1">
              {comments.map((c) => (
                <div key={c._id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <Avatar name={c.author?.name} src={c.author?.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.author?.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {c.createdAt ? format(new Date(c.createdAt), 'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-xs text-slate-400 py-2">No comments yet. Start the conversation!</p>
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment or mention @teammate..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Attributes Column (Right 1 col) */}
        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 h-fit">
          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                taskApi.updateTask(taskId, { status: e.target.value }).then((res) => {
                  setTask(res.data.task);
                  if (onTaskUpdated) onTaskUpdated(res.data.task);
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none"
            >
              {TASK_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                taskApi.updateTask(taskId, { priority: e.target.value }).then((res) => {
                  setTask(res.data.task);
                  if (onTaskUpdated) onTaskUpdated(res.data.task);
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                taskApi.updateTask(taskId, { dueDate: e.target.value || null }).then((res) => {
                  setTask(res.data.task);
                  if (onTaskUpdated) onTaskUpdated(res.data.task);
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
            />
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Assignee
            </label>
            <select
              value={selectedAssignees[0] || ''}
              onChange={(e) => {
                const newAssignees = e.target.value ? [e.target.value] : [];
                setSelectedAssignees(newAssignees);
                taskApi.updateTask(taskId, { assignees: newAssignees }).then((res) => {
                  setTask(res.data.task);
                  if (onTaskUpdated) onTaskUpdated(res.data.task);
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                  {m.user?.name || 'Member'}
                </option>
              ))}
            </select>
          </div>

          {/* File Uploads */}
          <div className="pt-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Attachments ({task.attachments?.length || 0})
            </label>
            <label className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 cursor-pointer bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors">
              <Upload className="w-4 h-4 text-slate-400" /> Upload File
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>

            {task.attachments?.length > 0 && (
              <div className="space-y-1 mt-2 max-h-28 overflow-y-auto">
                {task.attachments.map((att) => (
                  <a
                    key={att._id}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 p-1.5 rounded bg-white dark:bg-slate-900 text-[11px] text-indigo-600 dark:text-indigo-400 truncate hover:underline"
                  >
                    <Paperclip className="w-3 h-3 shrink-0" />
                    <span className="truncate">{att.fileName}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Delete Task Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleDeleteTask}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Task
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};


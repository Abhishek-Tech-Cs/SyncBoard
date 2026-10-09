import React, { useState, useEffect } from 'react';
import { TASK_STATUSES } from '../../utils/constants.js';
import { KanbanColumn } from './KanbanColumn.jsx';
import { TaskDetailModal } from './TaskDetailModal.jsx';
import { TaskCreateModal } from './TaskCreateModal.jsx';
import { taskApi } from '../../api/taskApi.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const KanbanBoard = ({ projectId, tasks: initialTasks = [], members = [] }) => {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createColumnStatus, setCreateColumnStatus] = useState('Todo');

  const { socket, joinProject, leaveProject } = useSocket();
  const toast = useToast();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Join Socket.io project room and listen for real-time board updates!
  useEffect(() => {
    if (!projectId) return;

    joinProject(projectId);

    if (socket) {
      const handleTaskCreated = (newTask) => {
        if (newTask.project?._id === projectId || newTask.project === projectId) {
          setTasks((prev) => [...prev.filter((t) => t._id !== newTask._id), newTask]);
        }
      };

      const handleTaskUpdated = (updatedTask) => {
        if (updatedTask.project?._id === projectId || updatedTask.project === projectId) {
          setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
          if (selectedTask?._id === updatedTask._id) {
            setSelectedTask(updatedTask);
          }
        }
      };

      const handleTaskMoved = ({ taskId, status, order, task }) => {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status, order } : t))
        );
      };

      const handleTaskDeleted = ({ taskId }) => {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        if (selectedTask?._id === taskId) {
          setSelectedTask(null);
        }
      };

      socket.on('task:created', handleTaskCreated);
      socket.on('task:updated', handleTaskUpdated);
      socket.on('task:moved', handleTaskMoved);
      socket.on('task:deleted', handleTaskDeleted);

      return () => {
        leaveProject(projectId);
        socket.off('task:created', handleTaskCreated);
        socket.off('task:updated', handleTaskUpdated);
        socket.off('task:moved', handleTaskMoved);
        socket.off('task:deleted', handleTaskDeleted);
      };
    }
  }, [projectId, socket, selectedTask?._id]);

  // Handle Drag and Drop
  const handleTaskDrop = async (taskId, targetStatus) => {
    const taskToMove = tasks.find((t) => t._id === taskId);
    if (!taskToMove || taskToMove.status === targetStatus) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await taskApi.moveTask(taskId, {
        status: targetStatus,
        order: tasks.filter((t) => t.status === targetStatus).length,
      });
    } catch (err) {
      toast.error('Failed to move task on server');
      // Revert if error
      setTasks(initialTasks);
    }
  };

  const handleOpenCreateModal = (status) => {
    setCreateColumnStatus(status);
    setCreateModalOpen(true);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* 5-Column Horizontal Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-h-[calc(100vh-14rem)] w-max pr-4">
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks.filter((t) => t.status === status)}
              onTaskClick={(task) => setSelectedTask(task)}
              onAddTask={handleOpenCreateModal}
              onTaskDrop={handleTaskDrop}
            />
          ))}
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask._id}
          members={members}
          onTaskUpdated={(updated) => {
            setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
          }}
          onTaskDeleted={(deletedId) => {
            setTasks((prev) => prev.filter((t) => t._id !== deletedId));
            setSelectedTask(null);
          }}
        />
      )}

      {/* Task Creation Modal */}
      <TaskCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        defaultStatus={createColumnStatus}
        members={members}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [...prev, newTask]);
        }}
      />
    </div>
  );
};


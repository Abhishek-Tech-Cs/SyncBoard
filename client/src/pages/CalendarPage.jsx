import React, { useState, useEffect } from 'react';
import { taskApi } from '../api/taskApi.js';
import { workspaceApi } from '../api/workspaceApi.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { CalendarView } from '../components/calendar/CalendarView.jsx';

export const CalendarPage = () => {
  const { currentWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCalendarData = async () => {
    if (!currentWorkspace?._id) return;
    try {
      setLoading(true);
      const [tasksRes, membersRes] = await Promise.all([
        taskApi.getTasks({}),
        workspaceApi.getMembers(currentWorkspace._id),
      ]);
      setTasks(tasksRes.data.tasks || []);
      setMembers(membersRes.data.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [currentWorkspace?._id]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <CalendarView
        tasks={tasks}
        members={members}
        onTaskUpdated={(upd) => {
          setTasks((prev) => prev.map((t) => (t._id === upd._id ? upd : t)));
        }}
      />
    </div>
  );
};


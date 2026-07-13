import React from 'react';
import type { StaffTask } from '../utils/mockData';
import { ClipboardList, UserCheck, CheckCircle2, User } from 'lucide-react';

interface TaskDispatcherProps {
  tasks: StaffTask[];
  onAssignTask: (taskId: string, staffName: string) => void;
  onCompleteTask: (taskId: string) => void;
}

export const TaskDispatcher: React.FC<TaskDispatcherProps> = ({
  tasks,
  onAssignTask,
  onCompleteTask,
}) => {
  const getPriorityClass = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priority) {
      case 'HIGH': return 'text-rose-400 bg-rose-950/40 border border-rose-900';
      case 'MEDIUM': return 'text-amber-400 bg-amber-950/40 border border-amber-900';
      case 'LOW': return 'text-slate-400 bg-slate-800 border border-slate-700';
    }
  };

  const unassigned = tasks.filter(t => t.status === 'Unassigned');
  const inProgress = tasks.filter(t => t.status === 'In Progress');
  const completed = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="card glass-card task-card flex flex-col h-full">
      <div className="card-header border-b pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-emerald" size={20} />
          <h2 className="card-title text-lg font-bold">Volunteer & Staff Dispatch Board</h2>
        </div>
        <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
          Tasks: {tasks.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-grow overflow-hidden">
        
        {/* Unassigned Tasks */}
        <div className="flex flex-col bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 max-h-[300px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between pb-1 border-b border-slate-900">
            <span>Unassigned ({unassigned.length})</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {unassigned.length === 0 ? (
              <div className="text-center py-6 text-[11px] text-slate-600">No pending requests</div>
            ) : (
              unassigned.map(task => (
                <div key={task.id} className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-lg flex flex-col gap-1.5" id={`task-item-${task.id}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">{task.createdAt}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 leading-snug">{task.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{task.location.split(' ')[0]}</p>
                  <button
                    onClick={() => onAssignTask(task.id, 'Officer Ramirez')}
                    className="w-full mt-1 bg-slate-850 hover:bg-emerald-950/80 hover:text-emerald-300 text-[10px] py-1.5 rounded border border-slate-800 transition flex items-center justify-center gap-1"
                    id={`btn-assign-task-${task.id}`}
                  >
                    <UserCheck size={11} /> Assign to me
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* In Progress Tasks */}
        <div className="flex flex-col bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 max-h-[300px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between pb-1 border-b border-slate-900">
            <span>In Progress ({inProgress.length})</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {inProgress.length === 0 ? (
              <div className="text-center py-6 text-[11px] text-slate-600">No active work</div>
            ) : (
              inProgress.map(task => (
                <div key={task.id} className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-lg flex flex-col gap-1.5" id={`task-item-${task.id}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">{task.createdAt}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 leading-snug">{task.title}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <User size={10} className="text-amber-500" />
                    <span>Active: {task.assignedTo}</span>
                  </div>
                  <button
                    onClick={() => onCompleteTask(task.id)}
                    className="w-full mt-1 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-900/50 text-[10px] py-1.5 rounded transition flex items-center justify-center gap-1"
                    id={`btn-complete-task-${task.id}`}
                  >
                    <CheckCircle2 size={11} /> Complete task
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="flex flex-col bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 max-h-[300px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between pb-1 border-b border-slate-900">
            <span>Completed ({completed.length})</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {completed.length === 0 ? (
              <div className="text-center py-6 text-[11px] text-slate-600">No completed tasks yet</div>
            ) : (
              completed.map(task => (
                <div key={task.id} className="p-2.5 bg-slate-900/40 border border-slate-950 rounded-lg flex flex-col gap-1.5 opacity-60" id={`task-item-${task.id}`}>
                  <h4 className="text-xs font-semibold text-slate-400 line-through leading-snug">{task.title}</h4>
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span>By: {task.assignedTo}</span>
                    <span className="flex items-center gap-0.5 text-emerald-500">
                      <CheckCircle2 size={10} /> Done
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

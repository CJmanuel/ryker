import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { showError, showSuccess } from '../services/toastService';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  estimated_hours: number;
  actual_hours: number;
  created_at: string;
}

const Team: React.FC = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [projectWizardStep, setProjectWizardStep] = useState<1 | 2>(1);
  const [taskWizardStep, setTaskWizardStep] = useState<1 | 2>(1);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  interface ProjectFormData {
    name: string;
    description: string;
    status: Project['status'];
    priority: Project['priority'];
    start_date: string;
    end_date: string;
  }

  interface TaskFormData {
    title: string;
    description: string;
    status: Task['status'];
    priority: Task['priority'];
    due_date: string;
    estimated_hours: string;
    project_id: string;
  }

  const [projectFormData, setProjectFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    end_date: ''
  });

  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    project_id: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      showError('Failed to load projects: ' + error.message);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      showError('Failed to load tasks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const projectData = {
        name: projectFormData.name,
        description: projectFormData.description,
        status: projectFormData.status,
        priority: projectFormData.priority,
        start_date: projectFormData.start_date || null,
        end_date: projectFormData.end_date || null,
        created_by: profile?.id
      };

      if (editingProjectId) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProjectId);

        if (error) throw error;
        showSuccess('Project updated successfully!');
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;
        showSuccess('Project created successfully!');
      }

      setShowProjectForm(false);
      setEditingProjectId(null);
      setProjectWizardStep(1);
      setProjectFormData({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        start_date: '',
        end_date: ''
      });
      fetchProjects();
    } catch (error: any) {
      showError(`Failed to ${editingProjectId ? 'update' : 'create'} project: ` + error.message);
    }
  };

  const handleEditProject = (project: Project) => {
    setProjectFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      start_date: project.start_date,
      end_date: project.end_date
    });
    setEditingProjectId(project.id);
    setShowProjectForm(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Project deleted successfully!');
      fetchProjects();
    } catch (error: any) {
      showError('Failed to delete project: ' + error.message);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        project_id: taskFormData.project_id,
        title: taskFormData.title,
        description: taskFormData.description,
        status: taskFormData.status,
        priority: taskFormData.priority,
        due_date: taskFormData.due_date || null,
        estimated_hours: parseFloat(taskFormData.estimated_hours) || 0,
        created_by: profile?.id
      };

      if (editingTaskId) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTaskId);

        if (error) throw error;
        showSuccess('Task updated successfully!');
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([taskData]);

        if (error) throw error;
        showSuccess('Task created successfully!');
      }

      setShowTaskForm(false);
      setEditingTaskId(null);
      setTaskWizardStep(1);
      setTaskFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        estimated_hours: '',
        project_id: ''
      });
      fetchTasks();
    } catch (error: any) {
      showError(`Failed to ${editingTaskId ? 'update' : 'create'} task: ` + error.message);
    }
  };

  const handleEditTask = (task: Task) => {
    setTaskFormData({
      project_id: task.project_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      estimated_hours: task.estimated_hours.toString()
    });
    setEditingTaskId(task.id);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Task deleted successfully!');
      fetchTasks();
    } catch (error: any) {
      showError('Failed to delete task: ' + error.message);
    }
  };

  const handleViewTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const getStatusColor = (status: string, type: 'project' | 'task') => {
    if (type === 'project') {
      const colors = {
        planning: 'bg-blue-100 text-blue-800',
        active: 'bg-green-100 text-green-800',
        'on-hold': 'bg-yellow-100 text-yellow-800',
        completed: 'bg-indigo-100 text-indigo-800'
      };
      return colors[status as keyof typeof colors] || colors.planning;
    } else {
      const colors = {
        todo: 'bg-gray-100 text-gray-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        review: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-green-100 text-green-800'
      };
      return colors[status as keyof typeof colors] || colors.todo;
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatsProject = () => {
    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      planning: projects.filter(p => p.status === 'planning').length,
      completed: projects.filter(p => p.status === 'completed').length
    };
    return stats;
  };

  const getStatsTask = () => {
    const stats = {
      total: tasks.length,
      active: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'todo').length
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading team data...</div>
        </div>
      </div>
    );
  }

  const projectStats = getStatsProject();
  const taskStats = getStatsTask();

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Team Management</h1>
            <p className="subtitle">Organize projects, tasks, and team collaboration</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowProjectForm(!showProjectForm);
                setProjectWizardStep(1);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              {showProjectForm ? 'Cancel' : '+ New Project'}
            </button>
            <button
              onClick={() => {
                setShowTaskForm(!showTaskForm);
                setTaskWizardStep(1);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              {showTaskForm ? 'Cancel' : '+ New Task'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-600">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'projects'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              Projects ({projectStats.total})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'tasks'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              Tasks ({taskStats.total})
            </button>
          </nav>
        </div>

        {/* Status Cards - Projects */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="stat-card">
              <div className="text-gray-400 text-sm font-medium">Total</div>
              <div className="text-3xl font-bold text-white mt-2">{projectStats.total}</div>
            </div>
            <div className="stat-card">
              <div className="text-green-400 text-sm font-medium">Active</div>
              <div className="text-3xl font-bold text-green-400 mt-2">{projectStats.active}</div>
            </div>
            <div className="stat-card">
              <div className="text-blue-400 text-sm font-medium">Planning</div>
              <div className="text-3xl font-bold text-blue-400 mt-2">{projectStats.planning}</div>
            </div>
            <div className="stat-card">
              <div className="text-indigo-400 text-sm font-medium">Completed</div>
              <div className="text-3xl font-bold text-indigo-400 mt-2">{projectStats.completed}</div>
            </div>
          </div>
        )}

        {/* Status Cards - Tasks */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="stat-card">
              <div className="text-gray-400 text-sm font-medium">Total</div>
              <div className="text-3xl font-bold text-white mt-2">{taskStats.total}</div>
            </div>
            <div className="stat-card">
              <div className="text-blue-400 text-sm font-medium">In Progress</div>
              <div className="text-3xl font-bold text-blue-400 mt-2">{taskStats.active}</div>
            </div>
            <div className="stat-card">
              <div className="text-orange-400 text-sm font-medium">Pending</div>
              <div className="text-3xl font-bold text-orange-400 mt-2">{taskStats.pending}</div>
            </div>
            <div className="stat-card">
              <div className="text-green-400 text-sm font-medium">Completed</div>
              <div className="text-3xl font-bold text-green-400 mt-2">{taskStats.completed}</div>
            </div>
          </div>
        )}

        {/* Project Form - 2-Step Wizard */}
        {showProjectForm && (
          <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Create New Project</h3>
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${projectWizardStep === 1 ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  1
                </div>
                <div className={`h-1 w-12 ${projectWizardStep === 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${projectWizardStep === 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  2
                </div>
              </div>
              <div className="flex justify-between mt-4 text-sm text-gray-600">
                <span className="font-medium">Project Details</span>
                <span className="font-medium">Timeline & Status</span>
              </div>
            </div>

            <form onSubmit={handleProjectSubmit} className="space-y-6">
            {projectWizardStep === 1 && (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">Project Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                      <input
                        type="text"
                        value={projectFormData.name}
                        onChange={(e) => setProjectFormData({...projectFormData, name: e.target.value})}
                        placeholder="e.g., Website Redesign"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={projectFormData.priority}
                        onChange={(e) => setProjectFormData({...projectFormData, priority: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={projectFormData.description}
                      onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                      placeholder="Describe the project objectives and scope"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            {projectWizardStep === 2 && (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">Timeline & Status</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={projectFormData.status}
                        onChange={(e) => setProjectFormData({...projectFormData, status: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={projectFormData.start_date}
                        onChange={(e) => setProjectFormData({...projectFormData, start_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={projectFormData.end_date}
                        onChange={(e) => setProjectFormData({...projectFormData, end_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
                    <h3 className="font-medium text-gray-900 mb-2">Review Project</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div><strong>Name:</strong> {projectFormData.name}</div>
                      <div><strong>Priority:</strong> {projectFormData.priority}</div>
                      <div><strong>Status:</strong> {projectFormData.status}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => projectWizardStep === 2 ? setProjectWizardStep(1) : setShowProjectForm(false)}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                {projectWizardStep === 2 ? 'Back' : 'Cancel'}
              </button>
              {projectWizardStep === 1 && (
                <button
                  type="button"
                  onClick={() => setProjectWizardStep(2)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Next Step
                </button>
              )}
              {projectWizardStep === 2 && (
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Create Project
                </button>
              )}
            </div>
            </form>
          </div>
        )}

      {/* Task Form - 2-Step Wizard */}
      {showTaskForm && (
        <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${taskWizardStep === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}>
                1
              </div>
              <div className={`h-1 w-12 ${taskWizardStep === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${taskWizardStep === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}>
                2
              </div>
            </div>
            <div className="flex justify-between mt-4 text-sm text-gray-600">
              <span className="font-medium">Task Details</span>
              <span className="font-medium">Assignment & Timing</span>
            </div>
          </div>

          <form onSubmit={handleTaskSubmit} className="space-y-6">
            {taskWizardStep === 1 && (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">Task Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                      <input
                        type="text"
                        value={taskFormData.title}
                        onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})}
                        placeholder="e.g., Design homepage mockup"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
                      <select
                        value={taskFormData.project_id}
                        onChange={(e) => setTaskFormData({...taskFormData, project_id: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={taskFormData.description}
                      onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})}
                      placeholder="Add task details and requirements"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {taskWizardStep === 2 && (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">Assignment & Timing</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={taskFormData.status}
                        onChange={(e) => setTaskFormData({...taskFormData, status: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={taskFormData.priority}
                        onChange={(e) => setTaskFormData({...taskFormData, priority: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={taskFormData.due_date}
                        onChange={(e) => setTaskFormData({...taskFormData, due_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Est. Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        value={taskFormData.estimated_hours}
                        onChange={(e) => setTaskFormData({...taskFormData, estimated_hours: e.target.value})}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
                    <h3 className="font-medium text-gray-900 mb-2">Review Task</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div><strong>Title:</strong> {taskFormData.title}</div>
                      <div><strong>Status:</strong> {taskFormData.status}</div>
                      <div><strong>Priority:</strong> {taskFormData.priority}</div>
                      {taskFormData.estimated_hours && <div><strong>Est. Hours:</strong> {taskFormData.estimated_hours}</div>}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => taskWizardStep === 2 ? setTaskWizardStep(1) : setShowTaskForm(false)}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                {taskWizardStep === 2 ? 'Back' : 'Cancel'}
              </button>
              {taskWizardStep === 1 && (
                <button
                  type="button"
                  onClick={() => setTaskWizardStep(2)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Next Step
                </button>
              )}
              {taskWizardStep === 2 && (
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Task
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Projects Display */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">All Projects</h2>
            {projects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg">No projects found. Create your first project to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white border border-gray-200 rounded-lg">
                    <div className="p-6">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project.name}
                        </h3>
                        <div className="flex">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Status
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Priority
                          </span>
                        </div>
                      </div>

                      {/* {project.description && (
                        <p className="text-gray-600 text-sm mb-4">
                          {project.description}
                        </p>
                      )} */}

                      {/* <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500 mr-2">📊</span>
                          <span className="text-gray-900">
                            0 tasks
                          </span>
                        </div>
                      </div> */}
                    </div>

                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium" type="button">
                          View Details
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditProject(project)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tasks Display */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">All Tasks</h2>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-lg">No tasks found. Create your first task to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-lg">
                    <div className="p-4">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {task.title}
                        </h3>
                        <div className="flex">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {task.status}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => handleViewTaskDetails(task)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                        <div className="flex">
                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h2>
                  <div className="flex gap-2 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTask.status, 'task')}`}>
                      {selectedTask.status.charAt(0).toUpperCase() + selectedTask.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)} Priority
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTaskDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {selectedTask.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedTask.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Details</h3>
                    <div className="space-y-3">
                      {selectedTask.due_date && (
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-3">📅</span>
                          <div>
                            <p className="text-sm text-gray-500">Due Date</p>
                            <p className="text-gray-900">{new Date(selectedTask.due_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}

                      {selectedTask.estimated_hours > 0 && (
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-3">⏱️</span>
                          <div>
                            <p className="text-sm text-gray-500">Estimated Hours</p>
                            <p className="text-gray-900">{selectedTask.estimated_hours} hours</p>
                          </div>
                        </div>
                      )}

                      {selectedTask.actual_hours > 0 && (
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-3">✅</span>
                          <div>
                            <p className="text-sm text-gray-500">Actual Hours</p>
                            <p className="text-gray-900">{selectedTask.actual_hours} hours</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center">
                        <span className="text-gray-500 mr-3">📁</span>
                        <div>
                          <p className="text-sm text-gray-500">Project</p>
                          <p className="text-gray-900">
                            {projects.find(p => p.id === selectedTask.project_id)?.name || 'Unknown Project'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Status</span>
                        <span className="text-sm text-gray-600">{selectedTask.status.replace('-', ' ')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            selectedTask.status === 'completed' ? 'bg-green-500' :
                            selectedTask.status === 'in-progress' ? 'bg-blue-500' :
                            selectedTask.status === 'review' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}
                          style={{ width: selectedTask.status === 'completed' ? '100%' : selectedTask.status === 'in-progress' ? '60%' : selectedTask.status === 'review' ? '80%' : '20%' }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(selectedTask.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowTaskDetails(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskDetails(false);
                      handleEditTask(selectedTask);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Edit Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      </div>
    </div>
  );
};

export default Team;

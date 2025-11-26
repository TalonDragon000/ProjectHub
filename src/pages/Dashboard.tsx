import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, ExternalLink, TrendingUp, Users, DollarSign, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../types';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

  // Only load data when profile is available
  if (profile) {
    loadProjects();
    loadStats();
  } else {
    // Profile is still loading from AuthContext
    setLoading(false);
  }
}, [user, profile]); // Add profile as dependency

  const loadProjects = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('creator_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    if (!profile) return;

    const { data: projectsData } = await supabase
      .from('projects')
      .select('id')
      .eq('creator_id', profile.id);

    if (projectsData) {
      const projectIds = projectsData.map((p) => p.id);

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id')
        .in('project_id', projectIds);

      const { data: analyticsData } = await supabase
        .from('project_analytics')
        .select('page_views')
        .in('project_id', projectIds);

      setStats({
        totalProjects: projectsData.length,
        totalReviews: reviewsData?.length || 0,
        totalViews: analyticsData?.reduce((sum, a) => sum + a.page_views, 0) || 0,
      });
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (!error) {
      loadProjects();
      loadStats();
    }
  };

  const togglePublish = async (projectId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('projects')
      .update({ is_published: !currentStatus })
      .eq('id', projectId);

    if (!error) {
      loadProjects();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xl text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-slate-900">
              BuildHub
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-slate-600">
                Welcome, {profile?.display_name}
              </span>
              <button
                onClick={signOut}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Manage your projects and track performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalProjects || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Views</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalViews || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Reviews</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalReviews || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Revenue</p>
                <p className="text-3xl font-bold text-slate-900">$0</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Your Projects</h2>
            <Link
              to="/dashboard/projects/new"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 mb-4">You haven't created any projects yet</p>
              <Link
                to="/dashboard/projects/new"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Project</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {projects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">{project.name}</h3>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            project.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {project.is_published ? 'Published' : 'Draft'}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full capitalize">
                          {project.category}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-3">{project.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>★ {project.average_rating.toFixed(1)} ({project.total_reviews} reviews)</span>
                        <span>•</span>
                        <span>Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {project.is_published && (
                        <a
                          href={`/project/${project.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View public page"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                      <Link
                        to={`/dashboard/projects/${project.id}/edit`}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit project"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => togglePublish(project.id, project.is_published)}
                        className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {project.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

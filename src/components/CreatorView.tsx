import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  TrendingUp,
  MessageSquare,
  Star,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../types';
import { format } from 'date-fns';
import CreatorWelcomeScreen from '../components/CreatorWelcomeScreen';

interface CreatorStats {
  totalProjects: number;
  totalReviews: number;
  totalViews: number;
  averageRating: number;
}

export default function CreatorView() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({
    totalProjects: 0,
    totalReviews: 0,
    totalViews: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_creator) {
      loadCreatorData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const loadCreatorData = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setProjects(data);

      const projectIds = data.map((p) => p.id);

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id')
        .in('project_id', projectIds);

      const { data: analyticsData } = await supabase
        .from('project_analytics')
        .select('page_views')
        .in('project_id', projectIds);

      setCreatorStats({
        totalProjects: data.length,
        totalReviews: reviewsData?.length || 0,
        totalViews: analyticsData?.reduce((sum, a) => sum + a.page_views, 0) || 0,
        averageRating:
          data.length > 0
            ? data.reduce((sum, p) => sum + p.average_rating, 0) / data.length
            : 0,
      });
    }

    setLoading(false);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (!error) {
      loadCreatorData();
    }
  };

  const togglePublish = async (projectId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('projects')
      .update({ is_published: !currentStatus })
      .eq('id', projectId);

    if (!error) {
      loadCreatorData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-slate-600">Loading...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return <CreatorWelcomeScreen />;
  }

  return (
    <>
      <div id="creator-dashboard-header" className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Creator Dashboard</h1>
        <p className="text-slate-600">Manage your projects and track performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div id="creator-total-projects" className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-slate-900">
                {creatorStats.totalProjects || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div id="creator-total-views" className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Views</p>
              <p className="text-3xl font-bold text-slate-900">
                {creatorStats.totalViews || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div id="creator-total-reviews" className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Reviews</p>
              <p className="text-3xl font-bold text-slate-900">
                {creatorStats.totalReviews || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div id="creator-avg-rating" className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg Rating</p>
              <p className="text-3xl font-bold text-slate-900">
                {creatorStats.averageRating?.toFixed(1) || '0.0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div id="creator-projects-list" className="bg-white rounded-xl shadow-lg border border-slate-200">
        <div id="creator-projects-list-header" className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 id="creator-projects-list-title" className="text-xl font-bold text-slate-900">Your Projects</h2>
          <Link
            to="/dashboard/projects/new"
            id="creator-new-project-link"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span id="creator-new-project-text">New Project</span>
          </Link>
        </div>

        <div id="creator-projects-list-items" className="divide-y divide-slate-200">
          {projects.map((project) => (
            <div id="creator-project-item" key={project.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 id="creator-project-name" className="text-xl font-bold text-slate-900">
                      {project.name}
                    </h3>
                    
                    <span
                      id="creator-project-status"
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
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                    <span>
                      ★ {project.average_rating.toFixed(1)} ({project.total_reviews} reviews)
                    </span>
                    <span>•</span>
                    <span>Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}</span>
                  </div>

                  <div className="flex items-center space-x-2">
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
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
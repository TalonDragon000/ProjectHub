import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  TrendingUp,
  Users,
  MessageSquare,
  Settings,
  User,
  Briefcase,
  Star,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Project, Review } from '../types';
import { format } from 'date-fns';
import DiscoverProjects from '../components/DiscoverProjects';

export default function Dashboard() {
  const { user, profile, activeView, setActiveView, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [creatorStats, setCreatorStats] = useState<any>({});
  const [userStats, setUserStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (profile) {
      if (activeView === 'creator' && profile.is_creator) {
        loadCreatorData();
      } else {
        loadUserData();
      }
    } else {
      setLoading(false);
    }
  }, [user, profile, activeView]);

  const loadUserData = async () => {
    if (!profile) return;

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, project:projects(name, slug)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (reviewsData) {
      setUserReviews(reviewsData);
    }

    const { data: allReviewsData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('user_id', profile.id);

    if (allReviewsData) {
      const avgRating =
        allReviewsData.length > 0
          ? allReviewsData.reduce((sum, r) => sum + r.rating, 0) / allReviewsData.length
          : 0;

      setUserStats({
        totalReviews: allReviewsData.length,
        averageRatingGiven: avgRating,
        projectsReviewed: new Set(allReviewsData.map((r: any) => r.project_id)).size,
      });
    }

    setLoading(false);
  };

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
              ProjectHub
            </Link>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('user')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    activeView === 'user'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">User View</span>
                </button>
                <button
                  onClick={() => profile?.is_creator && setActiveView('creator')}
                  disabled={!profile?.is_creator}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    activeView === 'creator' && profile?.is_creator
                      ? 'bg-white text-blue-600 shadow-sm'
                      : !profile?.is_creator
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={
                    !profile?.is_creator ? 'Create a project to unlock Creator View' : ''
                  }
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm font-medium">Creator View</span>
                </button>
              </div>
              <Link
                to={`/profile/${profile?.username}`}
                className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                Welcome, {profile?.display_name}
              </Link>
              <Link
                to="/dashboard/settings"
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
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
        {activeView === 'user' ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Discover Projects</h1>
              <p className="text-slate-600">
                Explore amazing projects from the community and share your feedback
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Reviews Written</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {userStats.totalReviews || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Avg Rating Given</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {userStats.averageRatingGiven?.toFixed(1) || '0.0'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Projects Reviewed</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {userStats.projectsReviewed || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {userReviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Reviews</h2>
                <div className="space-y-4">
                  {userReviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-200 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <Link
                          to={`/project/${review.project?.slug}`}
                          className="font-semibold text-slate-900 hover:text-blue-600"
                        >
                          {review.project?.name}
                        </Link>
                        <div className="flex items-center text-yellow-500">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-1">{review.title}</p>
                      <p className="text-sm text-slate-600 line-clamp-2">{review.review_text}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
                {profile && (
                  <Link
                    to={`/profile/${profile.username}`}
                    className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All Reviews →
                  </Link>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Browse Projects</h2>
              <DiscoverProjects />
            </div>
          </>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Creator Dashboard</h1>
              <p className="text-slate-600">Manage your projects and track performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
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

              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
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

              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
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

              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
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
                            <span>
                              ★ {project.average_rating.toFixed(1)} ({project.total_reviews} reviews)
                            </span>
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
          </>
        )}
      </div>
    </div>
  );
}

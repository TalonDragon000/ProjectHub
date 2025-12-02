import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Mail, MessageCircle, Star, Briefcase, Grid3x3, ArrowLeft, Settings, User, DollarSign, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CreatorProfile as CreatorProfileType, Project } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function CreatorProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [creator, setCreator] = useState<CreatorProfileType | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'rating-high' | 'rating-low' | 'newest' | 'oldest'>('rating-high');

  useEffect(() => {
    if (username) {
      loadCreatorProfile();
    }
  }, [username]);

  useEffect(() => {
    if (creator) {
      loadProjects();
    }
  }, [creator, sortBy]);

  const loadCreatorProfile = async () => {
    const { data: creatorData, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_id
      `)
      .eq('username', username)
      .maybeSingle();

    if (error || !creatorData) {
      setLoading(false);
      return;
    }

    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, average_rating, total_reviews')
      .eq('user_id', creatorData.id)
      .eq('is_published', true);

    const totalProjects = projectsData?.length || 0;
    const averageRating = projectsData && projectsData.length > 0
      ? projectsData.reduce((sum, p) => sum + p.average_rating, 0) / projectsData.length
      : 0;
    const totalReviews = projectsData?.reduce((sum, p) => sum + p.total_reviews, 0) || 0;

    setCreator({
      ...creatorData,
      total_projects: totalProjects,
      average_rating: averageRating,
      total_reviews: totalReviews,
    });

    setLoading(false);
  };

  const loadProjects = async () => {
    if (!creator) return;

    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', creator.id)
      .eq('is_published', true);

    switch (sortBy) {
      case 'name-asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name-desc':
        query = query.order('name', { ascending: false });
        break;
      case 'rating-high':
        query = query.order('average_rating', { ascending: false });
        break;
      case 'rating-low':
        query = query.order('average_rating', { ascending: true });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
    }

    const { data } = await query;
    if (data) setProjects(data);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isOwnProfile = profile && creator && profile.id === creator.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Creator not found</h1>
          <p className="text-slate-600 mb-6">The creator you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Grid3x3 className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">ProjectHub</span>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden flex-shrink-0">
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt={creator.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitials(creator.display_name)}</span>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{creator.display_name}</h1>
                <p className="text-lg text-slate-600 mb-4">@{creator.username}</p>

                {creator.bio && (
                  <p className="text-slate-600 mb-4">{creator.bio}</p>
                )}

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {creator.payment_provider && creator.payment_username && (
                    <a
                      href={`https://${creator.payment_provider === 'paypal' ? 'paypal.me' : creator.payment_provider === 'ko-fi' ? 'ko-fi.com' : 'buy.stripe.com'}/${creator.payment_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Support Creator</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button
                    disabled
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                    title="Coming soon"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message User</span>
                  </button>

                  {isOwnProfile && (
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {creator.open_to_beta_test && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-700">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">Open to Beta Testing</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  This creator is available to test and provide feedback on new features and projects.
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{creator.total_projects || 0}</div>
                <div className="text-sm text-slate-600">Projects</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-yellow-600 mb-2">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {creator.average_rating ? creator.average_rating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-slate-600">Avg Rating</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{creator.total_reviews || 0}</div>
                <div className="text-sm text-slate-600">Reviews</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Published Projects</h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              >
                <option value="rating-high">Rating: High to Low</option>
                <option value="rating-low">Rating: Low to High</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.slug}`)}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
                >
                  <div className="h-card-hero-golden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {project.hero_image ? (
                      <img src={project.hero_image} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl font-bold text-white opacity-50">
                        {project.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="p-golden-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full capitalize">
                        {project.category}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-bold text-slate-900">
                          {project.average_rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-500">({project.total_reviews})</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-2 h-10 overflow-hidden">{project.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No published projects yet</h3>
              <p className="text-slate-600">
                {isOwnProfile
                  ? 'Start building and publish your first project!'
                  : 'This creator hasn\'t published any projects yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

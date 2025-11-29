import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Briefcase, MessageSquare, Calendar, Award, Settings as SettingsIcon, Mail, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile, Review, Project } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile: currentUserProfile, setActiveView } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'projects'>('reviews');
  const [reviewSort, setReviewSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    if (!username) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (!profileData) {
      navigate('/');
      return;
    }

    setProfile(profileData);

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, project:projects(name, slug)')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false });

    if (reviewsData) {
      setReviews(reviewsData);
    }

    if (profileData.is_creator) {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (projectsData) {
        setProjects(projectsData);
      }
    }

    setLoading(false);
  };

  const getSortedReviews = () => {
    const sorted = [...reviews];
    switch (reviewSort) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateStats = () => {
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;
    const projectsReviewed = new Set(reviews.map((r) => r.project_id)).size;

    const totalProjects = projects.length;
    const averageProjectRating =
      totalProjects > 0
        ? projects.reduce((sum, p) => sum + p.average_rating, 0) / totalProjects
        : 0;
    const totalReviewsReceived = projects.reduce((sum, p) => sum + p.total_reviews, 0);

    return {
      totalReviews,
      averageRating,
      projectsReviewed,
      totalProjects,
      averageProjectRating,
      totalReviewsReceived,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xl text-slate-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xl text-slate-600">Profile not found</div>
      </div>
    );
  }

  const stats = calculateStats();
  const isOwnProfile = user && profile.user_id === user.id;

  const handleSendMessage = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!currentUserProfile || !profile) return;

    setSendingMessage(true);

    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_profile_id: currentUserProfile.id,
        user2_profile_id: profile.id,
      });

      if (!error && data) {
        setActiveView('messages');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-slate-900">
              ProjectHub
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(profile.display_name)}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {profile.display_name}
                  </h1>
                  <p className="text-lg text-slate-500 mb-3">@{profile.username}</p>
                  <div className="flex items-center gap-3">
                    {profile.open_to_beta_test && (
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                        <Award className="w-4 h-4 mr-1" />
                        Open to Beta Test
                      </span>
                    )}
                    {profile.is_creator && (
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                        <Briefcase className="w-4 h-4 mr-1" />
                        Creator
                      </span>
                    )}
                    {profile.is_idea_maker && (
                      <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.061 1.06l1.06 1.061z" />
                        </svg>
                        Idea Maker
                      </span>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="text-slate-600 mt-4 max-w-2xl">{profile.bio}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {!isOwnProfile && (
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{sendingMessage ? 'Loading...' : 'Send Message'}</span>
                  </button>
                )}
                {isOwnProfile && (
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.totalReviews}</div>
                <div className="text-sm text-slate-600">Reviews Written</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="text-sm text-slate-600">Avg Rating Given</div>
              </div>
              {profile.is_creator && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {stats.totalProjects}
                    </div>
                    <div className="text-sm text-slate-600">Projects Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {stats.averageProjectRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-slate-600">Avg Project Rating</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {profile.is_creator && (
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'bg-white text-blue-600 shadow-lg border border-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200'
              }`}
            >
              <MessageSquare className="w-5 h-5 inline-block mr-2" />
              Reviews Written ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'projects'
                  ? 'bg-white text-blue-600 shadow-lg border border-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200'
              }`}
            >
              <Briefcase className="w-5 h-5 inline-block mr-2" />
              Projects ({projects.length})
            </button>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Reviews by {profile.display_name}
              </h2>
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>

            {reviews.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-600 mb-2">No reviews yet</p>
                <p className="text-slate-500 text-sm">
                  {isOwnProfile ? 'Start exploring projects and share your feedback!' : ''}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {getSortedReviews().map((review) => (
                  <div key={review.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <Link
                        to={`/project/${review.project?.slug}`}
                        className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {review.project?.name}
                      </Link>
                      <div className="flex items-center text-yellow-500">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <h3 className="text-md font-semibold text-slate-800 mb-2">
                      {review.title}
                    </h3>
                    <p className="text-slate-600 mb-3">{review.review_text}</p>
                    <div className="flex items-center text-sm text-slate-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && profile.is_creator && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Projects by {profile.display_name}
              </h2>
            </div>

            {projects.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-600 mb-2">No published projects yet</p>
                <p className="text-slate-500 text-sm">
                  {isOwnProfile ? 'Create your first project to share with the community!' : ''}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/project/${project.slug}`}
                    className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {project.hero_image && (
                      <img
                        src={project.hero_image}
                        alt={project.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {project.name}
                      </h3>
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-yellow-500">
                          <Star className="w-4 h-4 fill-current mr-1" />
                          <span className="font-medium text-slate-900">
                            {project.average_rating.toFixed(1)}
                          </span>
                          <span className="text-slate-500 ml-1">
                            ({project.total_reviews})
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded capitalize">
                          {project.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign Up to Send Messages</h2>
              <p className="text-slate-600">
                Create an account to start conversations with other users and build connections in
                the community.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full px-6 py-3 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Up / Login
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                className="block w-full px-6 py-3 bg-slate-100 text-slate-700 text-center font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

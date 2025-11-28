import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, TrendingUp, Clock, Grid3x3, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Project, Profile } from '../types';
import ProjectCarousel from '../components/ProjectCarousel';
import CreatorCard from '../components/CreatorCard';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [creatorSearchResults, setCreatorSearchResults] = useState<Profile[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [newestProjects, setNewestProjects] = useState<Project[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<Profile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryProjects, setCategoryProjects] = useState<Project[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [creatorsLoading, setCreatorsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = ['all', 'games', 'saas', 'tools', 'apps', 'design', 'other'];

  useEffect(() => {
    loadFeaturedProjects();
    loadNewestProjects();
    loadCategoryProjects();
    loadFeaturedCreators();
  }, []);

  useEffect(() => {
    loadCategoryProjects();
  }, [selectedCategory]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      performSearch();
    } else {
      setSearchResults([]);
      setCreatorSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  const loadFeaturedProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('is_published', true)
      .order('average_rating', { ascending: false })
      .limit(6);

    if (data) setFeaturedProjects(data);
  };

  const loadNewestProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (data) setNewestProjects(data);
  };

  const performSearch = async () => {
    const projectsPromise = supabase
      .from('projects')
      .select('*')
      .eq('is_published', true)
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .limit(5);

    const creatorsPromise = supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
      .limit(5);

    const [projectsRes, creatorsRes] = await Promise.all([projectsPromise, creatorsPromise]);

    if (projectsRes.data) {
      setSearchResults(projectsRes.data);
    }

    if (creatorsRes.data) {
      const creatorsWithStats = await Promise.all(
        creatorsRes.data.map(async (creator) => {
          const { data: projects } = await supabase
            .from('projects')
            .select('id, average_rating')
            .eq('user_id', creator.id)
            .eq('is_published', true);

          const totalProjects = projects?.length || 0;
          const averageRating = projects && projects.length > 0
            ? projects.reduce((sum, p) => sum + p.average_rating, 0) / projects.length
            : 0;

          return {
            ...creator,
            total_projects: totalProjects,
            average_rating: averageRating,
          };
        })
      );
      setCreatorSearchResults(creatorsWithStats);
    }

    setShowResults(true);
  };

  const loadFeaturedCreators = async () => {
    setCreatorsLoading(true);
    const { data, error } = await supabase.rpc('get_featured_profiles', { limit_count: 12 });

    if (data && !error) {
      setFeaturedCreators(data);
    }
    setCreatorsLoading(false);
  };

  const loadCategoryProjects = async () => {
    setCategoryLoading(true);
    let query = supabase
      .from('projects')
      .select('*')
      .eq('is_published', true);

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    const { data } = await query.order('average_rating', { ascending: false }).limit(12);

    if (data) setCategoryProjects(data);
    setCategoryLoading(false);
  };

  const handleProjectClick = (slug: string) => {
    navigate(`/project/${slug}`);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleCreatorClick = (username: string) => {
    navigate(`/creator/${username}`);
    setShowResults(false);
    setSearchQuery('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Discover & Support
            <span className="block text-blue-600">Startup Projects</span>
          </h1>
          <p className="text-xl text-slate-600 mb-12">
            Find amazing projects built by solo creators and freelancers. Leave reviews, provide feedback, and support their work.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-2xl shadow-xl p-4 border-2 border-slate-200 focus-within:border-blue-500 transition-all">
              <Search className="w-6 h-6 text-slate-400 ml-2" />
              <input
                type="text"
                placeholder="Search for projects or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 outline-none text-lg"
              />
            </div>

            {showResults && (creatorSearchResults.length > 0 || searchResults.length > 0) && (
              <div className="absolute w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10">
                {creatorSearchResults.length > 0 && (
                  <div>
                    <div className="px-6 py-2 bg-slate-50 border-b border-slate-200">
                      <span className="text-xs font-semibold text-slate-600 uppercase">Creators</span>
                    </div>
                    {creatorSearchResults.map((creator) => (
                      <button
                        key={creator.id}
                        onClick={() => handleCreatorClick(creator.username)}
                        className="w-full px-6 py-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
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
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900">{creator.display_name}</h3>
                            <p className="text-sm text-slate-600">@{creator.username} · {creator.total_projects || 0} projects</p>
                          </div>
                          {creator.average_rating !== undefined && creator.average_rating > 0 && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{creator.average_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div>
                    <div className="px-6 py-2 bg-slate-50 border-b border-slate-200">
                      <span className="text-xs font-semibold text-slate-600 uppercase">Projects</span>
                    </div>
                    {searchResults.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectClick(project.slug)}
                        className="w-full px-6 py-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{project.name}</h3>
                            <p className="text-sm text-slate-600 line-clamp-1">{project.description}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{project.average_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-3xl font-bold text-slate-900">Featured Projects</h2>
            </div>
          </div>
          <ProjectCarousel projects={featuredProjects} />
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <h2 className="text-3xl font-bold text-slate-900">Newest Projects</h2>
            </div>
          </div>
          <ProjectCarousel projects={newestProjects} />
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-3xl font-bold text-slate-900">Featured Creators</h2>
            </div>
          </div>
          <p className="text-slate-600 mb-8">Discover talented builders and their projects</p>

          {creatorsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 animate-pulse p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-slate-200 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-8 bg-slate-200 rounded w-full mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredCreators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No creators yet</h3>
              <p className="text-slate-600">Be the first to publish a project!</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Browse by Category</h2>
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg font-medium capitalize transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {categoryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 animate-pulse">
                  <div className="h-48 bg-slate-200"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : categoryProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.slug}`)}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {project.hero_image ? (
                      <img src={project.hero_image} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl font-bold text-white opacity-50">
                        {project.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
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
                    <p className="text-slate-600 line-clamp-2 text-sm">{project.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-block p-6 bg-slate-100 rounded-full mb-4">
                <Grid3x3 className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects found</h3>
              <p className="text-slate-600">
                There are no projects in the {selectedCategory === 'all' ? 'database' : selectedCategory} category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Grid3x3 className="w-8 h-8" />
            <span className="text-2xl font-bold">ProjectHub</span>
          </div>
          <p className="text-slate-400">Empowering indie builders to ship in public</p>
        </div>
      </footer>
    </div>
  );
}

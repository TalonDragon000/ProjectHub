import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, TrendingUp, Clock, Grid3x3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Project } from '../types';
import ProjectCarousel from '../components/ProjectCarousel';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [newestProjects, setNewestProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryProjects, setCategoryProjects] = useState<Project[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = ['all', 'games', 'saas', 'tools', 'apps', 'design', 'other'];

  useEffect(() => {
    loadFeaturedProjects();
    loadNewestProjects();
    loadCategoryProjects();
  }, []);

  useEffect(() => {
    loadCategoryProjects();
  }, [selectedCategory]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      searchProjects();
    } else {
      setSearchResults([]);
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

  const searchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('is_published', true)
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .limit(5);

    if (data) {
      setSearchResults(data);
      setShowResults(true);
    }
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
            <span className="block text-blue-600">Indie Projects</span>
          </h1>
          <p className="text-xl text-slate-600 mb-12">
            Find amazing projects built by solo creators and freelancers. Leave reviews, provide feedback, and support their work.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-2xl shadow-xl p-4 border-2 border-slate-200 focus-within:border-blue-500 transition-all">
              <Search className="w-6 h-6 text-slate-400 ml-2" />
              <input
                type="text"
                placeholder="Search for projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 outline-none text-lg"
              />
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10">
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

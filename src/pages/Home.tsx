import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Project, Profile } from '../types';
import ProjectCarousel from '../components/ProjectCarousel';
import CreatorCard from '../components/CreatorCard';
import BrowseProjects from '../components/BrowseProjects';
import SearchBar from '../components/SearchBar';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function Home() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [newestProjects, setNewestProjects] = useState<Project[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<Profile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryProjects, setCategoryProjects] = useState<Project[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [creatorsLoading, setCreatorsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest' | 'name'>('rating');

  useEffect(() => {
    loadFeaturedProjects();
    loadNewestProjects();
    loadCategoryProjects();
    loadFeaturedCreators();
  }, []);

  useEffect(() => {
    loadCategoryProjects();
  }, [selectedCategory, sortBy]);

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

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        query = query.order('average_rating', { ascending: false });
        break;
      case 'reviews':
        query = query.order('total_reviews', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      default:
        query = query.order('average_rating', { ascending: false });
    }

    const { data } = await query.limit(12);

    if (data) {
      // For client-side sorting (name), we need to sort after fetching
      let sortedData = [...data];
      if (sortBy === 'name') {
        sortedData.sort((a, b) => a.name.localeCompare(b.name));
      }
      setCategoryProjects(sortedData);
    }
    setCategoryLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <NavBar />
      <section id="hero" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4x text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Discover & Support
            <span className="block text-blue-600">Startup Projects</span>
          </h1>
          <p className="text-xl text-slate-600 mb-12">
            Find amazing projects built by solo creators and freelancers. Leave reviews, provide feedback, and support their work.
          </p>

          <div id="search-container" className="max-w-2xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>
      <section id="browse-by-category" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <BrowseProjects
            projects={categoryProjects}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categoryLoading={categoryLoading}
            title="Browse by Category"
            titleLevel="h2"
            sortBy={sortBy}
            onSortChange={setSortBy}
            showSortBy={true}
          />
        </div>
      </section>
      <section id="featured-projects" className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
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
      <section id="newest-projects" className="py-16 px-4 sm:px-6 lg:px-8">
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
      <section id="featured-creators" className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
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
      <Footer />
    </div>
  );
}

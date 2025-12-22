import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Star, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Project, Review } from '../types';
import { format } from 'date-fns';
import SearchBar from './SearchBar';
import BrowseProjects from './BrowseProjects';

interface UserStats {
  totalReviews: number;
  averageRatingGiven: number;
  projectsReviewed: number;
}

export default function UserView() {
  const { profile } = useAuth();
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalReviews: 0,
    averageRatingGiven: 0,
    projectsReviewed: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Browse projects state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryProjects, setCategoryProjects] = useState<Project[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest' | 'name'>('rating');

  useEffect(() => {
    if (profile) {
      loadUserData();
      loadCategoryProjects();
    }
  }, [profile]);

  useEffect(() => {
    loadCategoryProjects();
  }, [selectedCategory, sortBy]);

  const loadUserData = async () => {
    if (!profile) return;

    // Load recent reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, project:projects(name, slug)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (reviewsData) {
      setUserReviews(reviewsData);
    }

    // Load all reviews for stats
    const { data: allReviewsData } = await supabase
      .from('reviews')
      .select('rating, project_id')
      .eq('user_id', profile.id);

    if (allReviewsData) {
      const avgRating =
        allReviewsData.length > 0
          ? allReviewsData.reduce((sum, r) => sum + r.rating, 0) / allReviewsData.length
          : 0;

      setUserStats({
        totalReviews: allReviewsData.length,
        averageRatingGiven: avgRating,
        projectsReviewed: new Set(allReviewsData.map((r) => r.project_id)).size,
      });
    }

    setLoading(false);
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
      let sortedData = [...data];
      if (sortBy === 'name') {
        sortedData.sort((a, b) => a.name.localeCompare(b.name));
      }
      setCategoryProjects(sortedData);
    }
    setCategoryLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div id="user-view-header" className="mb-8">
        <h1 id="user-view-title" className="text-3xl font-bold text-slate-900 mb-2">
          Discover Projects
        </h1>
        <p id="user-view-description" className="text-slate-600">
          Explore amazing projects from the community and share your feedback
        </p>
      </div>

      <div id="user-dashboard-stats" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div id="user-reviews-written" className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
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

        <div id="avg-rating-given" className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
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

        <div id="projects-reviewed" className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
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
        <div id="recent-reviews" className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Reviews</h2>
          <div id="review-list" className="space-y-4">
            {userReviews.map((review) => (
              <div id="review-item" key={review.id} className="border-b border-slate-200 last:border-0 pb-4 last:pb-0">
                <div id="review-project-info" className="flex items-start justify-between mb-2">
                  <Link
                    to={`/project/${review.project_slug}`}
                    id="review-project-link"
                    className="font-semibold text-slate-900 hover:text-blue-600"
                  >
                    {review.project_slug}
                  </Link>
                  <div id="review-rating" className="flex items-center text-yellow-500">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p id="review-title" className="text-sm font-medium text-slate-700 mb-1">
                  {review.title}
                </p>
                <p id="review-text" className="text-sm text-slate-600 line-clamp-2">
                  {review.review_text}
                </p>
                <p id="review-date" className="text-xs text-slate-500 mt-2">
                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
          
          {profile && (
            <Link
              to={`/profile/${profile.username}`}
              id="view-all-reviews"
              className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Reviews →
            </Link>
          )}
        </div>
      )}

      <div id="search-bar" className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-8">
        <SearchBar placeholder="Search for projects or creators..." />
      </div>

      <div id="browse-projects" className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <BrowseProjects
          projects={categoryProjects}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryLoading={categoryLoading}
          title="Browse Projects"
          titleLevel="h3"
          sortBy={sortBy}
          onSortChange={setSortBy}
          showSortBy={true}
        />
      </div>
    </>
  );
}
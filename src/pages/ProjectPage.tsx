import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  ExternalLink,
  Heart,
  TrendingUp,
  DollarSign,
  User,
  Lightbulb,
  Info,
  Users,
  UsersRound,
  MonitorPlay,
  AlertTriangle,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  Project,
  Review,
  Feature,
  DonationGoal,
  ProjectLink,
  Profile,
  ProjectIdea,
} from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import IdeaSentiment from '../components/IdeaSentiment';
import AccordionSection from '../components/AccordionSection';
import NavBar from '../components/NavBar';

type FlowSection = 'discover' | 'validate' | 'try' | 'review';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [donationGoals, setDonationGoals] = useState<DonationGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [idea, setIdea] = useState<ProjectIdea | null>(null);
  const [ideaLoading, setIdeaLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<FlowSection>('discover');
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

  const handleSectionToggle = (section: FlowSection) => {
    if (section === 'try' && !disclaimerAcknowledged) {
      setShowDisclaimerModal(true);
      return;
    }
    setExpandedSection(section);
  };

  const handleDisclaimerAccept = () => {
    setDisclaimerAcknowledged(true);
    setShowDisclaimerModal(false);
    setExpandedSection('try');
  };

  const embeddableLink = links.find((link) => link.link_type === 'demo' || link.link_type === 'website');
  const primaryCtaLink = embeddableLink ?? links[0];

  useEffect(() => {
    if (slug) {
      loadProject();
    }
  }, [slug]);

  useEffect(() => {
    if (!project) return;

    const reviewsSubscription = supabase
      .channel(`reviews:${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `project_id=eq.${project.id}`,
        },
        async () => {
          await loadReviews(project.id);
          await refreshProjectRatings();
        }
      )
      .subscribe();

    return () => {
      reviewsSubscription.unsubscribe();
    };
  }, [project?.id]);

  const loadProject = async () => {
    setLoading(true);
    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (projectData) {
      setProject(projectData);
      loadCreator(projectData.user_id);
      trackPageView(projectData.id);
      loadReviews(projectData.id);
      loadFeatures(projectData.id);
      loadLinks(projectData.id);
      loadDonationGoals(projectData.id);
      loadIdea(projectData.id);
    } else {
      setIdea(null);
      setIdeaLoading(false);
    }
    setLoading(false);
  };

  const loadCreator = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) setCreator(data);
  };

  const trackPageView = async (projectId: string) => {
    await supabase.from('project_analytics').insert([
      {
        project_id: projectId,
        page_views: 1,
        unique_visitors: 1,
        visit_date: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const loadReviews = async (projectId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('*, profile:profiles(id, display_name, username, avatar_url)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (data) setReviews(data);
  };

  const loadFeatures = async (projectId: string) => {
    const { data } = await supabase
      .from('features')
      .select('*')
      .eq('project_id', projectId)
      .order('upvotes', { ascending: false });

    if (data) setFeatures(data);
  };

  const loadLinks = async (projectId: string) => {
    const { data } = await supabase.from('project_links').select('*').eq('project_id', projectId);

    if (data) setLinks(data);
  };

  const loadDonationGoals = async (projectId: string) => {
    const { data } = await supabase
      .from('donation_goals')
      .select('*')
      .eq('project_id', projectId)
      .eq('goal_type', 'project');

    if (data) setDonationGoals(data);
  };

  const loadIdea = async (projectId: string) => {
    setIdeaLoading(true);
    const { data, error } = await supabase
      .from('project_ideas')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (!error && data) {
      setIdea(data);
    } else {
      setIdea(null);
    }
    setIdeaLoading(false);
  };

  const refreshProjectRatings = async () => {
    if (!project) return;

    const { data: updatedProject } = await supabase
      .from('projects')
      .select('average_rating, total_reviews')
      .eq('id', project.id)
      .maybeSingle();

    if (updatedProject) {
      setProject({
        ...project,
        average_rating: updatedProject.average_rating,
        total_reviews: updatedProject.total_reviews,
      });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || rating === 0) return;

    const reviewData: any = {
      project_id: project.id,
      rating,
      title: reviewTitle,
      review_text: reviewText,
    };

    if (user && profile) {
      reviewData.user_id = profile.id;
    } else {
      reviewData.reviewer_name = reviewerName || null;
      reviewData.reviewer_email = reviewerEmail || null;
      reviewData.user_id = null;
    }

    const { error } = await supabase.from('reviews').insert([reviewData]);

    if (!error) {
      setSubmitSuccess('Review submitted successfully!');
      setRating(0);
      setReviewTitle('');
      setReviewText('');
      setReviewerName('');
      setReviewerEmail('');
      await loadReviews(project.id);
      await refreshProjectRatings();
      setTimeout(() => setSubmitSuccess(''), 3000);
    }
  };

  const handleLinkClick = async (linkId: string, url: string) => {
    await supabase.rpc('increment', { row_id: linkId, table_name: 'project_links' });
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xl text-slate-600">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Project not found</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      {/* Third-Party Disclaimer Modal */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDisclaimerModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowDisclaimerModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Third-Party Content</h3>
            </div>
            <div className="space-y-3 text-slate-600 text-sm mb-6">
              <p>
                You are about to access external content hosted by a third party. Please be aware:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li>ProjectHub does not own, operate, or control linked projects</li>
                <li>We do not endorse or guarantee any third-party content</li>
                <li>Visit external sites at your own discretion and risk</li>
                <li>We are not liable for any damages arising from third-party content</li>
              </ul>
            </div>
            <button
              onClick={handleDisclaimerAccept}
              className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              I Understand, Continue
            </button>
          </div>
        </div>
      )}
      
      <section id="project-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section id="project-header" className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {project.hero_image ? (
              <img src={project.hero_image} alt={project.name} className="w-auto h-64 object-cover" />
            ) : (
              <span className="text-9xl font-bold text-white opacity-50">{project.name.charAt(0)}</span>
            )}
          </div>
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <h1 className="text-4xl font-bold text-slate-900">{project.name}</h1>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full capitalize">
                    {project.category}
                  </span>
                </div>
                <p className="text-lg text-slate-600 mb-4">{project.description}</p>
                {creator && (
                  <div className="flex items-center space-x-3 text-slate-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Created by</span>
                    <Link
                      to={`/creator/${creator.username}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                    >
                      {creator.display_name}
                    </Link>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end space-x-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.round(project.average_rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-2xl font-bold text-slate-900">{project.average_rating.toFixed(1)}</div>
                <div className="text-sm text-slate-600">{project.total_reviews} reviews</div>
              </div>
            </div>

            {links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {links.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id, link.url)}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-medium">{link.link_name}</span>
                    {(link.link_type === 'demo' || link.link_type === 'website') && (
                      <div className="group relative">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Third-party content
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Main Content Grid: Accordion + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Accordion Sections */}
          <div className="lg:col-span-2 space-y-4">
            {/* Section 1: Discover the Idea */}
            <AccordionSection
              id="discover"
              stepNumber={1}
              title="Discover the Idea"
              subtitle="Understand the problem & vision"
              icon={<Lightbulb className="w-5 h-5" />}
              isExpanded={expandedSection === 'discover'}
              onToggle={() => handleSectionToggle('discover')}
              colorScheme="amber"
            >
              {ideaLoading ? (
                <div className="text-center py-8 text-slate-500">Loading idea details...</div>
              ) : idea ? (
                <div className="space-y-6">
                  {/* Problem Area */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                      Problem Area
                    </h4>
                    <p className="text-slate-900 text-lg leading-relaxed whitespace-pre-wrap">
                      {idea.problem_area}
                    </p>
                  </div>

                  {/* Keywords */}
                  {idea.keywords && idea.keywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                        Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {idea.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collaboration Status */}
                  <div className="flex items-center space-x-2">
                    {idea.collaboration_open ? (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                        <UsersRound className="w-4 h-4" />
                        <span className="font-medium text-sm">Open to Collaboration</span>
                        <div className="group relative">
                          <Info className="w-4 h-4 text-green-600 cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded shadow-lg z-10">
                            This creator is open to collaboration opportunities
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">
                        <Users className="w-4 h-4" />
                        <span className="font-medium text-sm">Not Seeking Collaborators</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No idea details available for this project yet.
                </div>
              )}
            </AccordionSection>

            {/* Section 2: Validate the Concept */}
            <AccordionSection
              id="validate"
              stepNumber={2}
              title="Validate the Concept"
              subtitle="Signal if this idea resonates with you"
              icon={<Heart className="w-5 h-5" />}
              isExpanded={expandedSection === 'validate'}
              onToggle={() => handleSectionToggle('validate')}
              colorScheme="blue"
            >
              <IdeaSentiment projectId={project.id} compact={false} showDetails={true} />
            </AccordionSection>

            {/* Section 3: Try It Out */}
            <AccordionSection
              id="try"
              stepNumber={3}
              title="Try It Out"
              subtitle="Third-party content · Not affiliated with ProjectHub"
              icon={<MonitorPlay className="w-5 h-5" />}
              isExpanded={expandedSection === 'try'}
              onToggle={() => handleSectionToggle('try')}
              colorScheme="slate"
            >
              {embeddableLink ? (
                <div className="space-y-4">
                  {/* Iframe Container */}
                  <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                    <iframe
                      src={embeddableLink.url}
                      title={`${project.name} preview`}
                      className="w-full h-full"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                  </div>
                  {/* Fallback link */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleLinkClick(embeddableLink.id, embeddableLink.url)}
                      className="flex items-center space-x-2 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in New Tab</span>
                    </button>
                  </div>
                </div>
              ) : primaryCtaLink ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-6">
                    Ready to experience this project firsthand?
                  </p>
                  <button
                    onClick={() => handleLinkClick(primaryCtaLink.id, primaryCtaLink.url)}
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-lg font-semibold"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Launch {project.name}</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No live demo available yet. Check back later!
                </div>
              )}
            </AccordionSection>

            {/* Section 4: Review the Execution */}
            <AccordionSection
              id="review"
              stepNumber={4}
              title="Review the Execution"
              subtitle="Rate the implementation & report issues"
              icon={<Star className="w-5 h-5" />}
              isExpanded={expandedSection === 'review'}
              onToggle={() => handleSectionToggle('review')}
              colorScheme="white"
            >
              <div className="space-y-8">
                {/* Review Form */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Leave a Review</h3>
                  {submitSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                      {submitSuccess}
                    </div>
                  )}
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {user && profile ? (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-800">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">Posting as {profile.display_name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-sm text-slate-600">
                          Posting anonymously.{' '}
                          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign in
                          </Link>{' '}
                          to post as yourself.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Your Rating</label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-8 h-8 transition-colors ${
                                star <= (hoverRating || rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {!user && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email (Optional)
                          </label>
                          <input
                            type="email"
                            value={reviewerEmail}
                            onChange={(e) => setReviewerEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Review Title
                      </label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Sum up your experience"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Review
                      </label>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        placeholder="Share your thoughts about this project..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={rating === 0}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Review
                    </button>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="border-t border-slate-200 pt-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Reviews ({reviews.length})</h3>
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-200 pb-6 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center space-x-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <h4 className="font-bold text-slate-900">{review.title}</h4>
                          </div>
                          <span className="text-sm text-slate-500">
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-slate-700 mb-2">{review.review_text}</p>
                        <div className="text-sm text-slate-500">
                          {review.user_id === null ? (
                            <span>Anonymous User</span>
                          ) : review.profile && review.profile.review_identity_public ? (
                            <Link
                              to={`/creator/${review.profile.username}`}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {review.profile.display_name}
                            </Link>
                          ) : (
                            <span>Private User</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <p className="text-center text-slate-500 py-8">No reviews yet. Be the first!</p>
                    )}
                  </div>
                </div>
              </div>
            </AccordionSection>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Support the Creator */}
            {creator?.payment_provider && creator?.payment_username && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-bold text-slate-900">Support the Creator</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Enjoy this project? Show your support by leaving a tip for {creator.display_name}!
                </p>
                <a
                  href={`https://${creator.payment_provider === 'paypal' ? 'paypal.me' : creator.payment_provider === 'ko-fi' ? 'ko-fi.com' : 'buy.stripe.com'}/${creator.payment_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Tip via {creator.payment_provider === 'paypal' ? 'PayPal' : creator.payment_provider === 'ko-fi' ? 'Ko-fi' : 'Stripe'}</span>
                </a>
              </div>
            )}

            {/* Roadmap */}
            {features.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Roadmap</h3>
                <div className="space-y-3">
                  {features.slice(0, 5).map((feature) => (
                    <div key={feature.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{feature.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{feature.status.replace('_', ' ')}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{feature.upvotes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Donation Goals */}
            {donationGoals.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Funding Goals</h3>
                {donationGoals.map((goal) => (
                  <div key={goal.id} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{goal.description}</span>
                      <span className="text-sm font-bold text-slate-900">
                        ${goal.current_amount} / ${goal.goal_amount}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((goal.current_amount / goal.goal_amount) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mt-4">
                  <Heart className="w-5 h-5" />
                  <span>Support Project</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

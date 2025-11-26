export interface Project {
  id: string;
  creator_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: 'active' | 'paused' | 'completed';
  hero_image?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  average_rating: number;
  total_reviews: number;
}

export interface Review {
  id: string;
  project_id: string;
  reviewer_name?: string;
  reviewer_email?: string;
  rating: number;
  title: string;
  review_text: string;
  created_at: string;
  is_verified: boolean;
}

export interface QuickFeedback {
  id: string;
  project_id: string;
  message: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  created_at: string;
}

export interface Feature {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  order_index: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  completion_percentage: number;
  target_date?: string;
  order_index: number;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface DonationGoal {
  id: string;
  project_id?: string;
  feature_id?: string;
  milestone_id?: string;
  goal_amount: number;
  current_amount: number;
  goal_type: 'project' | 'feature' | 'milestone';
  description: string;
  deadline?: string;
}

export interface Donation {
  id: string;
  goal_id: string;
  amount: number;
  donor_email?: string;
  donor_name?: string;
  stripe_payment_id?: string;
  created_at: string;
}

export interface ProjectLink {
  id: string;
  project_id: string;
  link_name: string;
  url: string;
  link_type: 'website' | 'demo' | 'github' | 'docs' | 'other';
  click_count: number;
}

export interface ProjectAnalytics {
  id: string;
  project_id: string;
  page_views: number;
  unique_visitors: number;
  referral_source?: string;
  visit_date: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  content: string;
  published_at: string;
  is_pinned: boolean;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

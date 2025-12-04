export interface Project {
  id: string;
  user_id: string;
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
  profile?: Profile;
}

export interface Review {
  id: string;
  project_id: string;
  project_slug: string;
  user_id: string | null;
  rating: number;
  title: string;
  review_text: string;
  reviewer_name?: string | null;
  reviewer_email?: string | null;
  review_identity_public?: boolean;
  session_id?: string | null;
  created_by_auth_uid?: string | null;
  last_edited_at?: string | null;
  created_at: string;
  updated_at?: string;
  is_verified: boolean;
  profile?: Profile;
}

export interface QuickFeedback {
  id: string;
  project_id: string;
  user_id?: string | null;
  message: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  session_id?: string | null;
  created_by_auth_uid?: string | null;
  last_edited_at?: string | null;
  created_at: string;
  profile?: Profile;
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

export type PaymentProvider = 'paypal' | 'stripe' | 'ko-fi';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  email_public: boolean;
  open_to_beta_test: boolean;
  is_creator: boolean;
  is_idea_maker?: boolean;
  review_identity_public?: boolean;
  post_reviews_anonymously?: boolean;
  post_feedback_anonymously?: boolean;
  payment_provider?: PaymentProvider | null;
  payment_username?: string | null;
  created_at: string;
  updated_at: string;
  total_projects?: number;
  average_rating?: number;
  total_reviews?: number;
  total_xp?: number;
}

export interface ProfileStats {
  total_reviews_written: number;
  average_rating_given: number;
  projects_reviewed: number;
  total_projects_created: number;
  average_project_rating: number;
  total_reviews_received: number;
}

export type CreatorProfile = Profile;
export type CreatorStats = ProfileStats;

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  created_at: string;
  participant_1?: Profile;
  participant_2?: Profile;
  last_message?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: Profile;
}

export interface ProjectIdea {
  id: string;
  project_id: string;
  problem_area: string;
  keywords: string[];
  need_count: number;
  curious_count: number;
  rethink_count: number;
  collaboration_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface IdeaReaction {
  id: string;
  project_id: string;
  user_id: string | null;
  reaction_type: 'need' | 'curious' | 'rethink';
  created_by_auth_uid?: string | null;
  created_at: string;
}

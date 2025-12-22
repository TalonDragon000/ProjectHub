import { useState, useEffect } from 'react';
import { Star, Edit, Trash2, Save, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Review, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import XPIndicator from './XPIndicator';

interface ReviewsListProps {
  projectId: string;
  refreshTrigger?: number;
}

export default function ReviewsList({ projectId, refreshTrigger }: ReviewsListProps) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editPostAnonymously, setEditPostAnonymously] = useState(false);
  const [editShowXPIndicator, setEditShowXPIndicator] = useState(false);
  const [editXpAmount, setEditXpAmount] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [projectId, refreshTrigger]);

  useEffect(() => {
    if (!projectId) return;

    const reviewsSubscription = supabase
      .channel(`reviews:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadReviews();
        }
      )
      .subscribe();

    return () => {
      reviewsSubscription.unsubscribe();
    };
  }, [projectId]);

  const loadReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*, profile:profiles(id, display_name, username, avatar_url)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data);
    }
    setLoading(false);
  };

  const canEditReview = (review: Review) => {
    if (!user) return false;
    return review.created_by_auth_uid === user.id;
  };

  const handleEditAnonymousToggle = (checked: boolean, review: Review) => {
    setEditPostAnonymously(checked);
    if (user && profile) {
      const wasAnonymous = !review.review_identity_public;
      const willBeAnonymous = checked;

      // XP: +2 if going public, -2 if going anonymous, 0 if unchanged
      const xp = wasAnonymous !== willBeAnonymous ? (willBeAnonymous ? -2 : 2) : 0;

      setEditXpAmount(xp);
      setEditShowXPIndicator(true);
      setTimeout(() => setEditShowXPIndicator(false), 3000);
    }
  };

  const handleStartEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditTitle(review.title);
    setEditText(review.review_text);
    setEditPostAnonymously(!review.review_identity_public);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditTitle('');
    setEditText('');
    setEditPostAnonymously(false);
  };

  const handleSaveEdit = async (review: Review) => {
    if (editRating === 0) return;

    const oldUserId = review.user_id;
    const updateData: any = {
      rating: editRating,
      title: editTitle,
      review_text: editText,
      last_edited_at: new Date().toISOString(),
    };

    if (user && profile) {
      updateData.user_id = profile.id;
      updateData.review_identity_public = !editPostAnonymously;
    }

    const { error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', review.id);

    if (!error) {
      await supabase.rpc('recalculate_review_xp_on_edit', {
        p_review_id: review.id,
        p_old_user_id: oldUserId,
        p_new_user_id: updateData.user_id,
        p_review_identity_public: updateData.review_identity_public,
      });

      setEditingReviewId(null);
      await loadReviews();
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (!error) {
      await loadReviews();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-600">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 pt-8">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Reviews ({reviews.length})</h3>
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-slate-200 pb-6 last:border-0">
            {editingReviewId === review.id ? (
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                {/* Edit Rating */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= editRating ? 'text-yellow-400 fill-current' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                {/* Edit Review Text */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Review</label>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    required
                  />
                </div>

                {/* Anonymous Toggle */}
                {user && profile && (
                  <div className="relative flex items-start space-x-3 p-3 bg-white border border-slate-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="editAnonymously"
                      checked={editPostAnonymously}
                      onChange={(e) => handleEditAnonymousToggle(e.target.checked, review)}
                      className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <label htmlFor="editAnonymously" className="text-sm font-medium text-slate-900 block cursor-pointer">
                        Post anonymously
                      </label>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {editPostAnonymously
                          ? 'Your name will not appear on this review (no XP)'
                          : review.review_identity_public
                          ? 'Your name will appear publicly (+2 XP)'
                          : 'Your name will appear as "Anonymous Reviewer"'}
                      </p>
                    </div>
                    <XPIndicator show={editShowXPIndicator} amount={editXpAmount} />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSaveEdit(review)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">
                      {format(new Date(review.created_at), 'MMM d, yyyy')}
                      {review.last_edited_at && (
                        <span className="ml-2 text-xs text-slate-400">(edited)</span>
                      )}
                    </span>
                    {canEditReview(review) && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStartEdit(review)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit review"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-slate-700 mb-2">{review.review_text}</p>
                <div className="text-sm text-slate-500">
                  {review.profile && review.review_identity_public ? (
                    <Link
                      to={`/creator/${review.profile.username}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {review.profile.display_name}
                    </Link>
                  ) : (
                    <span className="text-slate-500">Anonymous</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-center text-slate-500 py-8">No reviews yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
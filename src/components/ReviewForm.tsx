import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import XPIndicator from './XPIndicator';

interface ReviewFormProps {
  projectId: string;
  projectSlug: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ projectId, projectSlug, onReviewSubmitted }: ReviewFormProps) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [showXPIndicator, setShowXPIndicator] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setPostAnonymously(profile.post_reviews_anonymously ?? false);
    }
  }, [profile]);

  const handlePostAnonymouslyToggle = (checked: boolean) => {
    // If user anonymous is checked, no xp bonus
    setPostAnonymously(checked);
    if (user && profile) {
      const xp = checked ? -2 : 2;
      setXpAmount(xp);
      setShowXPIndicator(true);
      setTimeout(() => setShowXPIndicator(false), 3000);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || rating === 0) return;

    setSubmitting(true);

    try {
      const reviewData: any = {
        project_id: projectId,
        project_slug: projectSlug,
        rating,
        title: reviewTitle,
        review_text: reviewText,
        created_by_auth_uid: user?.id,
        user_id: profile?.id,
        review_identity_public: !postAnonymously,
      };

      const { error } = await supabase.from('reviews').insert([reviewData]);

      if (!error) {
        setSubmitSuccess('Review submitted successfully!');
        setRating(0);
        setReviewTitle('');
        setReviewText('');
        setPostAnonymously(profile?.post_reviews_anonymously ?? false);
        
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }

        setTimeout(() => setSubmitSuccess(''), 3000);
      } else {
        console.error('Error submitting review:', error);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">Leave a Review</h3>
      
      {submitSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {submitSuccess}
        </div>
      )}

      <form onSubmit={handleSubmitReview} className="space-y-4">
        {/* Only logged in users can review */}
        {user && profile ? (
          <>
          {/* Anonymous Toggle */}
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800">
                <Star className="w-4 h-4 mb-4" />
                <span className="text-sm font-medium mb-4">
                  {postAnonymously ? 'Reviewing is "Anonymous"' : `Reviewing as "${profile.display_name}"`}
                </span>
              </div>
              <div className="relative flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <input
                type="checkbox"
                id="reviewAnonymously"
                checked={postAnonymously}
                onChange={(e) => handlePostAnonymouslyToggle(e.target.checked)}
                className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500 mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="reviewAnonymously" className="text-sm font-medium text-slate-900 block cursor-pointer">
                  Review anonymously
                </label>
                <p className="text-xs text-slate-600 mt-0.5">
                  {postAnonymously
                    ? 'Check this box to hide your name from this review (no XP bonus)'
                    : 'Leave unchecked to show your display name (+2 XP bonus!)'}
                </p>
              </div>
              <XPIndicator show={showXPIndicator} amount={xpAmount} />
            </div>
            </div>
            
            {/* Rating */}
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

            {/* Review Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
              Review Title
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Sum up your experience"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                {reviewTitle.length}/100 characters
              </p>
            </div>

            {/* Review Text */}
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
              <p className="text-xs text-slate-500 mt-1">
                {reviewText.length}/500 characters
              </p>
            </div>
            
            </div>
            </>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600">
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>{' '}
              to review this project and earn XP.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={rating === 0 || submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
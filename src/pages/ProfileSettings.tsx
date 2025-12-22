import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Save, X, Grid3x3, ArrowLeft, Check, Loader, DollarSign, Shield, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PaymentProvider } from '../types';

export default function ProfileSettings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [allowMessagesFromUsers, setAllowMessagesFromUsers] = useState<boolean>(false);
  const [openToBetaTest, setOpenToBetaTest] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState<boolean>(false);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | null>(null);
  const [paymentUsername, setPaymentUsername] = useState<string>('');
  const [postReviewsAnonymously, setPostReviewsAnonymously] = useState<boolean>(false);
  const [postFeedbackAnonymously, setPostFeedbackAnonymously] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

 
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (profile) {
      setDisplayName(profile.display_name);
      setUsername(profile.username);
      setBio(profile.bio || '');
      setAllowMessagesFromUsers(profile.allow_messages_from_users || true);
      setOpenToBetaTest(profile.open_to_beta_test);
      setAvatarUrl(profile.avatar_url || '');
      setAvatarPreview(profile.avatar_url || '');
      setPaymentProvider(profile.payment_provider || null);
      setPaymentUsername(profile.payment_username || '');
      setPostReviewsAnonymously(profile.post_reviews_anonymously || false);
      setPostFeedbackAnonymously(profile.post_feedback_anonymously || false);
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (username && username !== profile?.username) {
      checkUsernameAvailability();
    } else if (username === profile?.username) {
      setUsernameAvailable(true);
    }
  }, [username]);

  useEffect(() => {
  if (success) {
    const timer = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(timer);
  }
}, [success]);

  useEffect(() => {
  if (error) {
    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }
}, [error]);
  
  const checkUsernameAvailability = async () => {
    const usernameRegex = /^[a-z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      setUsernameAvailable(false);
      return;
    }

    setUsernameChecking(true);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', profile?.id || '');

    setUsernameAvailable(!data || data.length === 0);
    setUsernameChecking(false);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2097152) {
      setError('Image must be less than 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are supported');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    if (avatarUrl) {
      const oldPath = avatarUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('avatars').remove([oldPath]);
    }

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: avatarFile.type,
      });

    if (uploadError || !uploadData) {
      console.error('Failed to upload avatar:', uploadError);
      throw new Error(`Failed to upload avatar: ${uploadError?.message || 'Unknown error'}`);
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!displayName.trim()) {
        throw new Error('Display name is required');
      }

      if (!username.trim()) {
        throw new Error('Username is required');
      }

      if (usernameAvailable === false) {
        throw new Error('Username is not available');
      }

      const usernameRegex = new RegExp(`^[a-z0-9_-]{3,30}$`);
      if (!usernameRegex.test(username)) {
        throw new Error(`Username must be 3-30 characters and contain only lowercase letters, numbers, hyphens, and underscores`);
      }

      if (bio.length > 500) {
        throw new Error('Bio must be 500 characters or less');
      }

      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
        }
      }

      const updatePayload = {
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        allow_messages_from_users: allowMessagesFromUsers,
        open_to_beta_test: openToBetaTest,
        avatar_url: newAvatarUrl || null,
        payment_provider: paymentProvider || null,
        payment_username: paymentUsername.trim() || null,
        post_reviews_anonymously: postReviewsAnonymously,
        post_feedback_anonymously: postFeedbackAnonymously,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', profile?.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      setAvatarFile(null);
      setAvatarUrl(newAvatarUrl);

    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Settings</h1>
            <p className="text-slate-600 mb-8">Update your public profile information</p>

            <form onSubmit={handleSave} className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Profile Picture</h2>
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(displayName)}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload New Photo</span>
                    </button>
                    <p className="text-sm text-slate-500 mt-2">
                      JPG, PNG, or WebP. Max size 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="John Doe"
                      required
                      maxLength={50}
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      {displayName.length}/50 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">@</div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        className="w-full pl-8 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="johndoe"
                        required
                        pattern="[a-z0-9_\-]{3,30}"
                        maxLength={30}
                      />
                      {usernameChecking && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader className="w-5 h-5 text-slate-400 animate-spin" />
                        </div>
                      )}
                      {!usernameChecking && usernameAvailable === true && username !== profile.username && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                      {!usernameChecking && usernameAvailable === false && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <X className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      3-30 characters. Lowercase letters, numbers, hyphens, and underscores only.
                    </p>
                    {!usernameChecking && usernameAvailable === false && (
                      <p className="text-sm text-red-600 mt-1">This username is not available</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Email cannot be changed here. Contact support if needed.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="allowMessagesFromUsers"
                      checked={allowMessagesFromUsers}
                      onChange={(e) => setAllowMessagesFromUsers(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="allowMessagesFromUsers" className="text-sm font-medium text-slate-700">
                      Allow messages from users
                    </label>
                    <p className="text-sm text-slate-500 mt-1">
                      When enabled, users will be able to send you messages.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">About Me</h2>
                <div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Tell others about yourself and what you build..."
                    rows={6}
                    maxLength={500}
                  />
                  <p className="text-sm text-slate-500 mt-1">{bio.length}/500 characters</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Privacy & Anonymity</span>
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  Control how your identity appears when posting reviews and feedback.
                </p>

                <div className="privacy-checkboxes space-y-4">
                  {/* Checkbox 1: Feedback */}
                  <div className="feedback-checkbox p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="postFeedbackAnonymously"
                        checked={postFeedbackAnonymously}
                        onChange={(e) => setPostFeedbackAnonymously(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <label htmlFor="postFeedbackAnonymously" className="text-sm font-medium text-slate-900 block mb-1">
                          Post feedback anonymously by default
                        </label>
                        <p className="text-sm text-slate-600">
                          {postFeedbackAnonymously 
                            ? 'Your feedback will show as "Anonymous" (base XP only)'
                            : 'Your feedback will show your name (+2 XP bonus!)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checkbox 2: Reviews */}
                  <div className="reviews-checkbox p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="postReviewsAnonymously"
                        checked={postReviewsAnonymously}
                        onChange={(e) => setPostReviewsAnonymously(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <label htmlFor="postReviewsAnonymously" className="text-sm font-medium text-slate-900 block mb-1">
                          Post reviews anonymously by default
                        </label>
                        <p className="text-sm text-slate-600">
                          {postReviewsAnonymously 
                            ? 'Your reviews will show as "Anonymous" (base XP only)'
                            : 'Your reviews will show your name (+2 XP bonus!)'}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="anonymous-posts-info p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 mt-4">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">About anonymous posts:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-700">
                      <li>You can edit or delete your anonymous posts until you clear your browser data</li>
                      <li>Anonymous posts don't earn bonus XP rewards</li>
                      <li>You can override the anonymous setting on a per-post basis</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Beta Testing</h2>
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="openToBetaTest"
                    checked={openToBetaTest}
                    onChange={(e) => setOpenToBetaTest(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500 mt-0.5"
                  />
                  <div>
                    <label htmlFor="openToBetaTest" className="text-sm font-medium text-slate-900 block mb-1">
                      I'm open to beta testing new projects
                    </label>
                    <p className="text-sm text-slate-600">
                      Project creators can see this badge on your profile, indicating you're available to test and provide feedback on new features and projects.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Payment Link (Optional)</span>
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  Add a payment link so supporters can tip or donate to your projects.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Payment Provider
                    </label>
                    <select
                      value={paymentProvider || ''}
                      onChange={(e) => {
                        setPaymentProvider(e.target.value as PaymentProvider | null);
                        if (!e.target.value) {
                          setPaymentUsername('');
                        }
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">None</option>
                      <option value="paypal">PayPal</option>
                      <option value="ko-fi">Ko-fi</option>
                      <option value="stripe">Stripe Payment Link</option>
                    </select>
                  </div>

                  {paymentProvider && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {paymentProvider === 'paypal' && 'PayPal.me Username'}
                        {paymentProvider === 'ko-fi' && 'Ko-fi Username'}
                        {paymentProvider === 'stripe' && 'Stripe Payment Link ID'}
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500 text-sm whitespace-nowrap">
                            {paymentProvider === 'paypal' && 'paypal.me/'}
                            {paymentProvider === 'ko-fi' && 'ko-fi.com/'}
                            {paymentProvider === 'stripe' && 'buy.stripe.com/'}
                          </span>
                          <input
                            type="text"
                            value={paymentUsername}
                            onChange={(e) => setPaymentUsername(e.target.value)}
                            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder={
                              paymentProvider === 'paypal' ? 'YourUsername' :
                              paymentProvider === 'ko-fi' ? 'yourusername' :
                              'your-payment-link-id'
                            }
                            pattern="[a-zA-Z0-9_\-]{3,100}"
                            maxLength={100}
                          />
                        </div>
                        {paymentUsername && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-slate-700 mb-1">Preview:</p>
                            <a
                              href={`https://${paymentProvider === 'paypal' ? 'paypal.me' : paymentProvider === 'ko-fi' ? 'ko-fi.com' : 'buy.stripe.com'}/${paymentUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700 underline break-all"
                            >
                              {`https://${paymentProvider === 'paypal' ? 'paypal.me' : paymentProvider === 'ko-fi' ? 'ko-fi.com' : 'buy.stripe.com'}/${paymentUsername}`}
                            </a>
                          </div>
                        )}
                        <p className="text-xs text-slate-500">
                          {paymentProvider === 'paypal' && 'Enter only your PayPal.me username, not the full URL'}
                          {paymentProvider === 'ko-fi' && 'Enter only your Ko-fi username, not the full URL'}
                          {paymentProvider === 'stripe' && 'Enter only the payment link ID from your Stripe payment link URL'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || usernameAvailable === false}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notifications - Fixed Position Bottom-Right */}
      {success && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 min-w-[320px]">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Success!</p>
              <p className="text-sm text-green-50">{success}</p>
            </div>
            <button 
              onClick={() => setSuccess('')}
              className="text-green-100 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 min-w-[320px]">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <X className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Error</p>
              <p className="text-sm text-red-50">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-100 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, X, Lightbulb, FileText, Rocket, Info, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import { validateHeroImageDimensions, formatDimensions } from '../utils/goldenRatio';

const HERO_IMAGE_BUCKET = 'project-hero-images';

export default function ProjectForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(id || null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('saas');
  const [status, setStatus] = useState<'active' | 'paused' | 'completed'>('active');
  const [heroImage, setHeroImage] = useState('');
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageFileSize, setImageFileSize] = useState<number | null>(null);
  const [dimensionWarning, setDimensionWarning] = useState('');
  const [imageQuality, setImageQuality] = useState<'perfect' | 'excellent' | 'good' | 'acceptable' | 'poor' | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  const [problemArea, setProblemArea] = useState('');
  const [keywords, setKeywords] = useState('');
  const [collaborationOpen, setCollaborationOpen] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const categories = ['games', 'saas', 'tools', 'apps', 'design', 'other'];

  useEffect(() => {
    if (isEdit && id) {
      loadProject();
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit && name && currentStep === 1) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  }, [name, isEdit, currentStep]);

  const loadProject = async () => {
    if (!id) return;

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (projectData && !projectError) {
      setName(projectData.name);
      setSlug(projectData.slug);
      setDescription(projectData.description);
      setCategory(projectData.category);
      setStatus(projectData.status);
      setHeroImage(projectData.hero_image || '');
      setIsPublished(projectData.is_published);
      setProjectId(projectData.id);

      const { data: ideaData } = await supabase
        .from('project_ideas')
        .select('*')
        .eq('project_id', id)
        .maybeSingle();

      if (ideaData) {
        setProblemArea(ideaData.problem_area);
        setKeywords(ideaData.keywords.join(', '));
        setCollaborationOpen(ideaData.collaboration_open);
      }
    }
  };

  const handleHeroImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Please upload an image smaller than 5MB.');
      return;
    }

    setUploadingHeroImage(true);
    setError('');
    setDimensionWarning('');
    setImageFileSize(file.size);

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        setImageDimensions({ width, height });

        const validation = validateHeroImageDimensions(width, height);
        setImageQuality(validation.quality);

        if (validation.warning) {
          setDimensionWarning(validation.warning);
        } else if (file.size > 1024 * 1024) {
          setDimensionWarning('Image file size is large (>1MB). Consider optimizing with tools like TinyPNG or Squoosh for faster loading.');
        } else {
          setDimensionWarning('');
        }
      };
    };

    reader.readAsDataURL(file);

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${profile?.id || 'anonymous'}-${Date.now()}.${fileExt}`;
      const filePath = `hero-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(HERO_IMAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(HERO_IMAGE_BUCKET).getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Unable to retrieve uploaded image URL.');
      }

      setHeroImage(data.publicUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload hero image.');
    } finally {
      setUploadingHeroImage(false);
      event.target.value = '';
    }
  };

  const saveStep1 = async () => {
    if (!name || !problemArea || !category) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!profile?.id) {
      setError('User profile not found. Please sign in again.');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      if (projectId) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            name,
            slug,
            category,
            hero_image: heroImage || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId);

        if (updateError) throw updateError;

        const keywordArray = keywords
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);

        const { error: ideaError } = await supabase
          .from('project_ideas')
          .upsert({
            project_id: projectId,
            problem_area: problemArea,
            keywords: keywordArray,
            collaboration_open: collaborationOpen,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'project_id'
          });

        if (ideaError) throw ideaError;
      } else {
        const { data: newProject, error: insertError } = await supabase
          .from('projects')
          .insert([
            {
              name,
              slug,
              description: problemArea,
              category,
              status: 'active',
              hero_image: heroImage || null,
              user_id: profile.id,
              is_published: false,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        setProjectId(newProject.id);

        const keywordArray = keywords
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);

        const { error: ideaError } = await supabase
          .from('project_ideas')
          .insert([
            {
              project_id: newProject.id,
              problem_area: problemArea,
              keywords: keywordArray,
              collaboration_open: collaborationOpen,
            },
          ]);

        if (ideaError) throw ideaError;
      }

      setSaveMessage('Idea saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveStep2 = async () => {
    if (!description) {
      setError('Please provide a project description');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          description,
          slug,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      setSaveMessage('Project details saved!');
      setTimeout(() => setSaveMessage(''), 3000);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const success = await saveStep1();
      if (success) setCurrentStep(2);
    } else if (currentStep === 2) {
      const success = await saveStep2();
      if (success) setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    { num: 1, label: 'Idea', icon: Lightbulb },
    { num: 2, label: 'Details', icon: FileText },
    { num: 3, label: 'Launch', icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep >= step.num
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      currentStep >= step.num ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-4 mb-6 rounded transition-all ${
                      currentStep > step.num ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">
            {isEdit ? 'Edit Project' : 'Create New Project'}
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {saveMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {saveMessage}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="My Awesome Project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Problem Area *
                </label>
                <textarea
                  value={problemArea}
                  onChange={(e) => setProblemArea(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="What problem does this project solve? Who is it for?"
                  required
                />
                <p className="mt-1 text-sm text-slate-500">
                  Describe the core problem or need your project addresses
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Keywords (Tags)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., productivity, automation, mobile, AI"
                />
                <p className="mt-1 text-sm text-slate-500">
                  Separate multiple keywords with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none capitalize"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Hero Image URL (Optional)
                  </label>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute left-0 top-6 w-80 bg-slate-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                      <p className="font-semibold mb-1">Recommended Dimensions:</p>
                      <p className="mb-2">1200 x 630 pixels (1.9:1 aspect ratio)</p>
                      <p className="text-slate-300 text-xs mb-2">Your image adapts to different views: card thumbnails, page banners, and mobile displays.</p>
                      <p className="text-slate-300 text-xs">Keep important content centered to avoid edge cropping.</p>
                    </div>
                  </div>
                </div>
                <input
                  type="url"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="mt-1 text-sm text-slate-500">
                  Enter a URL to an image hosted online or upload one below
                </p>
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Upload Hero Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    disabled={uploadingHeroImage}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-xs text-slate-700 space-y-2">
                    <p className="font-semibold text-blue-900 flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span>Golden Ratio Dimensions (1.62:1)</span>
                    </p>
                    <div className="space-y-1 pl-6">
                      <p className="font-medium">✨ Recommended: 1296 x 800px (Perfect Golden Ratio)</p>
                      <p>• Minimum: 648 x 400px (Golden Ratio)</p>
                      <p>• Alternative: 1280 x 720px (16:9 for video projects)</p>
                    </div>
                    <div className="border-t border-blue-200 pt-2 space-y-1">
                      <p>• Formats: JPG (photos), PNG (graphics with text)</p>
                      <p>• Max size: 5MB | Recommended: under 500KB</p>
                      <p>• All dimensions follow 4-point grid system</p>
                    </div>
                    <p className="text-slate-600 pt-1 border-t border-blue-200">💡 Tip: Golden ratio creates naturally pleasing proportions. Keep important content centered as images use object-cover.</p>
                  </div>
                  {uploadingHeroImage && (
                    <p className="text-sm text-blue-600">Uploading image...</p>
                  )}
                  {dimensionWarning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                      <p className="font-medium">⚠️ Dimension Notice</p>
                      <p className="text-xs mt-1">{dimensionWarning}</p>
                    </div>
                  )}
                  {heroImage && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-700">Preview</p>
                        {imageDimensions && (
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="bg-slate-100 px-2 py-1 rounded font-mono">
                              {formatDimensions(imageDimensions.width, imageDimensions.height)}
                            </span>
                            {imageFileSize && (
                              <span className="bg-slate-100 px-2 py-1 rounded">
                                {(imageFileSize / 1024).toFixed(0)}KB
                              </span>
                            )}
                            {imageQuality && (
                              <span className={`px-2 py-1 rounded font-medium ${
                                imageQuality === 'perfect' ? 'bg-yellow-100 text-yellow-800' :
                                imageQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                                imageQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                                imageQuality === 'acceptable' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {imageQuality === 'perfect' && '⭐ Perfect'}
                                {imageQuality === 'excellent' && '✓ Excellent'}
                                {imageQuality === 'good' && 'Good'}
                                {imageQuality === 'acceptable' && 'Acceptable'}
                                {imageQuality === 'poor' && 'Poor'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Card View (324 x 200px - Golden Ratio)</p>
                          <img
                            src={heroImage}
                            alt="Card preview"
                            className="w-card-golden h-card-hero-golden object-cover rounded-lg border border-slate-200"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Page Banner (full width x 400px - Golden Ratio)</p>
                          <img
                            src={heroImage}
                            alt="Banner preview"
                            className="w-full h-page-hero-golden object-cover rounded-lg border border-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="collaboration"
                    checked={collaborationOpen}
                    onChange={(e) => setCollaborationOpen(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="collaboration" className="flex items-center space-x-2 cursor-pointer">
                      <span className="font-medium text-slate-900">Open to Collaboration</span>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-slate-400" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg z-10">
                          When enabled, visitors can see you're open to collaborators and may reach out to discuss working together
                        </div>
                      </div>
                    </label>
                    <p className="text-sm text-slate-600 mt-1">
                      Let others know if you're looking for collaborators on this project
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL Slug *
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500">projecthub.com/project/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="my-awesome-project"
                    required
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens"
                  />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  This will be your project's unique URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Provide a detailed description of your project, its features, and what makes it unique..."
                  required
                />
                <p className="mt-1 text-sm text-slate-500">
                  Tell people about your project's execution, features, and current status
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'paused' | 'completed')}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none capitalize"
                  required
                >
                  <option value="active">Active - Currently working on it</option>
                  <option value="paused">Paused - Temporarily on hold</option>
                  <option value="completed">Completed - Finished and launched</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Preview</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Name:</span>{' '}
                    <span className="text-slate-900">{name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Category:</span>{' '}
                    <span className="text-slate-900 capitalize">{category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Problem Area:</span>{' '}
                    <span className="text-slate-900">{problemArea}</span>
                  </div>
                  {keywords && (
                    <div>
                      <span className="font-medium text-slate-700">Keywords:</span>{' '}
                      <span className="text-slate-900">{keywords}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-slate-700">Collaboration:</span>{' '}
                    <span className="text-slate-900">
                      {collaborationOpen ? 'Open to collaborators' : 'Not seeking collaborators'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="publish"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="publish" className="font-medium text-slate-900 cursor-pointer">
                      Publish Project
                    </label>
                    <p className="text-sm text-slate-600 mt-1">
                      Make your project visible to the public. You can unpublish it later from your dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> If you don't publish now, your project will be saved as a draft. You can publish it later from your dashboard.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between space-x-4 pt-6 mt-6 border-t border-slate-200">
            <div className="flex items-center space-x-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </Link>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loading ? 'Saving...' : 'Save & Continue'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  <span>{loading ? 'Saving...' : isPublished ? 'Publish Project' : 'Save as Draft'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ProjectForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('saas');
  const [status, setStatus] = useState<'active' | 'paused' | 'completed'>('active');
  const [heroImage, setHeroImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = ['games', 'saas', 'tools', 'apps', 'design', 'other'];

  useEffect(() => {
    if (isEdit && id) {
      loadProject();
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  }, [name, isEdit]);

  const loadProject = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (data && !error) {
      setName(data.name);
      setSlug(data.slug);
      setDescription(data.description);
      setCategory(data.category);
      setStatus(data.status);
      setHeroImage(data.hero_image || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    const projectData = {
      name,
      slug,
      description,
      category,
      status,
      hero_image: heroImage || null,
      updated_at: new Date().toISOString(),
    };

    if (isEdit && id) {
      const { error: updateError } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('projects')
        .insert([
          {
            ...projectData,
            creator_id: profile.id,
          },
        ]);

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
    }

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="text-xl font-bold text-slate-900">
              ProjectHub
            </Link>
            <Link to="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">
            {isEdit ? 'Edit Project' : 'Create New Project'}
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Tell people about your project..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'paused' | 'completed')}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none capitalize"
                  required
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hero Image URL (Optional)
              </label>
              <input
                type="url"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-1 text-sm text-slate-500">
                Enter a URL to an image hosted online
              </p>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}</span>
              </button>
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

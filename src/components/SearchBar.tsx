import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Project, Profile } from '../types';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onProjectClick?: (slug: string) => void;
  onCreatorClick?: (username: string) => void;
}

export default function SearchBar({ 
  placeholder = 'Search for projects or creators...',
  className = '',
  onProjectClick,
  onCreatorClick,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [creatorSearchResults, setCreatorSearchResults] = useState<Profile[]>([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      performSearch();
    } else {
      setSearchResults([]);
      setCreatorSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    const projectsPromise = supabase
      .from('projects')
      .select('*')
      .eq('is_published', true)
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .limit(5);

    const creatorsPromise = supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
      .limit(5);

    const [projectsRes, creatorsRes] = await Promise.all([projectsPromise, creatorsPromise]);

    if (projectsRes.data) {
      setSearchResults(projectsRes.data);
    }

    if (creatorsRes.data) {
      const creatorsWithStats = await Promise.all(
        creatorsRes.data.map(async (creator) => {
          const { data: projects } = await supabase
            .from('projects')
            .select('id, average_rating')
            .eq('user_id', creator.id)
            .eq('is_published', true);

          const totalProjects = projects?.length || 0;
          const averageRating = projects && projects.length > 0
            ? projects.reduce((sum, p) => sum + p.average_rating, 0) / projects.length
            : 0;

          return {
            ...creator,
            total_projects: totalProjects,
            average_rating: averageRating,
          };
        })
      );
      setCreatorSearchResults(creatorsWithStats);
    }

    setShowResults(true);
  };

  const handleProjectClick = (slug: string) => {
    if (onProjectClick) {
      onProjectClick(slug);
    } else {
      navigate(`/project/${slug}`);
    }
    setShowResults(false);
    setSearchQuery('');
  };

  const handleCreatorClick = (username: string) => {
    if (onCreatorClick) {
      onCreatorClick(username);
    } else {
      navigate(`/creator/${username}`);
    }
    setShowResults(false);
    setSearchQuery('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center bg-white rounded-2xl shadow-xl p-4 border-2 border-slate-200 focus-within:border-blue-500 transition-all">
        <Search className="w-6 h-6 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 outline-none text-lg"
        />
      </div>

      {showResults && (creatorSearchResults.length > 0 || searchResults.length > 0) && (
        <div className="absolute w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10">
          {creatorSearchResults.length > 0 && (
            <div>
              <div className="px-6 py-2 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600 uppercase">Creators</span>
              </div>
              {creatorSearchResults.map((creator) => (
                <button
                  key={creator.id}
                  onClick={() => handleCreatorClick(creator.username)}
                  className="w-full px-6 py-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                      {creator.avatar_url ? (
                        <img
                          src={creator.avatar_url}
                          alt={creator.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(creator.display_name)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{creator.display_name}</h3>
                      <p className="text-sm text-slate-600">@{creator.username} · {creator.total_projects || 0} projects</p>
                    </div>
                    {creator.average_rating !== undefined && creator.average_rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{creator.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchResults.length > 0 && (
            <div>
              <div className="px-6 py-2 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600 uppercase">Projects</span>
              </div>
              {searchResults.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectClick(project.slug)}
                  className="w-full px-6 py-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{project.name}</h3>
                      <p className="text-sm text-slate-600 line-clamp-1">{project.description}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{project.average_rating.toFixed(1)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

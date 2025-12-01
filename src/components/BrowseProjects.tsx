// src/components/BrowseProjects.tsx
import ProjectCard from './ProjectCard';
import { Project } from '../types';
import { ReactNode } from 'react';
import { Grid3x3 } from 'lucide-react';
import { PROJECT_CATEGORIES } from '../constants/categories';

interface BrowseProjectsProps {
  projects: Project[];
  categories?: readonly string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isLoading?: boolean;
  categoryLoading?: boolean;
  title?: string;
  titleLevel?: 'h1' | 'h2' | 'h3';
  emptyMessage?: string | ReactNode;
  renderToolbar?: () => ReactNode;
  sortBy?: 'rating' | 'reviews' | 'newest' | 'name';
  onSortChange?: (sortBy: 'rating' | 'reviews' | 'newest' | 'name') => void;
  showSortBy?: boolean;
}

export default function BrowseProjects({
  projects,
  categories = PROJECT_CATEGORIES,
  selectedCategory,
  onCategoryChange,
  isLoading = false,
  categoryLoading = false,
  title = 'Browse Projects',
  titleLevel = 'h2',
  emptyMessage,
  renderToolbar,
  sortBy,
  onSortChange,
  showSortBy = false,
}: BrowseProjectsProps) {
  // Dynamic title component based on titleLevel
  const TitleTag = titleLevel as keyof JSX.IntrinsicElements;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-600">
        Loading projects…
      </div>
    );
  }

  const defaultEmptyMessage = (
    <div className="text-center py-16">
      <div className="inline-block p-6 bg-slate-100 rounded-full mb-4">
        <Grid3x3 className="w-12 h-12 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects found</h3>
      <p className="text-slate-600">
        There are no projects in the {selectedCategory === 'all' ? 'database' : selectedCategory} category yet.
      </p>
    </div>
  );

  return (
    <>
      <TitleTag className="text-3xl font-bold text-slate-900 mb-8">{title}</TitleTag>
      
      {renderToolbar && renderToolbar()}
      
      {(showSortBy && onSortChange && sortBy !== undefined) && (
        <div className="flex items-center justify-start mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'rating' | 'reviews' | 'newest' | 'name')}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
              <option value="newest">Newest</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-6 py-3 rounded-lg font-medium capitalize transition-all ${
              selectedCategory === category
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {categoryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 animate-pulse">
              <div className="h-48 bg-slate-200"></div>
              <div className="p-3 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div id="projects" className="flex flex-wrap gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        emptyMessage || defaultEmptyMessage
      )}
    </>
  );
}
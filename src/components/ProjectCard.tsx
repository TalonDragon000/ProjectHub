import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Project } from '../types';
import { cardFlexClasses } from '../utils/cardStyles';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
      <Link
      to={`/project/${project.slug}`}
      className={`${cardFlexClasses} w-card-golden`}
    >
      {/* Hero Image - Golden Ratio Dimensions */}
      <div className="h-card-hero-golden w-card-golden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        {project.hero_image ? (
          <img src={project.hero_image} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl font-bold text-white opacity-50">
            {project.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Content - Flex to fill remaining space */}
      <div className="p-golden-sm flex-1 flex flex-col">
        {/* Category & Rating Row */}
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full capitalize">
            {project.category}
          </span>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-bold text-slate-900">
              {project.average_rating.toFixed(1)}
            </span>
            <span className="text-sm text-slate-500">({project.total_reviews})</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
          {project.name}
        </h3>

        {/* Description - Fixed 2 lines with ellipsis */}
        <p className="text-slate-600 text-sm line-clamp-2 min-h-[2.5rem] flex-1">
          {project.description}
        </p>
      </div>
      </Link>
  );
}
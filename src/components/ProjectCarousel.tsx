import { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Project } from '../types';
import { useNavigate } from 'react-router-dom';

interface ProjectCarouselProps {
  projects: Project[];
}

export default function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
  });
  const navigate = useNavigate();

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No projects available yet. Be the first to create one!
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex-none w-80 cursor-pointer group"
              onClick={() => navigate(`/project/${project.slug}`)}
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {project.hero_image ? (
                    <img src={project.hero_image} alt={project.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl font-bold text-white opacity-50">
                      {project.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
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
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-slate-600 line-clamp-2 text-sm">{project.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {projects.length > 3 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-slate-700" />
          </button>
        </>
      )}
    </div>
  );
}

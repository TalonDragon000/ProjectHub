  // src/components/BrowseProjects.tsx
  import ProjectCard from './ProjectCard';
  import { Project } from '../types';
  import { ReactNode } from 'react';

  interface BrowseProjectsProps {
    projects: Project[];
    isLoading?: boolean;
    emptyMessage?: string;
    showCreator?: boolean;
    renderToolbar?: () => ReactNode; // pass in search/sort controls
  }

  export default function BrowseProjects({
    projects,
    isLoading = false,
    emptyMessage = 'No projects found',
    showCreator = true,
    renderToolbar,
  }: BrowseProjectsProps) {
    if (isLoading) {
        return (
          <div className="flex items-center justify-center py-12 text-slate-600">
            Loading projects…
          </div>
        );
      }
      if (projects.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
            No projects available yet. Be the first to create one!
          </div>
        );
      }

    return (
      <section className="space-y-6">
        {renderToolbar?.()}
        <div className="flex flex-wrap gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} showCreator={showCreator} />
          ))}
        </div>
      </section>
    );
  }
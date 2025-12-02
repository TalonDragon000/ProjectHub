import { useState, useEffect } from 'react';
import { Info, Users, UsersRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProjectIdea } from '../types';
import IdeaSentiment from './IdeaSentiment';

interface IdeaTabProps {
  projectId: string;
}

export default function IdeaTab({ projectId }: IdeaTabProps) {
  const [idea, setIdea] = useState<ProjectIdea | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIdea();
  }, [projectId]);

  const loadIdea = async () => {
    const { data, error } = await supabase
      .from('project_ideas')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (data && !error) {
      setIdea(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-slate-600">Loading idea details...</div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="bg-slate-50 rounded-lg p-8 text-center">
        <p className="text-slate-600">No idea details available for this project yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 border border-amber-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.061 1.06l1.06 1.061z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">The Idea</h2>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Problem Area
          </h3>
          <p className="text-slate-900 text-lg leading-relaxed whitespace-pre-wrap">
            {idea.problem_area}
          </p>
        </div>

        {idea.keywords && idea.keywords.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {idea.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-default"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {idea.collaboration_open ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <UsersRound className="w-4 h-4" />
              <span className="font-medium text-sm">Open to Collaboration</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-green-600 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded shadow-lg z-10">
                  This creator is open to collaboration opportunities and welcomes discussions about working together on this project
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">
              <Users className="w-4 h-4" />
              <span className="font-medium text-sm">Not Seeking Collaborators</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-slate-500 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded shadow-lg z-10">
                  This creator is not currently looking for collaborators on this project
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <IdeaSentiment projectId={projectId} showDetails={true} />
      </div>
    </div>
  );
}

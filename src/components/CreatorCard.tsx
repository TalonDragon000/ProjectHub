import { useNavigate } from 'react-router-dom';
import { User, Star, Briefcase } from 'lucide-react';
import { CreatorProfile } from '../types';

interface CreatorCardProps {
  creator: CreatorProfile;
}

export default function CreatorCard({ creator }: CreatorCardProps) {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={() => navigate(`/creator/${creator.username}`)}
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group p-6"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4 overflow-hidden">
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

        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
          {creator.display_name}
        </h3>

        <p className="text-sm text-slate-500 mb-4">@{creator.username}</p>

        <div className="flex items-center justify-center gap-4 w-full mb-4">
          <div className="flex items-center space-x-1 text-slate-600">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm font-medium">
              {creator.total_projects || 0} {creator.total_projects === 1 ? 'project' : 'projects'}
            </span>
          </div>

          {creator.average_rating !== undefined && creator.average_rating > 0 && (
            <div className="flex items-center space-x-1 text-yellow-600">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold">{creator.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          View Profile
        </button>
      </div>
    </div>
  );
}

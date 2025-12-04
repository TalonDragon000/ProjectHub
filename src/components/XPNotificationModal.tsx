import { X, Zap, Trophy, Star, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface XPNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  xpGained: number;
  reason: string;
  newTotalXP?: number;
  newLevel?: number;
  leveledUp?: boolean;
  isFirstProject?: boolean;
}

export default function XPNotificationModal({
  isOpen,
  onClose,
  xpGained,
  reason,
  newTotalXP,
  newLevel,
  leveledUp,
  isFirstProject
}: XPNotificationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && (leveledUp || isFirstProject)) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, leveledUp, isFirstProject]);

  if (!isOpen) return null;

  const getReasonText = () => {
    switch (reason) {
      case 'first_project_published':
        return 'Published Your First Project';
      case 'project_published':
        return 'Published a Project';
      case 'demo_view_received':
        return 'Project Demo Viewed';
      case 'idea_submitted':
        return 'Submitted an Idea';
      case 'idea_reaction_received':
        return 'Received Idea Reaction';
      case 'review_received':
        return 'Received a Review';
      default:
        return 'Earned XP';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'][
                    Math.floor(Math.random() * 5)
                  ]
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {isFirstProject ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <Trophy className="w-10 h-10 text-yellow-300" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
              <p className="text-blue-100 text-lg">You published your first project!</p>
            </div>
          ) : leveledUp ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <Star className="w-10 h-10 text-yellow-300" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Level Up!</h2>
              <p className="text-blue-100 text-lg">You reached Level {newLevel}!</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <Zap className="w-10 h-10 text-yellow-300" />
              </div>
              <h2 className="text-3xl font-bold mb-2">XP Earned!</h2>
              <p className="text-blue-100 text-lg">{getReasonText()}</p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">XP Gained</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">+{xpGained}</span>
          </div>

          {newTotalXP !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Total XP</span>
                <span className="font-semibold text-gray-900">{newTotalXP.toLocaleString()}</span>
              </div>
              {newLevel !== undefined && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Current Level</span>
                  <span className="font-semibold text-gray-900">Level {newLevel}</span>
                </div>
              )}
            </div>
          )}

          {isFirstProject && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800 text-center">
                You're now a Creator! Keep publishing projects to earn more XP and climb the leaderboard.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              to="/leaderboard"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all text-center"
            >
              View Leaderboard
            </Link>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}

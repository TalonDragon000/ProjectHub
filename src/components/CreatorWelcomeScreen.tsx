import { Link } from 'react-router-dom';
import { Plus, TrendingUp, MessageSquare, Users, Star, BarChart3 } from 'lucide-react';

export default function CreatorWelcomeScreen() {
  const features = [
    {
      icon: TrendingUp,
      title: 'Share Your Projects',
      description: 'Showcase your work and get valuable feedback from the community',
    },
    {
      icon: BarChart3,
      title: 'Track Analytics',
      description: 'Monitor views, engagement, and understand your audience',
    },
    {
      icon: MessageSquare,
      title: 'Get Feedback',
      description: 'Receive reviews and suggestions to improve your projects',
    },
    {
      icon: Users,
      title: 'Find Beta Testers',
      description: 'Connect with users eager to test and provide early feedback',
    },
    {
      icon: Star,
      title: 'Build Your Reputation',
      description: 'Grow your creator profile and attract more supporters',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-8 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Start Your Creator Journey
          </h1>
          <p className="text-blue-50 text-lg max-w-2xl mx-auto">
            Share your projects with the community, get valuable feedback, and grow your creator profile
          </p>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              You haven't created any projects yet
            </h2>
            <p className="text-slate-600">
              Create your first project to unlock the full creator dashboard and all its features
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <Link
              to="/dashboard/projects/new"
              className="inline-flex items-center space-x-3 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-6 h-6" />
              <span>Create Your First Project</span>
            </Link>
          </div>

          <div className="border-t border-slate-200 pt-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">
              Creator Features & Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  Ready to get started?
                </h4>
                <p className="text-sm text-slate-600">
                  Join our community of creators and share your amazing work
                </p>
              </div>
              <Link
                to="/dashboard/projects/new"
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                <span>Create Project</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

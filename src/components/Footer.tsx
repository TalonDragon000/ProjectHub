import { Grid3x3, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="footer" className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center space-x-2">
              <Grid3x3 className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold">ProjectHub</span>
            </div>
            <p className="text-slate-400 text-sm text-center md:text-left max-w-xs">
              Empowering startup builders to ship in public and grow their ideas together.
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <nav className="flex flex-col space-y-2 text-slate-400 text-sm">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/browse" className="hover:text-white transition-colors">Browse Projects</a>
              <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
            </nav>
          </div>

          {/* Social Links Section */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            <h3 className="text-lg font-semibold text-white">Connect With Us</h3>
            <div className="flex flex-col space-y-3">
              <a 
                href="https://github.com/Talondragon000/ProjectHub" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors group"
              >
                <img 
                  src="/images/github-mark-white.png" 
                  alt="GitHub" 
                  className="w-4 h-4 group-hover:scale-110 transition-transform" 
                />
                <span className="font-medium">GitHub Repository</span>
              </a>
              <a 
                href="https://www.x.com/ProjectHub_" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors group"
              >
                <img 
                  src="/images/x-mark.png" 
                  alt="X" 
                  className="h-5 w-5 invert group-hover:scale-110 transition-transform" 
                />
                <span className="font-medium">@ProjectHub_</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-400 text-sm">
              © 2025 ProjectHub. All rights reserved. <span className="text-slate-500">v0.1.3</span>
            </p>
            <p className="text-slate-400 text-sm">
              Built with <span className="text-red-400">❤️</span> by{' '}
              <a 
                href="https://github.com/Talondragon000" 
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-blue-400 transition-colors"
              >
                Talondragon000
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
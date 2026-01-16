import { Grid3x3, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="footer" className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center space-x-2">
              <Grid3x3 className="w-8 h-8 text-indigo-400" />
              <span className="text-2xl font-bold">ProjectHub</span>
            </div>
            <p className="text-slate-400 text-sm text-center md:text-left max-w-xs">
              Empowering startup builders to ship in public and grow their ideas together.
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="flex flex-col items-center md:items-center space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <nav className="flex flex-col space-y-2 text-white font-semibold text-sm text-center md:text-left">
              <a href="/" className="hover:text-indigo-400 transition-colors">Home</a>
              <a href="/browse" className="hover:text-indigo-400 transition-colors">Browse Projects</a>
              <a href="/dashboard" className="hover:text-indigo-400 transition-colors">Dashboard</a>
            </nav>
          </div>

          {/* Social Links Section */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white text-center md:text-left mb-4">Connect With Us</h3>
                <div className="flex space-y-2 mb-2">
                  <a className="flex space-x-2 hover:text-indigo-400 transition-colors group text-sm font-semibold"
                  href="https://github.com/Talondragon000/ProjectHub" 
                  target="_blank"
                  rel="noopener noreferrer"
                  >
                  <Github className="h-5 w-5" />
                  <span>GitHub Repository</span>
                  </a>
                </div>
                <div className="flex space-y-2">
                  <a 
                  href="https://www.x.com/ProjectHub_" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex space-x-2 hover:text-indigo-400 transition-colors group text-sm font-semibold"
                  >
                  <Twitter className="h-5 w-5"/>
                  <span>@ProjectHub_</span>
                  </a>
                </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-400 text-sm">
              © 2025 ProjectHub. All rights reserved. <span className="text-slate-500">v0.1.3.2</span>
            </p>
            <p className="text-slate-400 text-sm">
              Illustrations by <a href="https://www.freepik.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-indigo-400 transition-colors">freepik.com</a>
            </p>
            <p className="text-slate-400 text-sm">
              Built with <span className="text-red-400">❤️</span> by{' '}
              <a 
                href="https://github.com/Talondragon000" 
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-indigo-400 transition-colors"
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
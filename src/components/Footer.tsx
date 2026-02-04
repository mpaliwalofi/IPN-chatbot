import { Code, Zap, Layout, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#004536] text-slate-200">
      <div className="container mx-auto px-6 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand */}
          <div>
            <h3 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                <Code className="w-5 h-5 text-emerald-300" />
              </div>
              IPN Docs
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">
              Comprehensive API documentation for Inspired Pet Nutrition&apos;s
              multi-repository architecture.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 mt-6">
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
                ✉️
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/home" className="hover:text-emerald-300 transition-colors duration-200 hover:translate-x-1 inline-block">Home</a></li>
              <li><a href="/overview" className="hover:text-emerald-300 transition-colors duration-200 hover:translate-x-1 inline-block">Overview</a></li>
              <li><a href="/explore" className="hover:text-emerald-300 transition-colors duration-200 hover:translate-x-1 inline-block">Explorer</a></li>
              <li><a href="/docs" className="hover:text-emerald-300 transition-colors duration-200 hover:translate-x-1 inline-block">Documentation</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer">
                <div className="w-6 h-6 rounded bg-emerald-400/10 flex items-center justify-center">
                  <Code size={14} className="text-emerald-400" />
                </div>
                Backend (PHP)
              </li>
              <li className="flex items-center gap-2 text-slate-300 hover:text-blue-300 transition-colors cursor-pointer">
                <div className="w-6 h-6 rounded bg-blue-400/10 flex items-center justify-center">
                  <Zap size={14} className="text-blue-400" />
                </div>
                Frontend (Vue.js)
              </li>
              <li className="flex items-center gap-2 text-slate-300 hover:text-purple-300 transition-colors cursor-pointer">
                <div className="w-6 h-6 rounded bg-purple-400/10 flex items-center justify-center">
                  <Layout size={14} className="text-purple-400" />
                </div>
                CMS (Strapi)
              </li>
            </ul>
          </div>

          {/* Stats */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Documentation Stats</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 rounded bg-white/5">
                <span className="text-slate-300">Total Files</span>
                <span className="text-white font-bold text-lg">4,516</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Backend</span>
                <span className="text-emerald-300 font-semibold">1,685</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Frontend</span>
                <span className="text-blue-300 font-semibold">2,073</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Other</span>
                <span className="text-slate-400 font-semibold">758</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-emerald-700/30 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <span>© 2026 Inspired Pet Nutrition Documentation. All rights reserved.</span>
          <div className="flex gap-6 mt-3 md:mt-0">
            <a href="#" className="hover:text-emerald-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-300 transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
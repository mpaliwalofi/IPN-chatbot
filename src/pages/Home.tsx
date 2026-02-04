import React, { useState } from 'react';
import { 
  Search, 
  Database, 
  Layout, 
  FileText, 
  Code, 
  Terminal, 
  Zap, 
  Box, 
  Layers, 
  Command, 
  Radio, 
  Puzzle, 
  MoreHorizontal,
  ChevronRight,
  Github,
  Server,
  Monitor
} from 'lucide-react';
import { motion } from 'motion/react';
import exampleImage from "@/assets/exampleImage.png";
import logoImage from "@/assets/logoImage.png";
import { useNavigate } from "react-router-dom";

// Hero Section
const Hero = () => {
  const navigate = useNavigate(); // Add this hook

  return (
    <section className="pt-24 pb-16 bg-[#F9FAFB] via-emerald-800 to-emerald-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
              <h1 className="font-roboto text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
    <span className="text-black">Legacy Documentation </span>
    <span className="text-[#004525]">Explorer</span>
  </h1>

            <p className="text-sm sm:text-base text-black mb-6 max-w-2xl mx-auto lg:mx-0">
  Explore 4,500+ auto-generated documentation files from our Backend, Frontend, and CMS repositories.
</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8">

  {/* Primary CTA */}
  <button
    onClick={() => navigate('/docs')}
    className="
      bg-[#004536] 
      hover:bg-[#063f33]
      text-white 
      font-semibold 
      py-3 px-8 
      rounded-xl 
      text-base
      shadow-md 
      hover:shadow-lg
      transition-all
      duration-200
    "
  >
    Browse Documentation
  </button>

  {/* Secondary CTA */}
  <button
    onClick={() => navigate('/overview')}
    className="
      bg-white 
      text-[#004536]
      border border-[#004536]
      hover:bg-[#004536]
      hover:text-white
      font-semibold
      py-3 px-8 
      rounded-xl 
      text-base
      shadow-sm
      hover:shadow-md
      transition-all
      duration-200
    "
  >
    View Overview
  </button>
</div>

          </motion.div>
          
          <motion.div 
            className="flex-1 w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
              <div className="absolute top-0 left-0 right-0 h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <img 
                src={exampleImage}
                alt="Documentation Preview" 
                className="w-full h-auto mt-8 opacity-90 object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Features / Stats Bar
const FeaturesBar = () => {
  const features = [
    { icon: <Zap className="text-amber-500" />, title: "AI-Enhanced Summaries", desc: "Powered by Claude Sonnet 4.5" },
    { icon: <Box className="text-blue-500" />, title: "Multi-Repository Support", desc: "Unified documentation" },
    { icon: <Layers className="text-emerald-500" />, title: "Categorized Navigation", desc: "Organized structure" },
    { icon: <Search className="text-purple-500" />, title: "Interactive Explorer", desc: "Advanced filtering" },
  ];

  return (
    <div className="bg-white py-12 border-b border-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="p-3 bg-slate-100 rounded-lg shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Overview / Repositories Section
const OverviewSection = () => {
  const repos = [
    { 
      title: "Backend Application", 
      type: "PHP", 
      desc: "Core business logic and API endpoints handling data processing.",
      repo: "ultrapremiumdirect/backend",
      icon: <Server size={32} className="text-white" />,
      color: "bg-emerald-700"
    },
    { 
      title: "Frontend Application", 
      type: "JavaScript/JSON/TypeScript", 
      desc: "Client-side application providing the user interface and interactions.",
      repo: "ultrapremiumdirect/frontend",
      icon: <Monitor size={32} className="text-white" />,
      color: "bg-emerald-600"
    },
    { 
      title: "Content Management", 
      type: "CMS", 
      desc: "System for managing dynamic content and media assets.",
      repo: "ultrapremiumdirect/cms",
      icon: <Layout size={32} className="text-white" />,
      color: "bg-emerald-800"
    },
  ];

  return (
    <section className="py-20 bg-emerald-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Unified Repository Overview</h2>
          <p className="text-emerald-100 max-w-2xl mx-auto">
            This documentation has been automatically generated from multiple code repositories to provide comprehensive insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {repos.map((repo, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl overflow-hidden text-slate-900 shadow-xl"
            >
              <div className={`${repo.color} p-6 flex justify-center items-center`}>
                {repo.icon}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{repo.title}</h3>
                </div>
                <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full mb-4">
                  {repo.type}
                </div>
                <p className="text-slate-600 mb-6 text-sm">
                  {repo.desc}
                </p>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                    <Github size={12} />
                    {repo.repo}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Categories Section
const CategoriesSection = () => {
  const categories = [
    { name: "Controllers", desc: "Request handlers and API endpoints", icon: <Command /> },
    { name: "Services", desc: "Business logic and service classes", icon: <Zap /> },
    { name: "Entities", desc: "Data models and database entities", icon: <Database /> },
    { name: "Repositories", desc: "Data access layers", icon: <Server /> },
    { name: "Commands", desc: "CLI commands and scheduled tasks", icon: <Terminal /> },
    { name: "Events", desc: "Event handlers and listeners", icon: <Radio /> },
    { name: "Plugins", desc: "Payment, Shipping, CMS, etc.", icon: <Puzzle /> },
    { name: "Other", desc: "Miscellaneous files and utilities", icon: <MoreHorizontal /> },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Documentation Categories</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Navigate through the codebase using these organized categories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, index) => (
            <a key={index} href="#" className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-500 transition-all">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                {cat.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{cat.name}</h3>
              <p className="text-sm text-slate-500">{cat.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

// How To Use Section
const HowToUseSection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">How to Use the Explorer</h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="text-xl font-semibold text-slate-900 mb-2">Browse by Category</h4>
                  <p className="text-slate-600">Use the Documentation Index to navigate through categorized code files tailored to your needs.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h4 className="text-xl font-semibold text-slate-900 mb-2">Smart Search</h4>
                  <p className="text-slate-600">Use the search bar at the top to find specific files, functions, or classes instantly across all repositories.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h4 className="text-xl font-semibold text-slate-900 mb-2">Interactive View</h4>
                  <p className="text-slate-600">Use the Explorer for advanced filtering and searching to drill down into the details.</p>
                </div>
              </div>
            </div>
            <div className="mt-10">
              <button
  onClick={() => navigate('/explore')}
  className="bg-[#004536] hover:bg-slate-800 text-white font-medium py-3 px-8 rounded-lg transition-colors"
>
  Start Exploring
</button>

            </div>
          </div>
          <div className="flex-1 bg-slate-50 p-8 rounded-2xl border border-slate-200">
             <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
                  <Search className="text-slate-400" size={20} />
                  <div className="text-slate-400 text-sm">Search documentation...</div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                </div>
                <div className="mt-6 flex gap-2">
                   <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Controller</div>
                   <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Service</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};



const Footer = () => {
  return (
    <footer className="bg-[#004536] text-slate-200">
      <div className="container mx-auto px-6 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand */}
          <div>
            <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
              IPN Docs
            </h3>
            <p className="text-sm leading-relaxed text-emerald-100">
              Comprehensive API documentation for Inspired Pet Nutrition&apos;s
              multi-repository architecture.
            </p>

            {/* Icons */}
            <div className="flex gap-3 mt-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-800 flex items-center justify-center hover:bg-emerald-700 cursor-pointer">
                🐙
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-800 flex items-center justify-center hover:bg-emerald-700 cursor-pointer">
                ✉️
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/home" className="hover:text-white">Home</a></li>
              <li><a href="/overview" className="hover:text-white">Overview</a></li>
              <li><a href="/explore" className="hover:text-white">Explorer</a></li>
              <li><a href="/docs" className="hover:text-white">Documentation</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-emerald-100">
                <Code size={14} /> Backend (PHP)
              </li>
              <li className="flex items-center gap-2 text-emerald-100">
                <Zap size={14} /> Frontend (Vue.js)
              </li>
              <li className="flex items-center gap-2 text-emerald-100">
                <Layout size={14} /> CMS (Strapi)
              </li>
            </ul>
          </div>

          {/* Stats */}
          <div>
            <h4 className="text-white font-semibold mb-4">Documentation Stats</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Total Files</span>
                <span className="text-white font-semibold">4,516</span>
              </li>
              <li className="flex justify-between">
                <span>Backend</span>
                <span className="text-emerald-300 font-semibold">1,685</span>
              </li>
              <li className="flex justify-between">
                <span>Frontend</span>
                <span className="text-blue-300 font-semibold">2,073</span>
              </li>
              <li className="flex justify-between">
                <span>Other</span>
                <span className="text-slate-300 font-semibold">758</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-emerald-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-emerald-200">
          <span>© 2026 Inspired Pet Nutrition Documentation.</span>
          <div className="flex gap-6 mt-3 md:mt-0">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

//export default Footer;


// Main App Component
export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate(); // Add this

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation - UPDATED */}
      <nav className="fixed top-0 w-full z-50 bg-[#004536]   text-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Inspired Pet Nutrition" className="h-16 w-auto object-contain" />
            </div>
            
            {/* Desktop Navigation - UPDATED */}
            <div className="hidden md:flex items-center gap-8">
              <a href="/home" className="text-sm font-medium text-emerald-100 hover:text-white transition-colors">HOME</a>
              <a href="/overview" className="text-sm font-medium text-emerald-100 hover:text-white transition-colors">OVERVIEW</a>
              <a href="/explore" className="text-sm font-medium text-emerald-100 hover:text-white transition-colors">EXPLORER</a>
              {/* NEW: Documentation Link */}
              <button 
                onClick={() => navigate('/docs')}
                className="text-sm font-medium text-emerald-100 hover:text-white transition-colors"
              >
                Documentation
              </button>
              <button className="bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-medium py-2 px-4 rounded transition-colors">
              SIGN IN
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu - UPDATED */}
        {isMenuOpen && (
          <div className="md:hidden bg-emerald-800 border-t border-emerald-700">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <a href="/home" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-700">Home</a>
              <a href="/overview" className="block px-3 py-2 rounded-md text-base font-medium text-emerald-100 hover:text-white hover:bg-emerald-700">Overview</a>
              <a href="/explore" className="block px-3 py-2 rounded-md text-base font-medium text-emerald-100 hover:text-white hover:bg-emerald-700">Explorer</a>
              {/* NEW: Documentation Link */}
              <button 
                onClick={() => navigate('/docs')}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-emerald-100 hover:text-white hover:bg-emerald-700"
              >
                Documentation
              </button>
            </div>
          </div>
        )}
      </nav>

      <main>
        <Hero />
        <FeaturesBar />
        <OverviewSection />
        <CategoriesSection />
        <HowToUseSection />
      </main>

      <Footer />
    </div>
  );
}
// export default Home;

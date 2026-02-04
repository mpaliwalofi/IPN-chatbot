import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Code, 
  Database, 
  Server, 
  Layers,
  FileCode,
  ChevronRight,
  Search,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Overview() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'backend' | 'frontend'>('backend');

  // Backend statistics from documentation.json
  const backendStats = {
    total: 1685,
    categories: [
      { name: "Controllers", count: 153, desc: "API request handlers and endpoints" },
      { name: "Services", count: 147, desc: "Business logic and service layers" },
      { name: "Entities", count: 140, desc: "Database models and entities" },
      { name: "Repositories", count: 44, desc: "Data access patterns" },
      { name: "Commands", count: 85, desc: "CLI and scheduled tasks" },
      { name: "Events", count: 90, desc: "Event handlers and listeners" },
    ],
    techStack: [
      { name: "PHP", version: "8.x" },
      { name: "Symfony", version: "6.x" },
     { name: "API Platform", version: "3.x" }
    ]
  };

  // Frontend statistics from documentation.json
  const frontendStats = {
    total: 2073,
    categories: [
      { name: "Components", count: 856, desc: "Reusable UI components" },
      { name: "Pages", count: 234, desc: "Route-based page components" },
      { name: "API Routes", count: 312, desc: "Strapi CMS API endpoints" },
      { name: "Services", count: 189, desc: "Frontend business logic" },
      { name: "Content Types", count: 267, desc: "CMS content schemas" },
      { name: "Plugins", count: 215, desc: "Strapi plugins and extensions" },
    ],
    techStack: [
      { name: "Vue.js", version: "3.x" },
      { name: "TypeScript", version: "5.x" },
      { name: "Tailwind CSS", version: "3.x" },
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/20 to-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-[#024639] via-[#025a49] to-[#024639]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Documentation Overview
            </h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
              Explore our comprehensive API documentation across Backend (PHP/Symfony) and Frontend (Vue.js/Strapi) architectures
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex bg-white rounded-xl p-1.5 shadow-lg border border-gray-200">
            <button
              onClick={() => setSelectedTab('backend')}
              className={`flex items-center gap-3 px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
                selectedTab === 'backend'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Server size={20} />
              Backend
              <span className={`text-xs px-2 py-1 rounded-full ${
                selectedTab === 'backend' ? 'bg-emerald-800' : 'bg-gray-200 text-gray-600'
              }`}>
                {backendStats.total}
              </span>
            </button>
            <button
              onClick={() => setSelectedTab('frontend')}
              className={`flex items-center gap-3 px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
                selectedTab === 'frontend'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code size={20} />
              Frontend
              <span className={`text-xs px-2 py-1 rounded-full ${
                selectedTab === 'frontend' ? 'bg-blue-800' : 'bg-gray-200 text-gray-600'
              }`}>
                {frontendStats.total}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Backend Content */}
        {selectedTab === 'backend' && (
          <motion.div
            key="backend"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Backend Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Server size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">Backend Architecture</h2>
                      <p className="text-emerald-100">PHP / Symfony Framework</p>
                    </div>
                  </div>
                  <p className="text-emerald-50 max-w-2xl">
                    Core business logic, API endpoints, database models, and server-side processing built with modern PHP and Symfony best practices.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/docs')}
                  className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
                >
                  Browse Docs
                  <ArrowRight size={18} />
                </motion.button>
              </div>

              {/* Tech Stack */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {backendStats.techStack.map((tech, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="font-semibold">{tech.name}</div>
                    <div className="text-sm text-emerald-100">{tech.version}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Backend Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {backendStats.categories.map((category, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => navigate('/docs')}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <Database className="text-emerald-600" size={24} />
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">{category.count}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{category.desc}</p>
                  <div className="flex items-center text-emerald-600 text-sm font-semibold">
                    View Files
                    <ChevronRight size={16} className="ml-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Frontend Content */}
        {selectedTab === 'frontend' && (
          <motion.div
            key="frontend"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Frontend Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Code size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">Frontend Architecture</h2>
                      <p className="text-blue-100">Vue.js / Strapi CMS</p>
                    </div>
                  </div>
                  <p className="text-blue-50 max-w-2xl">
                    User interface components, page structures, CMS content types, and client-side logic powered by Vue.js and Strapi headless CMS.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/docs')}
                  className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
                >
                  Browse Docs
                  <ArrowRight size={18} />
                </motion.button>
              </div>

              {/* Tech Stack */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {frontendStats.techStack.map((tech, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="font-semibold">{tech.name}</div>
                    <div className="text-sm text-blue-100">{tech.version}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Frontend Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {frontendStats.categories.map((category, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => navigate('/docs')}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <FileCode className="text-blue-600" size={24} />
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{category.count}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{category.desc}</p>
                  <div className="flex items-center text-blue-600 text-sm font-semibold">
                    View Files
                    <ChevronRight size={16} className="ml-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/docs')}
              className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition-all text-left"
            >
              <Search className="text-emerald-600 mb-3" size={32} />
              <h4 className="font-bold text-gray-900 mb-2">Search Documentation</h4>
              <p className="text-sm text-gray-600">Find specific files, functions, or classes across all repositories</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/explore')}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all text-left"
            >
              <Layers className="text-blue-600 mb-3" size={32} />
              <h4 className="font-bold text-gray-900 mb-2">Interactive Explorer</h4>
              <p className="text-sm text-gray-600">Navigate through categorized file trees and filter by type</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/home')}
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all text-left"
            >
              <FileCode className="text-purple-600 mb-3" size={32} />
              <h4 className="font-bold text-gray-900 mb-2">Getting Started</h4>
              <p className="text-sm text-gray-600">Learn how to navigate and use the documentation system</p>
            </motion.button>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
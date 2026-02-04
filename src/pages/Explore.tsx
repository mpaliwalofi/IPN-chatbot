import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";




import {
  Search,
  ChevronDown,
  ChevronRight,
  Code,
  Database,
  FileText,
  Filter,
  X,
  FolderOpen,
  File
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Mock data - replace with actual documentation data
const mockFiles = [
  // Backend PHP files
  { id: 1, name: "UserController.php", category: "backend", section: "Controllers", path: "src/Api/Controller" },
  { id: 2, name: "ProductService.php", category: "backend", section: "Services", path: "src/Service" },
  { id: 3, name: "Order.php", category: "backend", section: "Entities", path: "src/Entity" },
  { id: 4, name: "UserRepository.php", category: "backend", section: "Repositories", path: "src/Repository" },
  // Frontend JS files
  { id: 5, name: "HomePage.vue", category: "frontend", section: "Pages", path: "src/pages" },
  { id: 6, name: "ProductCard.vue", category: "frontend", section: "Components", path: "src/components" },
  { id: 7, name: "blog-article.js", category: "frontend", section: "API Routes", path: "src/api/blog-article" },
  { id: 8, name: "schema.json", category: "frontend", section: "Content Types", path: "src/api/b2c-product" },
];

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'backend' | 'frontend'>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filter files
  const filteredFiles = useMemo(() => {
    let files = mockFiles;

    // Category filter
    if (categoryFilter !== 'all') {
      files = files.filter(f => f.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      files = files.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.section.toLowerCase().includes(query) ||
        f.path.toLowerCase().includes(query)
      );
    }

    return files;
  }, [searchQuery, categoryFilter]);

  // Group files by section
  const filesBySection = useMemo(() => {
    const grouped: Record<string, typeof mockFiles> = {};
    filteredFiles.forEach(file => {
      if (!grouped[file.section]) {
        grouped[file.section] = [];
      }
      grouped[file.section].push(file);
    });
    return grouped;
  }, [filteredFiles]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'backend':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'frontend':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'backend':
        return <Database className="w-4 h-4" />;
      case 'frontend':
        return <Code className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/20 to-gray-50 flex flex-col">
      <Navigation />
      <div className="pt-16">

      {/* Hero */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-[#024639] via-[#025a49] to-[#024639]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Documentation Explorer
            </h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
              Interactive file browser with advanced filtering and search capabilities
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${
              showFilters ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Filter size={20} className="text-emerald-600" />
                Filters
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Search Files
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, path..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Category
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-[#024639] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Files
                  <span className="float-right text-xs opacity-75">4,516</span>
                </button>
                <button
                  onClick={() => setCategoryFilter('backend')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                    categoryFilter === 'backend'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Database size={16} />
                    Backend (PHP)
                  </span>
                  <span className="float-right text-xs opacity-75">1,685</span>
                </button>
                <button
                  onClick={() => setCategoryFilter('frontend')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                    categoryFilter === 'frontend'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Code size={16} />
                    Frontend (JS/Vue)
                  </span>
                  <span className="float-right text-xs opacity-75">2,073</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Total Files:</span>
                  <span className="font-semibold text-gray-900">{filteredFiles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sections:</span>
                  <span className="font-semibold text-gray-900">
                    {Object.keys(filesBySection).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Clear Button */}
            {(searchQuery || categoryFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                variant="outline"
                className="w-full mt-4"
              >
                Clear All Filters
              </Button>
            )}
          </motion.div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
              <Button
                onClick={() => setShowFilters(true)}
                variant="outline"
                className="w-full"
              >
                <Filter size={16} className="mr-2" />
                Show Filters
              </Button>
            </div>

            {/* Results Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {filteredFiles.length} Files Found
                  </h2>
                  <p className="text-gray-600">
                    {categoryFilter === 'all' ? 'All categories' : 
                     categoryFilter === 'backend' ? 'Backend files only' : 
                     'Frontend files only'}
                  </p>
                </div>
                <Badge variant="outline" className="text-base px-4 py-2">
                  {Object.keys(filesBySection).length} Sections
                </Badge>
              </div>
            </motion.div>

            {/* File Tree */}
            <div className="space-y-4">
              {Object.keys(filesBySection).length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No files found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search query or filters
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                Object.entries(filesBySection).map(([section, files], idx) => (
                  <motion.div
                    key={section}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                  >
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: expandedSections[section] ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </motion.div>
                        <FolderOpen className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-gray-900">{section}</span>
                      </div>
                      <Badge variant="secondary" className="text-sm">
                        {files.length} files
                      </Badge>
                    </button>

                    {/* Files List */}
                    <AnimatePresence>
                      {expandedSections[section] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-100 overflow-hidden"
                        >
                          <div className="p-4 space-y-2">
                            {files.map((file) => (
                              <motion.div
                                key={file.id}
                                whileHover={{ x: 4, backgroundColor: 'rgba(2, 70, 57, 0.02)' }}
                                onClick={() => navigate('/docs')}
                                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                              >
                                <File className="w-4 h-4 text-gray-400" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {file.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {file.path}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getCategoryColor(file.category)} border`}
                                >
                                  <span className="flex items-center gap-1">
                                    {getCategoryIcon(file.category)}
                                    {file.category}
                                  </span>
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
}
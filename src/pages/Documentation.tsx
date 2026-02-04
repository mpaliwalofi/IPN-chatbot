import { useState, useEffect, useMemo } from "react";
import { Search, ChevronRight, ChevronDown, Code, Database, FileText, Menu, X, Home, Filter, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpg";
import type { DocumentationData, DocFile } from "@/types/documentation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";


export default function Documentation() {
  const navigate = useNavigate();
  const [docsData, setDocsData] = useState<DocumentationData | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocFile | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'backend' | 'frontend' | 'other'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  // Copy to clipboard with fallback
  const copyToClipboard = async (text: string, type: 'path' | 'code', codeIndex?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'path') {
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
      } else if (type === 'code' && codeIndex !== undefined) {
        setCopiedCode(codeIndex);
        setTimeout(() => setCopiedCode(null), 2000);
      }
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        if (type === 'path') {
          setCopiedPath(true);
          setTimeout(() => setCopiedPath(false), 2000);
        } else if (type === 'code' && codeIndex !== undefined) {
          setCopiedCode(codeIndex);
          setTimeout(() => setCopiedCode(null), 2000);
        }
      } catch (e) {
        console.error('Copy failed:', e);
      }
      document.body.removeChild(textArea);
    }
  };

  // Load documentation data
  useEffect(() => {
    async function loadDocs() {
      try {
        const response = await fetch('/data/documentation.json');
        const data = await response.json();
        setDocsData(data);
        
        // Expand first section by default
        if (data.categories && Object.keys(data.categories).length > 0) {
          const firstSection = Object.keys(data.categories)[0];
          setExpandedSections({ [firstSection]: true });
        }
      } catch (error) {
        console.error('Failed to load documentation:', error);
      }
    }
    loadDocs();
  }, []);

  // Filter files based on search and category
  const filteredFiles = useMemo(() => {
    if (!docsData) return [];
    
    let files = docsData.files;
    
    // Filter by category
    if (categoryFilter !== 'all') {
      files = files.filter(f => f.category === categoryFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      files = files.filter(f => 
        f.displayName.toLowerCase().includes(query) ||
        f.fileName.toLowerCase().includes(query) ||
        f.section.toLowerCase().includes(query) ||
        f.path.toLowerCase().includes(query)
      );
    }
    
    return files;
  }, [docsData, searchQuery, categoryFilter]);

  // Load markdown file content
  const loadFileContent = async (file: DocFile) => {
    setLoading(true);
    setSelectedFile(file);
    
    try {
      const response = await fetch(`/docs/${file.mdFile}`);
      const content = await response.text();
      setFileContent(content);
    } catch (error) {
      console.error('Failed to load file:', error);
      setFileContent('# Error\n\nFailed to load documentation file.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'backend':
        return <Database className="w-4 h-4 text-emerald-600" />;
      case 'frontend':
        return <Code className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  // Parse markdown content into structured sections
  const parseMarkdownContent = (content: string) => {
    const sections = [];
    const lines = content.split('\n');
    let currentSection: any = null;
    let currentContent: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let mainTitle = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          if (currentSection) {
            currentSection.codeBlocks = currentSection.codeBlocks || [];
            currentSection.codeBlocks.push(codeBlockContent.join('\n'));
          }
          currentContent.push(`___CODE_BLOCK_${currentSection?.codeBlocks?.length - 1}___`);
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Check for main title (# )
      if (line.startsWith('# ') && !line.startsWith('## ')) {
        mainTitle = line.replace('# ', '').trim();
        continue;
      }

      // Check for section heading (##)
      if (line.startsWith('## ')) {
        // Skip Overview section
        const sectionTitle = line.replace('## ', '').trim();
        if (sectionTitle === 'Overview') {
          currentSection = null;
          currentContent = [];
          continue;
        }
        
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }
        currentSection = {
          title: sectionTitle,
          content: '',
          codeBlocks: []
        };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Add last section
    if (currentSection && currentSection.title !== 'Overview') {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    return sections;
  };

  const renderFormattedContent = (content: string, codeBlocks: string[] = []) => {
    const lines = content.split('\n');
    const elements = [];
    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <div key={`list-${elements.length}`} className="bg-gradient-to-r from-emerald-50/50 to-transparent rounded-lg p-4 border-l-4 border-emerald-500 my-3">
            <div className="space-y-2">
              {currentList.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-gray-700">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                  </div>
                  <span className="flex-1 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, idx) => {
      // Skip any remaining hash symbols
      if (line.trim().startsWith('#')) {
        return;
      }

      // Handle code block placeholders
      if (line.includes('___CODE_BLOCK_')) {
        flushList();
        const match = line.match(/___CODE_BLOCK_(\d+)___/);
        if (match && codeBlocks[parseInt(match[1])]) {
          const codeIndex = parseInt(match[1]);
          elements.push(
            <div key={`code-${idx}`} className="my-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#024639] to-emerald-900 rounded-xl blur-sm opacity-20"></div>
                <div className="relative bg-gradient-to-br from-[#024639] to-[#025a48] rounded-xl p-5 shadow-lg border border-emerald-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(codeBlocks[codeIndex], 'code', codeIndex)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs text-emerald-100 transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center gap-1.5"
                    >
                      {copiedCode === codeIndex ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        'Copy Code'
                      )}
                    </button>
                  </div>
                  <pre className="text-emerald-50 font-mono text-sm overflow-x-auto leading-relaxed">
                    {codeBlocks[codeIndex]}
                  </pre>
                </div>
              </div>
            </div>
          );
        }
      }
      // Handle list items
      else if (line.trim().startsWith('- ')) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(line.trim().substring(2));
      }
      // Handle method signatures (like login(credentials))
      else if (line.trim() && /^[a-zA-Z_]+\([^)]*\)$/.test(line.trim())) {
        flushList();
        elements.push(
          <div key={`method-${idx}`} className="my-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg px-4 py-2 shadow-sm">
              <Code className="w-4 h-4 text-teal-600" />
              <code className="text-teal-700 text-sm font-mono font-semibold">
                {line.trim()}
              </code>
            </div>
          </div>
        );
      }
      // Handle bold text (Parameters:, Returns:, Example:)
      else if (line.trim().match(/^(Parameters|Returns|Example|Summary):/)) {
        flushList();
        const label = line.trim();
        const color = 
          label.startsWith('Parameters') ? 'from-pink-500 to-rose-500' :
          label.startsWith('Returns') ? 'from-cyan-500 to-blue-500' :
          label.startsWith('Example') ? 'from-purple-500 to-indigo-500' :
          'from-emerald-500 to-teal-500';
        
        elements.push(
          <div key={`label-${idx}`} className="mt-6 mb-3">
            <div className="inline-flex items-center gap-2">
              <div className={`w-1 h-6 bg-gradient-to-b ${color} rounded-full`}></div>
              <h3 className="text-lg font-bold text-gray-900">
                {label}
              </h3>
            </div>
          </div>
        );
      }
      // Handle **Path**: pattern
      else if (line.trim().startsWith('**') && line.includes('**:')) {
        flushList();
        const pathContent = line.trim().replace('**Path**:', '').trim().replace(/`/g, '');
        elements.push(
          <div key={`path-${idx}`} className="my-4">
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Path</div>
                  <code className="text-sm text-gray-800 font-mono break-all">{pathContent}</code>
                </div>
              </div>
            </div>
          </div>
        );
      }
      // Handle inline code with properties (like credentials.email)
      else if (line.includes('`')) {
        flushList();
        const parts = line.split('`');
        const rendered = parts.map((part, i) => {
          if (i % 2 === 1) {
            return (
              <code key={i} className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200 text-sm font-mono font-medium">
                {part}
              </code>
            );
          }
          return <span key={i}>{part}</span>;
        });
        elements.push(
          <div key={`inline-${idx}`} className="text-gray-700 leading-relaxed my-2">
            {rendered}
          </div>
        );
      }
      // Regular paragraph text
      else if (line.trim()) {
        flushList();
        elements.push(
          <p key={`text-${idx}`} className="text-gray-700 leading-relaxed my-2">
            {line}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  if (!docsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-gray-50 flex flex-col">
       <Navigation />
      <div className="flex flex-1 overflow-hidden pt-16">

        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden fixed lg:relative h-[calc(100vh-64px)] z-40"
            >
              {/* Search */}
              <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-emerald-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    variant={categoryFilter === 'all' ? 'default' : 'outline'}
                    className={`cursor-pointer ${categoryFilter === 'all' ? 'bg-[#024639] hover:bg-[#024639]' : ''}`}
                    onClick={() => setCategoryFilter('all')}
                  >
                    All ({docsData.stats.total})
                  </Badge>
                  <Badge
                    variant={categoryFilter === 'backend' ? 'default' : 'outline'}
                    className={`cursor-pointer ${categoryFilter === 'backend' ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
                    onClick={() => setCategoryFilter('backend')}
                  >
                    Backend ({docsData.stats.backend})
                  </Badge>
                  <Badge
                    variant={categoryFilter === 'frontend' ? 'default' : 'outline'}
                    className={`cursor-pointer ${categoryFilter === 'frontend' ? 'bg-blue-600 hover:bg-blue-600' : ''}`}
                    onClick={() => setCategoryFilter('frontend')}
                  >
                    Frontend ({docsData.stats.frontend})
                  </Badge>
                </div>

                <div className="text-xs text-gray-500">
                  {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
                </div>
              </div>

              {/* File Tree */}
              <div className="flex-1 overflow-y-auto p-4">
                {searchQuery.trim() ? (
                  // Search Results View
                  <div className="space-y-1">
                    {filteredFiles.map(file => (
                      <motion.button
                        key={file.id}
                        whileHover={{ x: 3, backgroundColor: 'rgba(2, 70, 57, 0.05)' }}
                        onClick={() => loadFileContent(file)}
                        className={`w-full text-left p-2 rounded-md flex items-start gap-2 transition-colors ${
                          selectedFile?.id === file.id ? 'bg-emerald-50 border border-emerald-200' : ''
                        }`}
                      >
                        {getCategoryIcon(file.category)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {file.displayName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {file.section} {file.subsection && `> ${file.subsection}`}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  // Category Tree View
                  <div className="space-y-2">
                    {Object.entries(docsData.categories).map(([categoryName, categoryData]) => {
                      const categoryFiles = docsData.files.filter(f => f.section === categoryName);
                      const visibleFiles = categoryFilter === 'all' 
                        ? categoryFiles 
                        : categoryFiles.filter(f => f.category === categoryFilter);
                      
                      if (visibleFiles.length === 0) return null;

                      return (
                        <div key={categoryName} className="space-y-1">
                          <motion.button
                            whileHover={{ x: 2 }}
                            onClick={() => toggleSection(categoryName)}
                            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-sm font-semibold text-gray-700"
                          >
                            <motion.div
                              animate={{ rotate: expandedSections[categoryName] ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </motion.div>
                            <span className="flex-1 text-left">{categoryName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {visibleFiles.length}
                            </Badge>
                          </motion.button>

                          <AnimatePresence>
                            {expandedSections[categoryName] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="ml-6 space-y-0.5 overflow-hidden"
                              >
                                {visibleFiles.slice(0, 50).map(file => (
                                  <motion.button
                                    key={file.id}
                                    whileHover={{ x: 3, backgroundColor: 'rgba(2, 70, 57, 0.05)' }}
                                    onClick={() => loadFileContent(file)}
                                    className={`w-full text-left p-2 rounded-md flex items-center gap-2 text-sm transition-colors ${
                                      selectedFile?.id === file.id ? 'bg-emerald-50 border border-emerald-200' : ''
                                    }`}
                                  >
                                    {getCategoryIcon(file.category)}
                                    <span className="truncate">{file.displayName}</span>
                                  </motion.button>
                                ))}
                                {visibleFiles.length > 50 && (
                                  <p className="text-xs text-gray-500 p-2">
                                    + {visibleFiles.length - 50} more files...
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {selectedFile ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto"
            >
              {/* File Header */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getCategoryIcon(selectedFile.category)}
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        {selectedFile.displayName}
                      </h1>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{selectedFile.section}</span>
                        {selectedFile.subsection && (
                          <>
                            <ChevronRight className="w-3 h-3" />
                            <span>{selectedFile.subsection}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className={
                    selectedFile.category === 'backend' ? 'bg-emerald-600' :
                    selectedFile.category === 'frontend' ? 'bg-blue-600' :
                    'bg-gray-600'
                  }>
                    {selectedFile.category.toUpperCase()}
                  </Badge>
                </div>
                
                {/* Beautiful Path Highlight */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#024639] via-emerald-700 to-[#024639] rounded-xl blur-sm opacity-20"></div>
                  <div className="relative bg-gradient-to-r from-[#024639] to-emerald-800 rounded-xl p-4 shadow-lg border border-emerald-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                          <FileText className="w-4 h-4 text-emerald-200" />
                        </div>
                      </div>
                      <code className="text-sm font-mono text-emerald-50 font-medium tracking-wide flex-1 break-all">
                        {selectedFile.path}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedFile.path, 'path')}
                        className="flex-shrink-0 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-emerald-100 transition-all duration-200 hover:shadow-md backdrop-blur-sm flex items-center gap-1.5"
                      >
                        {copiedPath ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          'Copy'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Content */}
              <div className="space-y-6">
                {loading ? (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading content...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {parseMarkdownContent(fileContent).map((section, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                      >
                        {/* Section Header with Icon */}
                        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              section.title === 'Summary' ? 'bg-purple-100' :
                              section.title === 'Classes' ? 'bg-orange-100' :
                              section.title === 'Function Details' || section.title === 'Methods' ? 'bg-emerald-100' :
                              section.title === 'Parameters' ? 'bg-pink-100' :
                              section.title === 'Returns' ? 'bg-cyan-100' :
                              'bg-gray-100'
                            }`}>
                              {section.title === 'Summary' && <FileText className="w-5 h-5 text-purple-600" />}
                              {section.title === 'Classes' && <Database className="w-5 h-5 text-orange-600" />}
                              {(section.title === 'Function Details' || section.title === 'Methods') && <Code className="w-5 h-5 text-emerald-600" />}
                              {section.title === 'Parameters' && <ChevronRight className="w-5 h-5 text-pink-600" />}
                              {section.title === 'Returns' && <ChevronRight className="w-5 h-5 text-cyan-600" />}
                              {!['Summary', 'Classes', 'Function Details', 'Methods', 'Parameters', 'Returns'].includes(section.title) && 
                                <FileText className="w-5 h-5 text-gray-600" />}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                              {section.title}
                            </h2>
                          </div>
                        </div>
                        
                        {/* Section Content */}
                        <div className="px-6 py-5">
                          <div className="space-y-3">
                            {renderFormattedContent(section.content, section.codeBlocks)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="max-w-3xl mx-auto text-center py-20">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Select a file to view
              </h2>
              <p className="text-gray-600">
                Browse the documentation tree on the left or use the search to find specific files.
              </p>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
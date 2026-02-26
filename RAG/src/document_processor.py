"""
Document Processor - Handles loading and preprocessing of documentation files
Supports markdown files with metadata extraction
"""

import re
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

try:
    from langchain.schema import Document
except ImportError:
    from langchain_core.documents import Document

logger = logging.getLogger(__name__)


@dataclass
class FileMetadata:
    """Metadata extracted from a documentation file"""
    source_file: str
    file_path: str
    category: str  # 'backend', 'frontend', 'other'
    file_extension: str
    relative_path: str


class DocumentProcessor:
    """
    Processes documentation files for the RAG system
    
    Features:
    - Loads markdown files from directory structure
    - Extracts metadata (category, file type, path)
    - Handles large files with intelligent splitting
    - Preserves code blocks and structure
    """
    
    # File extension to category mapping
    CATEGORY_MAP = {
        # Backend
        '.php': 'backend',
        '.xml': 'backend',
        '.yaml': 'backend',
        '.yml': 'backend',
        '.twig': 'backend',
        
        # Frontend
        '.vue': 'frontend',
        '.js': 'frontend',
        '.ts': 'frontend',
        '.tsx': 'frontend',
        '.jsx': 'frontend',
        '.json': 'frontend',
        
        # Other
        '.md': 'other',
        '.css': 'other',
        '.scss': 'other',
        '.sh': 'other',
        '.sql': 'other',
    }
    
    def __init__(self):
        self.stats = {
            'files_processed': 0,
            'chunks_created': 0,
            'errors': 0
        }
    
    def _get_category_from_filename(self, filename: str) -> str:
        """
        Determine file category based on filename patterns
        """
        filename_lower = filename.lower()
        
        # Check for backend patterns
        if any(pattern in filename_lower for pattern in [
            'config_', 'entity_', 'repository_', 'controller_',
            'service_', 'command_', 'handler_', 'listener_',
            'sylius_', 'api_platform', 'doctrine', 'messenger'
        ]):
            return 'backend'
        
        # Check for frontend patterns
        if any(pattern in filename_lower for pattern in [
            'component_', 'composable_', 'store_', 'plugin_',
            'middleware_', 'layout_', 'page_', '_vue.', '_ts.',
            'apps_front', 'storybook'
        ]):
            return 'frontend'
        
        # Default to other
        return 'other'
    
    def _extract_original_extension(self, filename: str) -> str:
        """
        Extract the original file extension from the markdown filename
        e.g., 'file_php.md' -> '.php'
        """
        # Remove .md suffix
        if filename.endswith('.md'):
            filename = filename[:-3]
        
        # Find the last underscore which separates filename from extension
        if '_' in filename:
            parts = filename.rsplit('_', 1)
            if len(parts) == 2:
                ext = parts[1]
                # Validate it looks like an extension
                if ext.isalnum() and len(ext) <= 10:
                    return f'.{ext}'
        
        return '.unknown'
    
    def _parse_file_path(self, file_path: Path, base_path: Path) -> FileMetadata:
        """
        Extract metadata from file path
        """
        relative = file_path.relative_to(base_path)
        filename = file_path.name
        
        # Extract original extension from filename
        original_ext = self._extract_original_extension(filename)
        
        # Determine category
        category = self.CATEGORY_MAP.get(original_ext, 'other')
        
        # Refine category based on filename patterns
        if category == 'other':
            category = self._get_category_from_filename(filename)
        
        # Clean up source file name (remove .md and extension marker)
        source_file = filename.replace('.md', '').replace('_', '.')
        
        return FileMetadata(
            source_file=source_file,
            file_path=str(relative),
            category=category,
            file_extension=original_ext,
            relative_path=str(relative.parent)
        )
    
    def _clean_content(self, content: str) -> str:
        """
        Clean and normalize document content
        """
        # Remove excessive whitespace
        content = re.sub(r'\n{4,}', '\n\n\n', content)
        
        # Normalize line endings
        content = content.replace('\r\n', '\n')
        
        return content.strip()
    
    def _split_large_document(
        self, 
        content: str, 
        metadata: FileMetadata,
        max_chars: int = 2000,
        overlap: int = 200
    ) -> List[Document]:
        """
        Split large documents into overlapping chunks
        Preserves code blocks and structure
        """
        documents = []
        
        # If content is small enough, return as-is
        if len(content) <= max_chars:
            return [Document(
                page_content=content,
                metadata={
                    'source_file': metadata.source_file,
                    'file_path': metadata.file_path,
                    'category': metadata.category,
                    'file_extension': metadata.file_extension,
                    'chunk_index': 0
                }
            )]
        
        # Split by headers to preserve structure
        header_pattern = r'\n(#{1,6}\s+.+?)\n'
        sections = re.split(header_pattern, content)
        
        chunks = []
        current_chunk = ""
        chunk_index = 0
        
        for section in sections:
            if not section.strip():
                continue
            
            # If adding this section exceeds max size, save current chunk
            if len(current_chunk) + len(section) > max_chars and current_chunk:
                chunks.append({
                    'text': current_chunk.strip(),
                    'index': chunk_index
                })
                # Keep overlap from previous chunk
                overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                current_chunk = overlap_text + "\n" + section
                chunk_index += 1
            else:
                current_chunk += "\n" + section
        
        # Don't forget the last chunk
        if current_chunk.strip():
            chunks.append({
                'text': current_chunk.strip(),
                'index': chunk_index
            })
        
        # Create Document objects
        for chunk in chunks:
            documents.append(Document(
                page_content=chunk['text'],
                metadata={
                    'source_file': metadata.source_file,
                    'file_path': metadata.file_path,
                    'category': metadata.category,
                    'file_extension': metadata.file_extension,
                    'chunk_index': chunk['index']
                }
            ))
        
        return documents
    
    def load_documents(self, docs_path: Path) -> List[Document]:
        """
        Load all documentation files from the given path
        
        Args:
            docs_path: Path to the documentation directory
            
        Returns:
            List of Document objects with metadata
        """
        if not docs_path.exists():
            raise FileNotFoundError(f"Documentation path not found: {docs_path}")
        
        logger.info(f"Loading documents from {docs_path}")
        
        all_documents = []
        md_files = list(docs_path.rglob("*.md"))
        
        logger.info(f"Found {len(md_files)} markdown files")
        
        # Track categories for stats
        category_counts = {}
        
        for md_file in md_files:
            try:
                # Parse metadata from filename
                metadata = self._parse_file_path(md_file, docs_path)
                
                # Update category counts
                category_counts[metadata.category] = category_counts.get(metadata.category, 0) + 1
                
                # Read content
                content = md_file.read_text(encoding='utf-8', errors='ignore')
                
                # Clean content
                content = self._clean_content(content)
                
                if not content:
                    logger.warning(f"Empty file: {md_file}")
                    continue
                
                # Split large documents
                documents = self._split_large_document(content, metadata)
                all_documents.extend(documents)
                
                self.stats['files_processed'] += 1
                self.stats['chunks_created'] += len(documents)
                
            except Exception as e:
                logger.error(f"Error processing {md_file}: {e}")
                self.stats['errors'] += 1
        
        logger.info(f"Processed {self.stats['files_processed']} files")
        logger.info(f"Created {self.stats['chunks_created']} chunks")
        logger.info(f"Category distribution: {category_counts}")
        
        if self.stats['errors'] > 0:
            logger.warning(f"Encountered {self.stats['errors']} errors during processing")
        
        return all_documents
    
    def get_stats(self) -> Dict[str, Any]:
        """Get processing statistics"""
        return self.stats.copy()

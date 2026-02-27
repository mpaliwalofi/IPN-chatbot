"""
Document Analyzer - Analyzes IPN documentation structure and provides statistics
Handles overview questions about controllers, entities, and codebase structure
"""

import re
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, asdict
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class CodebaseStats:
    """Statistics about the IPN codebase"""
    total_documents: int
    total_controllers: int
    total_entities: int
    total_services: int
    total_repositories: int
    total_components: int
    total_composables: int
    
    # Breakdown by category
    backend_files: int
    frontend_files: int
    other_files: int
    
    # Specific lists (top items)
    controllers: List[str]
    entities: List[str]
    services: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class DocumentAnalyzer:
    """
    Analyzes the documentation structure to answer overview questions
    Provides statistics about controllers, entities, and codebase organization
    """
    
    def __init__(self, docs_path: str):
        self.docs_path = Path(docs_path)
        self._stats_cache: Optional[CodebaseStats] = None
        self._file_index: Dict[str, List[str]] = defaultdict(list)
        self._category_index: Dict[str, List[str]] = defaultdict(list)
        
    def analyze(self, force_rebuild: bool = False) -> CodebaseStats:
        """
        Analyze all documentation files and build statistics
        
        Args:
            force_rebuild: Force rebuild even if cache exists
            
        Returns:
            CodebaseStats object with all statistics
        """
        if self._stats_cache is not None and not force_rebuild:
            return self._stats_cache
            
        logger.info("Analyzing documentation structure...")
        
        if not self.docs_path.exists():
            raise FileNotFoundError(f"Documentation path not found: {self.docs_path}")
        
        # Collect all files
        all_files = list(self.docs_path.rglob("*.md"))
        
        # Categorize files
        controllers = []
        entities = []
        services = []
        repositories = []
        components = []
        composables = []
        
        backend_files = 0
        frontend_files = 0
        other_files = 0
        
        for file_path in all_files:
            filename = file_path.name.lower()
            
            # Categorize by type
            if 'controller' in filename:
                controllers.append(self._clean_filename(file_path.name))
            elif 'entity' in filename:
                entities.append(self._clean_filename(file_path.name))
            elif 'service' in filename:
                services.append(self._clean_filename(file_path.name))
            elif 'repository' in filename:
                repositories.append(self._clean_filename(file_path.name))
            elif 'component' in filename or filename.endswith('_vue.md'):
                components.append(self._clean_filename(file_path.name))
            elif 'composable' in filename:
                composables.append(self._clean_filename(file_path.name))
            
            # Categorize by backend/frontend/other
            if any(ext in filename for ext in ['_php.', '_xml.', '_yaml.', '_yml.']):
                backend_files += 1
            elif any(ext in filename for ext in ['_vue.', '_js.', '_ts.', '_tsx.', '_jsx.']):
                frontend_files += 1
            else:
                other_files += 1
        
        self._stats_cache = CodebaseStats(
            total_documents=len(all_files),
            total_controllers=len(controllers),
            total_entities=len(entities),
            total_services=len(services),
            total_repositories=len(repositories),
            total_components=len(components),
            total_composables=len(composables),
            backend_files=backend_files,
            frontend_files=frontend_files,
            other_files=other_files,
            controllers=sorted(controllers)[:50],  # Top 50
            entities=sorted(entities)[:50],
            services=sorted(services)[:30]
        )
        
        logger.info(f"Analysis complete: {self._stats_cache.total_documents} documents")
        logger.info(f"  - Controllers: {self._stats_cache.total_controllers}")
        logger.info(f"  - Entities: {self._stats_cache.total_entities}")
        logger.info(f"  - Services: {self._stats_cache.total_services}")
        
        return self._stats_cache
    
    def _clean_filename(self, filename: str) -> str:
        """Clean up filename for display"""
        # Remove .md extension
        if filename.endswith('.md'):
            filename = filename[:-3]
        # Replace underscores with dots
        return filename.replace('_', '.')
    
    def is_overview_question(self, query: str) -> bool:
        """
        Detect if the query is asking for an overview/statistics
        
        Args:
            query: User query string
            
        Returns:
            True if this is an overview question
        """
        query_lower = query.lower().strip()
        
        overview_patterns = [
            # Statistics questions
            r'^(how many|total number|count of|number of)',
            r'(how many|total|count)\s+(controllers|entities|services|files|documents)',
            
            # Overview questions
            r'^(give me an? )?overview',
            r'^what is the (structure|architecture|organization)',
            r'^(show|list|tell) me (all|the)',
            r'^(what|which)\s+(controllers|entities|services|components)',
            
            # Specific type questions
            r'^(list|show)\s+(all\s+)?(the\s+)?(controllers|entities|services)',
            r'how many\s+(controllers|entities|services|repositories|components)',
            r'^(what are|tell me about)\s+(the\s+)?(controllers|entities|services)',
            
            # Summary questions
            r'^summarize\s+(the\s+)?(documentation|codebase)',
            r'^codebase\s+(stats|statistics|overview)',
            r'^documentation\s+(summary|overview|structure)',
        ]
        
        return any(re.search(pattern, query_lower) for pattern in overview_patterns)
    
    def get_response(self, query: str) -> Optional[str]:
        """
        Generate a response for overview/statistics questions
        
        Args:
            query: User query
            
        Returns:
            Formatted response string or None if not an overview question
        """
        if not self.is_overview_question(query):
            return None
            
        stats = self.analyze()
        query_lower = query.lower()
        
        # Specific controller count
        if 'controller' in query_lower and ('how many' in query_lower or 'count' in query_lower or 'number' in query_lower):
            return self._format_controller_count(stats)
        
        # Specific entity count
        if 'entity' in query_lower and ('how many' in query_lower or 'count' in query_lower or 'number' in query_lower):
            return self._format_entity_count(stats)
        
        # Specific service count
        if 'service' in query_lower and ('how many' in query_lower or 'count' in query_lower or 'number' in query_lower):
            return self._format_service_count(stats)
        
        # List all controllers
        if 'controller' in query_lower and ('list' in query_lower or 'show' in query_lower or 'what are' in query_lower):
            return self._format_controller_list(stats)
        
        # List all entities
        if 'entity' in query_lower and ('list' in query_lower or 'show' in query_lower or 'what are' in query_lower):
            return self._format_entity_list(stats)
        
        # List all services
        if 'service' in query_lower and ('list' in query_lower or 'show' in query_lower or 'what are' in query_lower):
            return self._format_service_list(stats)
        
        # General overview
        if 'overview' in query_lower or 'summary' in query_lower or 'structure' in query_lower:
            return self._format_overview(stats)
        
        # Total documents
        if 'total' in query_lower and 'document' in query_lower:
            return f"The IPN codebase contains **{stats.total_documents:,}** documentation files."
        
        # Default statistics summary
        return self._format_statistics_summary(stats)
    
    def _format_controller_count(self, stats: CodebaseStats) -> str:
        """Format controller count response"""
        return (
            f"The IPN codebase contains **{stats.total_controllers}** controllers.\n\n"
            f"Controllers handle HTTP requests and define the API endpoints for the application. "
            f"They are part of the Symfony backend architecture and manage the flow between "
            f"the frontend and the business logic."
        )
    
    def _format_entity_count(self, stats: CodebaseStats) -> str:
        """Format entity count response"""
        return (
            f"The IPN codebase contains **{stats.total_entities}** entities.\n\n"
            f"Entities represent the database models in the Symfony application using Doctrine ORM. "
            f"They define the data structure and relationships for the pet nutrition platform."
        )
    
    def _format_service_count(self, stats: CodebaseStats) -> str:
        """Format service count response"""
        return (
            f"The IPN codebase contains **{stats.total_services}** services.\n\n"
            f"Services contain the core business logic and are reusable across the application. "
            f"They handle complex operations, integrations, and data processing."
        )
    
    def _format_controller_list(self, stats: CodebaseStats) -> str:
        """Format controller list response"""
        controllers_sample = stats.controllers[:20]
        remaining = stats.total_controllers - len(controllers_sample)
        
        response = f"**Controllers in IPN ({stats.total_controllers} total):**\n\n"
        response += "Here are the main controllers:\n"
        for i, ctrl in enumerate(controllers_sample, 1):
            response += f"{i}. `{ctrl}`\n"
        
        if remaining > 0:
            response += f"\n...and {remaining} more controllers."
        
        response += (
            "\n\nControllers in Symfony handle incoming HTTP requests, process user input, "
            "interact with services and repositories, and return appropriate responses."
        )
        return response
    
    def _format_entity_list(self, stats: CodebaseStats) -> str:
        """Format entity list response"""
        entities_sample = stats.entities[:20]
        remaining = stats.total_entities - len(entities_sample)
        
        response = f"**Entities in IPN ({stats.total_entities} total):**\n\n"
        response += "Key entities include:\n"
        for i, entity in enumerate(entities_sample, 1):
            response += f"{i}. `{entity}`\n"
        
        if remaining > 0:
            response += f"\n...and {remaining} more entities."
        
        response += (
            "\n\nEntities represent the core data models including Products, Orders, Customers, "
            "Subscriptions, Animals, and their relationships in the database."
        )
        return response
    
    def _format_service_list(self, stats: CodebaseStats) -> str:
        """Format service list response"""
        services_sample = stats.services[:20]
        remaining = stats.total_services - len(services_sample)
        
        response = f"**Services in IPN ({stats.total_services} total):**\n\n"
        response += "Key services include:\n"
        for i, svc in enumerate(services_sample, 1):
            response += f"{i}. `{svc}`\n"
        
        if remaining > 0:
            response += f"\n...and {remaining} more services."
        
        response += (
            "\n\nServices encapsulate business logic, handle external integrations, "
            "and provide reusable functionality across the application."
        )
        return response
    
    def _format_overview(self, stats: CodebaseStats) -> str:
        """Format comprehensive overview"""
        return (
            f"# IPN Codebase Overview\n\n"
            f"The Inspired Pet Nutrition (IPN) platform is a comprehensive e-commerce solution "
            f"built with a modern tech stack. Here's the architecture overview:\n\n"
            f"## 📊 Statistics\n\n"
            f"- **Total Documentation Files**: {stats.total_documents:,}\n"
            f"- **Backend Files**: {stats.backend_files:,}\n"
            f"- **Frontend Files**: {stats.frontend_files:,}\n"
            f"- **Other Files**: {stats.other_files:,}\n\n"
            f"## 🏗️ Backend Architecture (Symfony/API Platform)\n\n"
            f"- **Controllers**: {stats.total_controllers} - Handle HTTP requests and API endpoints\n"
            f"- **Entities**: {stats.total_entities} - Doctrine ORM models for database\n"
            f"- **Services**: {stats.total_services} - Business logic and operations\n"
            f"- **Repositories**: {stats.total_repositories} - Data access layer\n\n"
            f"## 💻 Frontend Architecture (Vue.js/Nuxt)\n\n"
            f"- **Components**: {stats.total_components} - Vue UI components\n"
            f"- **Composables**: {stats.total_composables} - Reusable logic hooks\n\n"
            f"The platform supports pet nutrition e-commerce with features like "
            f"subscription management, animal profiles, order processing, and B2B capabilities."
        )
    
    def _format_statistics_summary(self, stats: CodebaseStats) -> str:
        """Format general statistics summary"""
        return (
            f"**IPN Codebase Statistics:**\n\n"
            f"📁 **Total Documents**: {stats.total_documents:,}\n"
            f"   - Backend: {stats.backend_files:,}\n"
            f"   - Frontend: {stats.frontend_files:,}\n"
            f"   - Other: {stats.other_files:,}\n\n"
            f"🏗️ **Backend Components**:\n"
            f"   - Controllers: {stats.total_controllers}\n"
            f"   - Entities: {stats.total_entities}\n"
            f"   - Services: {stats.total_services}\n"
            f"   - Repositories: {stats.total_repositories}\n\n"
            f"💻 **Frontend Components**:\n"
            f"   - Components: {stats.total_components}\n"
            f"   - Composables: {stats.total_composables}\n\n"
            f"Ask me about any specific component type for more details!"
        )
    
    def get_entity_explanation(self, entity_name: Optional[str] = None) -> str:
        """
        Get explanation about entities
        
        Args:
            entity_name: Optional specific entity to explain
            
        Returns:
            Explanation string
        """
        if entity_name:
            return (
                f"**{entity_name} Entity**\n\n"
                f"This entity is part of the IPN data model. Entities in IPN are PHP classes "
                f"annotated with Doctrine ORM mappings that define the database structure. "
                f"They typically include properties, relationships to other entities, "
                f"and validation constraints."
            )
        
        return (
            "**Entities in IPN**\n\n"
            "Entities are PHP classes that represent database tables using Doctrine ORM. "
            "They define:\n\n"
            "- **Properties**: Fields/columns with data types\n"
            "- **Relationships**: One-to-many, many-to-one, many-to-many associations\n"
            "- **Validation**: Constraints for data integrity\n"
            "- **Lifecycle Callbacks**: Pre/post persist operations\n\n"
            f"The system has {self._stats_cache.total_entities if self._stats_cache else 'many'} entities "
            "including Customer, Order, Product, Subscription, Animal, and more."
        )
    
    def get_controller_explanation(self, controller_name: Optional[str] = None) -> str:
        """
        Get explanation about controllers
        
        Args:
            controller_name: Optional specific controller to explain
            
        Returns:
            Explanation string
        """
        if controller_name:
            return (
                f"**{controller_name} Controller**\n\n"
                f"This controller handles HTTP requests for specific resources. "
                f"In Symfony, controllers receive requests, interact with services/repositories, "
                f"and return JSON responses (for API) or rendered views."
            )
        
        return (
            "**Controllers in IPN**\n\n"
            "Controllers are the entry point for HTTP requests in the Symfony backend. They:\n\n"
            "- **Handle Routing**: Map URLs to specific actions\n"
            "- **Process Input**: Validate and extract request data\n"
            "- **Orchestrate**: Call services and repositories\n"
            "- **Return Responses**: JSON for API, views for admin\n\n"
            "IPN uses API Platform controllers for REST endpoints and standard Symfony "
            "controllers for custom operations."
        )
    
    def get_quick_stats(self) -> Dict[str, Any]:
        """Get quick statistics for API responses"""
        if self._stats_cache is None:
            self.analyze()
        return self._stats_cache.to_dict()

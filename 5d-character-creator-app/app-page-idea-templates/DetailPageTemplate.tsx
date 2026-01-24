'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Download,
  Edit3,
  MoreHorizontal,
  Upload,
  Wand2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  Users,
  Crown,
  Swords,
  Heart,
  MapPin,
  Calendar,
  BookOpen,
  Sparkles,
  Image as ImageIcon,
  Play,
  Bookmark,
  MessageSquare,
  Link2,
  Clock,
  Tag,
  Info,
  Settings,
  Music
} from 'lucide-react';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface DetailItem {
  id: string;
  type: 'character' | 'world' | 'faction' | 'location';
  title: string;
  subtitle?: string;
  tagline?: string;
  heroImage: {
    url: string;
    source: 'preset' | 'uploaded' | 'generated';
    caption?: string;
  };
  infobox: InfoboxData;
  sections: ContentSection[];
  relatedItems?: RelatedItem[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    author?: string;
    version?: string;
  };
}

interface InfoboxData {
  stats: { label: string; value: string; icon?: string }[];
  quickFacts?: { label: string; value: string }[];
  tags?: string[];
}

interface ContentSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: string | React.ReactNode;
  subsections?: {
    id: string;
    title: string;
    content: string | React.ReactNode;
  }[];
  images?: {
    url: string;
    caption?: string;
    position?: 'left' | 'right' | 'full';
  }[];
  collapsed?: boolean;
}

interface RelatedItem {
  id: string;
  title: string;
  type: string;
  imageUrl: string;
  relationship?: string;
}

// =============================================================================
// PLACEHOLDER DATA
// TODO: Antigravity - Replace with actual data from your state/database
// =============================================================================

const PLACEHOLDER_CHARACTER: DetailItem = {
  id: 'char-001',
  type: 'character',
  title: 'Elara Vance',
  subtitle: 'Memory Courier • The Reluctant Hero',
  tagline: 'A memory courier who can\'t forget her own past.',
  heroImage: {
    url: '/api/placeholder/1920/1080',
    source: 'preset',
    caption: 'Elara in the rain-soaked streets of Sector 7'
  },
  infobox: {
    stats: [
      { label: 'Role', value: 'Protagonist' },
      { label: 'Archetype', value: 'The Reluctant Hero' },
      { label: 'World', value: 'Neon Prime' },
      { label: 'Age', value: '28' },
      { label: 'Status', value: 'Active' }
    ],
    quickFacts: [
      { label: 'Occupation', value: 'Memory Courier' },
      { label: 'Affiliation', value: 'The Underground' },
      { label: 'Origin', value: 'Sector 7, Lower City' }
    ],
    tags: ['Cyberpunk', 'Protagonist', 'Memory-Touched', 'Haunted Past']
  },
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      icon: <BookOpen className="w-5 h-5" />,
      content: `Elara Vance is a memory courier operating in the neon-drenched underbelly of 
      Neon Prime. Unlike most couriers who simply transport encrypted neural packages, 
      Elara possesses a rare mutation that allows fragments of the memories she carries 
      to bleed into her own consciousness. This gift—or curse—has made her invaluable 
      to those who need sensitive information moved without digital traces, but has left 
      her haunted by the experiences of strangers.`
    },
    {
      id: 'personality',
      title: 'Personality Matrix',
      icon: <Heart className="w-5 h-5" />,
      content: '',
      subsections: [
        {
          id: 'motivations',
          title: 'Core Motivations',
          content: `Elara is driven by three intertwined desires: to find her missing sister 
          Maya who disappeared three years ago, to expose the MindTech Corporation's 
          illegal memory experiments, and simply to survive in a city that treats people 
          like data to be bought and sold.`
        },
        {
          id: 'flaws',
          title: 'Flaws & Shadows',
          content: `Her greatest weakness is her inability to trust—years of carrying other 
          people's secrets have made her paranoid about her own. She also struggles with 
          distinguishing her own memories from those she's transported, sometimes losing 
          hours to flashbacks of lives she never lived.`
        },
        {
          id: 'fears',
          title: 'Deepest Fears',
          content: `Elara fears losing herself entirely—waking up one day and not knowing 
          which memories are hers. She also harbors a secret terror that she'll discover 
          her sister is already dead, carried in a memory she transported without knowing.`
        }
      ]
    },
    {
      id: 'backstory',
      title: 'Backstory & Origin',
      icon: <Clock className="w-5 h-5" />,
      content: '',
      subsections: [
        {
          id: 'origin',
          title: 'Origin Story',
          content: `Born in Sector 7's lower districts, Elara and her sister Maya grew up 
          in the shadow of the corporate spires. Their parents were mid-level data 
          technicians who died in a "industrial accident"—though Elara has always 
          suspected foul play. The sisters survived by their wits, Maya eventually 
          finding work in MindTech's research division while Elara took to the streets 
          as a courier.`
        },
        {
          id: 'ghost',
          title: 'The Ghost (Core Trauma)',
          content: `Three years ago, Maya sent Elara an encrypted memory package with 
          instructions to never open it, then vanished. Elara broke the seal, but the 
          memory was corrupted—she caught only fragments: a white room, screaming, her 
          sister's face twisted in terror. This incomplete memory haunts her every 
          night, driving her relentless search for the truth.`
        },
        {
          id: 'timeline',
          title: 'Key Life Events',
          content: `
          • 2089 - Born in Sector 7, Lower City
          • 2097 - Parents killed in "accident"
          • 2101 - First job as memory courier
          • 2105 - Maya joins MindTech Corporation
          • 2108 - Maya disappears; corrupted memory received
          • 2111 - Present day; still searching
          `
        }
      ],
      images: [
        {
          url: '/api/placeholder/600/400',
          caption: 'The Vance sisters, age 12 and 15',
          position: 'right'
        }
      ]
    },
    {
      id: 'relationships',
      title: 'Relationship Web',
      icon: <Users className="w-5 h-5" />,
      content: `Elara maintains a careful network of allies and enemies, though she 
      trusts no one completely. Her relationships are transactional by necessity, 
      emotional by accident.`
    },
    {
      id: 'arc',
      title: 'Narrative Arc',
      icon: <Sparkles className="w-5 h-5" />,
      content: '',
      subsections: [
        {
          id: 'arc-type',
          title: 'Arc Type',
          content: `Elara follows a Redemption/Discovery arc. She begins the story as someone 
          who has closed herself off from human connection, using her gift purely for 
          survival. Through her journey, she must learn to trust again and accept that 
          some memories—the painful ones—are worth keeping.`
        },
        {
          id: 'climax',
          title: 'Climax Resolution',
          content: `In the final confrontation, Elara will face a choice: erase all foreign 
          memories and live a clean but hollow life, or embrace the fractured mosaic 
          of her identity—including the truth about her sister—and become something 
          new: neither fully herself nor the sum of those she's carried, but something 
          stronger.`
        }
      ]
    }
  ],
  relatedItems: [
    { id: 'world-001', title: 'Neon Prime', type: 'World', imageUrl: '/api/placeholder/200/200', relationship: 'Home World' },
    { id: 'char-002', title: 'Maya Vance', type: 'Character', imageUrl: '/api/placeholder/200/200', relationship: 'Sister (Missing)' },
    { id: 'faction-001', title: 'The Underground', type: 'Faction', imageUrl: '/api/placeholder/200/200', relationship: 'Ally' },
    { id: 'faction-002', title: 'MindTech Corp', type: 'Faction', imageUrl: '/api/placeholder/200/200', relationship: 'Enemy' }
  ],
  metadata: {
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    version: '2.3'
  }
};

// =============================================================================
// TABLE OF CONTENTS COMPONENT
// =============================================================================

interface TableOfContentsProps {
  sections: ContentSection[];
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  sections, 
  activeSection, 
  onNavigate 
}) => {
  return (
    <nav 
      className="sticky top-24 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.6) 0%, rgba(12, 12, 18, 0.8) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          Contents
        </h3>
      </div>
      <div className="p-2">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              onClick={() => onNavigate(section.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                activeSection === section.id 
                  ? 'bg-[#F97316]/10 text-[#F97316]' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {section.icon && <span className="opacity-60">{section.icon}</span>}
              <span>{section.title}</span>
            </button>
            {section.subsections && (
              <div className="ml-6 border-l border-white/5">
                {section.subsections.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onNavigate(sub.id)}
                    className={`w-full px-3 py-1.5 text-left text-xs transition-all ${
                      activeSection === sub.id 
                        ? 'text-[#F97316]' 
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {sub.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};

// =============================================================================
// INFOBOX COMPONENT (Wikipedia-style sidebar)
// =============================================================================

interface InfoboxProps {
  data: InfoboxData;
  title: string;
  imageUrl: string;
  type: string;
}

const Infobox: React.FC<InfoboxProps> = ({ data, title, imageUrl, type }) => {
  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.8) 0%, rgba(12, 12, 18, 0.9) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      {/* Header */}
      <div 
        className="p-4 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.05) 100%)',
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)'
        }}
      >
        <span className="text-xs font-medium text-[#F97316] uppercase tracking-wider">
          {type}
        </span>
        <h3 className="text-lg font-bold text-white mt-1">{title}</h3>
      </div>

      {/* Thumbnail Image */}
      <div className="relative aspect-square">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(12, 12, 18, 0.8) 0%, transparent 50%)'
          }}
        />
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3">
        {data.stats.map((stat, idx) => (
          <div 
            key={idx}
            className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
          >
            <span className="text-xs text-white/40 uppercase tracking-wide">
              {stat.label}
            </span>
            <span className="text-sm text-white font-medium">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Facts */}
      {data.quickFacts && data.quickFacts.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-xs text-white/40 uppercase tracking-wide mb-2">
            Quick Facts
          </div>
          {data.quickFacts.map((fact, idx) => (
            <div 
              key={idx}
              className="flex justify-between items-center py-1.5 text-xs"
            >
              <span className="text-white/50">{fact.label}</span>
              <span className="text-white/80">{fact.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map((tag, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 text-xs rounded-md"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// CONTENT SECTION COMPONENT
// =============================================================================

interface ContentSectionBlockProps {
  section: ContentSection;
  isFirst?: boolean;
}

const ContentSectionBlock: React.FC<ContentSectionBlockProps> = ({ section, isFirst }) => {
  const [isExpanded, setIsExpanded] = useState(!section.collapsed);

  return (
    <section 
      id={section.id}
      className={`scroll-mt-24 ${!isFirst ? 'pt-8 border-t border-white/5' : ''}`}
    >
      {/* Section Header */}
      <div 
        className="flex items-center gap-3 mb-4 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {section.icon && (
          <div 
            className="p-2 rounded-xl"
            style={{
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.2)'
            }}
          >
            <span className="text-[#F97316]">{section.icon}</span>
          </div>
        )}
        <h2 className="text-xl font-bold text-white tracking-tight flex-1">
          {section.title}
        </h2>
        <ChevronDown 
          className={`w-5 h-5 text-white/30 transition-transform duration-300 ${
            isExpanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </div>

      {/* Section Content */}
      <div className={`transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        {/* Main Content */}
        {section.content && (
          <div className="prose prose-invert max-w-none">
            <p className="text-white/70 leading-relaxed whitespace-pre-line">
              {section.content}
            </p>
          </div>
        )}

        {/* Subsections */}
        {section.subsections && section.subsections.length > 0 && (
          <div className="space-y-6 mt-6">
            {section.subsections.map((sub) => (
              <div 
                key={sub.id}
                id={sub.id}
                className="scroll-mt-24 pl-4 border-l-2 border-white/10"
              >
                <h3 className="text-base font-semibold text-white/90 mb-2">
                  {sub.title}
                </h3>
                <div className="text-sm text-white/60 leading-relaxed whitespace-pre-line">
                  {sub.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section Images */}
        {section.images && section.images.length > 0 && (
          <div className="mt-6 space-y-4">
            {section.images.map((img, idx) => (
              <figure 
                key={idx}
                className={`rounded-xl overflow-hidden ${
                  img.position === 'right' ? 'float-right ml-6 w-64' :
                  img.position === 'left' ? 'float-left mr-6 w-64' :
                  'w-full'
                }`}
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <img 
                  src={img.url}
                  alt={img.caption || ''}
                  className="w-full h-auto"
                />
                {img.caption && (
                  <figcaption className="px-3 py-2 text-xs text-white/40 bg-black/30">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// =============================================================================
// RELATED ITEMS COMPONENT
// =============================================================================

interface RelatedItemsProps {
  items: RelatedItem[];
  onItemClick: (id: string) => void;
}

const RelatedItems: React.FC<RelatedItemsProps> = ({ items, onItemClick }) => {
  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.6) 0%, rgba(12, 12, 18, 0.8) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Related
        </h3>
      </div>
      <div className="p-3 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group"
          >
            <img 
              src={item.imageUrl}
              alt={item.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-white group-hover:text-[#F97316] transition-colors">
                {item.title}
              </div>
              <div className="text-xs text-white/40">
                {item.relationship || item.type}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#F97316] transition-all group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// HERO IMAGE CHANGE MODAL
// =============================================================================

interface HeroImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  onGenerate: () => void;
  currentSource: 'preset' | 'uploaded' | 'generated';
}

const HeroImageModal: React.FC<HeroImageModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onGenerate,
  currentSource
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative w-full max-w-md mx-4 p-6 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(12, 12, 18, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Change Hero Image</h3>
        
        <div className="space-y-3">
          <button
            onClick={onUpload}
            className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div className="p-3 rounded-xl bg-[#14B8A6]/10">
              <Upload className="w-5 h-5 text-[#14B8A6]" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">Upload Image</div>
              <div className="text-xs text-white/40">Use your own image file</div>
            </div>
          </button>

          <button
            onClick={onGenerate}
            className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div className="p-3 rounded-xl bg-[#F97316]/10">
              <Wand2 className="w-5 h-5 text-[#F97316]" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">Generate with AI</div>
              <div className="text-xs text-white/40">Create a new image from description</div>
            </div>
          </button>
        </div>

        <div className="mt-4 text-xs text-white/30 text-center">
          Current source: <span className="text-white/50 capitalize">{currentSource}</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN DETAIL PAGE COMPONENT
// =============================================================================

interface DetailPageTemplateProps {
  item?: DetailItem;
  onBack: () => void;
  onNavigateToRelated: (id: string) => void;
  onEdit?: () => void;
}

/**
 * DetailPageTemplate
 * 
 * A wiki-style detail page with cinematic hero section and structured content.
 * 
 * TODO for Antigravity:
 * 1. Wire up actual data fetching to replace PLACEHOLDER_CHARACTER
 * 2. Implement hero image upload flow:
 *    - Open file picker
 *    - Upload to storage
 *    - Update item.heroImage.url
 *    - Set item.heroImage.source = 'uploaded'
 * 3. Implement hero image generation:
 *    - Open ImageGeneratorModal (reuse from WelcomeGalleryTemplate)
 *    - Call generation API
 *    - Update item.heroImage.url with result
 *    - Set item.heroImage.source = 'generated'
 * 4. Hero image should sync with Welcome Gallery:
 *    - When changed here, update the gallery card
 *    - When changed in gallery, update here on load
 * 5. Add edit mode for sections (inline editing)
 * 6. Add "Chat with Character" functionality
 * 7. Add audio/ambient playback option
 * 8. Implement scroll spy for table of contents highlighting
 */
export const DetailPageTemplate: React.FC<DetailPageTemplateProps> = ({
  item = PLACEHOLDER_CHARACTER,
  onBack,
  onNavigateToRelated,
  onEdit
}) => {
  const [activeSection, setActiveSection] = useState(item.sections[0]?.id || '');
  const [heroImageModalOpen, setHeroImageModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHeroUpload = () => {
    // TODO: Antigravity - Implement file upload
    console.log('Upload hero image');
    setHeroImageModalOpen(false);
  };

  const handleHeroGenerate = () => {
    // TODO: Antigravity - Open image generator modal
    console.log('Generate hero image');
    setHeroImageModalOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#08080c' }}>
      {/* Sticky Navigation Bar (appears on scroll) */}
      <div 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{
          background: 'rgba(8, 8, 12, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </button>
            <h2 className="text-lg font-semibold text-white">{item.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/5 transition-all">
              <Bookmark className="w-5 h-5 text-white/60" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/5 transition-all">
              <Share2 className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      </div>

      {/* HERO SECTION - Cinematic Editorial Style */}
      <div ref={heroRef} className="relative h-[70vh] min-h-[500px] max-h-[800px]">
        {/* Hero Image */}
        <div className="absolute inset-0">
          <img
            src={item.heroImage.url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlays */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, 
                rgba(8, 8, 12, 0.3) 0%, 
                rgba(8, 8, 12, 0.1) 40%,
                rgba(8, 8, 12, 0.6) 70%,
                rgba(8, 8, 12, 1) 100%)`
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, rgba(8, 8, 12, 0.8) 0%, transparent 50%)'
            }}
          />
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md transition-all hover:bg-white/10"
            style={{
              background: 'rgba(8, 8, 12, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/70">Back</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
          <button
            onClick={() => setHeroImageModalOpen(true)}
            className="p-2.5 rounded-xl backdrop-blur-md transition-all hover:bg-white/10"
            style={{
              background: 'rgba(8, 8, 12, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            title="Change hero image"
          >
            <ImageIcon className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={onEdit}
            className="p-2.5 rounded-xl backdrop-blur-md transition-all hover:bg-white/10"
            style={{
              background: 'rgba(8, 8, 12, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            title="Edit"
          >
            <Edit3 className="w-4 h-4 text-white/70" />
          </button>
          <button
            className="p-2.5 rounded-xl backdrop-blur-md transition-all hover:bg-white/10"
            style={{
              background: 'rgba(8, 8, 12, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Share2 className="w-4 h-4 text-white/70" />
          </button>
          <button
            className="p-2.5 rounded-xl backdrop-blur-md transition-all hover:bg-white/10"
            style={{
              background: 'rgba(8, 8, 12, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <MoreHorizontal className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16">
          <div className="max-w-4xl">
            {/* Type Badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{
                background: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.3)'
              }}
            >
              <span className="text-xs font-medium text-[#F97316] uppercase tracking-wider">
                {item.type}
              </span>
            </div>

            {/* Title */}
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
              style={{ 
                textShadow: '0 4px 30px rgba(0,0,0,0.5)',
                letterSpacing: '-0.02em'
              }}
            >
              {item.title}
            </h1>

            {/* Subtitle */}
            {item.subtitle && (
              <p className="text-lg md:text-xl text-white/60 mb-4 font-light">
                {item.subtitle}
              </p>
            )}

            {/* Tagline */}
            {item.tagline && (
              <p 
                className="text-base md:text-lg text-white/80 italic max-w-2xl"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                "{item.tagline}"
              </p>
            )}

            {/* Image Source Indicator */}
            <div className="flex items-center gap-2 mt-6 text-xs text-white/30">
              {item.heroImage.source === 'generated' && (
                <>
                  <Sparkles className="w-3 h-3 text-[#F97316]" />
                  <span>AI Generated</span>
                </>
              )}
              {item.heroImage.source === 'uploaded' && (
                <>
                  <Upload className="w-3 h-3 text-[#14B8A6]" />
                  <span>Custom Upload</span>
                </>
              )}
              {item.heroImage.source === 'preset' && (
                <>
                  <ImageIcon className="w-3 h-3" />
                  <span>Placeholder Image</span>
                </>
              )}
              {item.heroImage.caption && (
                <span className="ml-2 text-white/20">• {item.heroImage.caption}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WIKI CONTENT SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Table of Contents (desktop) */}
          <aside className="hidden lg:block lg:col-span-2">
            <TableOfContents
              sections={item.sections}
              activeSection={activeSection}
              onNavigate={navigateToSection}
            />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-7">
            <div className="space-y-8">
              {item.sections.map((section, idx) => (
                <ContentSectionBlock
                  key={section.id}
                  section={section}
                  isFirst={idx === 0}
                />
              ))}
            </div>

            {/* Metadata Footer */}
            {item.metadata && (
              <div 
                className="mt-12 pt-6 border-t border-white/5 flex flex-wrap gap-6 text-xs text-white/30"
              >
                {item.metadata.createdAt && (
                  <span>Created: {item.metadata.createdAt}</span>
                )}
                {item.metadata.updatedAt && (
                  <span>Updated: {item.metadata.updatedAt}</span>
                )}
                {item.metadata.version && (
                  <span>Version: {item.metadata.version}</span>
                )}
              </div>
            )}
          </main>

          {/* Right Sidebar - Infobox & Related */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Infobox */}
            <Infobox
              data={item.infobox}
              title={item.title}
              imageUrl={item.heroImage.url}
              type={item.type}
            />

            {/* Related Items */}
            {item.relatedItems && item.relatedItems.length > 0 && (
              <RelatedItems
                items={item.relatedItems}
                onItemClick={onNavigateToRelated}
              />
            )}

            {/* Chat with Character Button */}
            {item.type === 'character' && (
              <button
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-sm font-medium text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)'
                }}
              >
                <MessageSquare className="w-4 h-4" />
                Chat with {item.title.split(' ')[0]}
              </button>
            )}

            {/* API Key Notice for Images */}
            <div 
              className="p-4 rounded-xl text-xs"
              style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}
            >
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                <div className="text-white/50">
                  <p className="font-medium text-white/70 mb-1">Image Generation</p>
                  <p>Configure image AI providers in <a href="/settings" className="text-[#F97316] hover:underline">Settings</a> for enhanced visuals.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Hero Image Change Modal */}
      <HeroImageModal
        isOpen={heroImageModalOpen}
        onClose={() => setHeroImageModalOpen(false)}
        onUpload={handleHeroUpload}
        onGenerate={handleHeroGenerate}
        currentSource={item.heroImage.source}
      />
    </div>
  );
};

export default DetailPageTemplate;

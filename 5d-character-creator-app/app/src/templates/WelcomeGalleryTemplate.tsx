'use client';

import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Sparkles,
  Settings,
  Image as ImageIcon,
  ChevronRight,
  Wand2,
  Globe,
  Users,
  Crown,
  Swords,
  Heart,
  Star,
  Info,
  ExternalLink,
} from 'lucide-react';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface GalleryItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  imageSource: 'preset' | 'uploaded' | 'generated';
  category: string;
  tags?: string[];
  metadata?: Record<string, string>;
  size: 'small' | 'medium' | 'large' | 'wide' | 'tall';
}

interface ImageGeneratorConfig {
  provider: 'free' | 'gemini' | 'dalle';
  apiKeyConfigured: boolean;
}

// =============================================================================
// PLACEHOLDER DATA
// =============================================================================

const PLACEHOLDER_ITEMS: GalleryItem[] = [
  {
    id: 'char-001',
    title: 'Elara Vance',
    subtitle: 'The Reluctant Hero',
    description: 'A memory courier haunted by fragments of lives not her own.',
    imageUrl: '/api/placeholder/600/800',
    imageSource: 'preset',
    category: 'character',
    tags: ['Protagonist', 'Cyberpunk'],
    size: 'tall',
  },
  {
    id: 'world-001',
    title: 'Neon Prime',
    subtitle: 'Cyberpunk Megalopolis',
    description: 'A sprawling mega-city ruled by AI corporations.',
    imageUrl: '/api/placeholder/800/400',
    imageSource: 'preset',
    category: 'world',
    tags: ['Sci-Fi', 'Urban'],
    size: 'wide',
  },
  {
    id: 'char-002',
    title: 'Kaelen Thorne',
    subtitle: 'The Tragic Villain',
    description: 'A fallen paladin seeking redemption through chaos.',
    imageUrl: '/api/placeholder/400/400',
    imageSource: 'preset',
    category: 'character',
    tags: ['Antagonist', 'Fantasy'],
    size: 'medium',
  },
  {
    id: 'world-002',
    title: 'Virelith',
    subtitle: 'Dark Fantasy Realm',
    description: 'Shattered islands floating in eternal twilight.',
    imageUrl: '/api/placeholder/400/400',
    imageSource: 'preset',
    category: 'world',
    tags: ['Fantasy', 'Dark'],
    size: 'medium',
  },
  {
    id: 'char-003',
    title: 'The Oracle',
    subtitle: 'Mysterious Guide',
    description: 'Speaks in riddles, sees all timelines.',
    imageUrl: '/api/placeholder/300/300',
    imageSource: 'preset',
    category: 'character',
    tags: ['Supporting', 'Mystical'],
    size: 'small',
  },
  {
    id: 'faction-001',
    title: 'The Obsidian Court',
    subtitle: 'Ancient Power',
    description: 'Keepers of forbidden knowledge.',
    imageUrl: '/api/placeholder/300/300',
    imageSource: 'preset',
    category: 'faction',
    tags: ['Faction', 'Political'],
    size: 'small',
  },
];

// =============================================================================
// IMAGE GENERATION MODAL COMPONENT
// =============================================================================

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, provider: string) => void;
  currentProvider: ImageGeneratorConfig;
}

const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  currentProvider,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] =
    useState<'free' | 'gemini' | 'dalle'>('free');

  if (!isOpen) return null;

  const providers = [
    {
      id: 'free' as const,
      name: 'Free Generator',
      description: 'No API key required',
      available: true,
      icon: Sparkles,
    },
    {
      id: 'gemini' as const,
      name: 'Google Gemini',
      description: currentProvider.apiKeyConfigured
        ? 'API key configured'
        : 'Requires API key',
      available: currentProvider.apiKeyConfigured,
      icon: Globe,
    },
    {
      id: 'dalle' as const,
      name: 'DALL-E',
      description: currentProvider.apiKeyConfigured
        ? 'API key configured'
        : 'Requires API key',
      available: currentProvider.apiKeyConfigured,
      icon: Wand2,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(12, 12, 18, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 60px rgba(249, 115, 22, 0.1)',
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C]">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">
                Generate Image
              </h2>
              <p className="text-sm text-white/50">Describe your vision</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Image Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A weathered warrior standing in a field of crimson flowers, dramatic lighting, cinematic composition..."
              className="w-full h-32 px-4 py-3 rounded-xl text-white placeholder:text-white/30 resize-none transition-all duration-300"
              style={{
                background: 'rgba(12, 12, 18, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                e.target.style.boxShadow =
                  '0 0 20px rgba(249, 115, 22, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">
              Image Generator
            </label>
            <div className="grid grid-cols-3 gap-3">
              {providers.map((provider) => {
                const Icon = provider.icon;
                const isSelected = selectedProvider === provider.id;
                const isDisabled = !provider.available && provider.id !== 'free';

                return (
                  <button
                    key={provider.id}
                    onClick={() => !isDisabled && setSelectedProvider(provider.id)}
                    disabled={isDisabled}
                    className={`relative p-4 rounded-xl text-left transition-all duration-300 ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%)'
                        : 'rgba(12, 12, 18, 0.6)',
                      border: `1px solid ${
                        isSelected
                          ? 'rgba(249, 115, 22, 0.4)'
                          : 'rgba(255, 255, 255, 0.06)'
                      }`,
                      boxShadow: isSelected
                        ? '0 0 20px rgba(249, 115, 22, 0.1)'
                        : 'none',
                    }}
                  >
                    <Icon
                      className={`w-5 h-5 mb-2 ${
                        isSelected ? 'text-[#F97316]' : 'text-white/50'
                      }`}
                    />
                    <div className="text-sm font-medium text-white">
                      {provider.name}
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      {provider.description}
                    </div>

                    {isDisabled && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                        <a
                          href="/settings"
                          className="text-xs text-[#F97316] hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Add API Key <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Notice */}
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <Info className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
            <div className="text-sm text-white/60">
              <p className="font-medium text-white/80 mb-1">
                Image Generation API Keys
              </p>
              <p>
                The free generator works without any setup. For higher quality
                results, configure Gemini or DALL-E API keys in{' '}
                <a
                  href="/settings"
                  className="text-[#F97316] hover:underline"
                >
                  Settings → Image Generation
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(prompt, selectedProvider)}
            disabled={!prompt.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
            }}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Generate
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// GALLERY CARD COMPONENT
// =============================================================================

interface GalleryCardProps {
  item: GalleryItem;
  onClick: () => void;
  onImageChange: (itemId: string, action: 'upload' | 'generate') => void;
}

const GalleryCard: React.FC<GalleryCardProps> = ({
  item,
  onClick,
  onImageChange,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Size configurations for bento grid
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 row-span-1 md:col-span-1 md:row-span-1',
    large: 'col-span-2 row-span-2',
    wide: 'col-span-2 row-span-1',
    tall: 'col-span-1 row-span-2',
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    character: <Users className="w-3.5 h-3.5" />,
    world: <Globe className="w-3.5 h-3.5" />,
    faction: <Crown className="w-3.5 h-3.5" />,
    conflict: <Swords className="w-3.5 h-3.5" />,
    relationship: <Heart className="w-3.5 h-3.5" />,
  };

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${sizeClasses[item.size]}`}
      style={{
        background:
          'linear-gradient(135deg, rgba(20, 20, 28, 0.8) 0%, rgba(12, 12, 18, 0.9) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        minHeight:
          item.size === 'tall'
            ? '400px'
            : item.size === 'small'
            ? '180px'
            : '200px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="absolute inset-0">
        {/* Placeholder/Loading State */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c12] to-[#08080c] flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-white/10" />
          </div>
        )}

        {/* Actual Image */}
        <img
          src={item.imageUrl}
          alt={item.title}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${isHovered ? 'scale-105' : 'scale-100'}`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Gradient Overlays */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: `linear-gradient(to top, 
              rgba(8, 8, 12, 0.95) 0%, 
              rgba(8, 8, 12, 0.6) 30%, 
              rgba(8, 8, 12, 0.2) 60%,
              transparent 100%)`,
          }}
        />

        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background:
              'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-4 md:p-5">
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md"
            style={{
              background: 'rgba(12, 12, 18, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {categoryIcons[item.category]}
            <span className="capitalize">{item.category}</span>
          </div>
        </div>

        {/* Image Source Indicator */}
        <div className="absolute top-3 right-3">
          <div
            className="p-1.5 rounded-full backdrop-blur-md"
            style={{
              background: 'rgba(12, 12, 18, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            title={`Image: ${item.imageSource}`}
          >
            {item.imageSource === 'generated' && (
              <Sparkles className="w-3 h-3 text-[#F97316]" />
            )}
            {item.imageSource === 'uploaded' && (
              <Upload className="w-3 h-3 text-[#14B8A6]" />
            )}
            {item.imageSource === 'preset' && (
              <ImageIcon className="w-3 h-3 text-white/50" />
            )}
          </div>
        </div>

        {/* Image Action Buttons (on hover) */}
        <div
          className={`absolute top-12 right-3 flex flex-col gap-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onImageChange(item.id, 'upload')}
            className="p-2 rounded-lg backdrop-blur-md transition-all hover:scale-110"
            style={{
              background: 'rgba(20, 184, 166, 0.2)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
            }}
            title="Upload new image"
          >
            <Upload className="w-3.5 h-3.5 text-[#14B8A6]" />
          </button>
          <button
            onClick={() => onImageChange(item.id, 'generate')}
            className="p-2 rounded-lg backdrop-blur-md transition-all hover:scale-110"
            style={{
              background: 'rgba(249, 115, 22, 0.2)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
            }}
            title="Generate with AI"
          >
            <Wand2 className="w-3.5 h-3.5 text-[#F97316]" />
          </button>
        </div>

        {/* Title & Info */}
        <div className="space-y-1">
          {item.subtitle && (
            <p className="text-xs font-medium text-[#F97316] tracking-wide uppercase">
              {item.subtitle}
            </p>
          )}
          <h3 className="text-lg md:text-xl font-semibold text-white tracking-tight leading-tight">
            {item.title}
          </h3>
          {item.description && item.size !== 'small' && (
            <p className="text-sm text-white/50 line-clamp-2 mt-1">
              {item.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && item.size !== 'small' && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs rounded-md"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* View Arrow (on hover) */}
        <div
          className={`absolute bottom-4 right-4 p-2 rounded-full transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
          }`}
          style={{
            background:
              'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)',
          }}
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN WELCOME GALLERY COMPONENT
// =============================================================================

interface WelcomeGalleryProps {
  items?: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
  onCreateNew: (type: 'character' | 'world') => void;
  pageType: 'characters' | 'worlds' | 'mixed';
}

/**
 * WelcomeGalleryTemplate
 *
 * A bento-box masonry layout for displaying characters, worlds, and other creative entities.
 */
export const WelcomeGalleryTemplate: React.FC<WelcomeGalleryProps> = ({
  items = PLACEHOLDER_ITEMS,
  onItemClick,
  onCreateNew,
  pageType,
}) => {
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
  const [selectedItemForImage, setSelectedItemForImage] =
    useState<string | null>(null);

  // Placeholder config; wire to real settings later
  const [imageGeneratorConfig] = useState<ImageGeneratorConfig>({
    provider: 'free',
    apiKeyConfigured: false,
  });

  const handleImageChange = (itemId: string, action: 'upload' | 'generate') => {
    setSelectedItemForImage(itemId);

    if (action === 'upload') {
      console.log('Upload image for item:', itemId);
    } else {
      setGeneratorModalOpen(true);
    }
  };

  const handleGenerate = (prompt: string, provider: string) => {
    console.log('Generate image:', { prompt, provider, itemId: selectedItemForImage });
    setGeneratorModalOpen(false);
  };

  // Filter items based on page type
  const filteredItems =
    pageType === 'mixed'
      ? items
      : items.filter((item) =>
          pageType === 'characters'
            ? item.category === 'character'
            : item.category === 'world',
        );

  return (
    <div className="min-h-screen" style={{ background: '#08080c' }}>
      {/* Header Section */}
      <div className="px-6 py-8 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {pageType === 'characters' && 'Your Characters'}
                {pageType === 'worlds' && 'Your Worlds'}
                {pageType === 'mixed' && 'Creative Universe'}
              </h1>
              <p className="text-white/50 mt-2 text-sm md:text-base">
                {pageType === 'characters' && 'Explore your cast of characters'}
                {pageType === 'worlds' && 'Discover your created realms'}
                {pageType === 'mixed' &&
                  'Characters, worlds, and everything in between'}
              </p>
            </div>

            {/* Settings Link for API Keys */}
            <a
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Image Settings</span>
            </a>
          </div>

          {/* Filter Pills (Optional) */}
          {pageType === 'mixed' && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['All', 'Characters', 'Worlds', 'Factions', 'Locations'].map(
                (filter) => (
                  <button
                    key={filter}
                    className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                    style={{
                      background:
                        filter === 'All'
                          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)'
                          : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${
                        filter === 'All'
                          ? 'rgba(249, 115, 22, 0.3)'
                          : 'rgba(255, 255, 255, 0.06)'
                      }`,
                      color:
                        filter === 'All'
                          ? '#F97316'
                          : 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    {filter}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bento Grid Gallery */}
      <div className="px-6 pb-12 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 auto-rows-[minmax(180px,auto)]">
            {/* Create New Card */}
            <CreateNewCard
              type={pageType === 'worlds' ? 'world' : 'character'}
              onClick={() =>
                onCreateNew(pageType === 'worlds' ? 'world' : 'character')
              }
            />

            {/* Gallery Items */}
            {filteredItems.map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                onImageChange={handleImageChange}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div
            className="p-6 rounded-2xl mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Star className="w-12 h-12 text-white/10" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No items yet
          </h3>
          <p className="text-white/40 text-center max-w-md mb-6">
            Start building your creative universe by creating your first{' '}
            {pageType === 'worlds' ? 'world' : 'character'}.
          </p>
          <button
            onClick={() =>
              onCreateNew(pageType === 'worlds' ? 'world' : 'character')
            }
            className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
            }}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create {pageType === 'worlds' ? 'World' : 'Character'}
            </span>
          </button>
        </div>
      )}

      {/* Image Generator Modal */}
      <ImageGeneratorModal
        isOpen={generatorModalOpen}
        onClose={() => setGeneratorModalOpen(false)}
        onGenerate={handleGenerate}
        currentProvider={imageGeneratorConfig}
      />
    </div>
  );
};

export default WelcomeGalleryTemplate;


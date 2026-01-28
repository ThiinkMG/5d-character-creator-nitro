'use client';

import React from 'react';
import { WelcomeGalleryTemplate } from '@/templates/WelcomeGalleryTemplate';

/**
 * Preview page for WelcomeGalleryTemplate
 * 
 * This page allows you to preview the WelcomeGalleryTemplate component
 * standalone with mock data.
 */
export default function WelcomeGalleryPreviewPage() {
  const handleItemClick = (item: any) => {
    console.log('Item clicked:', item);
    alert(`Clicked: ${item.title}`);
  };

  const handleCreateNew = (type: 'character' | 'world') => {
    console.log('Create new:', type);
    alert(`Create new ${type}`);
  };

  return (
    <WelcomeGalleryTemplate
      items={undefined} // Uses PLACEHOLDER_ITEMS from the component
      onItemClick={handleItemClick}
      onCreateNew={handleCreateNew}
      pageType="mixed" // Can be 'characters', 'worlds', or 'mixed'
    />
  );
}

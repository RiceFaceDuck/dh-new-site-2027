import React, { useState } from 'react';
import StoreProfileDetails from './StoreProfileDetails';
import StoreContactChannels from './StoreContactChannels';
import StoreLocationCard from './StoreLocationCard';
import StoreCertifications from './StoreCertifications';
import PartnerReviews from './PartnerReviews';
import GalleryLightbox from './GalleryLightbox';

const StoreProfileInfo = ({ partner, currentUser }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(null);

  if (!partner) return null;

  return (
    <>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* 1. Service Details & Gallery Preview */}
        <div className="md:col-span-2">
          <StoreProfileDetails
            partner={partner}
            onOpenLightbox={(idx) => setActiveImageIndex(idx)}
          />
        </div>

        {/* 2. Contact, Location & Certifications (Middle on Mobile, Right Column on Desktop) */}
        <div className="space-y-6 md:col-start-3 md:row-start-1 md:row-span-2 self-start">
          <StoreContactChannels partner={partner} />
          <StoreLocationCard partner={partner} />
          <StoreCertifications partner={partner} />
        </div>

        {/* 3. Reviews & Ratings Section (Bottom on Mobile, Left Column Row 2 on Desktop) */}
        <div className="md:col-span-2 md:col-start-1 md:row-start-2 self-start">
          <PartnerReviews
            partnerId={partner.id}
            ownerId={partner.ownerId}
            currentUser={currentUser}
          />
        </div>
      </div>

      {/* Full Screen Lightbox Modal */}
      {activeImageIndex !== null && (
        <GalleryLightbox
          images={partner.galleryImages || []}
          initialIndex={activeImageIndex}
          onClose={() => setActiveImageIndex(null)}
        />
      )}
    </>
  );
};

export default React.memo(StoreProfileInfo);

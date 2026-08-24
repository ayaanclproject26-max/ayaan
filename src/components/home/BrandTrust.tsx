'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Certificate {
  id: string;
  title: string;
  imageUrl: string;
}

const certificates: Certificate[] = [
  {
    id: 'cert-1',
    title: 'BGMEA Associate Membership',
    imageUrl: '/certificates/cert-bgmea.webp'
  },
  {
    id: 'cert-2',
    title: 'VAT Registration Certificate',
    imageUrl: '/certificates/cert-vat.webp'
  },
  {
    id: 'cert-3',
    title: 'Taxpayer Identification Certificate',
    imageUrl: '/certificates/cert-tin.png'
  },
  {
    id: 'cert-4',
    title: 'ISO 9001:2015 Certification',
    imageUrl: '/certificates/cert-iso.webp'
  }
];

export default function BrandTrust() {
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const openLightbox = (cert: Certificate) => {
    setSelectedCert(cert);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedCert(null);
    document.body.style.overflow = '';
  };

  return (
    <section id="brand-trust" className="py-10 sm:py-12 bg-[#f8f6f0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 md:mb-8">
          <h2 className="text-fluid-h2 font-display font-semibold text-foreground mb-2 tracking-tight">Compliance & certifications</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Verified registrations and quality certifications. Tap any document to view it in full.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {certificates.map((cert) => (
            <div 
              key={cert.id} 
              className="group flex flex-col bg-background cursor-pointer rounded-xl border border-border/60 p-3.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              onClick={() => openLightbox(cert)}
            >
              <div className="relative aspect-[3/4] w-full rounded-lg border border-border/40 overflow-hidden bg-white mb-3 flex items-center justify-center p-2">
                <img 
                  src={cert.imageUrl} 
                  alt={cert.title} 
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <h3 className="text-sm font-medium text-foreground px-0.5 pb-0.5 line-clamp-2">{cert.title}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedCert && (
        <div className="fixed inset-0 bg-ink/85 z-[9999] flex items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-in fade-in duration-300" onClick={closeLightbox}>
          <div className="bg-background w-full max-w-2xl relative flex flex-col rounded-xl overflow-hidden max-h-[95vh] shadow-2xl animate-in zoom-in-95 duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-3 right-3 bg-background/90 text-foreground w-9 h-9 rounded-full flex items-center justify-center cursor-pointer z-10 transition-transform duration-200 hover:scale-105 hover:bg-background shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
              onClick={closeLightbox}
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>
            <div className="w-full bg-secondary flex items-center justify-center overflow-hidden p-4 sm:p-6">
              <img 
                src={selectedCert.imageUrl} 
                alt={selectedCert.title} 
                className="max-w-full max-h-[75vh] object-contain shadow-sm border border-border/20 bg-white"
              />
            </div>
            <div className="p-4 text-center bg-background border-t border-border/20">
              <h3 className="text-lg font-display font-medium">{selectedCert.title}</h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

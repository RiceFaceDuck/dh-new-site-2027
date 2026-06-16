import React from 'react';
import { Youtube } from 'lucide-react';

export default function ProductVideoSection({ videoId }) {
  if (!videoId) return null;

  return (
    <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-lg group hover:shadow-xl transition-all duration-300">
      <div className="bg-slate-800/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Youtube className="text-red-500 w-5 h-5 animate-pulse" />
          <span className="text-white text-sm font-bold tracking-wide">Product Video Review</span>
        </div>
      </div>
      <div className="relative w-full aspect-video bg-black">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}

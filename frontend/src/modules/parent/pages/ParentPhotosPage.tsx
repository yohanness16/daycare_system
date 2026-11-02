import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  dateGroup: string;
  time: string;
  activity: string;
}

const MOCK_PHOTOS: PhotoItem[] = [
  {
    id: 'ph-1',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
    caption: 'Building tall block towers with teammates',
    dateGroup: 'Today',
    time: '10:45 AM',
    activity: 'STEM Block Free Play',
  },
  {
    id: 'ph-2',
    url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80',
    caption: 'Watering mint plants in the sensory garden',
    dateGroup: 'Today',
    time: '02:15 PM',
    activity: 'Outdoor Nature Walk',
  },
  {
    id: 'ph-3',
    url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80',
    caption: 'Finger painting colorful autumn leaves',
    dateGroup: 'Yesterday',
    time: '11:10 AM',
    activity: 'Creative Art Studio',
  },
  {
    id: 'ph-4',
    url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1200&q=80',
    caption: 'Music time with hand percussion instruments',
    dateGroup: 'Oct 7, 2026',
    time: '09:40 AM',
    activity: 'Music & Movement Circle',
  },
];

export const ParentPhotosPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  // Group photos by date
  const groups = MOCK_PHOTOS.reduce((acc, p) => {
    if (!acc[p.dateGroup]) acc[p.dateGroup] = [];
    acc[p.dateGroup].push(p);
    return acc;
  }, {} as Record<string, PhotoItem[]>);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={id ? `/parent/children/${id}` : '/parent'}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Photos & Moments
            </h1>
            <p className="text-xs text-slate-500">Shared classroom moments from activities</p>
          </div>
        </div>

        <Link
          to="/parent/consents"
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          Photo Consents →
        </Link>
      </div>

      {Object.entries(groups).map(([groupTitle, photos]) => (
        <div key={groupTitle} className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {groupTitle}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 cursor-pointer shadow-2xs hover:shadow-md transition-all"
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white text-xs">
                  <span className="font-bold line-clamp-1">{photo.caption}</span>
                  <span className="text-[10px] opacity-80">{photo.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="w-full h-80 sm:h-96 bg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="p-5 text-white space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {selectedPhoto.dateGroup} at {selectedPhoto.time}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                  {selectedPhoto.activity}
                </span>
              </div>
              <h4 className="font-bold text-sm sm:text-base leading-snug">
                {selectedPhoto.caption}
              </h4>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => alert('Photo saved to your photo roll.')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

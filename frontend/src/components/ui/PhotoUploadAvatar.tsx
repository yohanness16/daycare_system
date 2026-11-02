import React, { useRef, useState } from 'react';
import { mediaApi } from '../../core/api/mediaApi';

interface PhotoUploadAvatarProps {
  currentPhotoUrl?: string | null;
  name: string;
  id?: string;
  size?: 'md' | 'lg' | 'xl';
  editable?: boolean;
  onPhotoUploaded: (newPhotoUrl: string) => Promise<void> | void;
  className?: string;
}

const SIZE_STYLES = {
  md: {
    container: 'w-16 h-16',
    initials: 'text-lg',
    badge: 'w-6 h-6 -bottom-1 -right-1',
    iconSize: 'text-[14px]',
  },
  lg: {
    container: 'w-24 h-24',
    initials: 'text-2xl',
    badge: 'w-8 h-8 -bottom-1 -right-1',
    iconSize: 'text-[18px]',
  },
  xl: {
    container: 'w-32 h-32',
    initials: 'text-4xl',
    badge: 'w-10 h-10 bottom-0 right-0',
    iconSize: 'text-[22px]',
  },
};

export const PhotoUploadAvatar: React.FC<PhotoUploadAvatarProps> = ({
  currentPhotoUrl,
  name,
  id: _id,
  size = 'lg',
  editable = true,
  onPhotoUploaded,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const style = SIZE_STYLES[size];

  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleClick = () => {
    if (!editable || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (.jpg, .png, .webp)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Image size exceeds maximum limit of 25MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await mediaApi.uploadFile(file);
      await onPhotoUploaded(res.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`relative inline-block select-none ${className}`}>
      <div
        onClick={handleClick}
        className={`group relative ${style.container} rounded-3xl overflow-hidden shadow-sm border-2 border-surface-container bg-surface-container-low transition-all ${
          editable ? 'cursor-pointer hover:border-primary hover:shadow-md' : ''
        }`}
        title={editable ? `Click to change photo for ${name}` : name}
      >
        {currentPhotoUrl ? (
          <img
            src={currentPhotoUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary text-on-primary font-bold tracking-tight">
            <span className={style.initials}>{getInitials(name)}</span>
          </div>
        )}

        {/* Hover / Uploading Overlay */}
        {editable && (
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-opacity ${
              isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isUploading ? (
              <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Change</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Badge */}
      {editable && !isUploading && (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Upload photo"
          className={`absolute ${style.badge} rounded-full bg-primary hover:bg-primary-hover text-on-primary shadow-md flex items-center justify-center ring-2 ring-surface transition-transform hover:scale-110 cursor-pointer`}
        >
          <span className={`material-symbols-outlined ${style.iconSize}`}>photo_camera</span>
        </button>
      )}

      {/* Hidden File Input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* Error Tooltip */}
      {uploadError && (
        <div className="absolute top-full left-0 mt-1 z-30 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold shadow-lg whitespace-nowrap animate-in fade-in">
          {uploadError}
        </div>
      )}
    </div>
  );
};

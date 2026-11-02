import React, { useState } from 'react';

interface PickupPassModalProps {
  childName: string;
  classroomName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PickupPassModal: React.FC<PickupPassModalProps> = ({
  childName,
  classroomName,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const pinCode = '8492'; // Deterministic or daily dynamic PIN

  if (!isOpen) return null;

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 border border-[#E3DCCE] dark:border-slate-700 p-6 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Security Badge */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#3A7D5C]/10 text-[#3A7D5C] dark:text-emerald-400 flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[32px]">shield_person</span>
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Digital Pickup Pass
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Present at center kiosk or show to educator for <span className="font-bold text-slate-800 dark:text-slate-200">{childName}</span> ({classroomName})
        </p>

        {/* 4-digit PIN Box */}
        <div className="my-5 p-4 rounded-2xl bg-[#FDFBF7] dark:bg-slate-900/60 border border-[#E3DCCE] dark:border-slate-700">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
            Today&apos;s Security PIN
          </span>
          <div className="flex items-center justify-center gap-2">
            {pinCode.split('').map((digit, i) => (
              <span
                key={i}
                className="w-11 h-12 rounded-xl bg-white dark:bg-slate-800 border border-[#E3DCCE] dark:border-slate-700 flex items-center justify-center text-2xl font-black text-[#E06A3B] shadow-2xs"
              >
                {digit}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopyPin}
            className="mt-2.5 text-[11px] font-bold text-[#E06A3B] hover:underline inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'PIN Copied!' : 'Copy PIN'}</span>
          </button>
        </div>

        {/* Mock Simulated QR Code */}
        <div className="p-3 rounded-2xl bg-[#F7F4EC] dark:bg-slate-900/40 border border-[#E3DCCE]/70 inline-block mb-4">
          <div className="w-36 h-36 bg-white dark:bg-slate-800 rounded-xl p-2 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
            <span className="material-symbols-outlined text-[90px] text-slate-800 dark:text-slate-200 select-none">
              qr_code_2
            </span>
            <span className="text-[9px] font-mono font-bold text-slate-400 tracking-widest uppercase">
              SCAN TO VERIFY
            </span>
          </div>
        </div>

        {/* Notice */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Valid only for authorized guardians registered in {childName}&apos;s profile.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-[#E06A3B] hover:bg-[#D9531E] active:scale-[0.98] text-white text-xs font-bold rounded-2xl transition-all shadow-xs"
        >
          Done
        </button>
      </div>
    </div>
  );
};

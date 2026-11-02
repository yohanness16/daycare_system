import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface CredentialsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  email: string;
  temporaryPassword: string;
  title?: string;
  subtitle?: string;
}

export const CredentialsDialog: React.FC<CredentialsDialogProps> = ({
  isOpen,
  onClose,
  staffName,
  email,
  temporaryPassword,
  title,
  subtitle,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyToClipboard = async (text: string, type: 'email' | 'password' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else if (type === 'password') {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      } else {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const fullLoginDetails = `Daycare Portal Login Details:
Staff Member: ${staffName}
Email: ${email}
Temporary Password: ${temporaryPassword}

Note: You will be required to change this temporary password on your first login.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[24px]">
            verified_user
          </span>
          <span>{title || 'Account Credentials'}</span>
        </div>
      }
      subtitle={subtitle || `Login credentials generated for ${staffName}`}
      showCloseButton={false}
    >
      <div className="flex flex-col gap-4">
        {/* Warning Banner per spec §8.14 */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-400 shrink-0">
            warning
          </span>
          <div>
            <strong className="font-bold">Save this temporary password now:</strong>
            <p className="mt-0.5 leading-relaxed">
              This password is shown <strong>only once</strong> and cannot be retrieved later. The
              employee will be required to change it on their first login.
            </p>
          </div>
        </div>

        {/* Email Field with Copy */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Email Address
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={email}
              className="flex-1 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-100 select-all"
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => copyToClipboard(email, 'email')}
              icon={copiedEmail ? 'check' : 'content_copy'}
            >
              {copiedEmail ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Password Field with Copy */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Temporary Password
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={temporaryPassword}
              className="flex-1 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono font-bold text-primary-600 dark:text-primary-400 select-all"
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => copyToClipboard(temporaryPassword, 'password')}
              icon={copiedPassword ? 'check' : 'content_copy'}
            >
              {copiedPassword ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Copy All Details Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => copyToClipboard(fullLoginDetails, 'all')}
            icon={copiedAll ? 'done_all' : 'share'}
          >
            {copiedAll ? 'All Details Copied!' : 'Copy Login Details'}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

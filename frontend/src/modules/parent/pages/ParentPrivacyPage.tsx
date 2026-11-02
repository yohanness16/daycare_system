import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const ParentPrivacyPage: React.FC = () => {
  const [exportRequested, setExportRequested] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleExport = () => {
    setExportRequested(true);
    setTimeout(() => {
      alert('Your export file is ready! Downloading daycare_records_export.zip...');
    }, 1500);
  };

  const handleDeleteRequest = () => {
    if (
      window.confirm(
        'Are you sure you want to request data deletion? Due to childcare licensing statutory requirements, attendance and financial ledgers are retained for the statutory period.'
      )
    ) {
      setDeleteRequested(true);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Link
          to="/parent/account"
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Privacy & Data Controls
          </h1>
          <p className="text-xs text-slate-500">
            Export your records, manage data retention and privacy policies
          </p>
        </div>
      </div>

      {/* 1. Download My Data Export */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">archive</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Download Full Record Archive (GDPR / Privacy Export)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Export all data associated with your family: daily stories, meal logs, chat histories, health logs, and photos in a secure ZIP bundle.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exportRequested}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-colors"
        >
          {exportRequested ? 'Generating Data Export...' : 'Request & Download Archive (.ZIP)'}
        </button>
      </div>

      {/* 2. Photo Consent Policy Status */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Photo Sharing Permissions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            You can revoke or modify photo permissions at any time.
          </p>
        </div>
        <Link
          to="/parent/consents"
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
        >
          Manage Consents →
        </Link>
      </div>

      {/* 3. Account / Data Deletion */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-950/60 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-rose-700 dark:text-rose-400">
          Request Account & Data Deletion
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Submitting a deletion request initiates review by the daycare administration. State childcare licensing laws mandate retention of certain emergency contact and health verification records for enrolled periods.
        </p>

        {deleteRequested ? (
          <div className="p-3 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-200">
            ✓ Deletion request recorded. Administration will contact you within 5 business days.
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDeleteRequest}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
          >
            Submit Deletion Request
          </button>
        )}
      </div>
    </div>
  );
};

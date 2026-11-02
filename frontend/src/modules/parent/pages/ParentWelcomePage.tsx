import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ParentWelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [deliveryStyle, setDeliveryStyle] = useState<'Instant' | 'Digest'>('Instant');

  const slides = [
    {
      icon: 'wb_sunny',
      color: 'from-amber-400 to-orange-500',
      title: "See Your Child's Day Live",
      subtitle:
        'Know the moment they arrive, when they nap, what they eat, and how they are feeling right now.',
    },
    {
      icon: 'forum',
      color: 'from-primary-500 to-indigo-600',
      title: 'Stay in Touch With Teachers',
      subtitle:
        'Send quick messages to classroom staff, share morning notes, and receive shared moments throughout the week.',
    },
    {
      icon: 'shield_with_heart',
      color: 'from-emerald-400 to-teal-600',
      title: "Peace of Mind & Safety First",
      subtitle:
        'Manage authorized pickups, report planned absences, and receive immediate alerts for health or incident updates.',
    },
  ];

  const handleFinish = () => {
    localStorage.setItem('parent_onboarding_done', 'true');
    localStorage.setItem('parent_pref_delivery_style', deliveryStyle);
    navigate('/parent', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#12151C] flex flex-col justify-between p-6 sm:p-10 max-w-lg mx-auto">
      {/* Top Header / Skip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]">family_restroom</span>
          </div>
          <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
            Daycare Portal
          </span>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1 px-2 rounded-lg"
        >
          Skip Tour
        </button>
      </div>

      {/* Main Slide Carousel */}
      <div className="my-auto py-8">
        {step < slides.length ? (
          <div className="text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-6">
              <div
                className={`w-28 h-28 rounded-3xl bg-gradient-to-tr ${slides[step].color} flex items-center justify-center text-white shadow-xl`}
              >
                <span className="material-symbols-outlined text-[54px]">
                  {slides[step].icon}
                </span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {slides[step].title}
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              {slides[step].subtitle}
            </p>
          </div>
        ) : (
          /* Step 4: Quick Setup & Preferences */
          <div className="animate-in fade-in duration-200 space-y-5">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[32px]">tune</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                Personalize Your Updates
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose how you want to be notified about daily stories and activities.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Browser & Push Notifications
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Get alerted for check-ins and urgent health notes
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block mb-2">
                  Daily Stories Notification Style
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryStyle('Instant')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      deliveryStyle === 'Instant'
                        ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium'
                    }`}
                  >
                    <span className="text-xs block">⚡ Real-Time</span>
                    <span className="text-[10px] opacity-80">As teachers record them</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryStyle('Digest')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      deliveryStyle === 'Digest'
                        ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium'
                    }`}
                  >
                    <span className="text-xs block">📬 Daily Digest</span>
                    <span className="text-[10px] opacity-80">One evening summary</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls & Progress Dots */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={`h-2 rounded-full transition-all duration-300 ${
                dot === step ? 'w-6 bg-primary-600' : 'w-2 bg-slate-300 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            if (step < slides.length) {
              setStep(step + 1);
            } else {
              handleFinish();
            }
          }}
          className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          {step < slides.length ? (
            <>
              Next
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          ) : (
            'Start Exploring Portal'
          )}
        </button>
      </div>
    </div>
  );
};

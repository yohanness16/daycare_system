import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { MealStatus, MealType } from '../../../core/types/enums';
import { useChildren } from '../../children/useChildren';
import { useStaff } from '../../staff/useStaff';
import { useMeals } from '../useMeals';

export const MealsPage: React.FC = () => {
  const { t } = useLanguage();
  const [filterChildId, setFilterChildId] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const { meals, totalCount, recordMeal, updateMeal, deleteMeal } = useMeals(filterChildId);
  const { children } = useChildren();
  const { staff } = useStaff();

  const [childId, setChildId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [type, setType] = useState<MealType>(MealType.Breakfast);
  const [food, setFood] = useState('');
  const [status, setStatus] = useState<MealStatus>(MealStatus.Eaten);
  const [notes, setNotes] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  const filteredMeals = meals.filter((m) => {
    if (filterType !== 'All' && m.type !== filterType) return false;
    return true;
  });

  const handleStatusChange = async (meal: (typeof meals)[0], newStatus: MealStatus) => {
    try {
      await updateMeal(meal.id, {
        type: meal.type as MealType,
        food: meal.food,
        mealTime: meal.mealTime,
        status: newStatus,
        notes: meal.notes,
      });
    } catch (err) {
      console.error('Failed to update meal status', err);
    }
  };

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    const targetChildId = childId || children[0]?.id;
    const targetStaffId = staffId || staff[0]?.id || undefined;
    if (!targetChildId || !food.trim()) return;

    const child = children.find((c) => c.id === targetChildId);
    const staffMember = staff.find((s) => s.id === targetStaffId);

    recordMeal(
      {
        childId: targetChildId,
        staffId: targetStaffId,
        type,
        food: food.trim(),
        mealTime: new Date().toISOString(),
        status,
        notes: notes.trim(),
      },
      child ? `${child.firstName} ${child.lastName}` : 'Child',
      staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Staff'
    );

    setFood('');
    setNotes('');
    setShowLogModal(false);
  };

  const eatenCount = meals.filter((m) => m.status === MealStatus.Eaten || m.status === MealStatus.PartiallyEaten).length;
  const eatenRate = totalCount > 0 ? Math.round((eatenCount / totalCount) * 100) : 100;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">
            {t('meals', 'Meals')}
          </h1>
          <p className="text-xs text-outline mt-0.5">
            Daily meal logging and food intake records
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>{t('logMeal', 'Log Meal')}</span>
        </button>
      </div>

      {/* 3 Clean Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Total Meals</span>
            <div className="text-xl font-bold text-on-surface mt-0.5">{totalCount} Logged</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">restaurant</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Consumed Rate</span>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{eatenRate}%</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Active Intake</span>
            <div className="text-xl font-bold text-secondary mt-0.5">{eatenCount} / {totalCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">done_all</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="p-3 border-b border-surface-container-low flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['All', 'Breakfast', 'Lunch', 'Snack', 'Dinner'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  filterType === t
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterChildId}
              onChange={(e) => setFilterChildId(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
            >
              <option value="">All Children</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3">Child</th>
                <th className="py-2.5 px-3">Meal Type</th>
                <th className="py-2.5 px-3">Food Item</th>
                <th className="py-2.5 px-3">Intake</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Staff</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filteredMeals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-outline text-xs">
                    No meal records logged yet.
                  </td>
                </tr>
              ) : (
                filteredMeals.map((m) => {
                  const isFullyEaten = m.status === MealStatus.Eaten;
                  const isPartiallyEaten = m.status === MealStatus.PartiallyEaten;

                  return (
                    <tr key={m.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-on-surface">
                        <Link to={`/children/${m.childId}`} className="text-on-surface hover:text-primary no-underline">
                          {m.childName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-semibold text-[11px]">
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-on-surface max-w-xs truncate" title={m.food}>
                        {m.food}
                        {m.notes && <div className="text-[11px] text-outline font-normal truncate">{m.notes}</div>}
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={m.status}
                          onChange={(e) => handleStatusChange(m, e.target.value as MealStatus)}
                          className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer border transition-colors ${
                            isFullyEaten
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isPartiallyEaten
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                          title="Change meal intake status"
                        >
                          {Object.values(MealStatus).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-outline">
                        {m.mealTime
                          ? new Date(m.mealTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant">
                        {m.staffName || 'Staff'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteMeal(m.id)}
                          className="text-outline hover:text-error text-xs cursor-pointer"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Meal Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-5 shadow-xl border border-surface-container flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <h2 className="text-base font-bold text-on-surface">Log Meal Intake</h2>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleLog} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Child <span className="text-red-500">*</span>
                </label>
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                  required
                >
                  <option value="">-- Select Child --</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Staff Member
                </label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                >
                  <option value="">-- Select Staff --</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Meal Period
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MealType)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                  >
                    {Object.values(MealType).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Intake
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MealStatus)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                  >
                    {Object.values(MealStatus).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Food Item <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scrambled eggs, oatmeal, milk"
                  value={food}
                  onChange={(e) => setFood(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ate all eggs, asked for seconds"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-xs text-on-primary font-semibold cursor-pointer"
                >
                  Save Meal Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

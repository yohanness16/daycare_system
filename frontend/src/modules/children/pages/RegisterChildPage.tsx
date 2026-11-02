import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guardiansApi } from '../../guardians/guardiansApi';
import { useGuardians } from '../../guardians/useGuardians';
import { useChildren } from '../useChildren';
import type { AllergySeverity, ChildAllergy, GuardianRelationshipInfo } from '../types';

import { mediaApi } from '../../../core/api/mediaApi';

interface FormAllergyItem {
  id: string;
  allergen: string;
  severity: AllergySeverity;
  reaction: string;
  hasEpiPen: boolean;
  epiPenLocation: string;
  actionPlan: string;
}

const COMMON_ALLERGENS = [
  'Peanuts',
  'Tree Nuts',
  'Dairy / Milk',
  'Eggs',
  'Soy',
  'Wheat / Gluten',
  'Shellfish',
  'Fish',
  'Sesame',
  'Bee Stings',
];

const COMMON_DIETS = [
  'Nut-Free',
  'Dairy-Free',
  'Gluten-Free',
  'Vegetarian',
  'Vegan',
  'Halal',
  'Kosher',
  'No Pork',
];

export const RegisterChildPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerChild } = useChildren();
  const { guardians, refetch: refetchGuardians } = useGuardians();

  // Child Personal State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodType, setBloodType] = useState('Unknown');

  // Photo state
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Allergies State
  const [hasAllergies, setHasAllergies] = useState(false);
  const [allergiesList, setAllergiesList] = useState<FormAllergyItem[]>([]);

  // Medical & Dietary
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [medications, setMedications] = useState('');
  const [pediatricianName, setPediatricianName] = useState('');
  const [pediatricianPhone, setPediatricianPhone] = useState('');

  // Guardian Mode: 'new' or 'existing'
  const [guardianMode, setGuardianMode] = useState<'new' | 'existing'>('new');
  const [selectedGuardianId, setSelectedGuardianId] = useState('');

  // New Guardian Information
  const [guardianFirstName, setGuardianFirstName] = useState('');
  const [guardianLastName, setGuardianLastName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianAddress, setGuardianAddress] = useState('');

  // Guardian Relationship to Child
  const [relationshipType, setRelationshipType] = useState('Mother');
  const [isPrimaryGuardian, setIsPrimaryGuardian] = useState(true);
  const [isSecondaryGuardian, setIsSecondaryGuardian] = useState(false);
  const [isEmergencyContact, setIsEmergencyContact] = useState(true);
  const [emergencyPriority, setEmergencyPriority] = useState<number>(1);
  const [isAuthorizedPickup, setIsAuthorizedPickup] = useState(true);
  const [pickupPin, setPickupPin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo handlers
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('Photo size exceeds 25MB limit. Please choose a smaller file.');
      return;
    }

    // Set immediate client-side preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);

    // Upload to backend media storage
    try {
      const uploadRes = await mediaApi.uploadFile(file);
      if (uploadRes?.url) {
        setPhotoUrl(uploadRes.url);
      }
    } catch (uploadErr) {
      console.warn('Failed to upload image to server, preserving local preview:', uploadErr);
    }
  };

  const handleAddAllergy = (presetName?: string) => {
    const newItem: FormAllergyItem = {
      id: `allergy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      allergen: presetName || '',
      severity: 'Moderate',
      reaction: '',
      hasEpiPen: false,
      epiPenLocation: '',
      actionPlan: '',
    };
    setAllergiesList((prev) => [...prev, newItem]);
    setHasAllergies(true);
  };

  const handleUpdateAllergy = (id: string, field: keyof FormAllergyItem, value: unknown) => {
    setAllergiesList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveAllergy = (id: string) => {
    setAllergiesList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (updated.length === 0) {
        setHasAllergies(false);
      }
      return updated;
    });
  };

  const toggleDietPreset = (diet: string) => {
    const current = dietaryRestrictions
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    if (current.includes(diet)) {
      setDietaryRestrictions(current.filter((d) => d !== diet).join(', '));
    } else {
      setDietaryRestrictions([...current, diet].join(', '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !dateOfBirth) {
      setError('Please provide the child first name, last name, and date of birth.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate allergies if flagged
    if (hasAllergies && allergiesList.length > 0) {
      for (const a of allergiesList) {
        if (!a.allergen.trim()) {
          setError('Please provide a name for all registered allergies or remove empty items.');
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      setError('');

      let finalGuardianId = selectedGuardianId;
      let finalGuardianName = '';
      let guardianContactPhone = guardianPhone;

      if (guardianMode === 'new') {
        if (!guardianFirstName.trim() || !guardianLastName.trim()) {
          setError('Please provide guardian first name and last name.');
          setIsSubmitting(false);
          return;
        }

        // 1. Create Guardian first
        const newGuardian = await guardiansApi.create({
          firstName: guardianFirstName.trim(),
          lastName: guardianLastName.trim(),
          phone: guardianPhone.trim() || 'N/A',
          email: guardianEmail.trim() || 'guardian@daycare.local',
          address: guardianAddress.trim() || 'Local Area',
        });

        finalGuardianId = newGuardian.id;
        finalGuardianName = `${newGuardian.firstName} ${newGuardian.lastName}`;
        guardianContactPhone = newGuardian.phone;
        await refetchGuardians();
      } else {
        if (!finalGuardianId) {
          finalGuardianId = guardians[0]?.id || '';
        }
        if (!finalGuardianId) {
          setError('No existing guardian found. Please register a new guardian.');
          setIsSubmitting(false);
          return;
        }
        const existing = guardians.find((g) => g.id === finalGuardianId);
        finalGuardianName = existing ? `${existing.firstName} ${existing.lastName}` : 'Guardian';
        guardianContactPhone = existing?.phone || '';
      }

      // Convert allergies
      const sanitizedAllergies: ChildAllergy[] = hasAllergies
        ? allergiesList
            .filter((a) => a.allergen.trim().length > 0)
            .map((a) => ({
              id: a.id,
              allergen: a.allergen.trim(),
              severity: a.severity,
              reaction: a.reaction.trim() || undefined,
              hasEpiPen: a.hasEpiPen,
              epiPenLocation: a.hasEpiPen ? a.epiPenLocation.trim() || 'Classroom First Aid' : undefined,
              actionPlan: a.actionPlan.trim() || undefined,
            }))
        : [];

      // Relationship info
      const guardianRel: GuardianRelationshipInfo = {
        guardianId: finalGuardianId,
        firstName: guardianMode === 'new' ? guardianFirstName.trim() : finalGuardianName.split(' ')[0],
        lastName: guardianMode === 'new' ? guardianLastName.trim() : finalGuardianName.split(' ')[1] || '',
        relationship: relationshipType,
        phone: guardianContactPhone,
        email: guardianMode === 'new' ? guardianEmail.trim() : undefined,
        isPrimary: isPrimaryGuardian,
        isSecondary: isSecondaryGuardian,
        isEmergencyContact,
        emergencyPriority: isEmergencyContact ? emergencyPriority : undefined,
        isAuthorizedPickup,
        pickupPin: isAuthorizedPickup ? pickupPin.trim() : undefined,
      };

      // 2. Register Child linked to the Guardian
      const createdChild = await registerChild(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth,
          gender,
          guardianId: finalGuardianId,
          photoUrl: photoUrl.trim() || undefined,
          allergies: sanitizedAllergies,
          dietaryRestrictions: dietaryRestrictions.trim() || undefined,
          medicalNotes: medicalNotes.trim() || undefined,
          medications: medications.trim() || undefined,
          bloodType: bloodType !== 'Unknown' ? bloodType : undefined,
          pediatricianName: pediatricianName.trim() || undefined,
          pediatricianPhone: pediatricianPhone.trim() || undefined,
          guardianRelationship: {
            relationship: relationshipType,
            isPrimary: isPrimaryGuardian,
            isSecondary: isSecondaryGuardian,
            isEmergencyContact,
            emergencyPriority,
            isAuthorizedPickup,
            pickupPin: pickupPin.trim() || undefined,
          },
          guardians: [guardianRel],
        },
        finalGuardianName
      );

      navigate(`/children/${createdChild.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete registration.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/children')}
            className="text-xs font-semibold text-outline hover:text-primary flex items-center gap-1 cursor-pointer mb-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Children Roster</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Register New Student
          </h1>
          <p className="text-xs text-outline mt-0.5">
            Enroll child with comprehensive medical, allergy safety, and authorized guardian security
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-3 shadow-xs">
          <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0">
            error
          </span>
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Child Identity & Photo */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-low space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Child Identity &amp; Demographics
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-primary">Required Step</span>
          </div>

          {/* Photo Section */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Child Preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-primary shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoUrl('');
                    }}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer shadow-xs hover:bg-red-700"
                    title="Remove Photo"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-surface-container border-2 border-dashed border-outline/50 flex flex-col items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[28px]">add_a_photo</span>
                  <span className="text-[10px] font-bold mt-0.5">Photo</span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface">Student Profile Photo</label>
                <div className="flex gap-1 bg-surface-container p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPhotoMode('upload')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                      photoMode === 'upload'
                        ? 'bg-primary text-white shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoMode('url')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                      photoMode === 'url'
                        ? 'bg-primary text-white shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {photoMode === 'upload' ? (
                <label className="flex items-center justify-center px-4 py-2.5 border border-dashed border-outline/40 rounded-xl bg-surface hover:bg-surface-container-high/50 cursor-pointer transition-colors text-xs text-on-surface font-semibold gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">upload_file</span>
                  <span>Choose JPG, PNG, or WebP photo (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoFileUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <input
                  type="url"
                  placeholder="https://example.com/photos/child-avatar.jpg"
                  value={photoUrl}
                  onChange={(e) => {
                    setPhotoUrl(e.target.value);
                    setPhotoPreview(e.target.value || null);
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-surface text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
                />
              )}
            </div>
          </div>

          {/* Child Name & Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Leo"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Martinez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Blood Type
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container cursor-pointer"
              >
                <option value="Unknown">Unknown / Not Tested</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Critical Health, Allergies & Safety Protocol */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-low space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-red-100 text-red-600 text-xs font-extrabold flex items-center justify-center">
                2
              </span>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Allergies &amp; Emergency Medical Safety
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold uppercase">
                  High Priority
                </span>
              </div>
            </div>
          </div>

          {/* Known Allergies Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px] text-red-600">
                shield_with_heart
              </span>
              <div>
                <div className="text-xs font-bold text-on-surface">
                  Does this child have any documented allergies?
                </div>
                <div className="text-[11px] text-outline mt-0.5">
                  Displays an unavoidable red emergency warning badge across all teacher and meal logs
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasAllergies}
                onChange={(e) => {
                  setHasAllergies(e.target.checked);
                  if (e.target.checked && allergiesList.length === 0) {
                    handleAddAllergy();
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600" />
            </label>
          </div>

          {/* Allergies List Builder */}
          {hasAllergies && (
            <div className="space-y-4 pt-1">
              {/* Quick Allergen Presets */}
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1.5">
                  Quick Add Common Allergens:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ALLERGENS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleAddAllergy(item)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface cursor-pointer transition-colors border border-surface-container"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Allergy Cards */}
              <div className="space-y-4">
                {allergiesList.map((allergy, index) => (
                  <div
                    key={allergy.id}
                    className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-4 relative"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-red-200/60">
                      <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        <span>Allergy Record #{index + 1}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(allergy.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Allergen Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Peanuts, Bee Stings, Dairy"
                          value={allergy.allergen}
                          onChange={(e) => handleUpdateAllergy(allergy.id, 'allergen', e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-white text-slate-900 text-xs border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Severity Level
                        </label>
                        <select
                          value={allergy.severity}
                          onChange={(e) =>
                            handleUpdateAllergy(
                              allergy.id,
                              'severity',
                              e.target.value as AllergySeverity
                            )
                          }
                          className="w-full h-10 px-3 rounded-lg bg-white text-slate-900 text-xs border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                        >
                          <option value="Mild">Mild (Minor rash / discomfort)</option>
                          <option value="Moderate">Moderate (Hives, localized swelling)</option>
                          <option value="Severe">Severe (Difficulty breathing, vomiting)</option>
                          <option value="LifeThreatening">
                            ⚡ Life-Threatening (Anaphylaxis Risk)
                          </option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Typical Reaction Symptoms
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Hives within 5 minutes, throat tightening, cough"
                          value={allergy.reaction}
                          onChange={(e) => handleUpdateAllergy(allergy.id, 'reaction', e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-white text-slate-900 text-xs border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* Epi-Pen Checkbox & Location */}
                      <div className="sm:col-span-2 p-3 rounded-lg bg-white border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allergy.hasEpiPen}
                            onChange={(e) =>
                              handleUpdateAllergy(allergy.id, 'hasEpiPen', e.target.checked)
                            }
                            className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                          />
                          <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">vaccines</span>
                            <span>Epi-Pen Auto-Injector Required</span>
                          </span>
                        </label>

                        {allergy.hasEpiPen && (
                          <div className="flex-1 max-w-sm">
                            <input
                              type="text"
                              required={allergy.hasEpiPen}
                              placeholder="Storage location (e.g. Room 2 Cabinet, Shelf A)"
                              value={allergy.epiPenLocation}
                              onChange={(e) =>
                                handleUpdateAllergy(allergy.id, 'epiPenLocation', e.target.value)
                              }
                              className="w-full h-9 px-3 rounded-lg bg-red-50/50 text-slate-900 text-xs border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Emergency Action Plan
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Administer Epi-Pen immediately into mid-outer thigh. Call 911 immediately. Notify mother."
                          value={allergy.actionPlan}
                          onChange={(e) =>
                            handleUpdateAllergy(allergy.id, 'actionPlan', e.target.value)
                          }
                          className="w-full p-2.5 rounded-lg bg-white text-slate-900 text-xs border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddAllergy()}
                  className="w-full py-2.5 rounded-xl border border-dashed border-red-300 hover:border-red-400 bg-red-50/30 hover:bg-red-50 text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Add Another Allergy</span>
                </button>
              </div>
            </div>
          )}

          {/* Dietary Restrictions */}
          <div className="space-y-2 pt-2 border-t border-surface-container-low">
            <label className="block text-xs font-semibold text-on-surface">
              Dietary Restrictions &amp; Preferences
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_DIETS.map((diet) => {
                const active = dietaryRestrictions.includes(diet);
                return (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => toggleDietPreset(diet)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${
                      active
                        ? 'bg-secondary text-white border-secondary shadow-2xs'
                        : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
                    }`}
                  >
                    {diet}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="e.g. Gluten-Free, No Sesame, Vegetarian"
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
            />
          </div>

          {/* Medical Notes & Medications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-surface-container-low">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Ongoing Medications
              </label>
              <input
                type="text"
                placeholder="e.g. Albuterol Inhaler (2 puffs before outdoor play)"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Medical &amp; Physical Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Mild asthma triggered by cold weather; wears glasses"
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
              />
            </div>
          </div>

          {/* Pediatrician Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-surface-container-low">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Pediatrician / Clinic Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Sarah Reed (Pasadena Children's Clinic)"
                value={pediatricianName}
                onChange={(e) => setPediatricianName(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Pediatrician Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. (555) 234-8900"
                value={pediatricianPhone}
                onChange={(e) => setPediatricianPhone(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Guardian Details & Family Relationship */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-low space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-low">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-secondary/15 text-secondary text-xs font-extrabold flex items-center justify-center">
                3
              </span>
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Guardian Relationships &amp; Pickup Security
              </h2>
            </div>

            {/* Guardian Toggle Mode */}
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-surface-container text-xs">
              <button
                type="button"
                onClick={() => setGuardianMode('new')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  guardianMode === 'new'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                + Register New Guardian
              </button>
              <button
                type="button"
                onClick={() => setGuardianMode('existing')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  guardianMode === 'existing'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Select Existing ({guardians.length})
              </button>
            </div>
          </div>

          {guardianMode === 'new' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Guardian First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={guardianMode === 'new'}
                    placeholder="e.g. Maria"
                    value={guardianFirstName}
                    onChange={(e) => setGuardianFirstName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Guardian Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={guardianMode === 'new'}
                    placeholder="e.g. Martinez"
                    value={guardianLastName}
                    onChange={(e) => setGuardianLastName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required={guardianMode === 'new'}
                    placeholder="e.g. (555) 234-5678"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. maria@email.com"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Home Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 742 Evergreen Terrace, Springfield"
                  value={guardianAddress}
                  onChange={(e) => setGuardianAddress(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Select Registered Guardian
              </label>
              <select
                value={selectedGuardianId}
                onChange={(e) => setSelectedGuardianId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container cursor-pointer"
              >
                <option value="">-- Choose Existing Guardian --</option>
                {guardians.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.firstName} {g.lastName} ({g.phone || g.email || 'Contact'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Relationship Settings per FRONTEND_RULES §5.2 */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-4">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">
                family_restroom
              </span>
              <span>Relationship &amp; Authorization Permissions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Relationship to Child
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container cursor-pointer"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Foster Parent">Foster Parent</option>
                  <option value="Aunt / Uncle">Aunt / Uncle</option>
                  <option value="Other">Other Authorized Adult</option>
                </select>
              </div>

              {/* Primary vs Secondary Contact */}
              <div className="flex flex-col justify-center">
                <span className="text-xs font-semibold text-on-surface mb-1">Contact Status</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface">
                    <input
                      type="checkbox"
                      checked={isPrimaryGuardian}
                      onChange={(e) => {
                        setIsPrimaryGuardian(e.target.checked);
                        if (e.target.checked) setIsSecondaryGuardian(false);
                      }}
                      className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                    />
                    <span>Primary Contact</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface">
                    <input
                      type="checkbox"
                      checked={isSecondaryGuardian}
                      onChange={(e) => {
                        setIsSecondaryGuardian(e.target.checked);
                        if (e.target.checked) setIsPrimaryGuardian(false);
                      }}
                      className="w-4 h-4 text-secondary rounded border-slate-300 focus:ring-secondary"
                    />
                    <span>Secondary Contact</span>
                  </label>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="flex flex-col justify-center">
                <span className="text-xs font-semibold text-on-surface mb-1">Emergency Calls</span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface">
                  <input
                    type="checkbox"
                    checked={isEmergencyContact}
                    onChange={(e) => setIsEmergencyContact(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Designated Emergency Contact</span>
                </label>
                {isEmergencyContact && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-outline font-semibold">Call Priority:</span>
                    <select
                      value={emergencyPriority}
                      onChange={(e) => setEmergencyPriority(Number(e.target.value))}
                      className="h-6 px-1.5 rounded text-[11px] bg-surface text-on-surface border border-surface-container font-semibold cursor-pointer"
                    >
                      <option value={1}>1st Call</option>
                      <option value={2}>2nd Call</option>
                      <option value={3}>3rd Call</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Authorized Pickup & PIN */}
            <div className="pt-3 border-t border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-on-surface">
                <input
                  type="checkbox"
                  checked={isAuthorizedPickup}
                  onChange={(e) => setIsAuthorizedPickup(e.target.checked)}
                  className="w-4 h-4 text-secondary rounded border-slate-300 focus:ring-secondary"
                />
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    verified_user
                  </span>
                  <span>Authorized for Child Dismissal / Pickup</span>
                </span>
              </label>

              {isAuthorizedPickup && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-on-surface whitespace-nowrap">
                    Pickup Security PIN:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pickupPin}
                    onChange={(e) => setPickupPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="4-digit PIN"
                    className="w-28 h-9 px-3 rounded-lg bg-surface text-center font-mono font-bold text-sm tracking-widest text-primary border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPickupPin(Math.floor(1000 + Math.random() * 9000).toString())
                    }
                    title="Generate Random PIN"
                    className="p-2 rounded-lg bg-surface hover:bg-surface-container text-outline hover:text-on-surface border border-surface-container cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions (Min 48px touch targets per FRONTEND_RULES §1.3) */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => navigate('/children')}
            className="min-h-12 px-6 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-sm font-bold transition-colors cursor-pointer border border-surface-container"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-12 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-extrabold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2.5 active:scale-98"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  progress_activity
                </span>
                <span>Saving Child &amp; Health Records...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                <span>Complete Child Enrollment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

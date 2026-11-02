import React, { useState } from 'react';

export const SettingsPage: React.FC = () => {
  const [daycareName, setDaycareName] = useState('Daycare Central Operations (DC-CENTRAL-01)');
  const [licenseNum, setLicenseNum] = useState('LIC-VA-2024-99824');
  const [contactPhone, setContactPhone] = useState('+1 (555) 019-2830');
  const [officialEmail, setOfficialEmail] = useState('contact@daycare-central.org');
  const [physicalAddress, setPhysicalAddress] = useState('742 Evergreen Terrace, Suite 100, Springfield, VA 22150');
  const [timeZone, setTimeZone] = useState('Eastern Time (US & Canada) UTC-05:00');
  const [operatingHours, setOperatingHours] = useState('07:00 AM – 06:00 PM (Monday – Friday)');
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleReset = () => {
    setDaycareName('menge and freinds daycare');
    setLicenseNum('LIC-VA-2024-99824');
    setContactPhone('+1234567890');
    setOfficialEmail('contact@daycare-central.org');
    setPhysicalAddress('mexico around girma fast food');
  };

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-space-sm px-space-md py-3 rounded-lg bg-inverse-surface text-inverse-on-surface shadow-xl transition-all">
          <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">check_circle</span>
          <span className="font-body-md text-body-md font-medium">Settings and facility profile updated successfully.</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
              Configuration Engine
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="font-mono-data text-mono-data text-outline">ENV: LOCAL-DEV-DOTNET-8</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold">
            Settings &amp; Infrastructure
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Facility operational profile, state licensing parameters, and core service connectivity.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <button
            type="button"
            onClick={handleReset}
            className="px-space-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Discard</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-space-lg py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
        {/* Left Column: Primary Operational Profile Form (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col gap-space-lg">
          <section className="bg-surface-container-lowest rounded-xl p-space-lg sm:p-space-xl shadow-sm flex flex-col gap-space-lg border border-surface-container-low">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    Facility &amp; Organization Profile
                  </h2>
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Master Record ID: FAC-00129
                  </span>
                </div>
              </div>
              <span className="px-space-sm py-1 rounded-full bg-surface-container-low text-primary font-mono-data text-mono-data font-semibold">
                DC-CENTRAL-01
              </span>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-space-md" onSubmit={handleSave}>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant font-medium flex items-center justify-between" htmlFor="daycareName">
                  <span>Daycare Legal Name</span>
                  <span className="font-label-sm text-label-sm text-outline">Required</span>
                </label>
                <input
                  id="daycareName"
                  type="text"
                  value={daycareName}
                  onChange={(e) => setDaycareName(e.target.value)}
                  className="w-full h-10 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant font-medium" htmlFor="licenseNum">
                  State Operational License #
                </label>
                <input
                  id="licenseNum"
                  type="text"
                  value={licenseNum}
                  onChange={(e) => setLicenseNum(e.target.value)}
                  className="w-full h-10 px-space-md rounded-lg bg-surface-container-low text-on-surface font-mono-data text-mono-data focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant font-medium" htmlFor="licenseCap">
                  Licensed Occupancy Limit
                </label>
                <div className="relative flex items-center">
                  <input
                    id="licenseCap"
                    type="text"
                    readOnly
                    value="56 Children (Full-Time)"
                    className="w-full h-10 px-space-md pr-10 rounded-lg bg-surface-container text-on-surface-variant font-body-md text-body-md cursor-not-allowed select-none"
                  />
                  <span className="material-symbols-outlined absolute right-3 text-outline text-[18px]">verified</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant font-medium" htmlFor="contactPhone">
                  Contact Phone
                </label>
                <div className="relative flex items-center">
                  <input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface-container-low text-on-surface font-mono-data text-mono-data focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">call</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant font-medium" htmlFor="officialEmail">
                  Official Dispatch Email
                </label>
                <div className="relative flex items-center">
                  <input
                    id="officialEmail"
                    type="email"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">mail</span>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant font-medium" htmlFor="physicalAddress">
                  Physical Facility Address
                </label>
                <div className="relative flex items-center">
                  <input
                    id="physicalAddress"
                    type="text"
                    value={physicalAddress}
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">pin_drop</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant font-medium" htmlFor="timeZone">
                  System Facility Timezone
                </label>
                <div className="relative flex items-center">
                  <select
                    id="timeZone"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  >
                    <option>Eastern Time (US & Canada) UTC-05:00</option>
                    <option>Central Time (US & Canada) UTC-06:00</option>
                    <option>Mountain Time (US & Canada) UTC-07:00</option>
                    <option>Pacific Time (US & Canada) UTC-08:00</option>
                  </select>
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">schedule</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant font-medium" htmlFor="operatingHours">
                  Standard Operating Hours
                </label>
                <div className="relative flex items-center">
                  <input
                    id="operatingHours"
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">timelapse</span>
                </div>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column: System Telemetry & Architecture Panel (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-space-lg">
          <section className="bg-surface-container-lowest rounded-xl p-space-lg sm:p-space-xl shadow-sm flex flex-col gap-space-md border border-surface-container-low">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">dns</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    System Telemetry
                  </h2>
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Core Infrastructure Stack
                  </span>
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              {/* Frontend Tile */}
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-2 transition-colors hover:bg-surface-container">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">web</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Frontend Application
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-emerald-700 font-label-sm text-label-sm font-semibold shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Running &amp; Synchronized
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono-data text-mono-data text-on-surface-variant text-[12px] pt-1">
                  <span>Stack: React 19 + Vite + Tailwind v4</span>
                  <span className="text-primary font-semibold">Port 3001 (Proxy /api)</span>
                </div>
              </div>

              {/* Backend API Tile */}
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-2 transition-colors hover:bg-surface-container">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">hub</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Backend Core API
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-emerald-700 font-label-sm text-label-sm font-semibold shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Connected (Port 5107)
                  </span>
                </div>
                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex items-center justify-between font-mono-data text-mono-data text-on-surface-variant text-[12px]">
                    <span>Service: ASP.NET Core 8 API</span>
                    <span className="text-outline">Clean Architecture / JWT</span>
                  </div>
                  <span className="font-mono-data text-mono-data text-outline text-[11px] truncate bg-surface-container-lowest px-2 py-1 rounded">
                    http://localhost:5107/api
                  </span>
                </div>
              </div>

              {/* PostgreSQL Data Store Tile */}
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-2 transition-colors hover:bg-surface-container">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">database</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Primary Data Store
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-emerald-700 font-label-sm text-label-sm font-semibold shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Healthy
                  </span>
                </div>
                <div className="flex flex-col gap-1 pt-1 font-mono-data text-mono-data text-on-surface-variant text-[12px]">
                  <div className="flex items-center justify-between">
                    <span>Engine: PostgreSQL 16 (DaycareDb)</span>
                    <span className="text-primary font-semibold">Entity Framework Core 8</span>
                  </div>
                  <div className="flex items-center justify-between text-outline text-[11px]">
                    <span>Migrations: Up to Date</span>
                    <span>Admin: admin@email.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Latency Micro Visualization */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex justify-between items-center font-label-sm text-label-sm text-outline uppercase tracking-wider">
                <span>Core Endpoint Latency (Past 6 Hours)</span>
                <span className="font-mono-data text-emerald-700 font-semibold">Avg 8.4ms</span>
              </div>
              <div className="h-10 w-full flex items-end gap-1.5 bg-surface-container-low p-2 rounded-lg">
                {[20, 35, 18, 45, 28, 55, 30, 22, 40, 25, 32, 28, 42, 24, 38, 20].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-secondary/40 hover:bg-secondary transition-colors rounded-xs"
                    style={{ height: `${height}%` }}
                    title={`Tick ${i + 1}: ${height}ms`}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

/**
 * Date & Time utilities per UI/UX Specification §14
 */

export function getTodayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatAge(dobString?: string): string {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '';

  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();

  if (now.getDate() < dob.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return 'Newborn';
  if (years === 0) {
    return months === 1 ? '1 mo' : `${months} mos`;
  }
  if (years < 5) {
    return months > 0 ? `${years} yrs ${months} mos` : `${years} yrs`;
  }
  return `${years} yrs`;
}

export function formatTimeDisplay(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function formatDateDisplay(dateString?: string): string {
  if (!dateString) return '';
  try {
    // Avoid UTC off-by-one by splitting date parts
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

export function formatDuration(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return '';
  try {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const diffMins = Math.max(0, Math.round((end - start) / 60000));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  } catch {
    return '';
  }
}

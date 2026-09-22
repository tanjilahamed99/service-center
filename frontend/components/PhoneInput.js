"use client";

export default function PhoneInput({
  value = "",
  onChange,
  countryCode = "+91",
  label,
  required = false,
  placeholder = "",
}) {
  const codeDigits = countryCode.replace("+", ""); // "91"

  // Handle three real shapes existing data can take:
  // "+918604835001" (full, with plus) — the format this component itself writes
  // "918604835001"  (country code, no plus) — possible from older records/imports
  // "8604835001"    (no country code at all) — legacy data from before this
  //                  component existed; treat the whole thing as the national number
  let nationalNumber;
  if (value.startsWith(countryCode)) {
    nationalNumber = value.slice(countryCode.length);
  } else if (value.startsWith(codeDigits) && value.length > 10) {
    nationalNumber = value.slice(codeDigits.length);
  } else {
    nationalNumber = value.replace(/\D/g, ""); // strip any stray non-digits, keep everything else
  }

  function handleChange(e) {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    onChange?.(`${countryCode}${digitsOnly}`);
  }

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-navy-900">
          {label}
        </label>
      )}
      <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:border-electric-400 focus-within:bg-white focus-within:ring-1 focus-within:ring-electric-400">
        <span className="flex items-center bg-slate-100 px-3 text-sm font-medium text-slate-600">
          {countryCode}
        </span>
        <input
          type="tel"
          required={required}
          value={nationalNumber}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2 text-sm text-navy-900 focus:outline-none"
        />
      </div>
    </div>
  );
}

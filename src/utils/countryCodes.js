// Common country codes with flags, dial codes, and phone number length requirements
export const countryCodes = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', maxLength: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', maxLength: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', maxLength: 9 },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', maxLength: 10 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', maxLength: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', maxLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', maxLength: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', maxLength: 9 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', maxLength: 11 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', maxLength: 10 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', maxLength: 10 },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', maxLength: 11 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', maxLength: 10 },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', maxLength: 10 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', maxLength: 9 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', maxLength: 10 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', maxLength: 10 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', maxLength: 9 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', maxLength: 9 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', maxLength: 8 },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', maxLength: 9 },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', maxLength: 9 },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', maxLength: 10 },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', maxLength: 10 },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', maxLength: 9 },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', maxLength: 10 },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', maxLength: 10 },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', maxLength: 10 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', maxLength: 9 },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', maxLength: 9 },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', maxLength: 9 },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', maxLength: 10 },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', maxLength: 9 },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', maxLength: 8 },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', maxLength: 8 },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', maxLength: 9 },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', maxLength: 9 },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', maxLength: 9 },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', maxLength: 10 },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', maxLength: 9 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', maxLength: 9 },
];

// Default country (can be changed based on user preference or location)
export const getDefaultCountry = () => {
  return countryCodes.find(c => c.code === 'US') || countryCodes[0];
};

// Extract country code and phone number from full phone string
export const parsePhoneNumber = (phoneString) => {
  if (!phoneString) return { countryCode: null, phoneNumber: '' };
  
  // Try to match a dial code at the start
  const sortedCodes = [...countryCodes].sort((a, b) => b.dialCode.length - a.dialCode.length);
  
  for (const country of sortedCodes) {
    if (phoneString.startsWith(country.dialCode)) {
      return {
        countryCode: country,
        phoneNumber: phoneString.substring(country.dialCode.length).trim()
      };
    }
  }
  
  // If no dial code found, assume default country
  return {
    countryCode: getDefaultCountry(),
    phoneNumber: phoneString
  };
};

// Combine country code and phone number
export const formatPhoneNumber = (countryCode, phoneNumber) => {
  if (!phoneNumber) return '';
  if (!countryCode) return phoneNumber;
  return `${countryCode.dialCode} ${phoneNumber}`.trim();
};

/**
 * Get maximum phone number length for a country
 * @param {Object} countryCode - Country code object
 * @returns {number} Maximum number of digits allowed
 */
export const getPhoneMaxLength = (countryCode) => {
  if (!countryCode) return 15; // Default max length
  return countryCode.maxLength || 15; // Default to 15 if not specified
};

/**
 * Validate and limit phone number input based on country
 * @param {string} value - Input value
 * @param {Object} countryCode - Selected country code
 * @returns {string} Validated and limited phone number
 */
export const validatePhoneInput = (value, countryCode) => {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Get max length for the country
  const maxLength = getPhoneMaxLength(countryCode);
  
  // Limit to max length
  return digitsOnly.slice(0, maxLength);
};

/**
 * Get placeholder text for phone input based on country
 * @param {Object} countryCode - Selected country code
 * @returns {string} Placeholder text
 */
export const getPhonePlaceholder = (countryCode) => {
  if (!countryCode) return 'Phone number';
  const maxLength = getPhoneMaxLength(countryCode);
  return `Enter ${maxLength} digit${maxLength !== 1 ? 's' : ''}`;
};


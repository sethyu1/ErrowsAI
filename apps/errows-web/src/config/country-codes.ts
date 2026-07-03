export interface CountryCode {
  name: string
  code: string
  dialCode: string
}

export const countryCodes: CountryCode[] = [
  { name: 'Argentina', code: 'AR', dialCode: '+54' },
  { name: 'Australia', code: 'AU', dialCode: '+61' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880' },
  { name: 'Brazil', code: 'BR', dialCode: '+55' },
  { name: 'Cambodia', code: 'KH', dialCode: '+855' },
  { name: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'Colombia', code: 'CO', dialCode: '+57' },
  { name: 'Egypt', code: 'EG', dialCode: '+20' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'Ghana', code: 'GH', dialCode: '+233' },
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62' },
  { name: 'Ireland', code: 'IE', dialCode: '+353' },
  { name: 'Italy', code: 'IT', dialCode: '+39' },
  { name: 'Japan', code: 'JP', dialCode: '+81' },
  { name: 'Kazakhstan', code: 'KZ', dialCode: '+7' },
  { name: 'Kyrgyzstan', code: 'KG', dialCode: '+996' },
  { name: 'Laos', code: 'LA', dialCode: '+856' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60' },
  { name: 'Macau', code: 'MO', dialCode: '+853' },
  { name: 'Mexico', code: 'MX', dialCode: '+52' },
  { name: 'Myanmar', code: 'MM', dialCode: '+95' },
  { name: 'Nepal', code: 'NP', dialCode: '+977' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234' },
  { name: 'Oman', code: 'OM', dialCode: '+968' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92' },
  { name: 'Philippines', code: 'PH', dialCode: '+63' },
  { name: 'Portugal', code: 'PT', dialCode: '+351' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
  { name: 'Singapore', code: 'SG', dialCode: '+65' },
  { name: 'Slovenia', code: 'SI', dialCode: '+386' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27' },
  { name: 'South Korea', code: 'KR', dialCode: '+82' },
  { name: 'Spain', code: 'ES', dialCode: '+34' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94' },
  { name: 'Sweden', code: 'SE', dialCode: '+46' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41' },
  { name: 'Tajikistan', code: 'TJ', dialCode: '+992' },
  { name: 'Turkey', code: 'TR', dialCode: '+90' },
  { name: 'Ukraine', code: 'UA', dialCode: '+380' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'Uzbekistan', code: 'UZ', dialCode: '+998' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84' },
]

export function getCountryByDialCode(dialCode: string): CountryCode | undefined {
  return countryCodes.find(country => country.dialCode === dialCode)
}

export function getCountryByCode(code: string): CountryCode | undefined {
  return countryCodes.find(country => country.code === code)
}

export function getDefaultCountry(): CountryCode {
  return countryCodes.find(country => country.code === 'US') || countryCodes[0] || { code: 'US', name: 'United States', dialCode: '+1' }
}

export function formatMobileNumber(dialCode: string, mobile: string): string {
  const cleanDialCode = dialCode.replace(/^\+/, '')
  let cleanMobile = mobile.trim()

  if (cleanMobile.startsWith('+')) {
    cleanMobile = cleanMobile.substring(1)
  }

  if (cleanMobile.startsWith(cleanDialCode)) {
    cleanMobile = cleanMobile.substring(cleanDialCode.length)
  }

  return cleanDialCode + cleanMobile
}

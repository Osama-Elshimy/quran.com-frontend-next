/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/* eslint-disable max-lines */
const { http, HttpResponse } = require('msw');

// Define the base URL for the API
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8787';
const API_BASE_URL = `${API_GATEWAY_URL}/content/api/qdc`;

console.log('MSW: API_GATEWAY_URL:', API_GATEWAY_URL);
console.log('MSW: API_BASE_URL:', API_BASE_URL);

// Mock data for different language/country combinations
const mockCountryLanguagePreferences = {
  'en-US': {
    country: 'US',
    userDeviceLanguage: 'en',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 131 }],
    defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'en' },
    ayahReflectionsLanguages: [{ isoCode: 'en' }],
  },
  'en-GB': {
    country: 'GB',
    userDeviceLanguage: 'en',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 20 }],
    defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'en' },
    ayahReflectionsLanguages: [{ isoCode: 'en' }],
  },
  'en-CA': {
    country: 'CA',
    userDeviceLanguage: 'en',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 20 }],
    defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'en' },
    ayahReflectionsLanguages: [{ isoCode: 'en' }],
  },
  'en-AU': {
    country: 'AU',
    userDeviceLanguage: 'en',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 131 }],
    defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'en' },
    ayahReflectionsLanguages: [{ isoCode: 'en' }],
  },
  'en-IN': {
    country: 'IN',
    userDeviceLanguage: 'en',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 159 }],
    defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'en' },
    ayahReflectionsLanguages: [{ isoCode: 'en' }],
  },
  'en-SA': {
    country: 'SA',
    userDeviceLanguage: 'en',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 131 }],
    defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'en' },
    ayahReflectionsLanguages: [{ isoCode: 'en' }],
  },
  'en-EG': {
    country: 'EG',
    userDeviceLanguage: 'en',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 20 }],
    defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'en' },
    ayahReflectionsLanguages: [{ isoCode: 'en' }],
  },
  'en-JP': {
    country: 'JP',
    userDeviceLanguage: 'en',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 131 }],
    defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'en' },
    ayahReflectionsLanguages: [{ isoCode: 'en' }, { isoCode: 'ja' }],
  },
  'ar-US': {
    country: 'US',
    userDeviceLanguage: 'ar',
    defaultMushaf: { id: 2 },
    defaultTranslations: [{ id: 20 }],
    defaultTafsir: { id: 'ar-tafseer-al-tabari' },
    defaultWbwLanguage: { isoCode: 'ar' },
    ayahReflectionsLanguages: [{ isoCode: 'ar' }, { isoCode: 'en' }],
  },
  'bn-US': {
    country: 'US',
    userDeviceLanguage: 'bn',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 161 }],
    defaultTafsir: { id: 'bn-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'bn' },
    ayahReflectionsLanguages: [{ isoCode: 'bn' }, { isoCode: 'en' }],
  },
  'fa-US': {
    country: 'US',
    userDeviceLanguage: 'fa',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 135 }],
    defaultTafsir: { id: 'fa-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'fa' },
    ayahReflectionsLanguages: [{ isoCode: 'fa' }, { isoCode: 'en' }],
  },
  'fr-US': {
    country: 'US',
    userDeviceLanguage: 'fr',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 136 }],
    defaultTafsir: { id: 'fr-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'fr' },
    ayahReflectionsLanguages: [{ isoCode: 'fr' }, { isoCode: 'en' }],
  },
  'id-US': {
    country: 'US',
    userDeviceLanguage: 'id',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 33 }],
    defaultTafsir: { id: 'id-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'id' },
    ayahReflectionsLanguages: [{ isoCode: 'id' }, { isoCode: 'en' }],
  },
  'it-US': {
    country: 'US',
    userDeviceLanguage: 'it',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 153 }],
    defaultTafsir: { id: 'it-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'it' },
    ayahReflectionsLanguages: [{ isoCode: 'it' }, { isoCode: 'en' }],
  },
  'nl-US': {
    country: 'US',
    userDeviceLanguage: 'nl',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 144 }],
    defaultTafsir: { id: 'nl-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'nl' },
    ayahReflectionsLanguages: [{ isoCode: 'nl' }, { isoCode: 'en' }],
  },
  'pt-US': {
    country: 'US',
    userDeviceLanguage: 'pt',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 156 }],
    defaultTafsir: { id: 'pt-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'pt' },
    ayahReflectionsLanguages: [{ isoCode: 'pt' }, { isoCode: 'en' }],
  },
  'ru-US': {
    country: 'US',
    userDeviceLanguage: 'ru',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 79 }],
    defaultTafsir: { id: 'ru-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'ru' },
    ayahReflectionsLanguages: [{ isoCode: 'ru' }, { isoCode: 'en' }],
  },
  'sq-US': {
    country: 'US',
    userDeviceLanguage: 'sq',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 89 }],
    defaultTafsir: { id: 'sq-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'sq' },
    ayahReflectionsLanguages: [{ isoCode: 'sq' }, { isoCode: 'en' }],
  },
  'th-US': {
    country: 'US',
    userDeviceLanguage: 'th',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 165 }],
    defaultTafsir: { id: 'th-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'th' },
    ayahReflectionsLanguages: [{ isoCode: 'th' }, { isoCode: 'en' }],
  },
  'tr-US': {
    country: 'US',
    userDeviceLanguage: 'tr',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 77 }],
    defaultTafsir: { id: 'tr-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'tr' },
    ayahReflectionsLanguages: [{ isoCode: 'tr' }, { isoCode: 'en' }],
  },
  'ur-US': {
    country: 'US',
    userDeviceLanguage: 'ur',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 54 }],
    defaultTafsir: { id: 'ur-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'ur' },
    ayahReflectionsLanguages: [{ isoCode: 'ur' }, { isoCode: 'en' }],
  },
  'zh-US': {
    country: 'US',
    userDeviceLanguage: 'zh',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 109 }],
    defaultTafsir: { id: 'zh-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'zh' },
    ayahReflectionsLanguages: [{ isoCode: 'zh' }, { isoCode: 'en' }],
  },
  'ms-US': {
    country: 'US',
    userDeviceLanguage: 'ms',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 39 }],
    defaultTafsir: { id: 'ms-tafseer-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'ms' },
    ayahReflectionsLanguages: [{ isoCode: 'ms' }, { isoCode: 'en' }],
  },
};

// Helper function to get country language preference mock data
function getCountryLanguagePreferenceMockData(userDeviceLanguage, country) {
  // Implement business logic: For non-English languages, ignore country and use US
  const isEnglish = userDeviceLanguage === 'en';
  const effectiveCountry = isEnglish ? country : 'US';
  const key = `${userDeviceLanguage}-${effectiveCountry}`;

  // Return mock data if available
  if (mockCountryLanguagePreferences[key]) {
    return mockCountryLanguagePreferences[key];
  }

  // For non-English languages not in the map, use generic non-English defaults
  if (!isEnglish) {
    return {
      country: 'US', // Always US for non-English per spec
      userDeviceLanguage,
      defaultMushaf: { id: 2 },
      defaultTranslations: [{ id: 20 }],
      defaultTafsir: { id: 'ar-tafseer-al-tabari' },
      defaultWbwLanguage: { isoCode: userDeviceLanguage },
      ayahReflectionsLanguages: [{ isoCode: userDeviceLanguage }, { isoCode: 'en' }],
    };
  }

  // English fallback
  return {
    country: country || 'US',
    userDeviceLanguage: 'en',
    defaultMushaf: { id: 1 },
    defaultTranslations: [{ id: 131 }],
    defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
    defaultWbwLanguage: { isoCode: 'en' },
    ayahReflectionsLanguages: [{ isoCode: 'en' }],
  };
}

// Define handlers for MSW
const handlers = [
  // Handler for country language preference API - flexible pattern matching
  http.get('*/resources/country_language_preference', ({ request }) => {
    const url = new URL(request.url);
    const userDeviceLanguage = url.searchParams.get('user_device_language');
    const country = url.searchParams.get('country');

    console.log('MSW: Intercepted request URL:', request.url);
    console.log('MSW: Intercepted request for:', { userDeviceLanguage, country });
    const mockData = getCountryLanguagePreferenceMockData(userDeviceLanguage, country);
    console.log('MSW: Returning data:', mockData);
    return HttpResponse.json(mockData);
  }),

  // Handler for auth endpoints
  http.post('*/auth/signup', () => {
    return HttpResponse.json({
      success: true,
      user: { id: 'test-user-123', email: 'test@example.com' },
    });
  }),

  http.post('*/auth/login', () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: 'existing-user-123',
        email: 'existing@example.com',
        settings: null, // or provide mock settings
      },
    });
  }),

  // Handler for reflections API
  http.get('*/verses/:verseKey/reflections', ({ params }) => {
    const { verseKey } = params;
    console.log('MSW: Intercepted reflections request for verse:', verseKey);

    return HttpResponse.json({
      reflections: [
        { id: 1, text: 'English reflection', language: 'en' },
        { id: 2, text: 'تأمل عربي', language: 'ar' },
        { id: 3, text: 'اردو تأمل', language: 'ur' },
        { id: 4, text: 'French reflection', language: 'fr' },
      ],
    });
  }),

  // Handler for user settings update
  http.put('*/user/settings', () => {
    return HttpResponse.json({ success: true });
  }),
];

module.exports = {
  handlers,
  mockCountryLanguagePreferences,
};

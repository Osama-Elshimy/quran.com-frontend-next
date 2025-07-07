/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/* eslint-disable max-lines */
const { http, HttpResponse } = require('msw');

const { mockCountryLanguagePreferences } = require('../data');

// Define the base URL for the API
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8787';
const API_BASE_URL = `${API_GATEWAY_URL}/content/api/qdc`;

console.log('MSW: API_GATEWAY_URL:', API_GATEWAY_URL);
console.log('MSW: API_BASE_URL:', API_BASE_URL);

// Mock data for different language/country combinations

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

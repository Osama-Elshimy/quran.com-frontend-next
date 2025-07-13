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

const MOCK_LOGIN_USER = {
  success: true,
  user: {
    id: 'ebd161f7-9301-4f78-baae-1100fba00e07',
    email: 'osama+500@quran.com',
    firstName: 'Eleanor',
    lastName: 'Gilliam',
    photoUrl: null,
    lastSyncAt: '2025-07-12T15:25:57.456Z',
    lastActiveAt: '2025-07-12T17:05:22.860Z',
    lastMutationAt: '2025-07-12T16:42:11.675Z',
    timezone: 'Africa/Cairo',
    registrationSource: 'Quran.com_web',
    username: 'lomev',
    isAdmin: false,
    isBanned: false,
    createdAt: '2025-07-12T08:03:11.494Z',
    features: null,
    consents: {},
  },
};

const AT_STAGING_COOKIE =
  'at_staging=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYmQxNjFmNy05MzAxLTRmNzgtYmFhZS0xMTAwZmJhMDBlMDciLCJhcyI6IkVNTCIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE3NTIzNDkzMTMsImV4cCI6MTc1MjM1MTExM30.MlDmz4CMqyDdkMDWbjCUhg2RLAfAdAQThgLGTXqf0qM; path=/; expires=Sat, 12 Jul 2025 20:12:23 GMT; samesite=lax; httponly';
const RT_STAGING_COOKIE =
  'rt_staging=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYmQxNjFmNy05MzAxLTRmNzgtYmFhZS0xMTAwZmJhMDBlMDciLCJhcyI6IkVNTCIsImlzQWRtaW4iOmZhbHNlLCJqdGkiOiJhODVkNGVkZi01ZGRiLTQ4N2ItYWI2MS1hY2Y1ODg5YjMwZjQiLCJpYXQiOjE3NTIzNDkzMTMsImV4cCI6MTc1NDk0MTMxM30.rCbOXjW7tjX_jZeb3GNhn5cQnm5vTVzswXqh4uUpoPw; path=/; expires=Mon, 11 Aug 2025 19:41:53 GMT; samesite=lax; httponly';
const ID_STAGING_COOKIE =
  'id_staging=ebd161f7-9301-4f78-baae-1100fba00e07; path=/; expires=Mon, 11 Aug 2025 19:41:53 GMT; samesite=lax';
const NOTIF_SUB_ID_STAGING_COOKIE =
  'notif_sub_id_staging=5910f6d161eb60f8828d54175c1cbb3863fcb7f422350c897fe599bb91878ad5; path=/; expires=Mon, 11 Aug 2025 19:41:53 GMT; samesite=lax';

// Helper function to create the login response
function createLoginResponse() {
  const response = new HttpResponse(JSON.stringify(MOCK_LOGIN_USER), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  response.headers.append('Set-Cookie', AT_STAGING_COOKIE);
  response.headers.append('Set-Cookie', RT_STAGING_COOKIE);
  response.headers.append('Set-Cookie', ID_STAGING_COOKIE);
  response.headers.append('Set-Cookie', NOTIF_SUB_ID_STAGING_COOKIE);

  return response;
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
  http.post('*/auth/users/signup', async ({ request }) => {
    const requestBody = await request.json();
    if (requestBody.verificationCode) {
      // User has submitted verification code, so we log them in
      return createLoginResponse();
    }
    // Initial signup request before verification
    return HttpResponse.json({
      success: true,
      message: 'Verification code sent',
    });
  }),

  http.post('*/auth/users/login', () => createLoginResponse()),

  http.get('*/api/proxy/auth/preferences', () => {
    return HttpResponse.json({ language: { language: 'en' } });
  }),

  http.post('*/api/proxy/auth/preferences', async ({ request }) => {
    const requestBody = await request.json();
    console.log('MSW: Intercepted preference update request with body:', requestBody);
    return HttpResponse.json({ success: true });
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
];

module.exports = {
  handlers,
  mockCountryLanguagePreferences,
};

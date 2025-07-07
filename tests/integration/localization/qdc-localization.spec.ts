/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react-func/max-lines-per-function */
/* eslint-disable max-lines */
import { test, expect, BrowserContext, Page } from '@playwright/test';

// Import the Homepage POM for reusable functionality
import Homepage from '../../POM/home-page';

// Add TypeScript declaration for window.__store
declare global {
  interface Window {
    __store?: any;
  }
}

/**
 * QDC Intelligent Localization Test Suite
 *
 * This test suite implements the comprehensive test plan for QDC's intelligent
 * localization feature as documented in qdc-localization-test-plan.md
 *
 * SSR API Mocking Strategy:
 * ========================
 * This test suite uses Playwright's route mocking to intercept SSR API calls.
 * The route mocking is set up in the test helper methods and intercepts API calls
 * made during server-side rendering, allowing us to test different language/country
 * combinations without hitting the real API.
 *
 * API calls are intercepted before each test navigation to ensure SSR gets the
 * mocked responses during the initial page load.
 *
 * To run these tests:
 * - yarn test:integration (runs all integration tests)
 * - yarn playwright test localization (runs only localization tests)
 *
 * The test server runs on http://localhost:3005
 */

// Test data constants
const SUPPORTED_LANGUAGES = {
  ENGLISH: 'en',
  ARABIC: 'ar',
  BENGALI: 'bn',
  PERSIAN: 'fa',
  FRENCH: 'fr',
  INDONESIAN: 'id',
  ITALIAN: 'it',
  DUTCH: 'nl',
  PORTUGUESE: 'pt',
  RUSSIAN: 'ru',
  ALBANIAN: 'sq',
  THAI: 'th',
  TURKISH: 'tr',
  URDU: 'ur',
  CHINESE: 'zh',
  MALAY: 'ms',
} as const;

const UNSUPPORTED_LANGUAGES = {
  JAPANESE: 'ja',
  KOREAN: 'ko',
  GERMAN: 'de',
  SPANISH: 'es',
  HEBREW: 'he',
  HINDI: 'hi',
} as const;

const TEST_COUNTRIES = {
  US: 'US',
  GB: 'GB',
  CA: 'CA',
  AU: 'AU',
  IN: 'IN',
  SA: 'SA',
  EG: 'EG',
  JP: 'JP',
  DE: 'DE',
} as const;

// Helper functions
class LocalizationTestHelper {
  private page: Page;

  public homepage: Homepage;

  private headers: Record<string, string> = {};

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.homepage = new Homepage(page, context);
  }

  /**
   * Simulate geolocation by overriding the browser's navigator.geolocation
   */
  async mockGeolocation(latitude: number, longitude: number) {
    await this.page.context().grantPermissions(['geolocation']);
    await this.page.context().setGeolocation({ latitude, longitude });
  }

  /**
   * Set browser language preferences
   */
  async setBrowserLanguage(locales: string[]) {
    const ACCEPT_LANGUAGE = 'Accept-Language';
    const languageHeader = locales.join(',');
    console.log('🔍 DEBUG: Setting browser language header:', languageHeader);

    this.headers[ACCEPT_LANGUAGE] = languageHeader;
    await this.page.setExtraHTTPHeaders(this.headers);

    // Set up API mocking with default country (US)
    const language = locales[0]?.split('-')[0] || 'en';
    const country = this.headers['CF-IPCountry'] || 'US';
    await this.setupApiMocking(language, country);
  }

  /**
   * Mock IP-based country detection by setting the CF-IPCountry header from Cloudflare
   */
  async mockCountryDetection(countryCode: string) {
    console.log('🔍 DEBUG: Setting CF-IPCountry header for country:', countryCode);

    // Set the CF-IPCountry header that Cloudflare would normally provide
    this.headers['CF-IPCountry'] = countryCode.toUpperCase();
    await this.page.setExtraHTTPHeaders(this.headers);

    // Set up API mocking with current language or default
    const acceptLanguage = this.headers['Accept-Language'] || 'en-US,en';
    const language = acceptLanguage.split(',')[0]?.split('-')[0] || 'en';
    await this.setupApiMocking(language, countryCode);
  }

  /**
   * Set both language and country headers together
   */
  async setLanguageAndCountry(locales: string[], countryCode: string) {
    const ACCEPT_LANGUAGE = 'Accept-Language';
    const languageHeader = locales.join(',');

    console.log('🔍 DEBUG: Setting browser language header:', languageHeader);
    console.log('🔍 DEBUG: Setting CF-IPCountry header for country:', countryCode);

    this.headers[ACCEPT_LANGUAGE] = languageHeader;
    this.headers['CF-IPCountry'] = countryCode.toUpperCase();
    await this.page.setExtraHTTPHeaders(this.headers);

    // Set up API route mocking for SSR calls
    await this.setupApiMocking(locales[0]?.split('-')[0] || 'en', countryCode);
  }

  /**
   * Set up API route mocking for country language preference
   */
  private async setupApiMocking(userDeviceLanguage: string, country: string) {
    const mockData = LocalizationTestHelper.getMockCountryLanguagePreference(
      userDeviceLanguage,
      country,
    );

    // Mock the country language preference API for SSR
    await this.page.route(
      '**/api/proxy/content/api/qdc/resources/country_language_preference*',
      async (route) => {
        console.log('🔍 Playwright: Intercepted country_language_preference API call');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockData),
        });
      },
    );
  }

  /**
   * Get mock data for country language preference based on language and country
   * @param {string} userDeviceLanguage The user's detected device language
   * @param {string} country The user's detected country
   * @returns {any} Mock data object for the API response
   */
  private static getMockCountryLanguagePreference(
    userDeviceLanguage: string,
    country: string,
  ): any {
    // Apply business logic: For non-English languages, ignore country and use US
    const isEnglish = userDeviceLanguage === 'en';
    const effectiveCountry = isEnglish ? country : 'US';

    // Mock data based on language and country combinations
    const mockDataMap: Record<string, any> = {
      EN_US: {
        country: 'US',
        userDeviceLanguage: 'en',
        defaultMushaf: { id: 1 },
        defaultTranslations: [{ id: 131 }],
        defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
        defaultWbwLanguage: { isoCode: 'en' },
        ayahReflectionsLanguages: [{ isoCode: 'en' }, { isoCode: 'ar' }, { isoCode: 'ur' }],
      },
      EN_GB: {
        country: 'GB',
        userDeviceLanguage: 'en',
        defaultMushaf: { id: 1 },
        defaultTranslations: [{ id: 20 }],
        defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
        defaultWbwLanguage: { isoCode: 'en' },
        ayahReflectionsLanguages: [{ isoCode: 'en' }, { isoCode: 'ar' }, { isoCode: 'ur' }],
      },
      EN_CA: {
        country: 'CA',
        userDeviceLanguage: 'en',
        defaultMushaf: { id: 1 },
        defaultTranslations: [{ id: 20 }],
        defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
        defaultWbwLanguage: { isoCode: 'en' },
        ayahReflectionsLanguages: [{ isoCode: 'en' }, { isoCode: 'ar' }, { isoCode: 'ur' }],
      },
      EN_AU: {
        country: 'AU',
        userDeviceLanguage: 'en',
        defaultMushaf: { id: 1 },
        defaultTranslations: [{ id: 131 }],
        defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
        defaultWbwLanguage: { isoCode: 'en' },
        ayahReflectionsLanguages: [{ isoCode: 'en' }, { isoCode: 'ar' }, { isoCode: 'ur' }],
      },
      EN_IN: {
        country: 'IN',
        userDeviceLanguage: 'en',
        defaultMushaf: { id: 1 },
        defaultTranslations: [{ id: 159 }],
        defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
        defaultWbwLanguage: { isoCode: 'en' },
        ayahReflectionsLanguages: [{ isoCode: 'en' }, { isoCode: 'ar' }, { isoCode: 'ur' }],
      },
      AR_US: {
        country: 'US',
        userDeviceLanguage: 'ar',
        defaultMushaf: { id: 2 },
        defaultTranslations: [{ id: 20 }],
        defaultTafsir: { id: 'ar-tafseer-al-tabari' },
        defaultWbwLanguage: { isoCode: 'ar' },
        ayahReflectionsLanguages: [{ isoCode: 'ar' }, { isoCode: 'en' }],
      },
    };

    const key = `${userDeviceLanguage.toUpperCase()}_${effectiveCountry.toUpperCase()}`;
    const mockData = mockDataMap[key];

    if (mockData) {
      console.log('🔍 Using mock data for:', key, mockData);
      return mockData;
    }

    // Default fallback
    console.log('🔍 Using default mock data for:', key);
    return {
      country: effectiveCountry || 'US',
      userDeviceLanguage: userDeviceLanguage || 'en',
      defaultMushaf: { id: 1 },
      defaultTranslations: [{ id: 131 }],
      defaultTafsir: { id: 'en-tafisr-ibn-kathir' },
      defaultWbwLanguage: { isoCode: 'en' },
      ayahReflectionsLanguages: [{ isoCode: 'en' }, { isoCode: 'ar' }, { isoCode: 'ur' }],
    };
  }

  /**
   * Clear all headers
   */
  async clearHeaders() {
    this.headers = {};
    await this.page.setExtraHTTPHeaders({});
  }

  /**
   * Get Redux state from localStorage
   * @returns {Promise<any>} The persisted defaultSettings state
   */
  async getReduxState(): Promise<any> {
    const persistedState = await this.homepage.getPersistedValue('defaultSettings');
    console.log('🔍 DEBUG: Raw persisted state from getPersistedValue:', persistedState);
    return persistedState;
  }

  /**
   * Verify default settings structure
   */
  async verifyDefaultSettingsStructure(expectedSettings: {
    detectedLanguage: string;
    detectedCountry: string;
    userHasCustomised: boolean;
    isUsingDefaultSettings: boolean;
  }) {
    const defaultSettings = await this.getReduxState();

    // Debug logging to see actual vs expected values
    console.log('🔍 DEBUG: Expected settings:', expectedSettings);
    console.log('🔍 DEBUG: Actual defaultSettings:', defaultSettings);
    console.log(
      '🔍 DEBUG: detectedLanguage - Expected:',
      expectedSettings.detectedLanguage,
      'Actual:',
      defaultSettings?.detectedLanguage,
    );
    console.log(
      '🔍 DEBUG: detectedCountry - Expected:',
      expectedSettings.detectedCountry,
      'Actual:',
      defaultSettings?.detectedCountry,
    );
    console.log(
      '🔍 DEBUG: userHasCustomised - Expected:',
      expectedSettings.userHasCustomised,
      'Actual:',
      defaultSettings?.userHasCustomised,
    );
    console.log(
      '🔍 DEBUG: isUsingDefaultSettings - Expected:',
      expectedSettings.isUsingDefaultSettings,
      'Actual:',
      defaultSettings?.isUsingDefaultSettings,
    );

    expect(defaultSettings).toBeDefined();
    expect(defaultSettings.detectedLanguage).toBe(expectedSettings.detectedLanguage);
    expect(defaultSettings.detectedCountry).toBe(expectedSettings.detectedCountry);
    expect(defaultSettings.userHasCustomised).toBe(expectedSettings.userHasCustomised);
    expect(defaultSettings.isUsingDefaultSettings).toBe(expectedSettings.isUsingDefaultSettings);
  }

  /**
   * Verify that 6 core settings are applied (Mushaf, Translation, Tafsir, WBW, Reciter, Reflections)
   */
  async verifyCoreSettingsAreApplied() {
    // Get all relevant settings from localStorage
    const translations = await this.homepage.getPersistedValue('translations');
    const tafsirs = await this.homepage.getPersistedValue('tafsirs');
    const readingPreferences = await this.homepage.getPersistedValue('readingPreferences');
    const quranReaderStyles = await this.homepage.getPersistedValue('quranReaderStyles');
    const defaultSettings = await this.homepage.getPersistedValue('defaultSettings');

    // Verify all 6 core settings exist
    expect(translations.selectedTranslations).toBeDefined();
    expect(tafsirs.selectedTafsirs).toBeDefined();
    expect(readingPreferences.selectedWordByWordLocale).toBeDefined();
    expect(quranReaderStyles.quranFont).toBeDefined();
    expect(quranReaderStyles.mushafLines).toBeDefined();
    expect(defaultSettings.ayahReflectionsLanguages).toBeDefined();

    // Verify array/settings are not empty
    expect(translations.selectedTranslations.length).toBeGreaterThan(0);
    expect(tafsirs.selectedTafsirs.length).toBeGreaterThan(0);
    expect(defaultSettings.ayahReflectionsLanguages.length).toBeGreaterThan(0);
  }

  /**
   * Clear all browser storage (cookies, localStorage, sessionStorage)
   */
  async clearAllBrowserData() {
    await this.page.context().clearCookies();
    await this.clearHeaders();

    // Safely clear localStorage and sessionStorage
    try {
      await this.page.evaluate(() => {
        if (typeof Storage !== 'undefined') {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch (error) {
            // Storage might not be available in some contexts
            console.warn('Could not clear storage:', error);
          }
        }
      });
    } catch (error) {
      // Page might not be ready for evaluation
      console.warn('Could not evaluate storage clearing:', error);
    }
  }

  /**
   * Wait for Redux hydration to complete
   */
  async waitForReduxHydration() {
    try {
      await this.page.waitForFunction(
        () => {
          try {
            if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
              return false;
            }

            const storage = localStorage.getItem('persist:root');
            if (!storage) return false;

            const parsed = JSON.parse(storage);
            const persistData = parsed._persist;
            if (!persistData) return false;

            const persistInfo = JSON.parse(persistData);
            return persistInfo.rehydrated === true;
          } catch {
            return false;
          }
        },
        { timeout: 15000 },
      );
    } catch (error) {
      // If Redux hydration fails, continue with test
      console.warn('Redux hydration timeout:', error);
    }
  }
}

// Test group: Category 1 - First-time Guest User Detection & Settings
test.describe('Category 1: First-time Guest User Detection & Settings', () => {
  let helper: LocalizationTestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new LocalizationTestHelper(page, context);
    await helper.clearAllBrowserData();
  });

  test('Test Case 1.1.1: English Device Language + US Country', async ({ page }) => {
    // MSW will automatically intercept the SSR API call based on headers
    await helper.setLanguageAndCountry(['en-US', 'en'], 'US');

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 300000 });

    await helper.waitForReduxHydration();

    // Verify Redux state shows correct detection
    await helper.verifyDefaultSettingsStructure({
      detectedLanguage: 'en',
      detectedCountry: 'US',
      userHasCustomised: false,
      isUsingDefaultSettings: true,
    });

    // Verify all 6 core settings are applied
    await helper.verifyCoreSettingsAreApplied();

    // Verify specific US preferences are applied
    const translations = await helper.homepage.getPersistedValue('translations');
    expect(translations.selectedTranslations).toContain(131);
    expect(translations.isUsingDefaultTranslations).toBe(true);
  });

  test('Test Case 1.1.2: English Device Language + Non-US Country (UK)', async ({ page }) => {
    await helper.setLanguageAndCountry(['en-GB', 'en'], 'GB');

    await page.goto('/');
    await helper.waitForReduxHydration();

    await helper.verifyDefaultSettingsStructure({
      detectedLanguage: 'en',
      detectedCountry: 'GB',
      userHasCustomised: false,
      isUsingDefaultSettings: true,
    });

    // Verify UK-specific translation is applied
    const translations = await helper.homepage.getPersistedValue('translations');
    expect(translations.selectedTranslations).toContain(20);
  });

  test('Test Case 1.2.1: Arabic Device Language + Any Country (Country Ignored)', async ({
    page,
  }) => {
    await helper.setBrowserLanguage(['ar-SA', 'ar']);

    const testCountries = ['EG', 'SA', 'GB'];
    for (const testCountry of testCountries) {
      await helper.mockCountryDetection(testCountry);
      await page.goto('/');
      await helper.waitForReduxHydration();

      // Verify Arabic is detected regardless of country
      const defaultSettings = await helper.getReduxState();
      expect(defaultSettings.detectedLanguage).toBe('ar');
      expect(defaultSettings.detectedCountry).toBe('US'); // Should always be US for non-English
    }
  });

  test('Test Case 1.2.2: All Supported Non-English Languages', async ({ page }) => {
    const supportedLanguagesData = [
      { code: SUPPORTED_LANGUAGES.BENGALI, locale: 'bn-BD', name: 'Bengali', translationId: 161 },
      { code: SUPPORTED_LANGUAGES.PERSIAN, locale: 'fa-IR', name: 'Persian', translationId: 135 },
      { code: SUPPORTED_LANGUAGES.FRENCH, locale: 'fr-FR', name: 'French', translationId: 136 },
      {
        code: SUPPORTED_LANGUAGES.INDONESIAN,
        locale: 'id-ID',
        name: 'Indonesian',
        translationId: 33,
      },
      { code: SUPPORTED_LANGUAGES.ITALIAN, locale: 'it-IT', name: 'Italian', translationId: 153 },
      { code: SUPPORTED_LANGUAGES.DUTCH, locale: 'nl-NL', name: 'Dutch', translationId: 144 },
      {
        code: SUPPORTED_LANGUAGES.PORTUGUESE,
        locale: 'pt-BR',
        name: 'Portuguese',
        translationId: 156,
      },
      { code: SUPPORTED_LANGUAGES.RUSSIAN, locale: 'ru-RU', name: 'Russian', translationId: 79 },
      { code: SUPPORTED_LANGUAGES.ALBANIAN, locale: 'sq-AL', name: 'Albanian', translationId: 89 },
      { code: SUPPORTED_LANGUAGES.THAI, locale: 'th-TH', name: 'Thai', translationId: 165 },
      { code: SUPPORTED_LANGUAGES.TURKISH, locale: 'tr-TR', name: 'Turkish', translationId: 77 },
      { code: SUPPORTED_LANGUAGES.URDU, locale: 'ur-PK', name: 'Urdu', translationId: 54 },
      { code: SUPPORTED_LANGUAGES.CHINESE, locale: 'zh-CN', name: 'Chinese', translationId: 109 },
      { code: SUPPORTED_LANGUAGES.MALAY, locale: 'ms-MY', name: 'Malay', translationId: 39 },
    ];

    for (const language of supportedLanguagesData) {
      await helper.clearAllBrowserData();
      await helper.setBrowserLanguage([language.locale, language.code]);
      await helper.mockCountryDetection('US');

      await page.goto('/');
      await helper.waitForReduxHydration();

      // Verify language is detected and country is ignored (defaults to US)
      await helper.verifyDefaultSettingsStructure({
        detectedLanguage: language.code,
        detectedCountry: 'US',
        userHasCustomised: false,
        isUsingDefaultSettings: true,
      });

      // Verify language-specific settings are applied
      await helper.verifyCoreSettingsAreApplied();
      const translations = await helper.homepage.getPersistedValue('translations');
      expect(translations.selectedTranslations).toContain(language.translationId);
    }
  });

  test('Test Case 1.1.3: English Device Language + Multiple Countries', async ({ page }) => {
    const countries = [
      { code: TEST_COUNTRIES.CA, translationId: 20 },
      { code: TEST_COUNTRIES.AU, translationId: 131 },
      { code: TEST_COUNTRIES.IN, translationId: 159 },
      { code: TEST_COUNTRIES.SA, translationId: 131 },
      { code: TEST_COUNTRIES.EG, translationId: 20 },
    ];

    for (const country of countries) {
      await helper.clearAllBrowserData();
      await helper.setBrowserLanguage(['en-US', 'en']);
      await helper.mockCountryDetection(country.code);

      await page.goto('/');
      await helper.waitForReduxHydration();

      await helper.verifyDefaultSettingsStructure({
        detectedLanguage: 'en',
        detectedCountry: country.code,
        userHasCustomised: false,
        isUsingDefaultSettings: true,
      });

      const translations = await helper.homepage.getPersistedValue('translations');
      expect(translations.selectedTranslations).toContain(country.translationId);
    }
  });

  test('Test Case 1.3.1: Unsupported Language + Country Fallback (Japanese -> English)', async ({
    page,
  }) => {
    await helper.setBrowserLanguage(['ja-JP', 'ja']);
    await helper.mockCountryDetection('JP');

    await page.goto('/');
    await helper.waitForReduxHydration();

    // Should fallback to English but preserve country
    await helper.verifyDefaultSettingsStructure({
      detectedLanguage: 'en',
      detectedCountry: 'JP',
      userHasCustomised: false,
      isUsingDefaultSettings: true,
    });
  });

  test('Test Case 1.3.2: Multiple Unsupported Languages Fallback', async ({ page }) => {
    const unsupportedLanguagesData = [
      { locale: 'ko-KR', language: UNSUPPORTED_LANGUAGES.KOREAN, country: 'KR' },
      { locale: 'de-DE', language: UNSUPPORTED_LANGUAGES.GERMAN, country: TEST_COUNTRIES.DE },
      { locale: 'es-ES', language: UNSUPPORTED_LANGUAGES.SPANISH, country: 'ES' },
      { locale: 'he-IL', language: UNSUPPORTED_LANGUAGES.HEBREW, country: 'IL' },
      { locale: 'hi-IN', language: UNSUPPORTED_LANGUAGES.HINDI, country: TEST_COUNTRIES.IN },
    ];

    for (const lang of unsupportedLanguagesData) {
      await helper.clearAllBrowserData();
      await helper.setBrowserLanguage([lang.locale, lang.language]);
      await helper.mockCountryDetection(lang.country);

      await page.goto('/');
      await helper.waitForReduxHydration();

      await helper.verifyDefaultSettingsStructure({
        detectedLanguage: 'en',
        detectedCountry: lang.country,
        userHasCustomised: false,
        isUsingDefaultSettings: true,
      });
    }
  });
});

// Test group: Category 2 - User Authentication & Settings Persistence
test.describe('Category 2: User Authentication & Settings Persistence', () => {
  let helper: LocalizationTestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new LocalizationTestHelper(page, context);
    await helper.clearAllBrowserData();
  });

  test('Test Case 2.1.1: Guest Settings Preservation on Signup', async ({ page }) => {
    // Start as guest with detected Arabic settings
    await helper.setBrowserLanguage(['ar-SA', 'ar']);
    await helper.mockCountryDetection('US');

    await page.goto('/');
    await helper.waitForReduxHydration();

    // Verify initial guest settings
    let defaultSettings = await helper.getReduxState();
    expect(defaultSettings.detectedLanguage).toBe('ar');
    expect(defaultSettings.userHasCustomised).toBe(false);

    const guestTranslations = await helper.homepage.getPersistedValue('translations');
    expect(guestTranslations.selectedTranslations).toContain(20);

    // Simulate user signup/registration flow
    // Navigate to signup page
    await page.goto('/login');
    await page.locator('[data-testid="signup-tab"]').click();

    // Fill signup form (mock implementation)
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');

    // Mock successful signup API response
    await page.route('**/api/auth/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'test-user-123', email: 'test@example.com' },
        }),
      });
    });

    await page.locator('[data-testid="signup-submit"]').click();
    await page.waitForURL('/');
    await helper.waitForReduxHydration();

    // Verify guest settings are preserved after signup
    defaultSettings = await helper.getReduxState();
    expect(defaultSettings.detectedLanguage).toBe('ar');
    expect(defaultSettings.userHasCustomised).toBe(false);

    const postSignupTranslations = await helper.homepage.getPersistedValue('translations');
    expect(postSignupTranslations.selectedTranslations).toContain(20);
  });

  test('Test Case 2.1.2: Modified Guest Settings on Signup', async ({ page }) => {
    // Start as guest with initial settings
    await helper.setBrowserLanguage(['en-US', 'en']);
    await helper.mockCountryDetection('US');

    await page.goto('/');
    await helper.waitForReduxHydration();

    // Modify settings as guest
    await helper.homepage.openSettingsDrawer();
    await expect(page.locator('[data-testid="settings-drawer"]')).toBeVisible();

    // Simulate custom translation selection
    await page.evaluate(() => {
      window.__store?.dispatch({
        type: 'translations/setSelectedTranslations',
        payload: { translations: [20], locale: 'en' },
      });
    });

    await page.waitForTimeout(1000);

    // Verify user has customized settings
    let defaultSettings = await helper.getReduxState();
    expect(defaultSettings.userHasCustomised).toBe(true);

    await page.keyboard.press('Escape'); // Close settings drawer

    // Proceed with signup
    await page.goto('/login');
    await page.locator('[data-testid="signup-tab"]').click();
    await page.fill('[data-testid="email-input"]', 'customuser@example.com');
    await page.fill('[data-testid="password-input"]', 'custompass123');

    await page.route('**/api/auth/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'custom-user-123', email: 'customuser@example.com' },
        }),
      });
    });

    await page.locator('[data-testid="signup-submit"]').click();
    await page.waitForURL('/');
    await helper.waitForReduxHydration();

    // Verify customized settings are preserved
    defaultSettings = await helper.getReduxState();
    expect(defaultSettings.userHasCustomised).toBe(true);

    const customTranslations = await helper.homepage.getPersistedValue('translations');
    expect(customTranslations.selectedTranslations).toContain(20);
  });

  test('Test Case 2.2.1: User with Saved Settings Login', async ({ page }) => {
    // Mock user with existing saved settings
    const savedUserSettings = {
      translations: { selectedTranslations: [159], isUsingDefaultTranslations: false },
      tafsirs: { selectedTafsirs: ['en-tafisr-ibn-kathir'] },
      readingPreferences: { selectedWordByWordLocale: 'ur' },
      defaultSettings: {
        detectedLanguage: 'ur',
        detectedCountry: 'PK',
        userHasCustomised: true,
        isUsingDefaultSettings: false,
      },
    };

    // Mock login API response with saved settings
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'existing-user-123',
            email: 'existing@example.com',
            settings: savedUserSettings,
          },
        }),
      });
    });

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'existing@example.com');
    await page.fill('[data-testid="password-input"]', 'existingpass123');
    await page.locator('[data-testid="login-submit"]').click();

    await page.waitForURL('/');
    await helper.waitForReduxHydration();

    // Verify saved settings are loaded
    const defaultSettings = await helper.getReduxState();
    expect(defaultSettings.detectedLanguage).toBe('ur');
    expect(defaultSettings.detectedCountry).toBe('PK');
    expect(defaultSettings.userHasCustomised).toBe(true);
    expect(defaultSettings.isUsingDefaultSettings).toBe(false);

    const translations = await helper.homepage.getPersistedValue('translations');
    expect(translations.selectedTranslations).toContain(159);
    expect(translations.isUsingDefaultTranslations).toBe(false);
  });

  test('Test Case 2.2.2: User with No Saved Settings Login', async ({ page }) => {
    // Mock user with no saved settings
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'new-user-123',
            email: 'newuser@example.com',
            settings: null, // No saved settings
          },
        }),
      });
    });

    // Mock fresh detection for the new user
    await helper.setBrowserLanguage(['en-CA', 'en']);
    await helper.mockCountryDetection('CA');

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.fill('[data-testid="password-input"]', 'newpass123');
    await page.locator('[data-testid="login-submit"]').click();

    await page.waitForURL('/');
    await helper.waitForReduxHydration();

    // Verify fresh detection runs and appropriate defaults are applied
    const defaultSettings = await helper.getReduxState();
    expect(defaultSettings.detectedLanguage).toBe('en');
    expect(defaultSettings.detectedCountry).toBe('CA');
    expect(defaultSettings.userHasCustomised).toBe(false);
    expect(defaultSettings.isUsingDefaultSettings).toBe(true);

    const translations = await helper.homepage.getPersistedValue('translations');
    expect(translations.selectedTranslations).toContain(20); // Canada-specific default
  });
});

// Test group: Category 3 - Language Selector Behavior
test.describe('Category 3: Language Selector Behavior', () => {
  let helper: LocalizationTestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new LocalizationTestHelper(page, context);
    await helper.clearAllBrowserData();
  });

  test('Test Case 3.1.1: Language Change with Unmodified Settings (Arabic to English)', async ({
    page,
  }) => {
    // Start with Arabic detection
    await helper.setBrowserLanguage(['ar-SA', 'ar']);
    await helper.mockCountryDetection('US');

    await page.goto('/');
    await helper.waitForReduxHydration();

    // Verify initial Arabic settings
    let defaultSettings = await helper.getReduxState();
    expect(defaultSettings.detectedLanguage).toBe('ar');
    expect(defaultSettings.userHasCustomised).toBe(false);

    // Mock English preferences for language switch
    // Click language selector and switch to English
    await page.locator('[aria-label="Select Language"]').click();
    await expect(page.locator('div[role="menuitem"]:has-text("English")')).toBeVisible();

    await Promise.all([page.waitForURL('/'), page.locator('text=English').click()]);

    await helper.waitForReduxHydration();

    // Verify settings changed to English defaults
    defaultSettings = await helper.getReduxState();
    expect(defaultSettings.detectedLanguage).toBe('en');
    expect(defaultSettings.userHasCustomised).toBe(false); // Should remain false

    const translations = await helper.homepage.getPersistedValue('translations');
    expect(translations.selectedTranslations).toContain(131); // English default
  });

  test('Test Case 3.1.2: Switch to Supported Non-English Language', async ({ page }) => {
    // Start with English detection
    await helper.setBrowserLanguage(['en-US', 'en']);
    await helper.mockCountryDetection('US');

    await page.goto('/');
    await helper.waitForReduxHydration();

    // Verify initial English settings
    let defaultSettings = await helper.getReduxState();
    expect(defaultSettings.detectedLanguage).toBe('en');
    expect(defaultSettings.userHasCustomised).toBe(false);

    // Mock Arabic preferences for language switch
    // Click language selector and switch to Arabic
    await page.locator('[aria-label="Select Language"]').click();
    await expect(page.locator('div[role="menuitem"]:has-text("العربية")')).toBeVisible();

    await Promise.all([page.waitForURL('/ar'), page.locator('text=العربية').click()]);

    await helper.waitForReduxHydration();

    // Verify settings changed to Arabic defaults
    defaultSettings = await helper.getReduxState();
    expect(defaultSettings.detectedLanguage).toBe('ar');
    expect(defaultSettings.detectedCountry).toBe('US'); // Country ignored for non-English
    expect(defaultSettings.userHasCustomised).toBe(false); // Should remain false

    const translations = await helper.homepage.getPersistedValue('translations');
    expect(translations.selectedTranslations).toContain(20); // Arabic default
  });

  test('Test Case 3.2.1: Language Change Preserves User Customizations', async ({ page }) => {
    // Start with English detection
    await helper.setBrowserLanguage(['en-US', 'en']);
    await helper.mockCountryDetection('US');

    await page.goto('/');
    await helper.waitForReduxHydration();

    // Open settings and make customizations
    await helper.homepage.openSettingsDrawer();

    // Wait for settings drawer to be visible
    await expect(page.locator('[data-testid="settings-drawer"]')).toBeVisible();

    // Customize translation (simulate clicking on a different translation)
    // This is a placeholder - you'd need to implement actual translation selection logic
    await page.evaluate(() => {
      // Simulate Redux dispatch to change translation
      window.__store?.dispatch({
        type: 'translations/setSelectedTranslations',
        payload: { translations: [20], locale: 'en' },
      });
    });

    await page.waitForTimeout(1000); // Allow state to update

    // Verify user has customized
    let defaultSettings = await helper.getReduxState();
    expect(defaultSettings.userHasCustomised).toBe(true);

    // Close settings drawer
    await page.keyboard.press('Escape');

    // Mock Arabic preferences for language switch
    // Switch to Arabic
    await page.locator('[aria-label="Select Language"]').click();
    await Promise.all([page.waitForURL('/ar'), page.locator('text=العربية').click()]);

    await helper.waitForReduxHydration();

    // Verify userHasCustomised is preserved
    defaultSettings = await helper.getReduxState();
    expect(defaultSettings.userHasCustomised).toBe(true);

    // Verify custom translation is preserved (translation 20 should still be selected)
    const translations = await helper.homepage.getPersistedValue('translations');
    expect(translations.selectedTranslations).toContain(20);
  });
});

// Test group: Category 4 - Reset Settings Functionality
test.describe('Category 4: Reset Settings Functionality', () => {
  let helper: LocalizationTestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new LocalizationTestHelper(page, context);
    await helper.clearAllBrowserData();
  });

  test('Test Case 4.1: Settings Reset for Guest Users', async ({ page }) => {
    await helper.setBrowserLanguage(['en-US', 'en']);
    await helper.mockCountryDetection('US');

    await page.goto('/');
    await helper.waitForReduxHydration();

    // Modify settings manually
    await helper.homepage.openSettingsDrawer();
    await expect(page.locator('[data-testid="settings-drawer"]')).toBeVisible();

    // Simulate settings modification
    await page.evaluate(() => {
      window.__store?.dispatch({
        type: 'translations/setSelectedTranslations',
        payload: { translations: [20], locale: 'en' },
      });
    });

    await page.waitForTimeout(1000);

    // Verify user has customized
    let defaultSettings = await helper.getReduxState();
    expect(defaultSettings.userHasCustomised).toBe(true);

    // Click Reset to defaults button
    await page.locator('text=Reset to defaults').click();
    await page.waitForTimeout(2000); // Allow reset to complete

    // Verify fresh detection and reset
    defaultSettings = await helper.getReduxState();
    expect(defaultSettings.userHasCustomised).toBe(false);
    expect(defaultSettings.isUsingDefaultSettings).toBe(true);

    // Verify settings are back to defaults
    const translations = await helper.homepage.getPersistedValue('translations');
    expect(translations.selectedTranslations).toContain(131); // Back to default
  });

  test('Test Case 4.2: Settings Reset for Logged-in Users', async ({ page }) => {
    // Mock user login with custom settings
    const savedUserSettings = {
      translations: { selectedTranslations: [20], isUsingDefaultTranslations: false },
      tafsirs: { selectedTafsirs: ['ar-tafseer-al-tabari'] },
      readingPreferences: { selectedWordByWordLocale: 'ar' },
      defaultSettings: {
        detectedLanguage: 'ar',
        detectedCountry: 'US',
        userHasCustomised: true,
        isUsingDefaultSettings: false,
      },
    };

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'logged-user-123',
            email: 'logged@example.com',
            settings: savedUserSettings,
          },
        }),
      });
    });

    // Mock fresh detection preferences for reset
    await helper.setBrowserLanguage(['en-US', 'en']);
    await helper.mockCountryDetection('US');

    // Mock settings update API for reset
    await page.route('**/api/user/settings', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // Login user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'logged@example.com');
    await page.fill('[data-testid="password-input"]', 'loggedpass123');
    await page.locator('[data-testid="login-submit"]').click();

    await page.waitForURL('/');
    await helper.waitForReduxHydration();

    // Verify user has custom settings
    let defaultSettings = await helper.getReduxState();
    expect(defaultSettings.userHasCustomised).toBe(true);
    expect(defaultSettings.detectedLanguage).toBe('ar');

    // Open settings and click Reset to defaults
    await helper.homepage.openSettingsDrawer();
    await expect(page.locator('[data-testid="settings-drawer"]')).toBeVisible();

    await page.locator('text=Reset to defaults').click();
    await page.waitForTimeout(2000); // Allow reset to complete

    // Verify fresh detection and reset
    defaultSettings = await helper.getReduxState();
    expect(defaultSettings.userHasCustomised).toBe(false);
    expect(defaultSettings.isUsingDefaultSettings).toBe(true);
    expect(defaultSettings.detectedLanguage).toBe('en'); // Should detect fresh

    // Verify new defaults are applied
    const translations = await helper.homepage.getPersistedValue('translations');
    expect(translations.selectedTranslations).toContain(131); // New default
    expect(translations.isUsingDefaultTranslations).toBe(true);
  });
});

// Test group: Category 5 - Reflections Language Integration
test.describe('Category 5: Reflections Language Integration', () => {
  let helper: LocalizationTestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new LocalizationTestHelper(page, context);
    await helper.clearAllBrowserData();
  });

  test('Test Case 5.1: Reflections List Language Matching', async ({ page }) => {
    // Set up user with specific reflection languages in country preferences
    await helper.setBrowserLanguage(['en-US', 'en']);
    await helper.mockCountryDetection('US');

    // Mock reflections API to return sample reflection data
    await page.route('**/api/verses/1:1/reflections*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reflections: [
            { id: 1, text: 'English reflection', language: 'en' },
            { id: 2, text: 'تأمل عربي', language: 'ar' },
            { id: 3, text: 'اردو تأمل', language: 'ur' },
            { id: 4, text: 'French reflection', language: 'fr' }, // Should not appear
          ],
        }),
      });
    });

    await page.goto('/');
    await helper.waitForReduxHydration();

    // Navigate to a verse with reflections
    await page.goto('/1/1'); // Al-Fatiha verse 1
    await page.waitForLoadState('networkidle');

    // Open ayah-level reflections
    await page.locator('[data-testid="verse-actions"]').first().click();
    await page.locator('[data-testid="reflections-button"]').click();

    // Wait for reflections modal/drawer to be visible
    await expect(page.locator('[data-testid="reflections-modal"]')).toBeVisible();

    // Verify language filter shows only preset languages
    const languageFilter = page.locator('[data-testid="reflections-language-filter"]');
    await expect(languageFilter).toBeVisible();

    // Check that only English, Arabic, and Urdu options are available
    await languageFilter.click();
    await expect(page.locator('[data-testid="language-option-en"]')).toBeVisible();
    await expect(page.locator('[data-testid="language-option-ar"]')).toBeVisible();
    await expect(page.locator('[data-testid="language-option-ur"]')).toBeVisible();

    // Verify French is NOT available (not in preset languages)
    await expect(page.locator('[data-testid="language-option-fr"]')).not.toBeVisible();

    // Test filtering by each preset language
    await page.locator('[data-testid="language-option-en"]').click();
    await expect(page.locator('text=English reflection')).toBeVisible();
    await expect(page.locator('text=تأمل عربي')).not.toBeVisible();

    await languageFilter.click();
    await page.locator('[data-testid="language-option-ar"]').click();
    await expect(page.locator('text=تأمل عربي')).toBeVisible();
    await expect(page.locator('text=English reflection')).not.toBeVisible();

    await languageFilter.click();
    await page.locator('[data-testid="language-option-ur"]').click();
    await expect(page.locator('text=اردو تأمل')).toBeVisible();
    await expect(page.locator('text=English reflection')).not.toBeVisible();

    // Verify all preset languages show when "All" is selected
    await languageFilter.click();
    await page.locator('[data-testid="language-option-all"]').click();
    await expect(page.locator('text=English reflection')).toBeVisible();
    await expect(page.locator('text=تأمل عربي')).toBeVisible();
    await expect(page.locator('text=اردو تأمل')).toBeVisible();
    // French reflection should still not be visible
    await expect(page.locator('text=French reflection')).not.toBeVisible();
  });

  test('Test Case 5.1.2: Reflections Language Updates with Settings Change', async ({ page }) => {
    // Start with English settings
    await helper.setBrowserLanguage(['en-US', 'en']);
    await helper.mockCountryDetection('US');

    await page.goto('/');
    await helper.waitForReduxHydration();

    // Manually update reflection languages in settings
    await helper.homepage.openSettingsDrawer();
    await expect(page.locator('[data-testid="settings-drawer"]')).toBeVisible();

    // Add Arabic to reflection languages
    await page.evaluate(() => {
      window.__store?.dispatch({
        type: 'defaultSettings/updateAyahReflectionsLanguages',
        payload: [
          { isoCode: 'en', name: 'English' },
          { isoCode: 'ar', name: 'العربية' },
        ],
      });
    });

    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape'); // Close settings

    // Navigate to verse page
    await page.goto('/1/1');
    await page.waitForLoadState('networkidle');

    // Mock updated reflections API
    await page.route('**/api/verses/1:1/reflections*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reflections: [
            { id: 1, text: 'English reflection', language: 'en' },
            { id: 2, text: 'تأمل عربي', language: 'ar' },
            { id: 3, text: 'French reflection', language: 'fr' },
          ],
        }),
      });
    });

    // Open reflections
    await page.locator('[data-testid="verse-actions"]').first().click();
    await page.locator('[data-testid="reflections-button"]').click();
    await expect(page.locator('[data-testid="reflections-modal"]')).toBeVisible();

    // Verify updated language options
    const languageFilter = page.locator('[data-testid="reflections-language-filter"]');
    await languageFilter.click();

    // Should show English and Arabic (from updated settings)
    await expect(page.locator('[data-testid="language-option-en"]')).toBeVisible();
    await expect(page.locator('[data-testid="language-option-ar"]')).toBeVisible();

    // Should NOT show French (not in user's reflection language settings)
    await expect(page.locator('[data-testid="language-option-fr"]')).not.toBeVisible();
  });
});

// Test group: Category 6 - Error Handling & Edge Cases
test.describe('Category 6: Error Handling & Edge Cases', () => {
  let helper: LocalizationTestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new LocalizationTestHelper(page, context);
    await helper.clearAllBrowserData();
  });

  test('Test Case 6.1.1: Network Failure During Detection (Graceful Degradation)', async ({
    page,
  }) => {
    // Mock network failure for country preference API
    await page.route('**/resources/country_language_preference*', async (route) => {
      await route.abort('failed');
    });

    await helper.setBrowserLanguage(['en-US', 'en']);
    await helper.mockCountryDetection('US');

    // Navigate to homepage - should still load despite API failure
    await page.goto('/');

    // Page should load successfully
    await expect(page.locator('body')).toBeVisible();

    // Should fallback to locale-based defaults
    await helper.waitForReduxHydration();
    await helper.verifyCoreSettingsAreApplied();

    // No user-facing errors should be visible
    await expect(page.locator('text=Error')).not.toBeVisible();
    await expect(page.locator('text=Failed')).not.toBeVisible();
  });

  test('Test Case 6.1.2: Invalid Country/Language Combinations', async ({ page }) => {
    // Mock API returning error for invalid language/country combination
    await page.route('**/resources/country_language_preference*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid language/country combination',
          code: 'INVALID_COMBINATION',
        }),
      });
    });

    // Set unusual language/country combination
    await helper.setBrowserLanguage(['xx-YY', 'xx']); // Invalid language code
    await helper.mockCountryDetection('YY'); // Invalid country code

    // Navigate to homepage - should still load despite API error
    await page.goto('/');

    // Page should load successfully with fallback behavior
    await expect(page.locator('body')).toBeVisible();
    await helper.waitForReduxHydration();

    // Should fallback to safe defaults
    await helper.verifyCoreSettingsAreApplied();

    // No user-facing errors should be visible
    await expect(page.locator('text=Error')).not.toBeVisible();
    await expect(page.locator('text=Invalid')).not.toBeVisible();

    // Should likely fallback to English defaults
    const defaultSettings = await helper.getReduxState();
    expect(defaultSettings).toBeDefined();
    expect(defaultSettings.detectedLanguage).toBeTruthy();
  });

  test('Test Case 6.2.1: Missing Accept-Language Header', async ({ page }) => {
    // Don't set Accept-Language header
    await helper.mockCountryDetection('US');

    await page.goto('/');
    await helper.waitForReduxHydration();

    // Should fallback to English
    await helper.verifyDefaultSettingsStructure({
      detectedLanguage: 'en',
      detectedCountry: 'US',
      userHasCustomised: false,
      isUsingDefaultSettings: true,
    });
  });

  test('Test Case 6.2.2: Malformed Language Headers', async ({ page }) => {
    // Set malformed Accept-Language headers
    const ACCEPT_LANGUAGE = 'Accept-Language';
    await page.setExtraHTTPHeaders({
      [ACCEPT_LANGUAGE]: 'invalid-format, malformed;q=notanumber',
    });

    await helper.mockCountryDetection('US');

    await page.goto('/');

    // Should not crash and should fallback gracefully
    await expect(page.locator('body')).toBeVisible();
    await helper.waitForReduxHydration();

    // Should use fallback defaults
    const defaultSettings = await helper.getReduxState();
    expect(defaultSettings).toBeDefined();
    expect(defaultSettings.detectedLanguage).toBe('en');
  });
});

// Test group: Category 7 - Session Persistence
test.describe('Category 7: Session Persistence', () => {
  let helper: LocalizationTestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new LocalizationTestHelper(page, context);
    await helper.clearAllBrowserData();
  });

  test('Test Case 7.2: Session Persistence Across Browser Restarts', async ({ page, context }) => {
    await helper.setBrowserLanguage(['en-US', 'en']);
    await helper.mockCountryDetection('US');

    // Set initial settings
    await page.goto('/');
    await helper.waitForReduxHydration();

    // Customize settings
    await helper.homepage.openSettingsDrawer();
    await page.evaluate(() => {
      window.__store?.dispatch({
        type: 'translations/setSelectedTranslations',
        payload: { translations: [20], locale: 'en' },
      });
    });

    await page.waitForTimeout(1000);

    // Get settings before "restart"
    const settingsBeforeRestart = await helper.homepage.getPersistedValue('translations');
    expect(settingsBeforeRestart.selectedTranslations).toContain(20);

    // Simulate browser restart by creating new page with same context
    const newPage = await context.newPage();
    const newHelper = new LocalizationTestHelper(newPage, context);

    // Mock the same APIs for the new session
    await newHelper.setBrowserLanguage(['en-US', 'en']);
    await newHelper.mockCountryDetection('US');

    await newPage.goto('/');
    await newHelper.waitForReduxHydration();

    // Verify settings persisted across "restart"
    const settingsAfterRestart = await newHelper.homepage.getPersistedValue('translations');
    expect(settingsAfterRestart.selectedTranslations).toContain(20);

    // Verify Redux rehydrated correctly
    const defaultSettings = await newHelper.getReduxState();
    expect(defaultSettings.userHasCustomised).toBe(true);

    await newPage.close();
  });
});

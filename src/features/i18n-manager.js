/**
 * Multi-Language i18n Manager (Feature #12)
 * Manages internationalization and localization
 */

class I18nManager {
  constructor(options = {}) {
    this.defaultLanguage = options.defaultLanguage || 'en';
    this.supportedLanguages = options.supportedLanguages || ['en', 'es', 'fr', 'de', 'ja', 'zh'];
    this.translations = new Map();
    this.fallbackLanguage = options.fallbackLanguage || 'en';
  }

  /**
   * Register translation strings
   */
  registerTranslations(language, translations) {
    if (!this.supportedLanguages.includes(language)) {
      throw new Error(`Language ${language} not supported`);
    }
    this.translations.set(language, translations);
  }

  /**
   * Get translation string
   */
  t(key, language = null, defaultValue = key) {
    const lang = language || this.defaultLanguage;
    const translations = this.translations.get(lang);

    if (!translations) {
      // Fall back to default language
      const fallbackTranslations = this.translations.get(this.fallbackLanguage);
      if (fallbackTranslations && fallbackTranslations[key]) {
        return fallbackTranslations[key];
      }
      return defaultValue;
    }

    return translations[key] || defaultValue;
  }

  /**
   * Pluralize string based on count
   */
  plural(key, count, language = null) {
    const lang = language || this.defaultLanguage;
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`;
    return this.t(pluralKey, lang, key);
  }

  /**
   * Format date based on language
   */
  formatDate(date, language = null) {
    const lang = language || this.defaultLanguage;
    const options = {
      en: { year: 'numeric', month: 'long', day: 'numeric' },
      es: { year: 'numeric', month: 'long', day: 'numeric' },
      fr: { year: 'numeric', month: 'long', day: 'numeric' },
      de: { year: 'numeric', month: 'long', day: 'numeric' },
      ja: { year: 'numeric', month: 'numeric', day: 'numeric' },
      zh: { year: 'numeric', month: 'numeric', day: 'numeric' },
    };

    return new Intl.DateTimeFormat(lang, options[lang]).format(date);
  }

  /**
   * Format currency based on language
   */
  formatCurrency(amount, currency = 'USD', language = null) {
    const lang = language || this.defaultLanguage;
    const langMap = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      ja: 'ja-JP',
      zh: 'zh-CN',
    };

    return new Intl.NumberFormat(langMap[lang], {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

module.exports = I18nManager;

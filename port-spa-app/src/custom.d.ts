import 'react-i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    // Allow any keys so we don't need to update this file for every new translation key
    resources: { translation: Record<string, any> };
  }
}


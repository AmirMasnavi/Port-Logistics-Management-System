// Lightweight wrapper to access the i18n instance directly without pulling in the heavy react-i18next types
import i18nImported from './i18n';

// Treat the imported i18n as `any` to avoid TypeScript instantiation issues
const i18n: any = i18nImported as any;

export const t = (key: string) => (i18n.t as any)(key);
export const changeLanguage = (lang: string) => (i18n.changeLanguage as any)(lang);
export default i18n;

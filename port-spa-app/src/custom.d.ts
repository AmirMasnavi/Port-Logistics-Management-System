import 'react-i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: {
        language: {
          english: string;
          portuguese: string;
        };
        brand: {
          title: string;
          subtitle: string;
        };
        nav: {
          dashboard: string;
          vesselTypes: string;
          vesselVisits: string;
        };
        loading: string;
        search: {
          placeholder: string;
        };
        button: {
          new: string;
          logout: string;
          login: string;
        };
        greeting: {
          hello: string;
        };
      };
    };
  }
}


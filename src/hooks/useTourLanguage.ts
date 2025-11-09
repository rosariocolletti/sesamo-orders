import { useState, useEffect } from 'react';
import { Language } from '../constants/tourSteps';

export function useTourLanguage() {
  const [language, setLanguage] = useState<Language>('en');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('tourLanguage') as Language | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
      setIsLanguageSelected(true);
    }
  }, []);

  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('tourLanguage', lang);
    setIsLanguageSelected(true);
  };

  return {
    language,
    isLanguageSelected,
    selectLanguage,
  };
}

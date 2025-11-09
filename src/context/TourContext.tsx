import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '../constants/tourSteps';

interface TourContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  isLanguageSelected: boolean;
  setIsLanguageSelected: (selected: boolean) => void;
  showTour: boolean;
  setShowTour: (show: boolean) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const value: TourContextType = {
    language,
    setLanguage,
    isLanguageSelected,
    setIsLanguageSelected,
    showTour,
    setShowTour,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
}

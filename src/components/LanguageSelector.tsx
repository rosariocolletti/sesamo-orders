import React from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../constants/tourSteps';

interface LanguageSelectorProps {
  onSelectLanguage: (language: Language) => void;
}

export function LanguageSelector({ onSelectLanguage }: LanguageSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
        <div className="flex items-center justify-center mb-6">
          <Globe className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Select Language</h2>
        </div>

        <p className="text-gray-600 text-center mb-8">
          Choose your preferred language for the tour
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onSelectLanguage('en')}
            className="w-full px-6 py-4 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            English
          </button>

          <button
            onClick={() => onSelectLanguage('cs')}
            className="w-full px-6 py-4 text-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors duration-200"
          >
            Čeština
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          You can change this later from the Help menu
        </p>
      </div>
    </div>
  );
}

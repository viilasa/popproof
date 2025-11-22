import React from 'react';
import { HelpCircle } from 'lucide-react';

export function HelpButton() {
  return (
    <button className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-30 touch-manipulation">
      <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
  );
}
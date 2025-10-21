import React from 'react';
import { HelpCircle } from 'lucide-react';

export function HelpButton() {
  return (
    <button className="fixed bottom-6 right-6 w-12 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50">
      <HelpCircle className="w-6 h-6" />
    </button>
  );
}
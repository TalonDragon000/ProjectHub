/**
 * Shared card styling constants for consistent card components
 */

export const cardBaseClasses = 
  'bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 group';

export const cardLinkClasses = 
  `block ${cardBaseClasses}`;

export const cardFlexClasses = 
  `${cardBaseClasses} flex flex-col`;

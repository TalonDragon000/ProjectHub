/**
 * Project category constants
 * Single source of truth for all project categories across the application
 */

export const PROJECT_CATEGORIES = [
  'all',
  'games',
  'saas',
  'tools',
  'apps',
  'design',
  'other',
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/**
 * Category display labels (for future use with internationalization)
 */
export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  games: 'Games',
  saas: 'SaaS',
  tools: 'Tools',
  apps: 'Apps',
  design: 'Design',
  other: 'Other',
};

export const PHI = 1.618033988749895;
export const PHI_INVERSE = 0.6180339887498948;

export const GRID_UNIT = 4;

export const GOLDEN_DIMENSIONS = {
  hero: {
    recommended: { width: 1296, height: 800, ratio: 1.62 },
    minimum: { width: 648, height: 400, ratio: 1.62 },
    alternative: { width: 1280, height: 720, ratio: 1.78 },
  },
  card: {
    width: 324,
    height: 200,
    ratio: 1.62,
  },
  pageHero: {
    height: 400,
  },
};

export function snapToGrid(value: number, unit: number = GRID_UNIT): number {
  return Math.round(value / unit) * unit;
}

export function isOnGrid(value: number, unit: number = GRID_UNIT): boolean {
  return value % unit === 0;
}

export function getGoldenRatio(value: number): number {
  return value * PHI;
}

export function getInverseGoldenRatio(value: number): number {
  return value * PHI_INVERSE;
}

export function isGoldenRatio(width: number, height: number, tolerance: number = 0.1): boolean {
  const ratio = width / height;
  return Math.abs(ratio - PHI) <= tolerance;
}

export function getAspectRatio(width: number, height: number): number {
  return width / height;
}

export function validateHeroImageDimensions(width: number, height: number): {
  isValid: boolean;
  isGolden: boolean;
  isOnGrid: boolean;
  ratio: number;
  warning?: string;
  quality: 'perfect' | 'excellent' | 'good' | 'acceptable' | 'poor';
} {
  const ratio = getAspectRatio(width, height);
  const isGolden = isGoldenRatio(width, height, 0.05);
  const isGridAligned = isOnGrid(width) && isOnGrid(height);

  let quality: 'perfect' | 'excellent' | 'good' | 'acceptable' | 'poor' = 'good';
  let warning: string | undefined;

  if (width < 648 || height < 400) {
    quality = 'poor';
    warning = 'Image is smaller than recommended minimum (648 x 400px). Quality may be reduced.';
  } else if (ratio < 1.5 || ratio > 2.5) {
    quality = 'acceptable';
    warning = 'Image aspect ratio is outside recommended range (1.5:1 to 2.5:1). It may be cropped unexpectedly.';
  } else if (isGolden && isGridAligned) {
    quality = 'perfect';
  } else if (isGolden) {
    quality = 'excellent';
  } else if (ratio >= 1.5 && ratio <= 1.75 && isGridAligned) {
    quality = 'excellent';
  } else if (ratio >= 1.5 && ratio <= 1.75) {
    quality = 'good';
  }

  return {
    isValid: width >= 648 && height >= 400,
    isGolden,
    isOnGrid: isGridAligned,
    ratio,
    warning,
    quality,
  };
}

export function getGoldenSpacing(multiplier: number = 1): number {
  return snapToGrid(16 * PHI * multiplier);
}

export function formatDimensions(width: number, height: number): string {
  return `${width} × ${height}px (${getAspectRatio(width, height).toFixed(2)}:1)`;
}

/**
 * Privacy-first analytics - stores counts locally, no external tracking.
 * Used to understand basic usage patterns without compromising privacy.
 */

const ANALYTICS_KEY = 'payflow_usage_stats';

export type UsageStats = {
  firstUsed: number;
  lastUsed: number;
  paycheckCalculations: number;
  configSaves: number;
  configExports: number;
  themeToggles: number;
};

function getStats(): UsageStats {
  if (typeof window === 'undefined') {
    return createDefaultStats();
  }

  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (!stored) return createDefaultStats();
    return JSON.parse(stored) as UsageStats;
  } catch {
    return createDefaultStats();
  }
}

function createDefaultStats(): UsageStats {
  return {
    firstUsed: Date.now(),
    lastUsed: Date.now(),
    paycheckCalculations: 0,
    configSaves: 0,
    configExports: 0,
    themeToggles: 0,
  };
}

function saveStats(stats: UsageStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Failed to save usage stats:', err);
  }
}

/**
 * Track a usage event (locally only, no external calls)
 */
export function trackEvent(event: keyof Omit<UsageStats, 'firstUsed' | 'lastUsed'>): void {
  const stats = getStats();
  stats[event]++;
  stats.lastUsed = Date.now();
  saveStats(stats);
}

/**
 * Get current usage statistics (for debugging/development)
 */
export function getUsageStats(): UsageStats {
  return getStats();
}

/**
 * Clear usage statistics
 */
export function clearUsageStats(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ANALYTICS_KEY);
}

/**
 * Track daily active usage (called on app load)
 */
export function trackSession(): void {
  const stats = getStats();
  stats.lastUsed = Date.now();
  saveStats(stats);
}

import {
  type UserConfig,
  type LegacyConfigV1,
  CONFIG_VERSION,
  createDefaultConfig,
  userConfigSchema,
  legacyConfigSchemaV1,
} from './types';
import type { AllocationResult } from './allocations';
import { detectErrorType, type ErrorType } from './errorMessages';

export const STORAGE_KEY = 'paycheck_waterfall_config';
export const ALLOCATION_KEY = 'paycheck_waterfall_last_allocation';
export const BACKUP_KEY = 'paycheck_waterfall_config_backup';
export const BACKUP_TIMESTAMP_KEY = 'paycheck_waterfall_config_backup_timestamp';

const upgradeLegacy = (legacy: LegacyConfigV1): UserConfig => ({
  version: CONFIG_VERSION,
  updatedAt: new Date().toISOString(),
  bills: legacy.bills.map((b) => ({
    name: b.name ?? '',
    amount: typeof b.amount === 'number' ? b.amount : Number(b.amount ?? 0),
    cadence: b.cadence ?? 'monthly',
    dueDay: b.dueDay,
  })),
  goals: legacy.goals.map((g) => ({
    name: g.name ?? '',
    type: g.type ?? 'percent',
    value: typeof g.value === 'number' ? g.value : Number(g.value ?? 0),
  })),
  bonuses: [],
  settings: {
    percentApply: legacy.settings?.percentApply === 'remainder' ? 'remainder' : 'gross',
    payFrequency: legacy.settings?.payFrequency ?? 'biweekly',
    paycheckRange: legacy.settings?.paycheckRange ?? { min: 0, max: 0 },
  },
});

const parseConfig = (raw: unknown): { config: UserConfig; migrated?: boolean } => {
  const parsed = userConfigSchema.safeParse(raw);
  if (parsed.success) {
    const normalized = {
      ...parsed.data,
      version: CONFIG_VERSION,
    };
    const wasMigrated = parsed.data.version !== CONFIG_VERSION;
    return wasMigrated ? { config: normalized, migrated: true } : { config: normalized };
  }

  const legacy = legacyConfigSchemaV1.safeParse(raw);
  if (legacy.success) {
    return { config: upgradeLegacy(legacy.data), migrated: true };
  }

  return { config: createDefaultConfig(), migrated: true };
};

export type LoadResult = {
  config: UserConfig;
  error?: ErrorType;
  migrated?: boolean;
};

export function loadConfig(): LoadResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { config: createDefaultConfig() };
    const { config, migrated } = parseConfig(JSON.parse(raw));
    if (migrated) {
      saveConfig(config);
    }
    return { config, migrated };
  } catch (err) {
    console.warn('loadConfig: failed to read config, returning default', err);
    const errorType = detectErrorType(err);
    return { config: createDefaultConfig(), error: errorType };
  }
}

export type SaveResult = {
  success: boolean;
  error?: ErrorType;
};

/**
 * Estimate the size of data when serialized to JSON.
 */
function estimateStorageSize(data: unknown): number {
  return new Blob([JSON.stringify(data)]).size;
}

/**
 * Check if enough storage is available for the data.
 * Uses Storage API if available, otherwise assumes sufficient space.
 */
async function hasEnoughStorage(requiredBytes: number): Promise<boolean> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const available = (estimate.quota ?? Infinity) - (estimate.usage ?? 0);
      const safetyMargin = 1.5; // Require 50% extra space
      return available > requiredBytes * safetyMargin;
    } catch (err) {
      console.warn('Storage estimate failed:', err);
      return true; // Assume OK if API fails
    }
  }
  return true; // Storage API not available, proceed optimistically
}

/**
 * Save config with pre-check for available storage (async version).
 * Use this in async contexts for better error handling.
 */
export async function saveConfigSafe(cfg: UserConfig): Promise<SaveResult> {
  try {
    const normalized = userConfigSchema.parse({
      ...cfg,
      version: CONFIG_VERSION,
      updatedAt: new Date().toISOString(),
    });

    const estimatedSize = estimateStorageSize(normalized);
    const hasSpace = await hasEnoughStorage(estimatedSize);

    if (!hasSpace) {
      return { success: false, error: 'STORAGE_QUOTA' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return { success: true };
  } catch (err) {
    console.warn('saveConfigSafe: failed to write config', err);
    const errorType = detectErrorType(err);
    return { success: false, error: errorType };
  }
}

/**
 * Save config synchronously (for backward compatibility).
 * Consider using saveConfigSafe for better storage quota handling.
 */
export function saveConfig(cfg: UserConfig): SaveResult {
  try {
    const normalized = userConfigSchema.parse({
      ...cfg,
      version: CONFIG_VERSION,
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return { success: true };
  } catch (err) {
    console.warn('saveConfig: failed to write config', err);
    const errorType = detectErrorType(err);
    return { success: false, error: errorType };
  }
}

export function clearConfig() {
  const defaults = createDefaultConfig();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('clearConfig: failed to remove existing config', err);
  }
  saveConfig(defaults);
  return defaults;
}

export function exportConfig(): string {
  const { config } = loadConfig();
  return JSON.stringify(config, null, 2);
}

export type ImportResult = {
  config?: UserConfig;
  success: boolean;
  error?: ErrorType;
};

/**
 * Validate JSON depth to prevent stack overflow attacks.
 * @param obj - Object to validate
 * @param maxDepth - Maximum allowed nesting depth (default: 10)
 * @returns true if object is within depth limits, false otherwise
 */
function validateJSONDepth(obj: unknown, maxDepth = 10): boolean {
  function checkDepth(val: unknown, depth: number): boolean {
    if (depth > maxDepth) return false;
    if (val && typeof val === 'object') {
      const values = Array.isArray(val) ? val : Object.values(val);
      return values.every((v) => checkDepth(v, depth + 1));
    }
    return true;
  }
  return checkDepth(obj, 0);
}

export function importConfig(json: string): ImportResult {
  try {
    const raw = JSON.parse(json);

    // Validate depth to prevent stack overflow
    if (!validateJSONDepth(raw)) {
      return { success: false, error: 'INVALID_CONFIG' };
    }

    const { config } = parseConfig(raw);
    const saveResult = saveConfig(config);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }
    return { config, success: true };
  } catch (err) {
    console.warn('importConfig: invalid json', err);
    const errorType = detectErrorType(err);
    return { success: false, error: errorType };
  }
}

/**
 * Save the last allocation result to localStorage.
 * This persists the guilt-free spending and breakdown across page refreshes.
 */
export function saveAllocation(allocation: AllocationResult | null) {
  try {
    if (allocation === null) {
      localStorage.removeItem(ALLOCATION_KEY);
    } else {
      localStorage.setItem(ALLOCATION_KEY, JSON.stringify(allocation));
    }
  } catch (err) {
    console.warn('saveAllocation: failed to save allocation', err);
  }
}

/**
 * Load the last allocation result from localStorage.
 * Returns null if no allocation exists or if parsing fails.
 */
export function loadAllocation(): AllocationResult | null {
  try {
    const raw = localStorage.getItem(ALLOCATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AllocationResult;
  } catch (err) {
    console.warn('loadAllocation: failed to load allocation', err);
    return null;
  }
}

/**
 * Create a backup of the current config before destructive operations.
 * Backup expires after 24 hours.
 */
export function backupConfig(): void {
  try {
    const current = loadConfig();
    localStorage.setItem(BACKUP_KEY, JSON.stringify(current));
    localStorage.setItem(BACKUP_TIMESTAMP_KEY, Date.now().toString());
  } catch (err) {
    console.warn('backupConfig: failed to create backup', err);
  }
}

/**
 * Restore config from backup if it exists and is less than 24 hours old.
 * Returns true if restore was successful.
 */
export function restoreConfigFromBackup(): boolean {
  try {
    const backupRaw = localStorage.getItem(BACKUP_KEY);
    const timestampRaw = localStorage.getItem(BACKUP_TIMESTAMP_KEY);

    if (!backupRaw || !timestampRaw) return false;

    const timestamp = parseInt(timestampRaw, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // Check if backup is expired
    if (now - timestamp > twentyFourHours) {
      localStorage.removeItem(BACKUP_KEY);
      localStorage.removeItem(BACKUP_TIMESTAMP_KEY);
      return false;
    }

    const backup = JSON.parse(backupRaw) as UserConfig;
    saveConfig(backup);

    // Clear backup after successful restore
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(BACKUP_TIMESTAMP_KEY);

    return true;
  } catch (err) {
    console.warn('restoreConfigFromBackup: failed to restore', err);
    return false;
  }
}

/**
 * Check if a backup exists and is valid (less than 24 hours old).
 */
export function hasValidBackup(): { exists: boolean; timestamp?: number } {
  try {
    const backupRaw = localStorage.getItem(BACKUP_KEY);
    const timestampRaw = localStorage.getItem(BACKUP_TIMESTAMP_KEY);

    if (!backupRaw || !timestampRaw) return { exists: false };

    const timestamp = parseInt(timestampRaw, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - timestamp > twentyFourHours) {
      localStorage.removeItem(BACKUP_KEY);
      localStorage.removeItem(BACKUP_TIMESTAMP_KEY);
      return { exists: false };
    }

    return { exists: true, timestamp };
  } catch (err) {
    return { exists: false };
  }
}

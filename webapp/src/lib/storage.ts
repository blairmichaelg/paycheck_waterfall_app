import {
  type UserConfig,
  type LegacyConfigV1,
  CONFIG_VERSION,
  createDefaultConfig,
  userConfigSchema,
  legacyConfigSchemaV1,
} from './types';

const STORAGE_KEY = 'paycheck_waterfall_config';

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

const parseConfig = (raw: unknown): { config: UserConfig; migrated: boolean } => {
  const parsed = userConfigSchema.safeParse(raw);
  if (parsed.success) {
    const normalized = {
      ...parsed.data,
      version: CONFIG_VERSION,
    };
    return { config: normalized, migrated: parsed.data.version !== CONFIG_VERSION };
  }

  const legacy = legacyConfigSchemaV1.safeParse(raw);
  if (legacy.success) {
    return { config: upgradeLegacy(legacy.data), migrated: true };
  }

  return { config: createDefaultConfig(), migrated: true };
};

export function loadConfig(): UserConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultConfig();
    const { config, migrated } = parseConfig(JSON.parse(raw));
    if (migrated) {
      saveConfig(config);
    }
    return config;
  } catch (err) {
    console.warn('loadConfig: failed to read config, returning default', err);
    return createDefaultConfig();
  }
}

export function saveConfig(cfg: UserConfig) {
  try {
    const normalized = userConfigSchema.parse({
      ...cfg,
      version: CONFIG_VERSION,
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.warn('saveConfig: failed to write config', err);
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
  const cfg = loadConfig();
  return JSON.stringify(cfg, null, 2);
}

export function importConfig(json: string): UserConfig | null {
  try {
    const { config } = parseConfig(JSON.parse(json));
    saveConfig(config);
    return config;
  } catch (err) {
    console.warn('importConfig: invalid json', err);
    return null;
  }
}

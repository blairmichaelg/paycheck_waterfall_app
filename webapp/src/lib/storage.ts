import { UserConfig, DEFAULT_CONFIG } from './types'

const STORAGE_KEY = 'paycheck_waterfall_config_v1'

export function loadConfig(): UserConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return JSON.parse(raw) as UserConfig
  } catch (err) {
    console.warn('loadConfig: failed to read config, returning default', err)
    return DEFAULT_CONFIG
  }
}

export function saveConfig(cfg: UserConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  } catch (err) {
    console.warn('saveConfig: failed to write config', err)
  }
}

export function clearConfig() {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportConfig(): string {
  const cfg = loadConfig()
  return JSON.stringify(cfg, null, 2)
}

export function importConfig(json: string): UserConfig | null {
  try {
    const parsed = JSON.parse(json) as UserConfig
    // basic validation
    if (!parsed || typeof parsed !== 'object') return null
    if (!Array.isArray((parsed as any).bills) || !Array.isArray((parsed as any).goals)) return null
    saveConfig(parsed)
    return parsed
  } catch (err) {
    console.warn('importConfig: invalid json', err)
    return null
  }
}

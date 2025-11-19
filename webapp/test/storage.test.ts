import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadConfig, saveConfig, clearConfig, exportConfig, importConfig } from '../src/lib/storage'
import { createDefaultConfig, CONFIG_VERSION, type UserConfig } from '../src/lib/types'

describe('storage', () => {
  const STORAGE_KEY = 'paycheck_waterfall_config'
  
  beforeEach(() => {
    localStorage.clear()
  })
  
  afterEach(() => {
    localStorage.clear()
  })
  
  describe('loadConfig', () => {
    it('returns default config when localStorage is empty', () => {
      const config = loadConfig()
      expect(config.version).toBe(CONFIG_VERSION)
      expect(config.bills).toEqual([])
      expect(config.goals).toEqual([])
      expect(config.bonuses).toEqual([])
      expect(config.settings.percentApply).toBe('gross')
    })
    
    it('loads valid config from localStorage', () => {
      const testConfig = createDefaultConfig()
      testConfig.bills = [{ name: 'Rent', amount: 1000, cadence: 'monthly' }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testConfig))
      
      const loaded = loadConfig()
      expect(loaded.bills).toHaveLength(1)
      expect(loaded.bills[0].name).toBe('Rent')
    })
    
    it('migrates legacy v1 config to v3', () => {
      const legacyConfig = {
        bills: [{ name: 'Electric', amount: 100, cadence: 'monthly' }],
        goals: [{ name: 'Save', type: 'percent', value: 10 }],
        settings: {
          percentApply: 'remainder',
          payFrequency: 'weekly',
          paycheckRange: { min: 500, max: 600 }
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyConfig))
      
      const loaded = loadConfig()
      expect(loaded.version).toBe(CONFIG_VERSION)
      expect(loaded.bills).toHaveLength(1)
      expect(loaded.goals).toHaveLength(1)
      expect(loaded.bonuses).toEqual([]) // New in v3
      expect(loaded.settings.percentApply).toBe('remainder')
    })
    
    it('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json {')
      const loaded = loadConfig()
      expect(loaded.version).toBe(CONFIG_VERSION)
      expect(loaded.bills).toEqual([])
    })
    
    it('handles non-object JSON in localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('string data'))
      const loaded = loadConfig()
      expect(loaded.version).toBe(CONFIG_VERSION)
    })
  })
  
  describe('saveConfig', () => {
    it('saves config to localStorage with current version', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Internet', amount: 50, cadence: 'monthly' }]
      
      saveConfig(config)
      
      const raw = localStorage.getItem(STORAGE_KEY)
      expect(raw).toBeTruthy()
      const parsed = JSON.parse(raw!)
      expect(parsed.version).toBe(CONFIG_VERSION)
      expect(parsed.bills).toHaveLength(1)
    })
    
    it('updates timestamp on save', () => {
      const config = createDefaultConfig()
      const before = new Date().toISOString()
      
      saveConfig(config)
      
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = JSON.parse(raw!)
      expect(new Date(parsed.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime())
    })
    
    it('normalizes version to CONFIG_VERSION', () => {
      const config = createDefaultConfig()
      config.version = 99 // Test that old versions get normalized
      
      saveConfig(config)
      
      const loaded = loadConfig()
      expect(loaded.version).toBe(CONFIG_VERSION)
    })
  })
  
  describe('clearConfig', () => {
    it('removes config from localStorage', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Test', amount: 100, cadence: 'monthly' }]
      saveConfig(config)
      
      clearConfig()
      
      const loaded = loadConfig()
      expect(loaded.bills).toEqual([])
    })
    
    it('returns default config', () => {
      const result = clearConfig()
      expect(result.version).toBe(CONFIG_VERSION)
      expect(result.bills).toEqual([])
      expect(result.goals).toEqual([])
    })
  })
  
  describe('exportConfig', () => {
    it('exports config as formatted JSON string', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Gas', amount: 200, cadence: 'monthly' }]
      saveConfig(config)
      
      const exported = exportConfig()
      
      expect(exported).toContain('"name": "Gas"')
      expect(exported).toContain('"amount": 200')
      const parsed = JSON.parse(exported)
      expect(parsed.version).toBe(CONFIG_VERSION)
    })
    
    it('exports even when localStorage is empty', () => {
      const exported = exportConfig()
      const parsed = JSON.parse(exported)
      expect(parsed.version).toBe(CONFIG_VERSION)
      expect(parsed.bills).toEqual([])
    })
  })
  
  describe('importConfig', () => {
    it('imports valid config JSON', () => {
      const config: UserConfig = {
        version: CONFIG_VERSION,
        updatedAt: new Date().toISOString(),
        bills: [{ name: 'Imported', amount: 300, cadence: 'monthly' }],
        goals: [],
        bonuses: [],
        settings: {
          percentApply: 'gross',
          payFrequency: 'biweekly',
          paycheckRange: { min: 0, max: 0 }
        }
      }
      const json = JSON.stringify(config)
      
      const result = importConfig(json)
      
      expect(result).not.toBeNull()
      expect(result!.bills).toHaveLength(1)
      expect(result!.bills[0].name).toBe('Imported')
    })
    
    it('imports and migrates legacy config', () => {
      const legacyConfig = {
        bills: [{ name: 'Legacy Bill', amount: 123, cadence: 'weekly' }],
        goals: [],
        settings: { percentApply: 'gross' }
      }
      const json = JSON.stringify(legacyConfig)
      
      const result = importConfig(json)
      
      expect(result).not.toBeNull()
      expect(result!.version).toBe(CONFIG_VERSION)
      expect(result!.bills[0].name).toBe('Legacy Bill')
      expect(result!.bonuses).toEqual([])
    })
    
    it('returns null for invalid JSON', () => {
      const result = importConfig('invalid json {')
      expect(result).toBeNull()
    })
    
    it('imports non-object JSON as default config', () => {
      const result = importConfig(JSON.stringify('string'))
      // Non-object JSON is treated as invalid and returns default config
      expect(result).not.toBeNull()
      expect(result!.version).toBe(CONFIG_VERSION)
      expect(result!.bills).toEqual([])
    })
    
    it('persists imported config to localStorage', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Persist', amount: 50, cadence: 'monthly' }]
      const json = JSON.stringify(config)
      
      importConfig(json)
      
      const loaded = loadConfig()
      expect(loaded.bills[0].name).toBe('Persist')
    })
  })
  
  describe('schema validation edge cases', () => {
    it('handles empty bills array in legacy config', () => {
      const legacyConfig = {
        bills: [],
        goals: [],
        settings: {}
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyConfig))
      
      const loaded = loadConfig()
      expect(loaded.bills).toEqual([])
    })
    
    it('handles missing optional fields in bills', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Bill', amount: 100, cadence: 'monthly' }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      
      const loaded = loadConfig()
      expect(loaded.bills[0].dueDay).toBeUndefined()
    })
    
    it('handles paycheck range with equal min and max', () => {
      const config = createDefaultConfig()
      config.settings.paycheckRange = { min: 1000, max: 1000 }
      saveConfig(config)
      
      const loaded = loadConfig()
      expect(loaded.settings.paycheckRange.min).toBe(1000)
      expect(loaded.settings.paycheckRange.max).toBe(1000)
    })
  })
})

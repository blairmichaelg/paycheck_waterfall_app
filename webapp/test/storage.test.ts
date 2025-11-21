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
      const result = loadConfig()
      expect(result.config.version).toBe(CONFIG_VERSION)
      expect(result.config.bills).toEqual([])
      expect(result.config.goals).toEqual([])
      expect(result.config.bonuses).toEqual([])
      expect(result.config.settings.percentApply).toBe('gross')
      expect(result.error).toBeUndefined()
    })
    
    it('loads valid config from localStorage', () => {
      const testConfig = createDefaultConfig()
      testConfig.bills = [{ name: 'Rent', amount: 1000, cadence: 'monthly' }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testConfig))
      
      const result = loadConfig()
      expect(result.config.bills).toHaveLength(1)
      expect(result.config.bills[0].name).toBe('Rent')
      expect(result.error).toBeUndefined()
    })
    
    it('migrates legacy v1 config to v4 and sets migrated flag', () => {
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
      
      const result = loadConfig()
      expect(result.config.version).toBe(CONFIG_VERSION)
      expect(result.config.bills).toHaveLength(1)
      expect(result.config.goals).toHaveLength(1)
      expect(result.config.bonuses).toEqual([]) // New in v3+
      expect(result.config.settings.percentApply).toBe('remainder')
      expect(result.migrated).toBe(true)
      expect(result.error).toBeUndefined()
    })
    
    it('preserves all legacy v1 bill data during migration', () => {
      const legacyConfig = {
        bills: [
          { name: 'Rent', amount: 1200, cadence: 'monthly', dueDay: 1 },
          { name: 'Electric', amount: 150, cadence: 'biweekly' }
        ],
        goals: [],
        settings: {
          percentApply: 'gross',
          payFrequency: 'biweekly',
          paycheckRange: { min: 800, max: 1200 }
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyConfig))
      
      const result = loadConfig()
      expect(result.config.bills).toHaveLength(2)
      expect(result.config.bills[0].name).toBe('Rent')
      expect(result.config.bills[0].amount).toBe(1200)
      expect(result.config.bills[0].dueDay).toBe(1)
      expect(result.config.bills[1].name).toBe('Electric')
      expect(result.migrated).toBe(true)
    })
    
    it('handles corrupted localStorage data and returns error', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json {')
      const result = loadConfig()
      expect(result.config.version).toBe(CONFIG_VERSION)
      expect(result.config.bills).toEqual([])
      expect(result.error).toBeDefined()
    })
    
    it('handles non-object JSON in localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('string data'))
      const result = loadConfig()
      expect(result.config.version).toBe(CONFIG_VERSION)
      expect(result.migrated).toBe(true)
    })
    
    it('does not set migrated flag for current version config', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Test', amount: 100, cadence: 'monthly' }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      
      const result = loadConfig()
      expect(result.migrated).toBeUndefined()
      expect(result.error).toBeUndefined()
    })
  })
  
  describe('saveConfig', () => {
    it('saves config to localStorage with current version', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Internet', amount: 50, cadence: 'monthly' }]
      
      const result = saveConfig(config)
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      
      const raw = localStorage.getItem(STORAGE_KEY)
      expect(raw).toBeTruthy()
      const parsed = JSON.parse(raw!)
      expect(parsed.version).toBe(CONFIG_VERSION)
      expect(parsed.bills).toHaveLength(1)
    })
    
    it('updates timestamp on save', () => {
      const config = createDefaultConfig()
      const before = new Date().toISOString()
      
      const result = saveConfig(config)
      
      expect(result.success).toBe(true)
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = JSON.parse(raw!)
      expect(new Date(parsed.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime())
    })
    
    it('normalizes version to CONFIG_VERSION', () => {
      const config = createDefaultConfig()
      config.version = 99 // Test that old versions get normalized
      
      saveConfig(config)
      
      const loadResult = loadConfig()
      expect(loadResult.config.version).toBe(CONFIG_VERSION)
    })
    
    it('returns success false on storage errors', () => {
      const config = createDefaultConfig()
      // Simulate quota exceeded by mocking localStorage
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = () => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      }
      
      const result = saveConfig(config)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('STORAGE_QUOTA')
      
      // Restore original
      Storage.prototype.setItem = originalSetItem
    })
  })
  
  describe('clearConfig', () => {
    it('removes config from localStorage', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Test', amount: 100, cadence: 'monthly' }]
      saveConfig(config)
      
      clearConfig()
      
      const loadResult = loadConfig()
      expect(loadResult.config.bills).toEqual([])
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
      
      expect(result.success).toBe(true)
      expect(result.config).toBeDefined()
      expect(result.config!.bills).toHaveLength(1)
      expect(result.config!.bills[0].name).toBe('Imported')
    })
    
    it('imports and migrates legacy config', () => {
      const legacyConfig = {
        bills: [{ name: 'Legacy Bill', amount: 123, cadence: 'weekly' }],
        goals: [],
        settings: { percentApply: 'gross' }
      }
      const json = JSON.stringify(legacyConfig)
      
      const result = importConfig(json)
      
      expect(result.success).toBe(true)
      expect(result.config).toBeDefined()
      expect(result.config!.version).toBe(CONFIG_VERSION)
      expect(result.config!.bills[0].name).toBe('Legacy Bill')
      expect(result.config!.bonuses).toEqual([])
    })
    
    it('returns error for invalid JSON', () => {
      const result = importConfig('invalid json {')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.config).toBeUndefined()
    })
    
    it('imports non-object JSON as default config', () => {
      const result = importConfig(JSON.stringify('string'))
      // Non-object JSON is treated as invalid and returns default config
      expect(result.success).toBe(true)
      expect(result.config).toBeDefined()
      expect(result.config!.version).toBe(CONFIG_VERSION)
      expect(result.config!.bills).toEqual([])
    })
    
    it('persists imported config to localStorage', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Persist', amount: 50, cadence: 'monthly' }]
      const json = JSON.stringify(config)
      
      importConfig(json)
      
      const loadResult = loadConfig()
      expect(loadResult.config.bills[0].name).toBe('Persist')
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
      
      const result = loadConfig()
      expect(result.config.bills).toEqual([])
    })
    
    it('handles missing optional fields in bills', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Bill', amount: 100, cadence: 'monthly' }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      
      const result = loadConfig()
      expect(result.config.bills[0].dueDay).toBeUndefined()
    })
    
    it('handles paycheck range with equal min and max', () => {
      const config = createDefaultConfig()
      config.settings.paycheckRange = { min: 1000, max: 1000 }
      saveConfig(config)
      
      const result = loadConfig()
      expect(result.config.settings.paycheckRange.min).toBe(1000)
      expect(result.config.settings.paycheckRange.max).toBe(1000)
    })
  })

  describe('import depth validation', () => {
    it('rejects deeply nested objects', () => {
      // Create object with 15 levels of nesting (exceeds limit of 10)
      let deepObj: any = { value: 'deep' }
      for (let i = 0; i < 15; i++) {
        deepObj = { nested: deepObj }
      }
      
      const result = importConfig(JSON.stringify(deepObj))
      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_CONFIG')
    })

    it('accepts shallow valid configs', () => {
      const config = createDefaultConfig()
      config.bills = [{ name: 'Test', amount: 100, cadence: 'monthly' }]
      
      const result = importConfig(JSON.stringify(config))
      expect(result.success).toBe(true)
    })

    it('accepts reasonably nested arrays', () => {
      const config = createDefaultConfig()
      config.bills = [
        { name: 'Bill1', amount: 100, cadence: 'monthly' },
        { name: 'Bill2', amount: 200, cadence: 'monthly' },
      ]
      config.goals = [
        { name: 'Goal1', type: 'percent', value: 10 },
      ]
      
      const result = importConfig(JSON.stringify(config))
      expect(result.success).toBe(true)
    })
  })
})

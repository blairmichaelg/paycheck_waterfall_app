import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadTheme, saveTheme, getThemeColors, lightTheme, darkTheme } from '../src/lib/theme'

describe('theme', () => {
  const STORAGE_KEY = 'payflow_theme'
  
  beforeEach(() => {
    localStorage.clear()
    // Reset matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true
      })
    })
  })
  
  afterEach(() => {
    localStorage.clear()
  })
  
  describe('loadTheme', () => {
    it('returns light theme by default', () => {
      const theme = loadTheme()
      expect(theme).toBe('light')
    })
    
    it('loads dark theme from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'dark')
      const theme = loadTheme()
      expect(theme).toBe('dark')
    })
    
    it('loads light theme from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'light')
      const theme = loadTheme()
      expect(theme).toBe('light')
    })
    
    it('detects system dark mode preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true
        })
      })
      
      const theme = loadTheme()
      expect(theme).toBe('dark')
    })
    
    it('ignores invalid theme values', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid')
      const theme = loadTheme()
      expect(theme).toBe('light')
    })
  })
  
  describe('saveTheme', () => {
    it('saves dark theme to localStorage', () => {
      saveTheme('dark')
      expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
    })
    
    it('saves light theme to localStorage', () => {
      saveTheme('light')
      expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
    })
  })
  
  describe('getThemeColors', () => {
    it('returns light theme colors for light theme', () => {
      const colors = getThemeColors('light')
      expect(colors).toEqual(lightTheme)
      expect(colors.textPrimary).toBe('#1f2937')
    })
    
    it('returns dark theme colors for dark theme', () => {
      const colors = getThemeColors('dark')
      expect(colors).toEqual(darkTheme)
      expect(colors.textPrimary).toBe('#f1f5f9')
    })
    
    it('light theme has correct gradient', () => {
      const colors = getThemeColors('light')
      expect(colors.primaryGradient).toContain('linear-gradient')
    })
    
    it('dark theme has correct background', () => {
      const colors = getThemeColors('dark')
      expect(colors.cardBg).toBe('#1e293b')
    })
  })
})

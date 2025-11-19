export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'payflow_theme'

export function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  
  // Check system preference
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export type ThemeColors = {
  // Backgrounds
  bodyBg: string
  cardBg: string
  surfaceBg: string
  
  // Text
  textPrimary: string
  textSecondary: string
  textMuted: string
  
  // Borders
  border: string
  borderLight: string
  
  // Status colors (same in both themes but with adjusted alpha)
  success: string
  successBg: string
  warning: string
  warningBg: string
  error: string
  errorBg: string
  
  // Gradients
  primaryGradient: string
  accentGradient: string
  successGradient: string
  warningGradient: string
  statusGradient: string
}

export const lightTheme: ThemeColors = {
  bodyBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  cardBg: '#ffffff',
  surfaceBg: '#f9fafb',
  
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  
  success: '#10b981',
  successBg: '#d1fae5',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  error: '#dc2626',
  errorBg: '#fee2e2',
  
  primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  accentGradient: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
  successGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warningGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  statusGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
}

export const darkTheme: ThemeColors = {
  bodyBg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  cardBg: '#1e293b',
  surfaceBg: '#0f172a',
  
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  
  border: '#334155',
  borderLight: '#1e293b',
  
  success: '#10b981',
  successBg: '#064e3b',
  warning: '#f59e0b',
  warningBg: '#78350f',
  error: '#dc2626',
  errorBg: '#7f1d1d',
  
  primaryGradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
  accentGradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
  successGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warningGradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  statusGradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'
}

export function getThemeColors(theme: Theme): ThemeColors {
  return theme === 'dark' ? darkTheme : lightTheme
}

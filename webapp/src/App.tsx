import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import { loadConfig, saveConfig } from './lib/storage'
import type { UserConfig } from './lib/types'

export default function App() {
  const [config, setConfig] = useState<UserConfig>(loadConfig())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // sync initial config from localStorage
    setConfig(loadConfig())
  }, [])

  const handleSave = (c: UserConfig) => {
    saveConfig(c)
    setConfig(c)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <Header lastPaycheck={0} bills={config.bills} goals={config.goals} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div>
          <Onboarding initial={config} onSave={handleSave} />
          <Dashboard config={config} />
        </div>
        <aside>
          <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
            <h4>Status</h4>
            <div>{saved ? 'Configuration saved' : 'No recent changes'}</div>
          </div>

          <div style={{ marginTop: 12, background: '#fff', padding: 12, borderRadius: 8 }}>
            <h4>Data</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => {
                const data = exportConfig()
                const blob = new Blob([data], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'paycheck_waterfall_config.json'
                a.click()
                URL.revokeObjectURL(url)
              }}>Export config</button>

              <label style={{ display: 'block' }}>
                Import config
                <input type="file" accept="application/json" onChange={async (e) => {
                  const f = e.target.files && e.target.files[0]
                  if (!f) return
                  const text = await f.text()
                  const imported = importConfig(text)
                  if (imported) {
                    setConfig(imported)
                    setSaved(true)
                    setTimeout(() => setSaved(false), 1500)
                  } else {
                    alert('Invalid config file')
                  }
                }} />
              </label>

              <button onClick={() => { clearConfig(); setConfig({ bills: [], goals: [] }); setSaved(true); setTimeout(() => setSaved(false), 1500) }}>Clear config</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

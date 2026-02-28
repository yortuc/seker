import { useState } from 'react'

export default function ApiKeyModal({ initialKey, onSave, onClose }) {
  const [key, setKey] = useState(initialKey || '')

  const handleSave = () => {
    if (key.trim()) onSave(key.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-bold text-zinc-100 mb-1">Claude API Key</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Required to generate patterns. Stored in localStorage only — never sent anywhere except Anthropic's API.
        </p>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="sk-ant-..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 mb-4"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          {initialKey && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  )
}

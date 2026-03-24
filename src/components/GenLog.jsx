export default function GenLog({ sessions }) {
  if (sessions.length === 0) return null

  return (
    <aside className="w-80 flex-shrink-0">
      <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-2 px-1">
        Generation Log
      </div>
      <div className="flex flex-col gap-2 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
        {sessions.map(s => <SessionCard key={s.id} session={s} />)}
      </div>
    </aside>
  )
}

function SessionCard({ session }) {
  const { prompt, status, analysis, code, error } = session

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 font-mono text-xs flex flex-col gap-2">

      {/* Prompt */}
      <div className="flex items-start gap-1.5">
        <span className="text-zinc-600 mt-0.5 flex-shrink-0">▶</span>
        <span className="text-amber-400 leading-relaxed break-words">{prompt}</span>
        {(status === 'analyzing' || status === 'generating') && (
          <span className="inline-block w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin flex-shrink-0 mt-0.5" />
        )}
      </div>

      {/* Analysis */}
      {status === 'analyzing' && !analysis && (
        <Row label="analysis" dim>analyzing…</Row>
      )}
      {analysis && (
        <div className="pl-3 border-l border-zinc-800 flex flex-col gap-0.5">
          <span className="text-zinc-600">analysis</span>
          {analysis.genre_primary && (
            <div className="text-zinc-300">
              <span className="text-zinc-600">genre </span>
              <span className="text-violet-400">{analysis.genre_primary}</span>
              {analysis.genre_influences?.length > 0 && (
                <span className="text-zinc-500"> · {analysis.genre_influences.join(', ')}</span>
              )}
            </div>
          )}
          {analysis.key && (
            <div className="text-zinc-300">
              <span className="text-zinc-600">key </span>
              <span className="text-violet-400">{analysis.key}</span>
              {analysis.chord_progression?.length > 0 && (
                <span className="text-zinc-500"> · {analysis.chord_progression.join(' → ')}</span>
              )}
            </div>
          )}
          {analysis.register && (
            <div className="text-zinc-500">register: {analysis.register}</div>
          )}
          {analysis.rhythmic_character && (
            <div className="text-zinc-500">rhythm: {analysis.rhythmic_character}</div>
          )}
          {analysis.compositional_techniques?.length > 0 && (
            <div className="mt-0.5">
              <div className="text-zinc-600">techniques</div>
              {analysis.compositional_techniques.map((t, i) => (
                <div key={i} className="text-zinc-400 pl-1">· {t}</div>
              ))}
            </div>
          )}
          {analysis.strudel_functions_needed?.length > 0 && (
            <div className="text-zinc-600">
              fns: <span className="text-zinc-500">{analysis.strudel_functions_needed.join(' ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Code */}
      {status === 'generating' && !code && (
        <Row label="code" dim>generating…</Row>
      )}
      {code && (
        <div className="pl-3 border-l border-zinc-800">
          <div className="text-zinc-600 mb-0.5">code</div>
          <div className="text-green-400 break-all leading-relaxed">{code}</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="pl-3 border-l border-red-900 text-red-400">{error}</div>
      )}
    </div>
  )
}

function Row({ label, dim, children }) {
  return (
    <div className="pl-3 border-l border-zinc-800">
      {label && <div className="text-zinc-600">{label}</div>}
      <div className={dim ? 'text-zinc-600' : 'text-zinc-400'}>{children}</div>
    </div>
  )
}

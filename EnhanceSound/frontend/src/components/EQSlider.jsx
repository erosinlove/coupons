function EQSlider({ value, onChange, disabled }) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>EQ (Brighter ↔ Warmer)</span>
        <span className="font-mono text-xs text-slate-400">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min="-1"
        max="1"
        step="0.1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        className="w-full accent-brand-500"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>Warmer</span>
        <span>Neutral</span>
        <span>Brighter</span>
      </div>
    </div>
  )
}

export default EQSlider

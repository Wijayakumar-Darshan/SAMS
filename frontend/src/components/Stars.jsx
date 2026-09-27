export default function Stars({ value = 0, onChange, readOnly = false }) {
  const v = Number(value || 0);

  return (
    <div style={{ display: "inline-flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= v;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(n)}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "6px 8px",
              background: filled ? "var(--accent)" : "var(--surface)",
              color: filled ? "#fff" : "var(--text-muted)",
              cursor: readOnly ? "default" : "pointer",
              transition: "all 0.15s var(--ease)"
            }}
            aria-label={`Star ${n}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

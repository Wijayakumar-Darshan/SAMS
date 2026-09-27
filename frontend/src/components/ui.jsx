
/** Circular progress ring. value/max in same unit (e.g. minutes). */
export function ProgressRing({ value, max, size = 108, stroke = 10, label, sub }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-ring-label">
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>{Math.round(pct)}%</div>
        {label && <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>}
        {sub && <div style={{ fontSize: 10.5, color: "var(--text-faint)" }}>{sub}</div>}
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, trend, trendDirection, accent }) {
  return (
    <div className="card card-hover stat-card enter">
      <div className="between" style={{ alignItems: "flex-start" }}>
        <div className="stat-icon" style={accent ? { background: "var(--accent-50)", color: "var(--accent)" } : undefined}>
          {icon}
        </div>
        {trend !== undefined && trend !== null && (
          <span className={"stat-trend " + (trendDirection || (trend >= 0 ? "up" : "down"))}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function Skeleton({ height = 14, width = "100%", radius, style }) {
  return (
    <div
      className="skeleton"
      style={{ height, width, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <Skeleton height={38} width={38} radius={12} style={{ marginBottom: 14 }} />
          <Skeleton height={22} width="60%" style={{ marginBottom: 8 }} />
          <Skeleton height={12} width="80%" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="emptyState">
      {icon && <div className="icon-wrap">{icon}</div>}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ icon, title = "Something went wrong", message, onRetry, retryLabel = "Try Again" }) {
  return (
    <div className="errorState">
      {icon && <div className="icon-wrap">{icon}</div>}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {onRetry && (
        <button className="btn btn-outline mt-2" type="button" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function Badge({ children, tone = "default", dot }) {
  const cls = tone === "default" ? "badge" : `badge badge-${tone}`;
  return (
    <span className={cls}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function Avatar({ name, size }) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const sizeClass = size === "lg" ? "avatar avatar-lg" : size === "sm" ? "avatar avatar-sm" : "avatar";
  return <div className={sizeClass}>{initials || "?"}</div>;
}

/** Simple accessible confirm/action modal. Renders nothing when closed. */
export function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 300
      }}
      onClick={onClose}
    >
      <div
        className="card card-pad-lg"
        style={{ width: "100%", maxWidth: 420, animation: "cardIn 0.2s ease both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="h2">{title}</div>}
        <div>{children}</div>
        {footer && <div className="row mt-4" style={{ gap: 8, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

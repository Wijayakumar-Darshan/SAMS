import React from "react";
import { XIcon, SparklesIcon } from "./Icons.jsx";

/* =========================================================
   BUTTON COMPONENT
   ========================================================= */
export function Button({
  children,
  variant = "primary", // primary | secondary | outline | ghost | danger | success
  size = "md", // sm | md | lg
  icon = null,
  iconRight = null,
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const baseClasses = "sams-btn";
  const variantClass = `sams-btn-${variant}`;
  const sizeClass = `sams-btn-${size}`;
  const loadingClass = loading ? "sams-btn-loading" : "";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      {...props}
    >
      {loading ? (
        <span className="sams-btn-spinner" />
      ) : (
        icon && <span className="sams-btn-icon-left">{icon}</span>
      )}
      <span className="sams-btn-text">{children}</span>
      {!loading && iconRight && <span className="sams-btn-icon-right">{iconRight}</span>}
    </button>
  );
}

/* =========================================================
   CARD COMPONENT
   ========================================================= */
export function Card({
  children,
  className = "",
  hover = false,
  glass = false,
  padding = "md", // sm | md | lg | none
  onClick,
  ...props
}) {
  const hoverClass = hover ? "sams-card-hover" : "";
  const glassClass = glass ? "sams-card-glass" : "";
  const padClass = `sams-card-pad-${padding}`;

  return (
    <div
      className={`sams-card ${hoverClass} ${glassClass} ${padClass} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

/* =========================================================
   STAT CARD COMPONENT
   ========================================================= */
export function StatCard({
  icon,
  iconColor = "blue", // blue | green | amber | purple | red
  label,
  value,
  unit = "",
  change = null, // e.g. "+15%" or "-5%"
  changePositive = true,
  sublabel = "",
  className = "",
  loading = false,
}) {
  if (loading) {
    return (
      <Card className={`sams-stat-card ${className}`}>
        <div className="sams-stat-skeleton">
          <Skeleton circle width={44} height={44} />
          <div style={{ flex: 1 }}>
            <Skeleton width="45%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="70%" height={26} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card hover className={`sams-stat-card sams-stat-${iconColor} ${className}`}>
      <div className="sams-stat-header">
        <div className={`sams-stat-icon-wrap sams-stat-icon-${iconColor}`}>
          {icon}
        </div>
        {change !== null && change !== undefined && (
          <span className={`sams-trend-badge ${changePositive ? "positive" : "negative"}`}>
            {changePositive ? "↑ " : "↓ "}
            {change}
          </span>
        )}
      </div>

      <div className="sams-stat-body">
        <div className="sams-stat-label">{label}</div>
        <div className="sams-stat-value-row">
          <span className="sams-stat-value">{value}</span>
          {unit && <span className="sams-stat-unit">{unit}</span>}
        </div>
        {sublabel && <div className="sams-stat-sublabel">{sublabel}</div>}
      </div>
    </Card>
  );
}

/* =========================================================
   BADGE COMPONENT
   ========================================================= */
export function Badge({
  children,
  variant = "neutral", // primary | neutral | success | warning | danger | info | purple
  size = "md", // sm | md
  className = "",
  dot = false,
}) {
  return (
    <span className={`sams-badge sams-badge-${variant} sams-badge-${size} ${className}`.trim()}>
      {dot && <span className="sams-badge-dot" />}
      {children}
    </span>
  );
}

/* =========================================================
   PROGRESS BAR
   ========================================================= */
export function ProgressBar({
  value = 0,
  max = 100,
  variant = "gradient", // gradient | primary | success | amber
  height = 8,
  showLabel = false,
  className = "",
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={`sams-progress-container ${className}`}>
      <div className="sams-progress-track" style={{ height: `${height}px` }}>
        <div
          className={`sams-progress-fill sams-progress-fill-${variant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="sams-progress-label">
          <span>{percentage}%</span>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SKELETON SHIMMER LOADER
   ========================================================= */
export function Skeleton({
  width = "100%",
  height = 20,
  circle = false,
  className = "",
  style = {},
}) {
  return (
    <div
      className={`sams-skeleton ${circle ? "sams-skeleton-circle" : ""} ${className}`.trim()}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: circle ? "50%" : undefined,
        ...style,
      }}
    />
  );
}

/* =========================================================
   EMPTY STATE COMPONENT
   ========================================================= */
export function EmptyState({
  icon,
  title,
  description,
  actionText,
  actionIcon,
  onAction,
  className = "",
}) {
  return (
    <div className={`sams-empty-state ${className}`.trim()}>
      <div className="sams-empty-icon-wrap">
        {icon || <SparklesIcon size={32} color="#2E86C1" />}
      </div>
      <h3 className="sams-empty-title">{title}</h3>
      {description && <p className="sams-empty-desc">{description}</p>}
      {actionText && onAction && (
        <Button
          variant="primary"
          size="md"
          icon={actionIcon}
          onClick={onAction}
          className="sams-empty-btn"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}

/* =========================================================
   MODAL COMPONENT
   ========================================================= */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "540px",
  className = "",
}) {
  if (!isOpen) return null;

  return (
    <div className="sams-modal-backdrop" onClick={onClose}>
      <div
        className={`sams-modal-panel ${className}`.trim()}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sams-modal-header">
          <div>
            {title && <h2 className="sams-modal-title">{title}</h2>}
            {subtitle && <p className="sams-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="sams-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>
        <div className="sams-modal-body">{children}</div>
      </div>
    </div>
  );
}

import {
  FiArrowUpRight,
  FiArrowDownRight,
  FiMinus,
} from "react-icons/fi";

import "./StatCard.css";

function StatCard({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  subtitle,
}) {
  const normalizedTrend = ["up", "down", "neutral"].includes(
    trend
  )
    ? trend
    : "neutral";

  const TrendIcon =
    normalizedTrend === "up"
      ? FiArrowUpRight
      : normalizedTrend === "down"
        ? FiArrowDownRight
        : FiMinus;

  return (
    <article
      className={`stat-card stat-card-${normalizedTrend}`}
    >
      {/* =========================
          TOP
      ========================= */}

      <div className="stat-card-top">

        <div className="stat-icon" aria-hidden="true">
          {icon}
        </div>

        {change !== undefined &&
          change !== null &&
          change !== "" && (
            <span
              className={`stat-trend stat-trend-${normalizedTrend}`}
              aria-label={`Trend ${normalizedTrend}: ${change}`}
            >
              <TrendIcon aria-hidden="true" />
              <span>{change}</span>
            </span>
          )}

      </div>

      {/* =========================
          CONTENT
      ========================= */}

      <div className="stat-card-bottom">

        <span className="stat-title">
          {title || "Statistic"}
        </span>

        <strong className="stat-value">
          {value ?? "—"}
        </strong>

        {subtitle && (
          <small className="stat-subtitle">
            {subtitle}
          </small>
        )}

      </div>
    </article>
  );
}

export default StatCard;
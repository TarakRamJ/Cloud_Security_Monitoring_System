import React, { memo } from "react";
import { Box, Card, CardContent, Typography, Grid, Chip, Skeleton, Tooltip } from "@mui/material";
import { Gauge, Target, Shield, Zap, Info } from "lucide-react";

const TIME_RANGE_OPTIONS = [
  { label: "1H", value: "1h" },
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
];

const MetricCard = memo(({ title, value, icon, description, formula, benchmark, color }) => {
  const formattedVal = value !== undefined && value !== null ? Number(value).toFixed(2) : "—";
  const numericVal = value !== undefined && value !== null ? Number(value) : 0;
  const progressPercent = Math.min(Math.max(numericVal * 100, 5), 100);

  return (
    <Card
      sx={{
        height: "100%",
        background: "linear-gradient(145deg, #0f141d 0%, #07090e 100%)",
        border: `1px solid ${color}33`,
        borderRadius: 2.5,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.15s ease, border-color 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: `${color}88`,
        },
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${color}1A`,
                color: color,
              }}
            >
              {icon}
            </Box>
            <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.05em" }}>
              {title}
            </Typography>
          </Box>
          <Tooltip title={`${description} | Formula: ${formula} | Target: ${benchmark}`} arrow>
            <Box sx={{ cursor: "pointer", color: "text.secondary", display: "flex", "&:hover": { color: "#fff" } }}>
              <Info size={14} />
            </Box>
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, my: 1 }}>
          <Typography variant="h4" sx={{ color: "#fff", fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>
            {formattedVal}
          </Typography>
          <Typography variant="caption" sx={{ color: color, fontWeight: 700, fontSize: "0.75rem" }}>
            {benchmark}
          </Typography>
        </Box>

        <Box sx={{ width: "100%", height: 4, bgcolor: "rgba(255,255,255,0.06)", borderRadius: 1, my: 1.5, overflow: "hidden" }}>
          <Box
            sx={{
              width: `${progressPercent}%`,
              height: "100%",
              bgcolor: color,
              borderRadius: 1,
              transition: "width 0.5s ease-out",
            }}
          />
        </Box>

        <Typography variant="caption" sx={{ color: "var(--CSMS-text-muted)", display: "block", fontSize: "0.74rem", lineHeight: 1.3 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
});

export const TechnicalMetricsSection = memo(({ metrics, loading = false, timeRange = "24h", onTimeRangeChange }) => {
  if (loading && !metrics) {
    return (
      <Box sx={{ width: "100%", mb: 3 }}>
        <Skeleton variant="rounded" height={150} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Target size={18} color="#10b981" />
          </div>
          <div>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff", fontSize: "1.05rem" }}>
              Technical Security Metrics Framework
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--CSMS-text-muted)", display: "block" }}>
              Empirical SOC detection accuracy & remediation velocity (Forsberg & Frantti standard)
            </Typography>
          </div>
        </Box>

        {/* Time Range Selector */}
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {TIME_RANGE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              size="small"
              onClick={() => onTimeRangeChange?.(opt.value)}
              sx={{
                fontWeight: 700,
                fontSize: "0.68rem",
                height: 26,
                cursor: "pointer",
                backgroundColor: timeRange === opt.value ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)",
                color: timeRange === opt.value ? "#10b981" : "#8b93a3",
                border: timeRange === opt.value ? "1px solid #10b98155" : "1px solid rgba(255,255,255,0.08)",
                "&:hover": {
                  backgroundColor: "rgba(16,185,129,0.12)",
                  color: "#10b981",
                },
              }}
            />
          ))}
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="ETDR"
            value={metrics?.etdr}
            icon={<Target size={16} />}
            description="Early-Stage Threat Detection Ratio"
            formula="T_early / (T_early + T_late)"
            benchmark="Target ≥ 0.85"
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="STAA"
            value={metrics?.staa}
            icon={<Shield size={16} />}
            description="SecOps Technical Analysis Accuracy"
            formula="TP / (TP + FP)"
            benchmark="Target ≥ 0.90"
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CDAR"
            value={metrics?.cdar}
            icon={<Gauge size={16} />}
            description="Custom Detection Augmentation Ratio"
            formula="D_custom / D_total"
            benchmark="Target ≥ 0.70"
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="ASRV"
            value={metrics?.asrv}
            icon={<Zap size={16} />}
            description="Critical Attack Surface Remediation Velocity"
            formula="Remediated_24h / Exposure_Total"
            benchmark="Target ≥ 0.80"
            color="#ef4444"
          />
        </Grid>
      </Grid>
    </Box>
  );
});

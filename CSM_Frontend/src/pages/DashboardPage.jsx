import React, { useContext, useEffect, useState, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { DashboardTelemetrySection } from "../components/DashboardTelemetrySection";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  CircularProgress,
  Snackbar,
  Alert,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Storage as AssetIcon,
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as CriticalIcon,
  Shield as ShieldIcon,
  BugReport as BugIcon,
  VerifiedUser as ComplianceIcon,
  Speed as RiskIcon,
  History as AuditIcon,
  Memory as CpuIcon,
  Router as NetworkIcon,
  SdStorage as DiskIcon,
  Notifications as BellIcon,
  Add as AddIcon,
  AssignmentTurnedIn as ReportIcon,
} from "@mui/icons-material";
import { AssetHealthCard } from "../components/AssetHealthCard";
import { TechnicalMetricsSection } from "../components/TechnicalMetricsSection";

const socTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#050608",
      paper: "#0D1117",
    },
    primary: { main: "#10B981" },
    secondary: { main: "#3B82F6" },
    error: { main: "#EF4444" },
    warning: { main: "#F59E0B" },
    info: { main: "#3B82F6" },
    success: { main: "#10B981" },
    divider: "#1F2937",
    text: { primary: "#F9FAFB", secondary: "#9CA3AF" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
    h6: { fontWeight: 700, fontSize: "1rem", letterSpacing: "0.02em" },
    subtitle2: {
      fontSize: "0.7rem",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      fontWeight: 800,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#0D1117",
          border: "1px solid #1F2937",
          borderRadius: 12,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
  },
});

const SEVERITY_COLORS = {
  CRITICAL: "#EF4444",
  HIGH: "#F59E0B",
  MEDIUM: "#3B82F6",
  LOW: "#10B981",
};

const KPI_DEFS = [
  { key: "totalAssets", label: "Total Assets", icon: AssetIcon, color: "#3B82F6" },
  { key: "healthyAssets", label: "Healthy Assets", icon: HealthyIcon, color: "#10B981" },
  { key: "criticalAssets", label: "Critical Assets", icon: CriticalIcon, color: "#EF4444" },
  { key: "activeAlerts", label: "Active Alerts", icon: BellIcon, color: "#F59E0B" },
  { key: "activeIncidents", label: "Incidents", icon: WarningIcon, color: "#EF4444" },
  { key: "criticalVulnerabilities", label: "Critical CVEs", icon: BugIcon, color: "#EF4444" },
  { key: "overallRiskScore", label: "Risk Score", icon: RiskIcon, color: "#F59E0B", suffix: "/100" },
  { key: "compliancePercentage", label: "Compliance", icon: ComplianceIcon, color: "#10B981", suffix: "%" },
  { key: "auditLogsToday", label: "Audit Logs", icon: AuditIcon, color: "#8B93A3" },
];

const QUICK_ACTIONS = [
  { label: "Add Asset", act: "ADD_ASSET", icon: AddIcon, color: "#3B82F6" },
  { label: "Check Incidents", act: "CREATE_INCIDENT", icon: WarningIcon, color: "#F59E0B" },
  { label: "Run Scan", act: "RUN_TRIVY", icon: BugIcon, color: "#EF4444" },
  { label: "Generate Report", act: "GENERATE_REPORT", icon: ReportIcon, color: "#8B93A3" },
  { label: "Check Compliance", act: "CHECK_COMPLIANCE", icon: ComplianceIcon, color: "#10B981", adminOnly: true },
  { label: "View Alerts", act: "VIEW_ALERTS", icon: BellIcon, color: "#F59E0B" },
  { label: "View Vulnerabilities", act: "VIEW_VULNERABILITIES", icon: ShieldIcon, color: "#EF4444" },
  { label: "Audit Trail", act: "VIEW_AUDIT_TRAIL", icon: AuditIcon, color: "#3B82F6", adminOnly: true },
];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "ADMIN";
  const [data, setData] = useState(null);
  const [charts, setCharts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [technicalMetrics, setTechnicalMetrics] = useState(null);
  const [metricsTimeRange, setMetricsTimeRange] = useState("24h");

  const fetchSocData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [socRes, chartRes, metricsRes] = await Promise.all([
        API.get("/api/dashboard/soc-overview"),
        API.get("/api/dashboard/charts"),
        API.get("/api/v1/metrics/technical-performance", {
          params: { timeRange: metricsTimeRange },
        }),
      ]);
      setData(socRes.data);
      setTechnicalMetrics(metricsRes.data);

      const formattedCharts = (chartRes.data || []).map((item) => ({
        ...item,
        formattedTime: item.timestamp
          ? new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
      }));
      setCharts(formattedCharts);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("SOC Fetch Error:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [metricsTimeRange]);

  const fetchAuditLogs = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingLogs(true);
    try {
      const res = await API.get("/api/dashboard/auditLogs-summary");
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch audit logs summary:", err);
    } finally {
      if (!isBackground) setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchSocData(false);
    fetchAuditLogs(false);

    const interval = setInterval(() => {
      // Avoid polling when tab is inactive to save browser cycles
      if (!document.hidden) {
        fetchSocData(true);
        fetchAuditLogs(true);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [fetchSocData, fetchAuditLogs]);

  const handleQuickAction = async (actionType) => {
    setActionLoading(true);
    try {
      switch (actionType) {
        case "ADD_ASSET":
          navigate("/assets");
          break;
        case "CREATE_INCIDENT":
          navigate("/incidents");
          break;
        case "RUN_TRIVY":
          await API.post("/api/vulnerabilities/scan/trivy");
          setToast({
            open: true,
            message: "Vulnerability scan started.",
            severity: "success",
          });
          fetchSocData(false);
          break;
        case "GENERATE_REPORT":
          navigate("/reports");
          break;
        case "CHECK_COMPLIANCE":
          navigate("/compliance");
          break;
        case "VIEW_ALERTS":
          navigate("/alerts");
          break;
        case "VIEW_VULNERABILITIES":
          navigate("/vulnerabilities");
          break;
        case "VIEW_AUDIT_TRAIL":
          navigate("/audit");
          break;
        default:
          break;
      }
    } catch (err) {
      setToast({
        open: true,
        message:
          err.response?.data?.message ||
          "Something went wrong running that action.",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getThreatColor = (level) => {
    switch (level) {
      case "CRITICAL":
        return "#EF4444";
      case "HIGH":
        return "#F59E0B";
      case "MEDIUM":
        return "#3B82F6";
      default:
        return "#10B981";
    }
  };

  const visibleQuickActions = useMemo(
    () => QUICK_ACTIONS.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  const resourceUsage = useMemo(
    () => [
      {
        label: "CPU Usage",
        val: Math.round(data?.resourceSummary?.cpuUsage ?? 23),
        icon: <CpuIcon fontSize="small" />,
      },
      {
        label: "Memory Usage",
        val: Math.round(data?.resourceSummary?.memoryUsage ?? 47),
        icon: <AssetIcon fontSize="small" />,
      },
      {
        label: "Disk Usage",
        val: Math.round(data?.resourceSummary?.diskUsage ?? 67),
        icon: <DiskIcon fontSize="small" />,
      },
      {
        label: "Network Usage",
        val: Math.round(data?.resourceSummary?.networkUsage ?? 12),
        icon: <NetworkIcon fontSize="small" />,
      },
    ],
    [data?.resourceSummary]
  );

  const securityScore = data?.securityScore ?? 85;

  const formatLogTime = (isoString) => {
    if (!isoString) return "--:--";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return "--:--";
    }
  };

  // Construct Pie Data for Asset Health
  const totalAssetsCount = data?.totalAssets ?? 0;
  const healthyCount = data?.healthyAssets ?? 0;
  const criticalCount = data?.criticalAssets ?? 0;
  const warningCount = Math.max(
    0,
    totalAssetsCount - healthyCount - criticalCount,
  );

  const assetHealthData = useMemo(
    () => [
      { name: "HEALTHY", value: healthyCount, color: "#10B981" },
      { name: "WARNING", value: warningCount, color: "#F59E0B" },
      { name: "CRITICAL", value: criticalCount, color: "#EF4444" },
    ],
    [healthyCount, warningCount, criticalCount]
  );

  const lastScanDisplay = useMemo(() => {
    if (!data?.lastScanTime) return "N/A";
    const diff = Math.floor((Date.now() - new Date(data.lastScanTime).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, [data?.lastScanTime]);

  return (
    <ThemeProvider theme={socTheme}>
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          backgroundColor: "background.default",
          minHeight: "100vh",
          width: "100%",
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}
            >
              Security Operations Center
            </Typography>
            <Chip
              label={`Threat Level: ${data?.threatLevel || "LOW"}`}
              size="small"
              sx={{
                backgroundColor: `${getThreatColor(data?.threatLevel)}22`,
                color: getThreatColor(data?.threatLevel),
                border: `1px solid ${getThreatColor(data?.threatLevel)}55`,
                fontWeight: 700,
                fontSize: "0.7rem",
              }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Last refresh: {lastRefreshed.toLocaleTimeString()}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={() => {
                fetchSocData(false);
                fetchAuditLogs(false);
              }}
              sx={{
                borderColor: "divider",
                color: "text.secondary",
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                  backgroundColor: "rgba(16,185,129,0.08)",
                },
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* KPI GRID */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(5, 1fr)",
            },
            gap: 1.5,
            mb: 3,
            width: "100%",
          }}
        >
          {KPI_DEFS.map((kpi) => {
            const Icon = kpi.icon;
            const rawVal = data?.[kpi.key];
            const displayVal = loading
              ? null
              : rawVal !== undefined && rawVal !== null
                ? `${rawVal}${kpi.suffix || ""}`
                : "—";
            return (
              <Box
                key={kpi.key}
                sx={{
                  backgroundColor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 80,
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.18)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      fontSize: "0.7rem",
                    }}
                    noWrap
                  >
                    {kpi.label}
                  </Typography>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${kpi.color}1F`,
                      color: kpi.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                  </Box>
                </Box>
                {loading ? (
                  <Skeleton
                    variant="text"
                    width="55%"
                    height={28}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
                  />
                ) : (
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: "1.35rem",
                      color: "#fff",
                      lineHeight: 1,
                    }}
                  >
                    {displayVal}
                  </Typography>
                )}
              </Box>
            );
          })}

          {/* 10th Card: Last Scan */}
          <Box
            sx={{
              backgroundColor: "background.paper",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2.5,
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 80,
              transition: "transform 0.15s ease, border-color 0.15s ease",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.18)",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
                gap: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                }}
                noWrap
              >
                LAST SCAN
              </Typography>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "text.secondary",
                  flexShrink: 0,
                }}
              >
                <BugIcon sx={{ fontSize: 16 }} />
              </Box>
            </Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {lastScanDisplay}
            </Typography>
          </Box>
        </Box>

        {/* INFRASTRUCTURE OVERVIEW */}
        <Card sx={{ mb: 2, width: "100%" }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Infrastructure Overview
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 1.5,
                width: "100%",
              }}
            >
              {resourceUsage.map((res, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.015)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mb: 1,
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ color: "text.secondary", display: "flex" }}>
                      {res.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.78rem" }}
                    >
                      {res.label}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {res.val}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={res.val}
                    sx={{
                      mt: 1,
                      height: 5,
                      borderRadius: 2,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 2,
                        backgroundColor:
                          res.val > 80
                            ? "#EF4444"
                            : res.val > 50
                              ? "#F59E0B"
                              : "#10B981",
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* SINGLE ROW: SECURITY SCORE, ASSET HEALTH PIE CHART & TELEMETRY TREND */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 2.2fr" },
            gap: 2,
            mb: 2,
            width: "100%",
            alignItems: "stretch",
            minHeight: 280,
          }}
        >
          {/* Overall Security Score Card */}
          <Card
            elevation={0}
            sx={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#11161d",
              color: "#ffffff",
              borderRadius: 2,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: 2.5,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1.05rem",
                    color: "#f3f4f6",
                  }}
                >
                  Overall Security Score
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#9ca3af", fontSize: "0.825rem" }}
                >
                  Automated risk evaluation
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", my: 1.5 }}>
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={110}
                    thickness={5}
                    sx={{
                      color: "rgba(255,255,255,0.06)",
                      position: "absolute",
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={securityScore}
                    size={110}
                    thickness={5}
                    sx={{
                      color:
                        securityScore > 70
                          ? "#10B981"
                          : securityScore > 40
                            ? "#F59E0B"
                            : "#EF4444",
                      "& .MuiCircularProgress-circle": {
                        strokeLinecap: "round",
                      },
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: "absolute",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h4" fontWeight={800} color="#ffffff">
                      {securityScore}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#6b7280", fontSize: "0.75rem" }}
                    >
                      / 100
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: "#9ca3af",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  px: 1,
                }}
              >
                Calculated from vulnerabilities & incident SLA times
              </Typography>
            </CardContent>
          </Card>

          {/* Asset Health Donut Chart */}
          <AssetHealthCard
            assetHealthData={assetHealthData}
            totalAssetsCount={totalAssetsCount}
          />

          {/* Performance Telemetry Trend Chart */}
          <DashboardTelemetrySection charts={charts} loading={loading} />
        </Box>

        {/* FORSBERG (2023) TECHNICAL METRICS (LIVE DATA) */}
        <TechnicalMetricsSection
          metrics={technicalMetrics}
          loading={loading}
          timeRange={metricsTimeRange}
          onTimeRangeChange={(range) => setMetricsTimeRange(range)}
        />

        {/* LINE 1: OPERATIONS & COMPLIANCE ROW */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr 1fr" },
            gap: 2,
            mb: 2,
            width: "100%",
          }}
        >
          {/* Quick Operations Hub */}
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Quick Operations Hub
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 1,
                }}
              >
                {visibleQuickActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.act}
                      disabled={actionLoading}
                      onClick={() => handleQuickAction(item.act)}
                      sx={{
                        justifyContent: "flex-start",
                        gap: 1,
                        py: 0.9,
                        px: 1.2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "rgba(255,255,255,0.015)",
                        color: "text.primary",
                        fontSize: "0.8rem",
                        "&:hover": {
                          borderColor: `${item.color}66`,
                          backgroundColor: `${item.color}14`,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: `${item.color}1F`,
                          color: item.color,
                          flexShrink: 0,
                        }}
                      >
                        <Icon sx={{ fontSize: 13 }} />
                      </Box>
                      {item.label}
                    </Button>
                  );
                })}
              </Box>
            </CardContent>
          </Card>

          {/* Compliance Audits */}
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Compliance Audits
              </Typography>
              {data?.complianceSummary?.map((comp, idx) => (
                <Box
                  key={idx}
                  sx={{
                    mb: 1,
                    p: 1.2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.015)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {comp.framework}
                    </Typography>
                    <Chip
                      label={comp.status}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.6rem",
                        backgroundColor:
                          comp.status === "PASS"
                            ? "rgba(16,185,129,0.16)"
                            : "rgba(239,68,68,0.16)",
                        color: comp.status === "PASS" ? "#34d399" : "#f87171",
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Controls passed: {comp.passedControls}/{comp.totalControls}{" "}
                    ({comp.scorePercentage}%)
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Top Critical Vulnerabilities */}
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Top Critical Vulnerabilities
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          p: "4px 6px",
                          borderColor: "divider",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                        }}
                      >
                        CVE ID
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          p: "4px 6px",
                          borderColor: "divider",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                        }}
                      >
                        CVSS
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          p: "4px 6px",
                          borderColor: "divider",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Severity
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          p: "4px 6px",
                          borderColor: "divider",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.topCriticalCVEs?.length > 0 ? (
                      data.topCriticalCVEs.map((cve) => (
                        <TableRow key={cve.id}>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              p: "6px",
                              fontSize: "0.75rem",
                              fontFamily: "JetBrains Mono, monospace",
                              borderColor: "divider",
                            }}
                          >
                            {cve.cveId}
                          </TableCell>
                          <TableCell
                            sx={{
                              p: "6px",
                              fontSize: "0.75rem",
                              borderColor: "divider",
                            }}
                          >
                            {cve.cvssScore}
                          </TableCell>
                          <TableCell sx={{ p: "6px", borderColor: "divider" }}>
                            <Chip
                              label={cve.severity}
                              size="small"
                              sx={{
                                backgroundColor: `${SEVERITY_COLORS[cve.severity]}22`,
                                color: SEVERITY_COLORS[cve.severity],
                                height: 18,
                                fontSize: "0.6rem",
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              p: "6px",
                              fontSize: "0.75rem",
                              borderColor: "divider",
                            }}
                          >
                            {cve.patchStatus}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            color: "text.secondary",
                            py: 2,
                            borderColor: "divider",
                          }}
                        >
                          No active critical CVEs
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* LINE 2: AUDIT TIMELINE */}
        <Card sx={{ width: "100%", mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography
              variant="h6"
              sx={{ mb: 1.5, fontSize: "1.05rem", fontWeight: 700 }}
            >
              Live Security Audit Trail
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 1.5,
                width: "100%",
              }}
            >
              {loadingLogs ? (
                [...Array(4)].map((_, idx) => (
                  <Skeleton
                    key={idx}
                    variant="rounded"
                    height={68}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.03)",
                      borderRadius: 1.5,
                    }}
                  />
                ))
              ) : auditLogs.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ gridColumn: "1 / -1", py: 1 }}
                >
                  No recent audit logs recorded.
                </Typography>
              ) : (
                auditLogs.slice(0, 4).map((log, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.25,
                      borderLeft: "3px solid",
                      borderColor: "primary.main",
                      bgcolor: "rgba(255,255,255,0.015)",
                      borderRadius: 1.5,
                      borderTop: "1px solid #242933",
                      borderRight: "1px solid #242933",
                      borderBottom: "1px solid #242933",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "JetBrains Mono, monospace",
                          color: "primary.main",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        }}
                      >
                        {formatLogTime(log.timestamp)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.68rem",
                          color: "text.secondary",
                          noWrap: true,
                          maxWidth: "110px",
                        }}
                        title={log.userEmail}
                      >
                        {log.userEmail}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.8rem",
                        mt: 0.5,
                        fontWeight: 500,
                        color: "#fff",
                      }}
                      noWrap
                      title={log.action}
                    >
                      {log.action}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>

        <ActivityHeatmap days={365} />

        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast({ ...toast, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={toast.severity}
            sx={{ width: "100%" }}
            onClose={() => setToast({ ...toast, open: false })}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

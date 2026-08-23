import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";

const enterpriseTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0A0C10",
      paper: "#171B22",
    },
    primary: { main: "#10B981" }, 
    secondary: { main: "#3B82F6" },
    error: { main: "#EF4444" },
    text: { primary: "#F5F7FA", secondary: "#8B93A3" },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
  },
});

export const AuthPage = () => {
  const { login } = useContext(AuthContext);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // 2FA / MFA Flow Expansion State
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validate = () => {
    const errs = {};
    if (!formData.username.trim()) {
      errs.username = "Username or Identity ID is required";
    }
    if (!isLoginMode) {
      if (!formData.email.trim()) {
        errs.email = "Email address is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errs.email = "Invalid corporate email format";
      }
    }
    if (!formData.password) {
      errs.password = "Password is required";
    } else if (formData.password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");

    if (!validate()) return;

    setLoading(true);

    const payload = {
      username: formData.username.trim().toLowerCase(),
      email: formData.email ? formData.email.trim().toLowerCase() : undefined,
      password: formData.password,
      rememberMe,
    };

    try {
      if (isLoginMode) {
        // MFA Step Verification
        if (isMfaRequired) {
          const response = await API.post("/auth/mfa-verify", {
            username: payload.username,
            code: mfaCode,
          });
          login(response.data);
          return;
        }

        const response = await API.post("/auth/login", {
          username: payload.username,
          password: payload.password,
        });

        // Handle 2FA Challenge Trigger
        if (response.data?.mfaRequired) {
          setIsMfaRequired(true);
          setSuccessMessage(
            "Security Challenge: Enter the 2FA code from your authenticator app.",
          );
          return;
        }

        login(response.data);
      } else {
        await API.post("/auth/register", payload);

        setFormData({ username: "", email: "", password: "" });
        setIsLoginMode(true);
        setSuccessMessage(
          "Account created successfully. Please sign in with your credentials.",
        );
      }
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
          "Authentication service failed. Please check credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={enterpriseTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 70%)",
          p: 2,
        }}
      >
        <Card
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: "background.paper",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* BRANDING HEADER */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  mb: 0.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#52c41a",
                  }}
                >
                  <Shield size={24} />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.5px",
                  }}
                >
                  CSMS - <span style={{ color: "#52c41a" }}>IMA</span>
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontSize: "0.78rem" }}
              >
                Enterprise Security Operations Platform
              </Typography>
            </Box>

            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                fontWeight: 700,
                mb: 2.5,
                color: "#F5F7FA",
                fontSize: "1.05rem",
              }}
            >
              {isMfaRequired
                ? "Two-Factor Verification"
                : isLoginMode
                  ? "Sign In to Console"
                  : "Register Enterprise Account"}
            </Typography>

            {/* SUCCESS BANNER */}
            {successMessage && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  p: 1.5,
                  mb: 2,
                  borderRadius: 1.5,
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#52c41a",
                  fontSize: "0.825rem",
                }}
              >
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.825rem",
                    color: "#52c41a",
                    lineHeight: 1.3,
                  }}
                >
                  {successMessage}
                </Typography>
              </Box>
            )}

            {/* ERROR BANNER */}
            {apiError && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  p: 1.5,
                  mb: 2,
                  borderRadius: 1.5,
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  fontSize: "0.825rem",
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.825rem",
                    color: "#f87171",
                    lineHeight: 1.3,
                  }}
                >
                  {apiError}
                </Typography>
              </Box>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} noValidate>
              {/* MFA STEP */}
              {isMfaRequired ? (
                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      mb: 0.8,
                      display: "block",
                      fontSize: "0.75rem",
                    }}
                  >
                    Security Code
                  </Typography>
                  <Box sx={{ position: "relative" }}>
                    <KeyRound
                      size={18}
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6b7280",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 40px",
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "1rem",
                        letterSpacing: "4px",
                        textAlign: "center",
                        outline: "none",
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <>
                  {/* USERNAME FIELD */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        mb: 0.6,
                        display: "block",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      Username or ID
                    </Typography>
                    <Box sx={{ position: "relative" }}>
                      <User
                        size={18}
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#6b7280",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 40px",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          border: errors.username
                            ? "1px solid #ef4444"
                            : "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "0.875rem",
                          outline: "none",
                        }}
                      />
                    </Box>
                    {errors.username && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#ef4444",
                          fontSize: "0.72rem",
                          mt: 0.4,
                          display: "block",
                        }}
                      >
                        {errors.username}
                      </Typography>
                    )}
                  </Box>

                  {/* EMAIL FIELD (REGISTER MODE) */}
                  {!isLoginMode && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          mb: 0.6,
                          display: "block",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        Corporate Email
                      </Typography>
                      <Box sx={{ position: "relative" }}>
                        <Mail
                          size={18}
                          style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#6b7280",
                          }}
                        />
                        <input
                          type="email"
                          placeholder="user@organization.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          style={{
                            width: "100%",
                            padding: "10px 12px 10px 40px",
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                            border: errors.email
                              ? "1px solid #ef4444"
                              : "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "0.875rem",
                            outline: "none",
                          }}
                        />
                      </Box>
                      {errors.email && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#ef4444",
                            fontSize: "0.72rem",
                            mt: 0.4,
                            display: "block",
                          }}
                        >
                          {errors.email}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* PASSWORD FIELD */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        mb: 0.6,
                        display: "block",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      Password
                    </Typography>
                    <Box sx={{ position: "relative" }}>
                      <Lock
                        size={18}
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#6b7280",
                        }}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 40px 10px 40px",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          border: errors.password
                            ? "1px solid #ef4444"
                            : "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "0.875rem",
                          outline: "none",
                        }}
                      />
                      <Box
                        onClick={() => setShowPassword(!showPassword)}
                        sx={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#6b7280",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          "&:hover": { color: "#fff" },
                        }}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </Box>
                    </Box>
                    {errors.password && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#ef4444",
                          fontSize: "0.72rem",
                          mt: 0.4,
                          display: "block",
                        }}
                      >
                        {errors.password}
                      </Typography>
                    )}
                  </Box>

                  {/* PERSISTENCE & FORGOT PASSWORD */}
                  {isLoginMode && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2.5,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            size="small"
                            sx={{
                              color: "rgba(255,255,255,0.2)",
                              "&.Mui-checked": { color: "primary.main" },
                              p: 0.5,
                            }}
                          />
                        }
                        label={
                          <Typography
                            variant="caption"
                            sx={{ color: "#9ca3af", fontSize: "0.75rem" }}
                          >
                            Remember me
                          </Typography>
                        }
                      />
                    </Box>
                  )}
                </>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "11px",
                  backgroundColor: "#10B981",
                  color: "#000000",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background-color 0.15s ease",
                  opacity: loading ? 0.7 : 1,
                  marginTop: isLoginMode ? "0px" : "12px",
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: "#000" }} />
                ) : (
                  <>
                    <span>
                      {isMfaRequired
                        ? "Verify Code"
                        : isLoginMode
                          ? "Sign In to Console"
                          : "Create Account"}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* FOOTER SWITCH */}
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                mt: 2.5,
                fontSize: "0.825rem",
                color: "#9ca3af",
              }}
            >
              {isLoginMode
                ? "Don't have an enterprise account? "
                : "Already registered? "}
              <span
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setIsMfaRequired(false);
                  setErrors({});
                  setApiError("");
                  setSuccessMessage("");
                }}
                style={{ color: "#10B981", fontWeight: 600, cursor: "pointer" }}
              >
                {isLoginMode ? "Register Account" : "Sign In"}
              </span>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
};

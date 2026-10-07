package com.sentinel.security.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "alerts")
public class Alert {
    @Id
    private UUID alertId;

    @Column(name = "asset_id", nullable = false)
    private UUID assetId;

    @Column(name = "metric_name", nullable = false)
    private String metricName;

    @Column(name = "violation_value")
    private float violationValue;

    @Column(name = "solution")
    private String solution;

    @Column(name = "server_name")
    private String serverName;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    private AlertSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type")
    private AlertSourceType sourceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "classification")
    private AlertClassification classification;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public enum AlertSeverity { LOW, MEDIUM, HIGH, CRITICAL }
    public enum AlertSourceType { NETWORK, ENDPOINT, CLOUD, DATABASE, CUSTOM_AGENT }
    public enum AlertClassification { TRUE_POSITIVE, BENIGN_POSITIVE, FALSE_POSITIVE }

    public Alert() {
        this.alertId = UUID.randomUUID();
        this.createdAt = OffsetDateTime.now();
        this.sourceType = AlertSourceType.CUSTOM_AGENT;
        this.classification = AlertClassification.TRUE_POSITIVE;
    }

    public Alert(UUID assetId, String metricName, float violationValue, String serverName, AlertSeverity severity, String solution) {
        this.alertId = UUID.randomUUID();
        this.assetId = assetId;
        this.metricName = metricName;
        this.violationValue = violationValue;
        this.serverName = serverName;
        this.severity = severity;
        this.createdAt = OffsetDateTime.now();
        this.solution = solution;
        this.sourceType = AlertSourceType.CUSTOM_AGENT;
        this.classification = AlertClassification.TRUE_POSITIVE;
    }

    public Alert(UUID assetId, String metricName, float violationValue, String serverName,
                 AlertSeverity severity, String solution, AlertSourceType sourceType, AlertClassification classification) {
        this.alertId = UUID.randomUUID();
        this.assetId = assetId;
        this.metricName = metricName;
        this.violationValue = violationValue;
        this.serverName = serverName;
        this.severity = severity;
        this.createdAt = OffsetDateTime.now();
        this.solution = solution;
        this.sourceType = sourceType != null ? sourceType : AlertSourceType.CUSTOM_AGENT;
        this.classification = classification != null ? classification : AlertClassification.TRUE_POSITIVE;
    }

    public UUID getAlertId() { return alertId; }
    public void setAlertId(UUID alertId) { this.alertId = alertId; }
    public UUID getAssetId() { return assetId; }
    public void setAssetId(UUID assetId) { this.assetId = assetId; }
    public String getMetricName() { return metricName; }
    public void setMetricName(String metricName) { this.metricName = metricName; }
    public float getViolationValue() { return violationValue; }
    public void setViolationValue(float violationValue) { this.violationValue = violationValue; }
    public String getSolution() { return solution; }
    public void setSolution(String solution) { this.solution = solution; }
    public String getServerName() { return serverName; }
    public void setServerName(String serverName) { this.serverName = serverName; }
    public AlertSeverity getSeverity() { return severity; }
    public void setSeverity(AlertSeverity severity) { this.severity = severity; }
    public AlertSourceType getSourceType() { return sourceType; }
    public void setSourceType(AlertSourceType sourceType) { this.sourceType = sourceType; }
    public AlertClassification getClassification() { return classification; }
    public void setClassification(AlertClassification classification) { this.classification = classification; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}

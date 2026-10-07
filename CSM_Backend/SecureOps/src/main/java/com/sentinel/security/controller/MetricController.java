package com.sentinel.security.controller;

import com.sentinel.security.dto.TechnicalMetricsResponse;
import com.sentinel.security.service.IncidentService;
import com.sentinel.security.service.AlertService;
import com.sentinel.security.service.VulnerabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;

@RestController
@RequestMapping("/api/v1/metrics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MetricController {

    private final IncidentService incidentService;
    private final AlertService alertService;
    private final VulnerabilityService vulnerabilityService;

    @GetMapping("/technical-performance")
    public ResponseEntity<TechnicalMetricsResponse> getRealtimeTechnicalMetrics(
            @RequestParam(defaultValue = "24h") String timeRange) {

        Duration window = parseDuration(timeRange);

        Double etdr = incidentService.calculateRealTimeETDR(window);
        Double staa = incidentService.calculateRealTimeSTAA(window);
        Double cdar = alertService.calculateRealTimeCDAR(window);
        Double asrv = vulnerabilityService.calculateRealTimeASRV(window);

        return ResponseEntity.ok(new TechnicalMetricsResponse(
            etdr,
            staa,
            cdar,
            asrv,
            Instant.now()
        ));
    }

    private Duration parseDuration(String timeRange) {
        return switch (timeRange) {
            case "1h" -> Duration.ofHours(1);
            case "7d" -> Duration.ofDays(7);
            case "30d" -> Duration.ofDays(30);
            case "90d" -> Duration.ofDays(90);
            default -> Duration.ofHours(24);
        };
    }
}

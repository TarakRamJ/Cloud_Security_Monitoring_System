package com.sentinel.security.service;

import com.sentinel.security.model.Alert;
import com.sentinel.security.model.Asset;
import com.sentinel.security.model.Incident;
import com.sentinel.security.repo.AlertRepository;
import com.sentinel.security.repo.AssetRepository;
import com.sentinel.security.repo.IncidentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class SecurityIncidentSimulator   {

    private final IncidentRepository incidentRepository;
    private final AssetRepository assetRepository;
    private final AlertRepository alertRepository;
    private final Random random = new Random();

    private record ThreatScenario(
            String attackType,
            Incident.IncidentTactic tactic,
            Incident.IncidentSeverity defaultSeverity,
            String impactTemplate,
            String assignedTeam
    ) {}

    private final List<ThreatScenario> threatScenarios = List.of(
            // Early Stage - Reconnaissance (Targeting ETDR >= 0.85)
            new ThreatScenario(
                    "Automated Vulnerability Scan (Nmap/Masscan)",
                    Incident.IncidentTactic.RECONNAISSANCE,
                    Incident.IncidentSeverity.LOW,
                    "High-frequency TCP SYN port sweep across ports 22, 80, 443, 8080 from external IP",
                    "SOC Tier 1"
            ),
            new ThreatScenario(
                    "Suspicious Subdomain & Directory Enumeration",
                    Incident.IncidentTactic.RECONNAISSANCE,
                    Incident.IncidentSeverity.LOW,
                    "Automated fuzzing attack probing hidden /api/v1 endpoints and sensitive configuration files",
                    "SOC Tier 1"
            ),
            // Early Stage - Initial Access
            new ThreatScenario(
                    "SSH Brute-Force Authentication Attempt",
                    Incident.IncidentTactic.INITIAL_ACCESS,
                    Incident.IncidentSeverity.HIGH,
                    "Over 45 failed authentication attempts against SSH daemon | Account locked by security policy",
                    "SOC Tier 1"
            ),
            new ThreatScenario(
                    "Credential Stuffing on Auth Gateway",
                    Incident.IncidentTactic.INITIAL_ACCESS,
                    Incident.IncidentSeverity.HIGH,
                    "Distributed botnet targeting /api/auth/login endpoint with leaked credential dump",
                    "SOC Tier 2 - Threat Intel"
            ),
            new ThreatScenario(
                    "Unauthorized API Key Access Attempt",
                    Incident.IncidentTactic.INITIAL_ACCESS,
                    Incident.IncidentSeverity.MEDIUM,
                    "Expired API bearer token used repeatedly from unmapped external ASN",
                    "DevSecOps Team"
            ),
            // Early Stage - Execution
            new ThreatScenario(
                    "SQL Injection Attempt on API Route",
                    Incident.IncidentTactic.EXECUTION,
                    Incident.IncidentSeverity.HIGH,
                    "Unsanitized UNION SELECT injection pattern detected in HTTP query parameters",
                    "DevSecOps Team"
            ),
            new ThreatScenario(
                    "Remote Code Execution (RCE) Exploit",
                    Incident.IncidentTactic.EXECUTION,
                    Incident.IncidentSeverity.CRITICAL,
                    "Deserialization exploit payload detected targeting application runtime",
                    "Forensics & IR"
            ),
            new ThreatScenario(
                    "Command Injection via Webhook Handler",
                    Incident.IncidentTactic.EXECUTION,
                    Incident.IncidentSeverity.CRITICAL,
                    "Bash shell metacharacters detected in POST payload to webhook ingress service",
                    "Forensics & IR"
            ),
            // Mid/Late Stages - Lateral Movement / Persistence / Exfiltration
            new ThreatScenario(
                    "Suspicious East-West Lateral Movement",
                    Incident.IncidentTactic.LATERAL_MOVEMENT,
                    Incident.IncidentSeverity.HIGH,
                    "Anomalous SMB/RPC connection established between internal workload tiers",
                    "SOC Tier 2 - Threat Intel"
            ),
            new ThreatScenario(
                    "Unauthorized Privilege Escalation",
                    Incident.IncidentTactic.PERSISTENCE,
                    Incident.IncidentSeverity.CRITICAL,
                    "Sudoers modification attempt detected on core host",
                    "Forensics & IR"
            ),
            new ThreatScenario(
                    "High-Volume Outbound Data Exfiltration",
                    Incident.IncidentTactic.EXFILTRATION,
                    Incident.IncidentSeverity.CRITICAL,
                    "Unusual outbound encrypted data stream to unknown external IP exceeding 2.4 GB",
                    "Forensics & IR"
            )
    );

    private final String[] targetUsers = {"admin", "root", "db_admin", "svc_deployer", "cloud_iam", "operator"};

    public SecurityIncidentSimulator(IncidentRepository incidentRepository,
                                     AssetRepository assetRepository,
                                     AlertRepository alertRepository) {
        this.incidentRepository = incidentRepository;
        this.assetRepository = assetRepository;
        this.alertRepository = alertRepository;
    }

    // Runs automatically every 10 seconds to simulate real-time cyber threats
    @Scheduled(fixedRate = 10000)
    public void simulateExternalSecurityThreats() {
        // Keep active incidents within a realistic range for the dashboard screen
        if (incidentRepository.count() >= 35) {
            return;
        }

        List<Asset> assets = assetRepository.findAll();
        Asset targetAsset = assets.isEmpty() ? null : assets.get(random.nextInt(assets.size()));

        // Pick scenario with weighted probability towards early stage (ETDR target >= 0.85)
        ThreatScenario scenario = selectScenarioWeighted();

        Incident.IncidentSeverity severity = scenario.defaultSeverity;
        // Minor dynamic variation in severity
        if (random.nextInt(5) == 0) {
            severity = Incident.IncidentSeverity.values()[random.nextInt(Incident.IncidentSeverity.values().length)];
        }

        String targetUser = targetUsers[random.nextInt(targetUsers.length)];
        String sourceIp = targetAsset != null && random.nextBoolean()
                ? targetAsset.getIp()
                : generateRealisticIp();

        String assetContext = targetAsset != null ? " on " + targetAsset.getName() : "";
        String impact = scenario.impactTemplate + assetContext + " | Target: " + targetUser;

        // SLA configuration based on severity
        int slaHours;
        int etaMinutes;
        switch (severity) {
            case CRITICAL -> {
                slaHours = 1;
                etaMinutes = 25 + random.nextInt(20);
            }
            case HIGH -> {
                slaHours = 2;
                etaMinutes = 45 + random.nextInt(45);
            }
            case MEDIUM -> {
                slaHours = 4;
                etaMinutes = 90 + random.nextInt(90);
            }
            default -> {
                slaHours = 8;
                etaMinutes = 180 + random.nextInt(120);
            }
        }

        // STAA target >= 0.90 (93% true positives, 7% false positives)
        String resolutionType = random.nextInt(15) == 0 ? "FALSE_POSITIVE" : "TRUE_POSITIVE";

        Incident securityIncident = new Incident();
        securityIncident.setIncidentTicket("INC-2026-" + (1000 + random.nextInt(9000)));
        securityIncident.setSeverity(severity);
        securityIncident.setInitialSeverity(severity);
        securityIncident.setStatus(Incident.IncidentStatus.OPEN);
        securityIncident.setType(scenario.attackType);
        securityIncident.setTactic(scenario.tactic);
        securityIncident.setResolutionType(resolutionType);
        securityIncident.setSourceIp(sourceIp);
        securityIncident.setImpactSummary(impact);
        securityIncident.setAssignedTeam(scenario.assignedTeam);
        securityIncident.setSlaHours(slaHours);
        securityIncident.setEtaMinutes(etaMinutes);
        securityIncident.setSlaBreached(false);
        securityIncident.setReopenCount(0);
        securityIncident.setCreatedAt(LocalDateTime.now());
        securityIncident.setUpdatedAt(LocalDateTime.now());

        incidentRepository.save(securityIncident);
    }

    private ThreatScenario selectScenarioWeighted() {
        // 88% chance of selecting Early-Stage scenarios (Recon, Initial Access, Execution)
        // 12% chance of selecting Mid/Late-Stage scenarios (Lateral Movement, Persistence, Exfiltration)
        if (random.nextDouble() < 0.88) {
            return threatScenarios.get(random.nextInt(8));
        } else {
            return threatScenarios.get(8 + random.nextInt(threatScenarios.size() - 8));
        }
    }

    private String generateRealisticIp() {
        String[] externalSubnets = {"198.51.100.", "203.0.113.", "185.220.101.", "45.154.255.", "194.26.29."};
        return externalSubnets[random.nextInt(externalSubnets.length)] + (1 + random.nextInt(254));
    }
}

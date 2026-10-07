package com.sentinel.security.service;

import com.sentinel.security.model.Incident;
import com.sentinel.security.repo.IncidentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class IncidentSlaEngine {

    private final IncidentRepository incidentRepository;
    private final Random random = new Random();

    public IncidentSlaEngine(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    // Every 6 seconds, simulate real-time incident movement, SLA timer enforcement, and MTTR resolutions
    @Scheduled(fixedRate = 6000)
    public void processWorkflowAndResolutions() {
        List<Incident> incidents = incidentRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Incident incident : incidents) {
            // If already resolved or false positive, skip active processing
            if (incident.getStatus() == Incident.IncidentStatus.RESOLVED || incident.getStatus() == Incident.IncidentStatus.FALSE_POSITIVE) {
                continue;
            }

            incident.setUpdatedAt(now);

            // Real-time SLA elapsed time check
            if (incident.getCreatedAt() != null) {
                long elapsedMinutes = Duration.between(incident.getCreatedAt(), now).toMinutes();
                long maxSlaMinutes = incident.getSlaHours() > 0 ? (long) incident.getSlaHours() * 60 : 120;

                // Mark SLA breached if elapsed time exceeds SLA target
                if (elapsedMinutes > maxSlaMinutes) {
                    incident.setSlaBreached(true);
                }
            }

            // Real-time Incident Lifecycle & Triage Progression
            switch (incident.getStatus()) {
                case OPEN -> {
                    // Fast triage: Transition OPEN -> ASSIGNED
                    incident.setStatus(Incident.IncidentStatus.ASSIGNED);
                    if (incident.getTactic() == null) {
                        incident.setTactic(Incident.IncidentTactic.INITIAL_ACCESS);
                    }
                    incidentRepository.save(incident);
                }
                case ASSIGNED -> {
                    // Transition ASSIGNED -> INVESTIGATION (60% chance per tick)
                    if (random.nextInt(10) < 6) {
                        incident.setStatus(Incident.IncidentStatus.INVESTIGATION);
                        // Decrement initial ETA
                        int currentEta = incident.getEtaMinutes();
                        if (currentEta > 5) {
                            incident.setEtaMinutes(currentEta - (3 + random.nextInt(5)));
                        }
                        incidentRepository.save(incident);
                    }
                }
                case INVESTIGATION -> {
                    // Investigation progress: Decrement ETA countdown
                    int currentEta = incident.getEtaMinutes();
                    int decrement = 2 + random.nextInt(4);
                    int newEta = Math.max(0, currentEta - decrement);
                    incident.setEtaMinutes(newEta);

                    // Resolution check: When ETA reaches 0 or randomly completed
                    if (newEta == 0 || random.nextInt(4) == 0) {
                        if ("FALSE_POSITIVE".equalsIgnoreCase(incident.getResolutionType())) {
                            incident.setStatus(Incident.IncidentStatus.FALSE_POSITIVE);
                        } else {
                            incident.setStatus(Incident.IncidentStatus.RESOLVED);
                            if (incident.getResolutionType() == null) {
                                incident.setResolutionType("TRUE_POSITIVE");
                            }
                        }
                        incident.setEtaMinutes(0);
                    }
                    incidentRepository.save(incident);
                }
                default -> {}
            }
        }

        // Database maintenance: Prune resolved incidents if total table count gets too high
        maintainIncidentLimit();
    }

    private void maintainIncidentLimit() {
        long totalCount = incidentRepository.count();
        if (totalCount > 40) {
            List<Incident> allIncidents = incidentRepository.findAll();
            // Find resolved or false positive incidents to prune
            List<Incident> resolvedList = allIncidents.stream()
                    .filter(i -> i.getStatus() == Incident.IncidentStatus.RESOLVED || i.getStatus() == Incident.IncidentStatus.FALSE_POSITIVE)
                    .toList();

            if (!resolvedList.isEmpty()) {
                // Delete oldest resolved incident
                incidentRepository.delete(resolvedList.get(0));
            }
        }
    }
}

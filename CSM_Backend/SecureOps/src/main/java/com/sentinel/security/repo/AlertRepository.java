package com.sentinel.security.repo;

import com.sentinel.security.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
import java.time.OffsetDateTime;

public interface AlertRepository extends JpaRepository<Alert, UUID> {
    List<Alert> findByAssetId(UUID assetId);
    List<Alert> findAllByOrderByCreatedAtAsc();
    long count();

    List<Alert> findTop5ByOrderByCreatedAtDesc();

    long countBySeverity(Alert.AlertSeverity severity);

    List<Alert> findAllByCreatedAtAfter(OffsetDateTime createdAt);
}
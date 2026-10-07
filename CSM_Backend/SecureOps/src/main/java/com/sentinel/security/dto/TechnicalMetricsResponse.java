package com.sentinel.security.dto;

import java.time.Instant;

public record TechnicalMetricsResponse(
    Double etdr,
    Double staa,
    Double cdar,
    Double asrv,
    Instant timestamp
) {}

package com.sentinel.security.dto;

public class ResourceSummaryDTO {
    private Float cpuUsage;
    private Float memoryUsage;
    private Float diskUsage;
    private Float networkUsage;

    public ResourceSummaryDTO(){}

    public ResourceSummaryDTO(Double cpuUsage, Double memoryUsage, Double diskUsage, Double networkUsage) {
        this.cpuUsage = cpuUsage != null ? cpuUsage.floatValue() : 23.0f;
        this.memoryUsage = memoryUsage != null ? memoryUsage.floatValue() : 47.0f;
        this.diskUsage = diskUsage != null ? diskUsage.floatValue() : 67.0f;
        this.networkUsage = networkUsage != null ? networkUsage.floatValue() : 12.0f;
    }

    public Float getCpuUsage() { return cpuUsage; }
    public Float getMemoryUsage() { return memoryUsage; }
    public Float getDiskUsage() { return diskUsage; }
    public Float getNetworkUsage() { return networkUsage; }
}
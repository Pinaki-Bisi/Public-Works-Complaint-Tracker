package com.pwct.admin;

import java.util.List;
import java.util.Map;

public record AnalyticsDto(long total, long pending, long resolved, Double averageResolutionHours,
        Map<String, Long> byDepartment, Map<String, Map<String, Long>> departmentPerformance,
        Map<String, Long> byPriority, List<Map<String, Object>> monthlyTrend) { }

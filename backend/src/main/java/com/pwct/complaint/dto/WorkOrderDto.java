package com.pwct.complaint.dto;

import java.time.Instant;

import com.pwct.complaint.WorkOrder;

public record WorkOrderDto(
        Long id,
        Long assigneeId,
        String assigneeName,
        Instant scheduledAt,
        String status,
        String notes
) {
    public static WorkOrderDto from(WorkOrder workOrder) {
        if (workOrder == null) {
            return null;
        }
        return new WorkOrderDto(
                workOrder.getId(),
                workOrder.getAssignee().getId(),
                workOrder.getAssignee().getFullName(),
                workOrder.getScheduledAt(),
                workOrder.getStatus().name(),
                workOrder.getNotes()
        );
    }
}

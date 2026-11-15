package com.pwct.admin;

import java.time.Instant;
import com.pwct.complaint.Complaint;

public record OverdueComplaintDto(String ticketNo, String title, String department, String status,
        String assignee, Instant createdAt) {
    static OverdueComplaintDto from(Complaint complaint) {
        return new OverdueComplaintDto(complaint.getTicketNo(), complaint.getTitle(),
                complaint.getCategory().getDepartment().getName(), complaint.getStatus().name(),
                complaint.getWorkOrder() == null ? null : complaint.getWorkOrder().getAssignee().getFullName(),
                complaint.getCreatedAt());
    }
}

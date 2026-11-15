package com.pwct.notification;

import java.time.Instant;

public record NotificationDto(Long id, Long complaintId, String ticketNo, String message, Instant createdAt, Instant readAt) {
    static NotificationDto from(Notification n) {
        return new NotificationDto(n.getId(), n.getComplaint() == null ? null : n.getComplaint().getId(),
                n.getComplaint() == null ? null : n.getComplaint().getTicketNo(), n.getMessage(), n.getCreatedAt(), n.getReadAt());
    }
}

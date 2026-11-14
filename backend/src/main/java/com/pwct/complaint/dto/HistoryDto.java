package com.pwct.complaint.dto;

import java.time.Instant;

import com.pwct.complaint.ComplaintHistory;

public record HistoryDto(
        Long id,
        String oldStatus,
        String newStatus,
        String comment,
        String actorName,
        Instant createdAt
) {
    public static HistoryDto from(ComplaintHistory history) {
        return new HistoryDto(
                history.getId(),
                history.getOldStatus() != null ? history.getOldStatus().name() : null,
                history.getNewStatus().name(),
                history.getCommentText(),
                history.getActor().getFullName(),
                history.getCreatedAt()
        );
    }
}

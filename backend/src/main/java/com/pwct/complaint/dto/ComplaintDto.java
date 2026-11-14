package com.pwct.complaint.dto;

import java.time.Instant;
import java.util.List;

import com.pwct.complaint.Complaint;

public record ComplaintDto(
        Long id,
        String ticketNo,
        String title,
        String description,
        String location,
        String status,
        String priority,
        CategoryDto category,
        Long createdById,
        String createdByName,
        Instant createdAt,
        Instant updatedAt,
        WorkOrderDto workOrder,
        List<HistoryDto> history,
        List<CommentDto> comments
) {
    public static ComplaintDto from(Complaint complaint, boolean includeCollections) {
        return new ComplaintDto(
                complaint.getId(),
                complaint.getTicketNo(),
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getLocation(),
                complaint.getStatus().name(),
                complaint.getPriority().name(),
                CategoryDto.from(complaint.getCategory()),
                complaint.getCreatedBy().getId(),
                complaint.getCreatedBy().getFullName(),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt(),
                WorkOrderDto.from(complaint.getWorkOrder()),
                includeCollections ? complaint.getHistory().stream().map(HistoryDto::from).toList() : List.of(),
                includeCollections ? complaint.getComments().stream().map(CommentDto::from).toList() : List.of()
        );
    }
}

package com.pwct.complaint;

import java.time.Instant;

public record AttachmentDto(Long id, String fileName, String contentType, long sizeBytes, String uploadedBy, Instant createdAt) {
    static AttachmentDto from(ComplaintAttachment a) {
        return new AttachmentDto(a.getId(), a.getOriginalName(), a.getContentType(), a.getSizeBytes(),
                a.getUploadedBy().getFullName(), a.getCreatedAt());
    }
}

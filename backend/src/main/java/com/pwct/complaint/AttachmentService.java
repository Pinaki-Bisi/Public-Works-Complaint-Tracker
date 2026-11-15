package com.pwct.complaint;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.pwct.common.ApiException;
import com.pwct.user.UserRepository;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class AttachmentService {
    private static final long MAX_SIZE = 5L * 1024 * 1024;
    private static final Set<String> TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private final ComplaintAttachmentRepository attachments;
    private final ComplaintRepository complaints;
    private final UserRepository users;
    private final ComplaintService complaintService;
    private final S3Client s3;
    @Value("${app.storage.bucket:}") private String bucket;

    public AttachmentService(ComplaintAttachmentRepository attachments, ComplaintRepository complaints,
            UserRepository users, ComplaintService complaintService, S3Client s3) {
        this.attachments = attachments; this.complaints = complaints; this.users = users;
        this.complaintService = complaintService; this.s3 = s3;
    }

    @Transactional
    public AttachmentDto upload(String username, Long complaintId, MultipartFile file) {
        complaintService.get(username, complaintId);
        if (bucket == null || bucket.isBlank()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Object storage is not configured");
        if (file == null || file.isEmpty() || file.getSize() > MAX_SIZE) throw new ApiException(HttpStatus.BAD_REQUEST, "Image must be between 1 byte and 5 MB");
        String type;
        try { type = detectImageType(file.getBytes()); }
        catch (IOException ex) { throw new ApiException(HttpStatus.BAD_REQUEST, "Could not read image upload"); }
        if (type == null || !TYPES.contains(type)) throw new ApiException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, or WebP images are allowed");
        String objectKey = "complaints/" + complaintId + "/" + UUID.randomUUID();
        try {
            s3.putObject(PutObjectRequest.builder().bucket(bucket).key(objectKey).contentType(type).build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException | RuntimeException ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not store image");
        }
        ComplaintAttachment attachment = new ComplaintAttachment();
        attachment.setComplaint(complaints.getReferenceById(complaintId));
        attachment.setUploadedBy(users.findByUsername(username).orElseThrow());
        attachment.setObjectKey(objectKey);
        attachment.setOriginalName(file.getOriginalFilename() == null ? "image" : file.getOriginalFilename().replaceAll("[\\r\\n]", ""));
        attachment.setContentType(type);
        attachment.setSizeBytes(file.getSize());
        return AttachmentDto.from(attachments.save(attachment));
    }

    @Transactional(readOnly = true)
    public List<AttachmentDto> list(String username, Long complaintId) {
        complaintService.get(username, complaintId);
        return attachments.findByComplaint_IdOrderByCreatedAtAsc(complaintId).stream().map(AttachmentDto::from).toList();
    }

    @Transactional(readOnly = true)
    public StoredImage download(String username, Long complaintId, Long attachmentId) {
        complaintService.get(username, complaintId);
        ComplaintAttachment attachment = attachments.findByIdAndComplaint_Id(attachmentId, complaintId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attachment not found"));
        ResponseBytes<?> bytes = s3.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(attachment.getObjectKey()).build());
        return new StoredImage(attachment.getOriginalName(), attachment.getContentType(), bytes.asByteArray());
    }

    public record StoredImage(String fileName, String contentType, byte[] bytes) { }

    private String detectImageType(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff)
            return "image/jpeg";
        if (bytes.length >= 8 && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e
                && bytes[3] == 0x47 && bytes[4] == 0x0d && bytes[5] == 0x0a && bytes[6] == 0x1a && bytes[7] == 0x0a)
            return "image/png";
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') return "image/webp";
        return null;
    }
}

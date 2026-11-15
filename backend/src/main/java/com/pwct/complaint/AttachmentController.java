package com.pwct.complaint;

import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/complaints/{complaintId}/attachments")
public class AttachmentController {
    private final AttachmentService service;
    public AttachmentController(AttachmentService service) { this.service = service; }

    @GetMapping public List<AttachmentDto> list(Authentication auth, @PathVariable Long complaintId) {
        return service.list(auth.getName(), complaintId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AttachmentDto upload(Authentication auth, @PathVariable Long complaintId,
            @RequestPart("file") MultipartFile file) {
        return service.upload(auth.getName(), complaintId, file);
    }

    @GetMapping("/{attachmentId}/content")
    public ResponseEntity<byte[]> content(Authentication auth, @PathVariable Long complaintId,
            @PathVariable Long attachmentId) {
        AttachmentService.StoredImage image = service.download(auth.getName(), complaintId, attachmentId);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(image.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(image.fileName()).build().toString())
                .body(image.bytes());
    }
}

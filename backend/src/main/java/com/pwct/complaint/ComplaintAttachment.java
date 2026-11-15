package com.pwct.complaint;

import java.time.Instant;
import com.pwct.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity @Table(name = "complaint_attachments")
@Getter @Setter @NoArgsConstructor
public class ComplaintAttachment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "complaint_id") private Complaint complaint;
    @Column(name = "original_name", nullable = false) private String originalName;
    @Column(name = "object_key", nullable = false, unique = true) private String objectKey;
    @Column(name = "content_type", nullable = false) private String contentType;
    @Column(name = "size_bytes", nullable = false) private long sizeBytes;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "uploaded_by") private User uploadedBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
}

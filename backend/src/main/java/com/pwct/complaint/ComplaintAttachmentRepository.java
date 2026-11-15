package com.pwct.complaint;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintAttachmentRepository extends JpaRepository<ComplaintAttachment, Long> {
    List<ComplaintAttachment> findByComplaint_IdOrderByCreatedAtAsc(Long complaintId);
    Optional<ComplaintAttachment> findByIdAndComplaint_Id(Long id, Long complaintId);
}

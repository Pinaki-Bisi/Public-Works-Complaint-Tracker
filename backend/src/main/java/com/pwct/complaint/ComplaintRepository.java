package com.pwct.complaint;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pwct.common.ComplaintStatus;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByCreatedBy_IdOrderByCreatedAtDesc(Long userId);

    List<Complaint> findByCategory_Department_IdOrderByCreatedAtDesc(Long departmentId);

    List<Complaint> findByWorkOrder_Assignee_IdOrderByCreatedAtDesc(Long assigneeId);

    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    @Query("select c from Complaint c where (:status is null or c.status = :status) "
            + "and (:categoryId is null or c.category.id = :categoryId) "
            + "and (:departmentId is null or c.category.department.id = :departmentId) "
            + "order by c.createdAt desc")
    List<Complaint> search(
            @Param("status") ComplaintStatus status,
            @Param("categoryId") Long categoryId,
            @Param("departmentId") Long departmentId
    );

    @Query(value = "SELECT ticket_seq.NEXTVAL FROM dual", nativeQuery = true)
    Long nextTicketSeq();

    Optional<Complaint> findByTicketNo(String ticketNo);
}

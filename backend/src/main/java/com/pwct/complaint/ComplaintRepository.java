package com.pwct.complaint;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.pwct.common.ComplaintStatus;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    long countByStatus(ComplaintStatus status);

    @Query("select c.category.department.name, count(c) from Complaint c group by c.category.department.name")
    List<Object[]> countByDepartment();

    @Query("select c.category.department.name, c.status, count(c) from Complaint c group by c.category.department.name, c.status")
    List<Object[]> performanceByDepartment();

    @Query("select c.priority, count(c) from Complaint c group by c.priority")
    List<Object[]> countByPriority();

    @Query(value = "select to_char(created_at, 'YYYY-MM') as month, count(*) as total "
            + "from complaints where created_at >= add_months(trunc(sysdate, 'MM'), -11) "
            + "group by to_char(created_at, 'YYYY-MM') order by month", nativeQuery = true)
    List<Object[]> monthlyTrend();

    @Query(value = "select avg((cast(r.resolved_at as date) - cast(c.created_at as date)) * 24) "
            + "from complaints c join (select complaint_id, min(created_at) resolved_at from complaint_history "
            + "where new_status = 'RESOLVED' group by complaint_id) r on r.complaint_id = c.id", nativeQuery = true)
    Double averageResolutionHours();

    @Query("select c from Complaint c where c.status not in (com.pwct.common.ComplaintStatus.CLOSED, "
            + "com.pwct.common.ComplaintStatus.REJECTED, com.pwct.common.ComplaintStatus.RESOLVED) "
            + "and c.createdAt < :cutoff order by c.createdAt asc")
    List<Complaint> findOverdue(@Param("cutoff") java.time.Instant cutoff);

    @Query("select c from Complaint c where "
            + "(:admin = true or (:ownerId is not null and c.createdBy.id = :ownerId) "
            + "or (:departmentId is not null and c.category.department.id = :departmentId) "
            + "or (:assigneeId is not null and c.workOrder.assignee.id = :assigneeId)) "
            + "and (:status is null or c.status = :status) "
            + "and (:priority is null or c.priority = :priority) "
            + "and (:categoryId is null or c.category.id = :categoryId) "
            + "and (:filterDepartmentId is null or c.category.department.id = :filterDepartmentId) "
            + "and (:fromDate is null or c.createdAt >= :fromDate) "
            + "and (:toDate is null or c.createdAt < :toDate) "
            + "and (:term is null or lower(c.ticketNo) like lower(concat('%', :term, '%')) "
            + "or lower(c.title) like lower(concat('%', :term, '%')) "
            + "or lower(c.location) like lower(concat('%', :term, '%'))) ")
    Page<Complaint> searchScoped(
            @Param("admin") boolean admin,
            @Param("ownerId") Long ownerId,
            @Param("departmentId") Long departmentId,
            @Param("assigneeId") Long assigneeId,
            @Param("status") ComplaintStatus status,
            @Param("priority") com.pwct.common.Priority priority,
            @Param("categoryId") Long categoryId,
            @Param("filterDepartmentId") Long filterDepartmentId,
            @Param("fromDate") java.time.Instant fromDate,
            @Param("toDate") java.time.Instant toDate,
            @Param("term") String term,
            Pageable pageable
    );

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

package com.pwct.complaint;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    Optional<WorkOrder> findByComplaint_Id(Long complaintId);
}

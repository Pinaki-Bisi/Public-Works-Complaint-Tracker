package com.pwct.complaint;

import java.time.Instant;
import java.time.Year;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pwct.common.ApiException;
import com.pwct.common.ComplaintStatus;
import com.pwct.common.Priority;
import com.pwct.common.RoleName;
import com.pwct.common.WorkOrderStatus;
import com.pwct.complaint.dto.AssignRequest;
import com.pwct.complaint.dto.CategoryDto;
import com.pwct.complaint.dto.CommentDto;
import com.pwct.complaint.dto.CommentRequest;
import com.pwct.complaint.dto.ComplaintDto;
import com.pwct.complaint.dto.CreateComplaintRequest;
import com.pwct.complaint.dto.StatusUpdateRequest;
import com.pwct.user.User;
import com.pwct.user.UserRepository;

@Service
public class ComplaintService {

    private static final Set<ComplaintStatus> CREW_STATUSES = Set.of(
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.ON_HOLD,
            ComplaintStatus.RESOLVED
    );

    private final ComplaintRepository complaintRepository;
    private final ComplaintCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final WorkOrderRepository workOrderRepository;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            ComplaintCategoryRepository categoryRepository,
            UserRepository userRepository,
            WorkOrderRepository workOrderRepository
    ) {
        this.complaintRepository = complaintRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.workOrderRepository = workOrderRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> categories() {
        return categoryRepository.findAll().stream().map(CategoryDto::from).toList();
    }

    @Transactional
    @PreAuthorize("hasRole('CITIZEN')")
    public ComplaintDto create(String username, CreateComplaintRequest request) {
        User actor = requireUser(username);
        ComplaintCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unknown category"));
        Complaint complaint = new Complaint();
        complaint.setTicketNo(nextTicketNo());
        complaint.setTitle(request.title().trim());
        complaint.setDescription(request.description());
        complaint.setLocation(request.location().trim());
        complaint.setPriority(request.priority() != null ? request.priority() : Priority.MEDIUM);
        complaint.setCategory(category);
        complaint.setCreatedBy(actor);
        complaint.setStatus(ComplaintStatus.SUBMITTED);
        addHistory(complaint, null, ComplaintStatus.SUBMITTED, actor, "Complaint submitted");
        complaintRepository.save(complaint);
        return ComplaintDto.from(hydrate(complaint), true);
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> list(String username, ComplaintStatus status, Long categoryId, Long departmentId) {
        User actor = requireUser(username);
        List<Complaint> rows;
        if (hasRole(actor, RoleName.ADMIN)) {
            rows = complaintRepository.search(status, categoryId, departmentId);
        } else if (hasRole(actor, RoleName.SUPERVISOR)) {
            if (actor.getDepartment() == null) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Supervisor has no department");
            }
            rows = complaintRepository.findByCategory_Department_IdOrderByCreatedAtDesc(actor.getDepartment().getId());
            rows = applyFilters(rows, status, categoryId);
        } else if (hasRole(actor, RoleName.CREW)) {
            rows = complaintRepository.findByWorkOrder_Assignee_IdOrderByCreatedAtDesc(actor.getId());
            rows = applyFilters(rows, status, categoryId);
        } else {
            rows = complaintRepository.findByCreatedBy_IdOrderByCreatedAtDesc(actor.getId());
            rows = applyFilters(rows, status, categoryId);
        }
        return rows.stream().map(this::hydrate).map(c -> ComplaintDto.from(c, false)).toList();
    }

    @Transactional(readOnly = true)
    public ComplaintDto get(String username, Long id) {
        User actor = requireUser(username);
        Complaint complaint = hydrate(requireComplaint(id));
        assertCanView(actor, complaint);
        return ComplaintDto.from(complaint, true);
    }

    @Transactional
    public ComplaintDto updateStatus(String username, Long id, StatusUpdateRequest request) {
        User actor = requireUser(username);
        Complaint complaint = hydrate(requireComplaint(id));
        assertCanView(actor, complaint);
        ComplaintStatus next = request.status();
        if (next == ComplaintStatus.ASSIGNED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Use the assign endpoint to assign a crew");
        }
        if (!complaint.getStatus().canTransitionTo(next)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot transition from " + complaint.getStatus() + " to " + next);
        }
        if (hasRole(actor, RoleName.CREW) && !hasRole(actor, RoleName.SUPERVISOR) && !hasRole(actor, RoleName.ADMIN)) {
            assertAssignedCrew(actor, complaint);
            if (!CREW_STATUSES.contains(next)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Crew cannot apply status " + next);
            }
        } else if (!hasRole(actor, RoleName.SUPERVISOR) && !hasRole(actor, RoleName.ADMIN)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not allowed to change status");
        } else if (hasRole(actor, RoleName.SUPERVISOR) && !hasRole(actor, RoleName.ADMIN)) {
            assertSameDepartment(actor, complaint);
        }
        applyWorkOrderStatus(complaint, next);
        transition(complaint, next, actor, request.comment());
        return ComplaintDto.from(hydrate(complaint), true);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('SUPERVISOR','ADMIN')")
    public ComplaintDto assign(String username, Long id, AssignRequest request) {
        User actor = requireUser(username);
        Complaint complaint = hydrate(requireComplaint(id));
        if (hasRole(actor, RoleName.SUPERVISOR) && !hasRole(actor, RoleName.ADMIN)) {
            assertSameDepartment(actor, complaint);
        }
        ComplaintStatus current = complaint.getStatus();
        if (current != ComplaintStatus.ACKNOWLEDGED
                && current != ComplaintStatus.SUBMITTED
                && current != ComplaintStatus.REOPENED
                && current != ComplaintStatus.ASSIGNED) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot assign from status " + current);
        }
        User crew = userRepository.findById(request.assigneeId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Assignee not found"));
        if (!hasRole(crew, RoleName.CREW)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Assignee must have CREW role");
        }
        if (hasRole(actor, RoleName.SUPERVISOR) && actor.getDepartment() != null
                && crew.getDepartment() != null
                && !actor.getDepartment().getId().equals(crew.getDepartment().getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Crew must belong to your department");
        }
        WorkOrder workOrder = complaint.getWorkOrder();
        if (workOrder == null) {
            workOrder = new WorkOrder();
            workOrder.setComplaint(complaint);
            complaint.setWorkOrder(workOrder);
        }
        workOrder.setAssignee(crew);
        workOrder.setScheduledAt(request.scheduledAt());
        workOrder.setStatus(WorkOrderStatus.OPEN);
        workOrder.setUpdatedAt(Instant.now());
        workOrderRepository.save(workOrder);
        if (current == ComplaintStatus.SUBMITTED) {
            transition(complaint, ComplaintStatus.ACKNOWLEDGED, actor, "Acknowledged on assign");
        }
        if (complaint.getStatus() != ComplaintStatus.ASSIGNED) {
            transition(complaint, ComplaintStatus.ASSIGNED, actor,
                    request.comment() != null ? request.comment() : "Assigned to " + crew.getFullName());
        } else {
            addHistory(complaint, ComplaintStatus.ASSIGNED, ComplaintStatus.ASSIGNED, actor,
                    "Reassigned to " + crew.getFullName());
            complaint.setUpdatedAt(Instant.now());
        }
        return ComplaintDto.from(hydrate(complaint), true);
    }

    @Transactional
    public CommentDto addComment(String username, Long id, CommentRequest request) {
        User actor = requireUser(username);
        Complaint complaint = hydrate(requireComplaint(id));
        assertCanView(actor, complaint);
        Comment comment = new Comment();
        comment.setComplaint(complaint);
        comment.setAuthor(actor);
        comment.setBody(request.body().trim());
        complaint.getComments().add(comment);
        complaint.setUpdatedAt(Instant.now());
        complaintRepository.save(complaint);
        return CommentDto.from(comment);
    }

    @Transactional(readOnly = true)
    public List<com.pwct.user.UserDto> crewOptions(String username) {
        User actor = requireUser(username);
        if (hasRole(actor, RoleName.ADMIN)) {
            return userRepository.findByRoles_Name(RoleName.CREW).stream()
                    .map(com.pwct.user.UserDto::from)
                    .toList();
        }
        if (hasRole(actor, RoleName.SUPERVISOR) && actor.getDepartment() != null) {
            return userRepository.findByRoles_NameAndDepartment_Id(RoleName.CREW, actor.getDepartment().getId())
                    .stream()
                    .map(com.pwct.user.UserDto::from)
                    .toList();
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "Not allowed");
    }

    private List<Complaint> applyFilters(List<Complaint> rows, ComplaintStatus status, Long categoryId) {
        return rows.stream()
                .filter(c -> status == null || c.getStatus() == status)
                .filter(c -> categoryId == null || c.getCategory().getId().equals(categoryId))
                .toList();
    }

    private void applyWorkOrderStatus(Complaint complaint, ComplaintStatus next) {
        WorkOrder workOrder = complaint.getWorkOrder();
        if (workOrder == null) {
            return;
        }
        if (next == ComplaintStatus.IN_PROGRESS) {
            workOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
        } else if (next == ComplaintStatus.ON_HOLD) {
            workOrder.setStatus(WorkOrderStatus.ON_HOLD);
        } else if (next == ComplaintStatus.RESOLVED) {
            workOrder.setStatus(WorkOrderStatus.COMPLETED);
        }
        workOrder.setUpdatedAt(Instant.now());
    }

    private void transition(Complaint complaint, ComplaintStatus next, User actor, String comment) {
        ComplaintStatus previous = complaint.getStatus();
        if (previous != next && !previous.canTransitionTo(next)) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot transition from " + previous + " to " + next);
        }
        complaint.setStatus(next);
        complaint.setUpdatedAt(Instant.now());
        addHistory(complaint, previous, next, actor, comment);
    }

    private void addHistory(Complaint complaint, ComplaintStatus oldStatus, ComplaintStatus newStatus, User actor, String comment) {
        ComplaintHistory history = new ComplaintHistory();
        history.setComplaint(complaint);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setActor(actor);
        history.setCommentText(comment);
        complaint.getHistory().add(history);
    }

    private void assertCanView(User actor, Complaint complaint) {
        if (hasRole(actor, RoleName.ADMIN)) {
            return;
        }
        if (hasRole(actor, RoleName.CITIZEN) && complaint.getCreatedBy().getId().equals(actor.getId())) {
            return;
        }
        if (hasRole(actor, RoleName.SUPERVISOR) && sameDepartment(actor, complaint)) {
            return;
        }
        if (hasRole(actor, RoleName.CREW) && isAssignee(actor, complaint)) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "Access denied");
    }

    private void assertAssignedCrew(User actor, Complaint complaint) {
        if (!isAssignee(actor, complaint)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This work order is not assigned to you");
        }
    }

    private void assertSameDepartment(User actor, Complaint complaint) {
        if (!sameDepartment(actor, complaint)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Complaint is outside your department");
        }
    }

    private boolean sameDepartment(User actor, Complaint complaint) {
        return actor.getDepartment() != null
                && complaint.getCategory().getDepartment().getId().equals(actor.getDepartment().getId());
    }

    private boolean isAssignee(User actor, Complaint complaint) {
        return complaint.getWorkOrder() != null
                && complaint.getWorkOrder().getAssignee().getId().equals(actor.getId());
    }

    private boolean hasRole(User user, RoleName roleName) {
        return user.getRoles().stream().anyMatch(role -> role.getName() == roleName);
    }

    private Complaint requireComplaint(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Complaint hydrate(Complaint complaint) {
        complaint.getCategory().getDepartment().getName();
        complaint.getCreatedBy().getFullName();
        if (complaint.getWorkOrder() != null) {
            complaint.getWorkOrder().getAssignee().getFullName();
        }
        complaint.getHistory().forEach(h -> h.getActor().getFullName());
        complaint.getComments().forEach(c -> c.getAuthor().getFullName());
        return complaint;
    }

    private String nextTicketNo() {
        Long seq = complaintRepository.nextTicketSeq();
        int year = Year.now(ZoneOffset.UTC).getValue();
        return "PW-%d-%05d".formatted(year, seq);
    }
}

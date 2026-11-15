package com.pwct.complaint;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pwct.common.ApiException;
import com.pwct.common.ComplaintStatus;
import com.pwct.common.RoleName;
import com.pwct.complaint.dto.StatusUpdateRequest;
import com.pwct.notification.NotificationService;
import com.pwct.user.Role;
import com.pwct.user.Department;
import com.pwct.user.User;
import com.pwct.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {
    @Mock ComplaintRepository complaintRepository;
    @Mock ComplaintCategoryRepository categoryRepository;
    @Mock UserRepository userRepository;
    @Mock WorkOrderRepository workOrderRepository;
    @Mock NotificationService notificationService;
    private ComplaintService service;
    private User citizen;
    private Complaint complaint;

    @BeforeEach
    void setup() {
        service = new ComplaintService(complaintRepository, categoryRepository, userRepository, workOrderRepository, notificationService);
        Role citizenRole = new Role(); citizenRole.setName(RoleName.CITIZEN);
        citizen = new User(); citizen.setId(7L); citizen.setUsername("citizen"); citizen.setFullName("Citizen");
        citizen.setRoles(new HashSet<>(Set.of(citizenRole)));
        Department department = new Department(); department.setId(3L); department.setName("Roads");
        ComplaintCategory category = new ComplaintCategory(); category.setId(2L); category.setName("Pothole"); category.setDepartment(department);
        complaint = new Complaint(); complaint.setId(11L); complaint.setCreatedBy(citizen); complaint.setCategory(category);
        complaint.setStatus(ComplaintStatus.SUBMITTED);
        when(userRepository.findByUsername("citizen")).thenReturn(Optional.of(citizen));
        when(complaintRepository.findById(11L)).thenReturn(Optional.of(complaint));
    }

    @Test
    void rejectsCitizenAttemptToCloseComplaint() {
        assertThrows(ApiException.class, () -> service.updateStatus("citizen", 11L,
                new StatusUpdateRequest(ComplaintStatus.CLOSED, "close")));
    }
}

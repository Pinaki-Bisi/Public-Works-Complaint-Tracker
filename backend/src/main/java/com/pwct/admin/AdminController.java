package com.pwct.admin;

import java.util.List;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.pwct.common.ComplaintStatus;
import com.pwct.common.Priority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pwct.user.UserDto;
import com.pwct.complaint.dto.CategoryDto;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final ComplaintExportService exportService;

    public AdminController(AdminService adminService, ComplaintExportService exportService) {
        this.adminService = adminService;
        this.exportService = exportService;
    }

    @GetMapping("/users")
    public List<UserDto> users() {
        return adminService.users();
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto createUser(@Valid @RequestBody CreateUserRequest request) {
        return adminService.createUser(request);
    }

    @PatchMapping("/users/{id}/roles")
    public UserDto updateRoles(@PathVariable Long id, @Valid @RequestBody UpdateRolesRequest request) {
        return adminService.updateRoles(id, request);
    }

    @PatchMapping("/users/{id}/enabled")
    public UserDto enabled(@PathVariable Long id, @Valid @RequestBody EnabledRequest request) {
        return adminService.setEnabled(id, request);
    }

    @PostMapping("/departments")
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentDto createDepartment(@Valid @RequestBody DepartmentRequest request) {
        return adminService.createDepartment(request);
    }

    @org.springframework.web.bind.annotation.PutMapping("/departments/{id}")
    public DepartmentDto updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        return adminService.updateDepartment(id, request);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/departments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDepartment(@PathVariable Long id) { adminService.deleteDepartment(id); }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto createCategory(@Valid @RequestBody CategoryRequest request) {
        return adminService.createCategory(request);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        adminService.deleteCategory(id);
    }

    @GetMapping("/departments")
    public List<DepartmentDto> departments() {
        return adminService.departments();
    }

    @GetMapping("/analytics")
    public AnalyticsDto analytics() {
        return adminService.analytics();
    }

    @GetMapping("/reports/overdue")
    public List<OverdueComplaintDto> overdue() { return adminService.overdueComplaints(); }

    @GetMapping("/reports/complaints")
    public ResponseEntity<byte[]> export(@RequestParam(defaultValue = "xlsx") String format,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Instant fromDate,
            @RequestParam(required = false) Instant toDate) {
        var file = exportService.export(format, status, priority, departmentId, q, fromDate, toDate);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.fileName() + "\"")
                .body(file.bytes());
    }
}

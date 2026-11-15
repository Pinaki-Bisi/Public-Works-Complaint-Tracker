package com.pwct.admin;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.LinkedHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

import com.pwct.common.ApiException;
import com.pwct.common.RoleName;
import com.pwct.user.Department;
import com.pwct.user.DepartmentRepository;
import com.pwct.user.Role;
import com.pwct.user.RoleRepository;
import com.pwct.user.User;
import com.pwct.user.UserDto;
import com.pwct.user.UserRepository;
import com.pwct.complaint.ComplaintRepository;
import com.pwct.complaint.ComplaintCategory;
import com.pwct.complaint.ComplaintCategoryRepository;
import com.pwct.complaint.dto.CategoryDto;
import com.pwct.common.ComplaintStatus;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final ComplaintRepository complaintRepository;
    private final ComplaintCategoryRepository categoryRepository;

    public AdminService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder,
            ComplaintRepository complaintRepository,
            ComplaintCategoryRepository categoryRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.complaintRepository = complaintRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<UserDto> users() {
        return userRepository.findAll().stream().map(UserDto::from).toList();
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }
        User user = new User();
        user.setUsername(request.username().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setPhoneNumber(request.phoneNumber() == null || request.phoneNumber().isBlank() ? null : request.phoneNumber().trim());
        if (request.departmentId() != null) {
            Department department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unknown department"));
            user.setDepartment(department);
        }
        user.setRoles(resolveRoles(request.roles()));
        userRepository.save(user);
        return UserDto.from(user);
    }

    @Transactional
    public UserDto updateRoles(Long userId, UpdateRolesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        user.setRoles(resolveRoles(request.roles()));
        return UserDto.from(user);
    }

    @Transactional
    public UserDto setEnabled(Long userId, EnabledRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        user.setEnabled(request.enabled());
        return UserDto.from(user);
    }

    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public DepartmentDto createDepartment(DepartmentRequest request) {
        Department department = new Department();
        department.setName(request.name().trim());
        department.setCode(request.code().trim().toUpperCase());
        return DepartmentDto.from(departmentRepository.save(department));
    }

    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public DepartmentDto updateDepartment(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Department not found"));
        department.setName(request.name().trim());
        department.setCode(request.code().trim().toUpperCase());
        return DepartmentDto.from(department);
    }

    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Department not found");
        try { departmentRepository.deleteById(id); }
        catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT, "Department is in use and cannot be deleted");
        }
    }

    @Transactional
    @CacheEvict(value = "complaintCategories", allEntries = true)
    public CategoryDto createCategory(CategoryRequest request) {
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unknown department"));
        ComplaintCategory category = new ComplaintCategory();
        category.setName(request.name().trim());
        category.setDepartment(department);
        return CategoryDto.from(categoryRepository.save(category));
    }

    @Transactional
    @CacheEvict(value = "complaintCategories", allEntries = true)
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Category not found");
        }
        try {
            categoryRepository.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT, "Category is in use and cannot be deleted");
        }
    }

    @Transactional(readOnly = true)
    @Cacheable("departments")
    public List<DepartmentDto> departments() {
        return departmentRepository.findAll().stream().map(DepartmentDto::from).toList();
    }

    @Transactional(readOnly = true)
    public AnalyticsDto analytics() {
        Map<String, Long> departments = new LinkedHashMap<>();
        complaintRepository.countByDepartment().forEach(row -> departments.put((String) row[0], ((Number) row[1]).longValue()));
        Map<String, Long> priorities = new LinkedHashMap<>();
        complaintRepository.countByPriority().forEach(row -> priorities.put(row[0].toString(), ((Number) row[1]).longValue()));
        Map<String, Map<String, Long>> performance = new LinkedHashMap<>();
        complaintRepository.performanceByDepartment().forEach(row -> performance
                .computeIfAbsent((String) row[0], ignored -> new LinkedHashMap<>())
                .put(row[1].toString(), ((Number) row[2]).longValue()));
        List<Map<String, Object>> trend = complaintRepository.monthlyTrend().stream()
                .map(row -> Map.<String, Object>of("month", row[0], "total", ((Number) row[1]).longValue()))
                .toList();
        long pending = complaintRepository.count() - complaintRepository.countByStatus(ComplaintStatus.RESOLVED)
                - complaintRepository.countByStatus(ComplaintStatus.CLOSED)
                - complaintRepository.countByStatus(ComplaintStatus.REJECTED);
        return new AnalyticsDto(complaintRepository.count(), pending,
                complaintRepository.countByStatus(ComplaintStatus.RESOLVED)
                        + complaintRepository.countByStatus(ComplaintStatus.CLOSED),
                complaintRepository.averageResolutionHours(), departments, performance, priorities, trend);
    }

    @Transactional(readOnly = true)
    public List<OverdueComplaintDto> overdueComplaints() {
        return complaintRepository.findOverdue(Instant.now().minus(7, ChronoUnit.DAYS)).stream()
                .map(OverdueComplaintDto::from).toList();
    }

    private Set<Role> resolveRoles(List<String> names) {
        Set<Role> roles = new HashSet<>();
        for (String name : names) {
            RoleName roleName;
            try {
                roleName = RoleName.valueOf(name.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown role: " + name);
            }
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Role missing: " + roleName));
            roles.add(role);
        }
        return roles;
    }
}

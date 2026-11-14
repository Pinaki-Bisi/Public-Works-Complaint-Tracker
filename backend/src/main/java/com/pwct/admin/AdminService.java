package com.pwct.admin;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pwct.common.ApiException;
import com.pwct.common.RoleName;
import com.pwct.user.Department;
import com.pwct.user.DepartmentRepository;
import com.pwct.user.Role;
import com.pwct.user.RoleRepository;
import com.pwct.user.User;
import com.pwct.user.UserDto;
import com.pwct.user.UserRepository;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
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

    @Transactional(readOnly = true)
    public List<DepartmentDto> departments() {
        return departmentRepository.findAll().stream().map(DepartmentDto::from).toList();
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

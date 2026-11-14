package com.pwct.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pwct.user.UserDto;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
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

    @GetMapping("/departments")
    public List<DepartmentDto> departments() {
        return adminService.departments();
    }
}

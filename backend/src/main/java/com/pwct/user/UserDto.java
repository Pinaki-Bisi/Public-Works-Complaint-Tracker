package com.pwct.user;

import java.util.List;

public record UserDto(
        Long id,
        String username,
        String email,
        String phoneNumber,
        String fullName,
        Long departmentId,
        String departmentName,
        List<String> roles,
        boolean enabled
) {
    public static UserDto from(User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .sorted()
                .toList();
        Department dept = user.getDepartment();
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getFullName(),
                dept != null ? dept.getId() : null,
                dept != null ? dept.getName() : null,
                roles,
                user.isEnabled()
        );
    }
}

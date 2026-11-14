package com.pwct.admin;

import com.pwct.user.Department;

public record DepartmentDto(Long id, String name, String code) {
    public static DepartmentDto from(Department department) {
        return new DepartmentDto(department.getId(), department.getName(), department.getCode());
    }
}

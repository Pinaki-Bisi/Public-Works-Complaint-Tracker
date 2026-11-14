package com.pwct.complaint.dto;

import com.pwct.complaint.ComplaintCategory;

public record CategoryDto(Long id, String name, Long departmentId, String departmentName) {
    public static CategoryDto from(ComplaintCategory category) {
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getDepartment().getId(),
                category.getDepartment().getName()
        );
    }
}

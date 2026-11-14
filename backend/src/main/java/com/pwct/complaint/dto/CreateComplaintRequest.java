package com.pwct.complaint.dto;

import com.pwct.common.Priority;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateComplaintRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String description,
        @NotBlank @Size(max = 300) String location,
        @NotNull Long categoryId,
        Priority priority
) {
}

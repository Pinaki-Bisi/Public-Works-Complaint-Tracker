package com.pwct.admin;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public record UpdateRolesRequest(@NotEmpty List<String> roles) {
}

package com.pwct.admin;

import jakarta.validation.constraints.NotNull;

public record EnabledRequest(@NotNull Boolean enabled) { }

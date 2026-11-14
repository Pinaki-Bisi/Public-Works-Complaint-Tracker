package com.pwct.user;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserDto user
) {
}

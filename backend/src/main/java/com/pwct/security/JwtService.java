package com.pwct.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.pwct.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final JwtProperties properties;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
    }

    public String generateToken(User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .toList();
        Date now = new Date();
        Date expiry = new Date(now.getTime() + properties.getExpirationMs());
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("uid", user.getId())
                .claim("roles", roles)
                .claim("deptId", user.getDepartment() != null ? user.getDepartment().getId() : null)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey())
                .compact();
    }

    public String extractUsername(String token) {
        return parse(token).getSubject();
    }

    public boolean isValid(String token, String username) {
        Claims claims = parse(token);
        return username.equals(claims.getSubject()) && claims.getExpiration().after(new Date());
    }

    public long expirationMs() {
        return properties.getExpirationMs();
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey signingKey() {
        byte[] bytes = properties.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(bytes);
    }
}

package com.pwct.user;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pwct.common.ApiException;
import com.pwct.notification.NotificationService;

@Service
public class PasswordResetService {
    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final NotificationService notifications;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(UserRepository users, PasswordResetTokenRepository tokens,
            PasswordEncoder encoder, NotificationService notifications) {
        this.users = users; this.tokens = tokens; this.encoder = encoder; this.notifications = notifications;
    }

    @Transactional
    public void request(String email) {
        users.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
            byte[] bytes = new byte[32]; random.nextBytes(bytes);
            String raw = HexFormat.of().formatHex(bytes);
            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user); token.setTokenHash(hash(raw)); token.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
            tokens.save(token);
            notifications.sendAccountEmail(user.getEmail(), "Reset your Public Works password",
                    "Use this one-time token in the password reset screen within one hour: " + raw);
        });
    }

    @Transactional
    public void reset(ResetPasswordRequest request) {
        PasswordResetToken token = tokens.findByTokenHash(hash(request.token()))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Reset token is invalid or expired"));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reset token is invalid or expired");
        }
        token.getUser().setPasswordHash(encoder.encode(request.password()));
        token.setUsedAt(Instant.now());
    }

    private String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
}

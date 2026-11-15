package com.pwct.notification;

import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    public NotificationController(NotificationService service) { this.service = service; }
    @GetMapping public List<NotificationDto> list(Authentication auth) { return service.list(auth.getName()); }
    @PatchMapping("/{id}/read") public NotificationDto read(Authentication auth, @PathVariable Long id) {
        return service.markRead(auth.getName(), id);
    }
}

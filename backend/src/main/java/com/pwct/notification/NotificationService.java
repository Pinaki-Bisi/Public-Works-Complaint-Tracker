package com.pwct.notification;

import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.pwct.common.ApiException;
import com.pwct.complaint.Complaint;
import com.pwct.user.User;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final NotificationRepository repository;
    private final ObjectProvider<JavaMailSender> mailSender;
    @Value("${app.notifications.email-enabled:false}") private boolean emailEnabled;
    @Value("${app.notifications.from:no-reply@pwct.local}") private String from;
    public NotificationService(NotificationRepository repository, ObjectProvider<JavaMailSender> mailSender) {
        this.repository = repository; this.mailSender = mailSender;
    }

    @Transactional
    public void notify(User user, Complaint complaint, String message) {
        Notification n = new Notification();
        n.setUser(user); n.setComplaint(complaint); n.setMessage(message);
        repository.save(n);
        sendAccountEmail(user.getEmail(), "Public Works complaint update", message);
    }

    public void sendAccountEmail(String to, String subject, String body) {
        if (!emailEnabled || to == null || to.isBlank()) return;
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) return;
        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setFrom(from); email.setTo(to); email.setSubject(subject); email.setText(body); sender.send(email);
        } catch (RuntimeException ex) {
            log.warn("Unable to send email to account address");
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> list(String username) {
        return repository.findTop50ByUser_UsernameOrderByCreatedAtDesc(username).stream().map(NotificationDto::from).toList();
    }

    @Transactional
    public NotificationDto markRead(String username, Long id) {
        Notification notification = repository.findByIdAndUser_Username(id, username)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (notification.getReadAt() == null) notification.setReadAt(Instant.now());
        return NotificationDto.from(notification);
    }
}

package com.pwct.notification;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop50ByUser_UsernameOrderByCreatedAtDesc(String username);
    Optional<Notification> findByIdAndUser_Username(Long id, String username);
}

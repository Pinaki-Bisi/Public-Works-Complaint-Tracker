package com.pwct.complaint;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.pwct.common.RoleName;
import com.pwct.notification.NotificationService;
import com.pwct.user.UserRepository;

@Component
public class OverdueReminderJob {
    private static final Logger log = LoggerFactory.getLogger(OverdueReminderJob.class);
    private final ComplaintRepository complaints;
    private final UserRepository users;
    private final NotificationService notifications;

    public OverdueReminderJob(ComplaintRepository complaints, UserRepository users, NotificationService notifications) {
        this.complaints = complaints; this.users = users; this.notifications = notifications;
    }

    @Scheduled(cron = "${app.overdue.cron:0 0 8 * * *}")
    @Transactional
    public void remindOverdueComplaints() {
        var overdue = complaints.findOverdue(Instant.now().minus(7, ChronoUnit.DAYS));
        overdue.forEach(complaint -> {
            if (complaint.getWorkOrder() != null) {
                notifications.notify(complaint.getWorkOrder().getAssignee(), complaint,
                        "Reminder: complaint " + complaint.getTicketNo() + " has been open for more than seven days");
            }
            users.findByRoles_NameAndDepartment_Id(RoleName.SUPERVISOR,
                    complaint.getCategory().getDepartment().getId()).forEach(supervisor ->
                    notifications.notify(supervisor, complaint,
                            "Overdue complaint requires attention: " + complaint.getTicketNo()));
        });
        if (!overdue.isEmpty()) log.info("Generated overdue reminders for {} complaints", overdue.size());
    }
}

package com.pwct.config;

import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.pwct.common.RoleName;
import com.pwct.user.Department;
import com.pwct.user.DepartmentRepository;
import com.pwct.user.Role;
import com.pwct.user.RoleRepository;
import com.pwct.user.User;
import com.pwct.user.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private static final String DEMO_PASSWORD = "Password123!";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            RoleRepository roleRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }
        Role adminRole = role(RoleName.ADMIN);
        Role supervisorRole = role(RoleName.SUPERVISOR);
        Role crewRole = role(RoleName.CREW);
        Role citizenRole = role(RoleName.CITIZEN);
        Department roads = departmentRepository.findByCode("ROADS").orElseThrow();

        seed("admin", "admin@pwct.local", "City Admin", null, Set.of(adminRole));
        seed("supervisor", "supervisor@pwct.local", "Roads Supervisor", roads, Set.of(supervisorRole));
        seed("crew", "crew@pwct.local", "Roads Crew", roads, Set.of(crewRole));
        seed("citizen", "citizen@pwct.local", "Alex Citizen", null, Set.of(citizenRole));
        log.info("Seeded demo accounts for local development");
    }

    private void seed(String username, String email, String fullName, Department department, Set<Role> roles) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setDepartment(department);
        user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
        user.setRoles(new HashSet<>(roles));
        userRepository.save(user);
    }

    private Role role(RoleName name) {
        return roleRepository.findByName(name).orElseThrow();
    }
}

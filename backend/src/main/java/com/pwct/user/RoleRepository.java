package com.pwct.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pwct.common.RoleName;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}

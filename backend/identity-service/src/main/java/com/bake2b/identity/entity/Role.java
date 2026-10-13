package com.bake2b.identity.entity;

import com.bake2b.identity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/** CUSTOMER or ADMIN. Vendor ownership is not a role: it comes from Vendor.owner (BR-11). */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "role_name", unique = true, nullable = false, length = 50)
    private String roleName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}

package com.moonkage.vendor.cakeattribute;

import jakarta.persistence.LockModeType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface CakeAttributeRepository extends JpaRepository<CakeAttribute, String> {

    /** In the admin's order; equal positions by label key, so the order is the same on every read. */
    List<CakeAttribute> findByAttributeGroupOrderBySortOrderAscLabelKeyAsc(CakeAttributeGroup group);

    List<CakeAttribute> findAllByOrderByAttributeGroupAscSortOrderAscLabelKeyAsc();

    /** Every value of the group, rows locked: two admins changing one group are serialised (AC-54.2, AC-54.5). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM CakeAttribute a WHERE a.attributeGroup = :group")
    List<CakeAttribute> findForChangeByGroup(@Param("group") CakeAttributeGroup group);
}

package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.InterprovinceFee;
import com.moonkage.catalog.entity.Province;
import java.sql.Timestamp;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JdbcInterprovinceFeeRepository implements InterprovinceFeeRepository {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public List<Province> findProvinces() {
        return jdbcTemplate.query(
                "SELECT code, name FROM provinces ORDER BY code",
                (row, index) -> new Province(row.getString("code"), row.getString("name")));
    }

    @Override
    public List<Province> lockProvinces() {
        // Parent rows exist before the first fee save, unlike the fee rows. Every writer locks in this order.
        return jdbcTemplate.query(
                "SELECT code, name FROM provinces ORDER BY code FOR UPDATE",
                (row, index) -> new Province(row.getString("code"), row.getString("name")));
    }

    @Override
    public List<InterprovinceFee> findFees() {
        return jdbcTemplate.query(
                "SELECT province_code, fee, effective_from, updated_by FROM interprovince_fees ORDER BY province_code",
                (row, index) -> new InterprovinceFee(
                        row.getString("province_code"),
                        row.getLong("fee"),
                        row.getTimestamp("effective_from").toInstant(),
                        row.getString("updated_by")));
    }

    @Override
    public void saveFees(List<InterprovinceFee> fees) {
        jdbcTemplate.batchUpdate(
                """
                INSERT INTO interprovince_fees (province_code, fee, effective_from, updated_by)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (province_code) DO UPDATE SET fee = EXCLUDED.fee,
                    effective_from = EXCLUDED.effective_from, updated_by = EXCLUDED.updated_by
                """,
                fees.stream()
                        .map(fee -> new Object[] {
                            fee.provinceCode(), fee.fee(), Timestamp.from(fee.effectiveFrom()), fee.updatedBy()
                        })
                        .toList());
    }
}

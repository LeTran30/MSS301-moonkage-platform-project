package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.InterprovinceFee;
import com.moonkage.catalog.entity.Province;
import java.util.List;

public interface InterprovinceFeeRepository {
    List<Province> findProvinces();

    List<Province> lockProvinces();

    List<InterprovinceFee> findFees();

    void saveFees(List<InterprovinceFee> fees);
}

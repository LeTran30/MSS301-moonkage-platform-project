package com.moonkage.vendor.registrationfee;

import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.registrationfee.dto.ChangeRegistrationFeeRequest;
import com.moonkage.vendor.registrationfee.dto.RegistrationFeeConfigResponse;
import com.moonkage.vendor.security.CurrentUserInfo;

/** Root RegistrationFeeConfig (docs/architecture/api-db/vendor.md). */
public interface RegistrationFeeService {

    /** The amount a vendor is charged if it pays now (AC-53.3). */
    Price getCurrentFee();

    /** For the profile form, guests included (AC-26.9). */
    RegistrationFeeConfigResponse getCurrentConfig();

    /** Admin only: a new level from now on; payments already created keep their amount (FR-53, AC-53.2). */
    RegistrationFeeConfigResponse changeFee(CurrentUserInfo caller, ChangeRegistrationFeeRequest request);
}

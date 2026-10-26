package com.moonkage.vendor.registrationfee;

import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.outbox.OutboxService;
import com.moonkage.vendor.registrationfee.dto.ChangeRegistrationFeeRequest;
import com.moonkage.vendor.registrationfee.dto.RegistrationFeeConfigResponse;
import com.moonkage.vendor.security.CurrentUserInfo;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class RegistrationFeeServiceImpl implements RegistrationFeeService {

    private static final String FIELD_AMOUNT = "amount";

    private final RegistrationFeeConfigRepository repository;
    private final OutboxService outboxService;

    @Override
    @Transactional(readOnly = true)
    public Price getCurrentFee() {
        return getCurrent(Instant.now()).getAmount();
    }

    @Override
    @Transactional(readOnly = true)
    public RegistrationFeeConfigResponse getCurrentConfig() {
        return toResponse(getCurrent(Instant.now()));
    }

    @Override
    @Transactional
    public RegistrationFeeConfigResponse changeFee(CurrentUserInfo caller, ChangeRegistrationFeeRequest request) {
        if (!caller.isAdmin()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        Price amount;
        try {
            amount = Price.of(request.amount());
        } catch (AppException e) {
            throw e.atField(FIELD_AMOUNT);
        }
        Instant now = Instant.now();
        Price previous = getCurrent(now).getAmount();

        RegistrationFeeConfig config = repository.save(RegistrationFeeConfig.of(amount, now, caller.accountId()));
        RegistrationFeeChangedEvent event = RegistrationFeeChangedEvent.of(previous, config);
        outboxService.enqueue(event.eventId(), RabbitConfig.REGISTRATION_FEE_CHANGED_ROUTING_KEY, event);
        return toResponse(config);
    }

    /** The migration inserts the default level in every environment, so a level always exists. */
    private RegistrationFeeConfig getCurrent(Instant at) {
        return repository
                .findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(at)
                .orElseThrow(() -> new IllegalStateException("registration_fee_configs has no level in effect"));
    }

    private static RegistrationFeeConfigResponse toResponse(RegistrationFeeConfig config) {
        return new RegistrationFeeConfigResponse(config.getAmount().value(), config.getEffectiveFrom());
    }
}

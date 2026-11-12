package com.moonkage.order.messaging.inbox;

import com.moonkage.order.entity.ProcessedEvent;
import com.moonkage.order.repository.inbox.ProcessedEventRepository;
import com.moonkage.order.service.InboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InboxServiceImpl implements InboxService {

    private final ProcessedEventRepository repository;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean markProcessed(String eventId, String routingKey) {
        if (repository.existsById(eventId)) {
            return false;
        }
        repository.saveAndFlush(ProcessedEvent.of(eventId, routingKey));
        return true;
    }
}

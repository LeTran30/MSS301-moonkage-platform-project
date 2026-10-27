package com.moonkage.order.service;

import com.moonkage.order.entity.Order;
import com.moonkage.order.entity.ProgressUpdate;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.repository.ProgressUpdateRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** Every status change of an order goes into its progress history, which is never edited (FR-21, FR-40). */
@Component
@RequiredArgsConstructor
public class OrderProgress {

    private final ProgressUpdateRepository progressUpdateRepository;
    private final EntityManager entityManager;

    /**
     * Changes the status and records it; flushed, so the order's version is the one it is committed with.
     *
     * @param photoKeys object keys already moved under the order
     */
    public void moveTo(Order order, OrderStatus status, String note, List<String> photoKeys) {
        order.setStatus(status);
        ProgressUpdate update = new ProgressUpdate();
        update.setOrder(order);
        update.setMilestone(status);
        update.setNote(StringUtils.hasText(note) ? note.trim() : null);
        update.getPhotoKeys().addAll(photoKeys);
        progressUpdateRepository.save(update);
        entityManager.flush();
    }
}

package com.moonkage.payment.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.event.DisputeEvent;
import com.moonkage.payment.dto.event.OrderEvent;
import com.moonkage.payment.service.OrderEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

/**
 * order.* and dispute.* from order-service (integration.md).
 *
 * <p>Tất cả sự kiện của một đơn nằm trong **một** hàng đợi, nên chúng tới theo
 * đúng thứ tự order-service phát ra (outbox phát theo `created_at`). Điều đó
 * không phải là chi tiết vụn vặt: `dispute.opened` chỉ có nghĩa khi
 * `order.created` đã tạo được hàng `order_snapshots` — nếu không, sự kiện
 * khiếu nại sẽ bị **bỏ rơi** vĩnh viễn (xem `OrderEventServiceImpl`).
 *
 * <p>Trước đây mỗi loại sự kiện nằm ở một hàng đợi riêng, nên chúng được
 * tiêu thụ **song song** và không còn thứ tự: hàng đợi của `dispute.opened` có
 * thể tới trước hàng đợi của `order.created`, và tiền của đơn không bị khoá
 * lại (BR-18) dù khiếu nại đã mở.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventListener {

    private final OrderEventService orderEventService;
    private final ObjectMapper objectMapper;

    /**
     * Một hàng đợi cho mọi sự kiện của đơn; định dạng thân tin nhắn khác nhau
     * nên thân được đọc theo routing key.
     */
    @RabbitListener(queues = RabbitConfig.ORDER_EVENTS_QUEUE)
    public void onOrderEvent(Message message, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        switch (routingKey) {
            case RabbitConfig.DISPUTE_OPENED_ROUTING_KEY ->
                orderEventService.onDisputeOpened(read(message, DisputeEvent.class));
            case RabbitConfig.DISPUTE_RESOLVED_ROUTING_KEY ->
                orderEventService.onDisputeResolved(read(message, DisputeEvent.class));
            default -> orderEventService.onOrderEvent(routingKey, read(message, OrderEvent.class));
        }
    }

    private <T> T read(Message message, Class<T> type) {
        try {
            return objectMapper.readValue(message.getBody(), type);
        } catch (Exception e) {
            throw new IllegalArgumentException("Sự kiện không đọc được: " + e.getMessage(), e);
        }
    }
}

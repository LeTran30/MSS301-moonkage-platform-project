package com.moonkage.order.entity;

import com.moonkage.order.enums.ChatParty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

/** One message of an order's chat: text, a file, or both. Never edited once sent. */
@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
public class ChatMessage {

    @Id
    @Column(length = 36)
    private String id;

    /** Written by the database (identity), read back on insert: the order of the thread. */
    @Generated(event = EventType.INSERT)
    @Column(insertable = false, updatable = false)
    private Long seq;

    @Column(nullable = false)
    private String orderId;

    @Column(nullable = false, length = 36)
    private String senderAccountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ChatParty senderParty;

    @Column(columnDefinition = "TEXT")
    private String body;

    private String attachmentKey;

    private String attachmentName;

    @Column(length = 100)
    private String attachmentContentType;

    @Column(nullable = false)
    private Instant createdAt;
}

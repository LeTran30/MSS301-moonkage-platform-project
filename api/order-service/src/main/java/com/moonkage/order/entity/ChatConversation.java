package com.moonkage.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** The one conversation between a buyer and a Shop; open before, during and after any order. */
@Entity
@Table(name = "chat_conversations")
@Getter
@Setter
@NoArgsConstructor
public class ChatConversation {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 36)
    private String buyerAccountId;

    /** shortcut: copied when the conversation starts, not when the buyer renames; read identity if that matters. */
    @Column(length = 100)
    private String buyerName;

    @Column(nullable = false, length = 36)
    private String vendorId;

    private String vendorName;

    private Instant lastMessageAt;

    @Column(nullable = false)
    private Instant createdAt;
}

package com.moonkage.order.entity;

import com.moonkage.order.enums.ChatParty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** How far one side of an order's chat has read. */
@Entity
@Table(name = "chat_reads")
@IdClass(ChatRead.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class ChatRead {

    @Id
    private String orderId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private ChatParty party;

    @Column(nullable = false)
    private long lastReadSeq;

    @Column(nullable = false)
    private Instant updatedAt;

    public record Key(String orderId, ChatParty party) implements Serializable {

        /** For JPA, which builds the key reflectively. */
        public Key() {
            this(null, null);
        }
    }
}

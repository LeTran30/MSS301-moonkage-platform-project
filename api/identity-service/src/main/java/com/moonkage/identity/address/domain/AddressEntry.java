package com.moonkage.identity.address.domain;

import com.moonkage.identity.address.AddressView;
import com.moonkage.identity.platform.persistence.BaseEntity;
import com.moonkage.identity.shared.AccountId;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * One saved delivery address of an account (FR-03). Its default flag changes only through {@link AddressBook}, which
 * keeps at most one default per account.
 */
@Entity
@Table(name = "addresses")
public class AddressEntry extends BaseEntity {

    /** The {@link AddressId}. */
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    /** = accounts.id; an id, not a relation, so the account stays inside its module. */
    @Column(name = "account_id", nullable = false, updatable = false)
    private UUID accountId;

    @Embedded
    private DeliveryContact contact;

    /** Null when the owner gave no label. */
    @Column(name = "label", length = AddressLabel.MAX_LENGTH)
    private AddressLabel label;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    /** For JPA only. */
    protected AddressEntry() {}

    private AddressEntry(AddressId id, AccountId owner, DeliveryContact contact, AddressLabel label) {
        this.id = Objects.requireNonNull(id, "id").value();
        this.accountId = Objects.requireNonNull(owner, "owner").value();
        this.contact = Objects.requireNonNull(contact, "contact");
        this.label = label;
        this.isDefault = false;
    }

    static AddressEntry create(AddressId id, AccountId owner, DeliveryContact contact, AddressLabel label) {
        return new AddressEntry(id, owner, contact, label);
    }

    void revise(DeliveryContact newContact, AddressLabel newLabel) {
        this.contact = Objects.requireNonNull(newContact, "contact");
        this.label = newLabel;
    }

    void markDefault() {
        this.isDefault = true;
    }

    void unmarkDefault() {
        this.isDefault = false;
    }

    public AddressId id() {
        return new AddressId(id);
    }

    public AccountId owner() {
        return new AccountId(accountId);
    }

    public DeliveryContact contact() {
        return contact;
    }

    public Optional<AddressLabel> label() {
        return Optional.ofNullable(label);
    }

    public AddressView view() {
        Recipient recipient = contact.recipient();
        DeliveryLocation location = contact.location();
        return new AddressView(
                id().toString(),
                recipient.name().value(),
                recipient.phone().value(),
                location.province().code(),
                location.province().officialName(),
                location.ward().value(),
                location.detail().value(),
                location.oneLine(),
                location.area().code(),
                label == null ? null : label.value(),
                isDefault,
                getCreatedAt(),
                getUpdatedAt());
    }

    public boolean isDefault() {
        return isDefault;
    }
}

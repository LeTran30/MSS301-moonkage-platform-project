package com.moonkage.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** The gateway headers and the roles they carry are the contract between the gateway and every service. */
class GatewayHeaderTest {

    @Test
    void theHeaderNamesAreTheOnesTheGatewaySets() {
        assertThat(GatewayHeader.ACCOUNT_ID).isEqualTo("X-Account-Id");
        assertThat(GatewayHeader.USER_ROLE).isEqualTo("X-User-Role");
        assertThat(GatewayHeader.USER_ID).isEqualTo("X-User-Id");
    }

    @Test
    void onlyTheAdminNameIsTheAdmin() {
        assertThat(GatewayRole.isAdmin("ADMIN")).isTrue();
        assertThat(GatewayRole.isAdmin("MEMBER")).isFalse();
        assertThat(GatewayRole.isAdmin(null)).isFalse();
        assertThat(GatewayRole.isAdmin("admin")).isFalse();
    }

    @Test
    void anUnknownRoleIsNotAKnownRole() {
        assertThat(GatewayRole.isKnown("MEMBER")).isTrue();
        assertThat(GatewayRole.isKnown("ADMIN")).isTrue();
        assertThat(GatewayRole.isKnown("ROOT")).isFalse();
        assertThat(GatewayRole.isKnown(null)).isFalse();
    }

    @Test
    void aKnownRoleIsFoundByItsExactName() {
        assertThat(GatewayRole.nameOf("ADMIN")).isEqualTo(GatewayRole.ADMIN);
        assertThat(GatewayRole.nameOf("ROOT")).isNull();
        assertThat(GatewayRole.nameOf(null)).isNull();
    }
}

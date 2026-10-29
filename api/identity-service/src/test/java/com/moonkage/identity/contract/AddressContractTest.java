package com.moonkage.identity.contract;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

/** {@code /api/addresses}: FR-03 address book, one default per account, other accounts' entries look missing. */
class AddressContractTest extends ContractTest {

    private static final String HOME = """
            {"recipientName":"Nguyen Lan","recipientPhone":"0910000030","provinceCode":"79",
            "provinceName":"Thành phố Hồ Chí Minh","wardName":"Phường Bến Nghé","detail":"12 Lê Lợi",
            "label":"Nhà riêng"}""";
    private static final String OFFICE = """
            {"recipientName":"Tran Binh","recipientPhone":"0910000031","provinceCode":"01",
            "provinceName":"Thành phố Hà Nội","wardName":"Phường Hoàn Kiếm","detail":"1 Tràng Tiền",
            "isDefault":%s}""";

    @Test
    void firstAddressBecomesTheDefault() throws Exception {
        String token = accessToken(activeAccount("address-first"));

        assertContract("address/list-empty", getWith("/api/addresses", token));
        assertContract("address/create-first", postJson("/api/addresses", HOME, token));
        assertContract("address/list-one", getWith("/api/addresses", token));
    }

    /**
     * BUG (phase 1 report, B-1): asking for a second default answers 500. Hibernate writes the new flag before
     * clearing the old one and hits {@code ux_addresses_one_default_per_account}. Locked as it is today so that a fix
     * is a visible, approved change of this snapshot.
     */
    @Test
    void secondDefaultFailsToday() throws Exception {
        String token = accessToken(activeAccount("address-default"));
        postJson("/api/addresses", HOME, token);

        assertContract("address/create-not-default", postJson("/api/addresses", OFFICE.formatted("false"), token));
        assertContract("address/create-new-default", postJson("/api/addresses", OFFICE.formatted("true"), token));
        String office =
                postJson("/api/addresses", OFFICE.formatted("false"), token).read("$.data.id");
        assertContract(
                "address/update-make-default", putJson("/api/addresses/" + office, OFFICE.formatted("true"), token));
        // nothing changed: the first address is still the only default
        assertContract("address/list-after-failed-default", getWith("/api/addresses", token));
        assertEquals(1, defaults(token));
    }

    @Test
    void updateKeepsOrClearsTheDefaultFlag() throws Exception {
        String token = accessToken(activeAccount("address-update"));
        String home = postJson("/api/addresses", HOME, token).read("$.data.id");

        // isDefault left out: the flag stays as it was
        assertContract("address/update-keep-flag", putJson("/api/addresses/" + home, """
                {"recipientName":"Tran Binh","recipientPhone":"0910000031","provinceCode":"01",
                "provinceName":"Thành phố Hà Nội","wardName":"Phường Cửa Nam","detail":"2 Tràng Tiền"}""", token));
        assertEquals(1, defaults(token));
        // true on the default itself changes nothing
        assertContract(
                "address/update-default-again", putJson("/api/addresses/" + home, OFFICE.formatted("true"), token));
        // false clears it: the book may have no default
        assertContract(
                "address/update-clear-default", putJson("/api/addresses/" + home, OFFICE.formatted("false"), token));
        assertEquals(0, defaults(token));
    }

    @Test
    void deletingTheDefaultLeavesNoDefault() throws Exception {
        String token = accessToken(activeAccount("address-delete"));
        String home = postJson("/api/addresses", HOME, token).read("$.data.id");
        postJson("/api/addresses", OFFICE.formatted("false"), token);

        assertContract(
                "address/delete-ok", call(delete("/api/addresses/" + home).header("Authorization", bearer(token))));
        assertEquals(0, defaults(token));
        assertContract(
                "address/not-found-delete",
                call(delete("/api/addresses/" + home).header("Authorization", bearer(token))));
    }

    @Test
    void anotherAccountsAddressLooksMissing() throws Exception {
        String owner = accessToken(activeAccount("address-owner"));
        String stranger = accessToken(activeAccount("address-stranger"));
        String id = postJson("/api/addresses", HOME, owner).read("$.data.id");

        assertContract("address/not-found-update", putJson("/api/addresses/" + id, HOME, stranger));
        assertContract(
                "address/not-found-delete",
                call(delete("/api/addresses/" + id).header("Authorization", bearer(stranger))));
        assertContract("address/not-found-update", putJson("/api/addresses/" + UUID.randomUUID(), HOME, owner));
        assertContract("address/not-found-update-not-uuid", putJson("/api/addresses/not-a-uuid", HOME, owner));
        assertContract("address/list-empty", getWith("/api/addresses", stranger));
    }

    @Test
    void createReportsEveryInvalidField() throws Exception {
        String token = accessToken(activeAccount("address-invalid"));

        assertContract("address/create-missing", postJson("/api/addresses", "{}", token));
        assertContract(
                "address/create-invalid",
                postJson(
                        "/api/addresses",
                        """
                {"recipientName":"%s","recipientPhone":"12345","provinceCode":"99","provinceName":"%s",
                "wardName":"%s","detail":"%s","label":"%s"}""".formatted(
                                "n".repeat(101), "p".repeat(101), "w".repeat(101), "d".repeat(256), "l".repeat(51)),
                        token));
        assertContract("address/list-empty", getWith("/api/addresses", token));
    }

    @Test
    void providedProvinceNameIsStoredAsSent() throws Exception {
        String token = accessToken(activeAccount("address-province-name"));

        // today the server keeps the client's name even when it does not match the code (decision C3 changes this)
        assertContract("address/create-mismatched-province-name", postJson("/api/addresses", """
                {"recipientName":"Nguyen Lan","recipientPhone":"0910000032","provinceCode":"79",
                "provinceName":"Ten Tu Dat","wardName":"Phường Bến Nghé","detail":"12 Lê Lợi"}""", token));
    }

    private Answer putJson(String path, String json, String token) throws Exception {
        return call(
                put(path).contentType(MediaType.APPLICATION_JSON).content(json).header("Authorization", bearer(token)));
    }

    private int defaults(String token) throws Exception {
        List<Boolean> flags = getWith("/api/addresses", token).read("$.data[*].isDefault");
        return (int) flags.stream().filter(Boolean.TRUE::equals).count();
    }
}

package com.moonkage.identity.contract;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

/**
 * {@code /api/accounts/me/addresses}: FR-03 address book, one default per account, other accounts' entries look
 * missing.
 */
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

        assertContract("address/list-empty", getWith("/api/accounts/me/addresses", token));
        assertContract("address/create-first", postJson("/api/accounts/me/addresses", HOME, token));
        assertContract("address/list-one", getWith("/api/accounts/me/addresses", token));
    }

    /** AC-03.1: a new default takes the flag from the old one (fixed in phase 2, decision C5 / B-1). */
    @Test
    void newDefaultTakesTheFlagFromTheOldOne() throws Exception {
        String token = accessToken(activeAccount("address-default"));
        postJson("/api/accounts/me/addresses", HOME, token);

        assertContract(
                "address/create-not-default", postJson("/api/accounts/me/addresses", OFFICE.formatted("false"), token));
        assertContract(
                "address/create-new-default", postJson("/api/accounts/me/addresses", OFFICE.formatted("true"), token));
        assertEquals(1, defaults(token));
        String office = postJson("/api/accounts/me/addresses", OFFICE.formatted("false"), token)
                .read("$.data.id");
        assertContract(
                "address/update-make-default",
                putJson("/api/accounts/me/addresses/" + office, OFFICE.formatted("true"), token));
        assertEquals(1, defaults(token));
        assertEquals(office, getWith("/api/accounts/me/addresses", token).read("$.data[0].id"));
    }

    @Test
    void updateKeepsOrClearsTheDefaultFlag() throws Exception {
        String token = accessToken(activeAccount("address-update"));
        String home = postJson("/api/accounts/me/addresses", HOME, token).read("$.data.id");

        // isDefault left out: the flag stays as it was
        assertContract("address/update-keep-flag", putJson("/api/accounts/me/addresses/" + home, """
                {"recipientName":"Tran Binh","recipientPhone":"0910000031","provinceCode":"01",
                "provinceName":"Thành phố Hà Nội","wardName":"Phường Cửa Nam","detail":"2 Tràng Tiền"}""", token));
        assertEquals(1, defaults(token));
        // true on the default itself changes nothing
        assertContract(
                "address/update-default-again",
                putJson("/api/accounts/me/addresses/" + home, OFFICE.formatted("true"), token));
        // false clears it: the book may have no default
        assertContract(
                "address/update-clear-default",
                putJson("/api/accounts/me/addresses/" + home, OFFICE.formatted("false"), token));
        assertEquals(0, defaults(token));
    }

    @Test
    void deletingTheDefaultLeavesNoDefault() throws Exception {
        String token = accessToken(activeAccount("address-delete"));
        String home = postJson("/api/accounts/me/addresses", HOME, token).read("$.data.id");
        postJson("/api/accounts/me/addresses", OFFICE.formatted("false"), token);

        assertContract(
                "address/delete-ok",
                call(delete("/api/accounts/me/addresses/" + home).header("Authorization", bearer(token))));
        assertEquals(0, defaults(token));
        assertContract(
                "address/not-found-delete",
                call(delete("/api/accounts/me/addresses/" + home).header("Authorization", bearer(token))));
    }

    @Test
    void anotherAccountsAddressLooksMissing() throws Exception {
        String owner = accessToken(activeAccount("address-owner"));
        String stranger = accessToken(activeAccount("address-stranger"));
        String id = postJson("/api/accounts/me/addresses", HOME, owner).read("$.data.id");

        assertContract("address/not-found-update", putJson("/api/accounts/me/addresses/" + id, HOME, stranger));
        assertContract(
                "address/not-found-delete",
                call(delete("/api/accounts/me/addresses/" + id).header("Authorization", bearer(stranger))));
        assertContract(
                "address/not-found-update", putJson("/api/accounts/me/addresses/" + UUID.randomUUID(), HOME, owner));
        assertContract(
                "address/not-found-update-not-uuid", putJson("/api/accounts/me/addresses/not-a-uuid", HOME, owner));
        assertContract("address/list-empty", getWith("/api/accounts/me/addresses", stranger));
    }

    @Test
    void createReportsEveryInvalidField() throws Exception {
        String token = accessToken(activeAccount("address-invalid"));

        assertContract("address/create-missing", postJson("/api/accounts/me/addresses", "{}", token));
        assertContract(
                "address/create-invalid",
                postJson(
                        "/api/accounts/me/addresses",
                        """
                {"recipientName":"%s","recipientPhone":"12345","provinceCode":"99","provinceName":"%s",
                "wardName":"%s","detail":"%s","label":"%s"}""".formatted(
                                "n".repeat(101), "p".repeat(101), "w".repeat(101), "d".repeat(256), "l".repeat(51)),
                        token));
        assertContract("address/list-empty", getWith("/api/accounts/me/addresses", token));
    }

    @Test
    void provinceNameComesFromTheCode() throws Exception {
        String token = accessToken(activeAccount("address-province-name"));

        // decision C3: the client's provinceName is ignored, whatever it says or whether it is sent at all
        assertContract("address/create-province-name-from-code", postJson("/api/accounts/me/addresses", """
                {"recipientName":"Nguyen Lan","recipientPhone":"0910000032","provinceCode":"79",
                "provinceName":"Ten Tu Dat","wardName":"Phường Bến Nghé","detail":"12 Lê Lợi"}""", token));
        assertContract("address/create-province-name-left-out", postJson("/api/accounts/me/addresses", """
                {"recipientName":"Nguyen Lan","recipientPhone":"0910000032","provinceCode":"79",
                "wardName":"Phường Bến Nghé","detail":"12 Lê Lợi","isDefault":false}""", token));
    }

    private Answer putJson(String path, String json, String token) throws Exception {
        return call(
                put(path).contentType(MediaType.APPLICATION_JSON).content(json).header("Authorization", bearer(token)));
    }

    private int defaults(String token) throws Exception {
        List<Boolean> flags = getWith("/api/accounts/me/addresses", token).read("$.data[*].isDefault");
        return (int) flags.stream().filter(Boolean.TRUE::equals).count();
    }
}

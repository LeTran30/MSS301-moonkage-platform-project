package com.moonkage.identity.nfc.infrastructure.crypto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.nfc.application.port.CardPayloadDecryptor.SealedCardFields;
import com.nimbusds.jose.EncryptionMethod;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWEAlgorithm;
import com.nimbusds.jose.JWEHeader;
import com.nimbusds.jose.JWEObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.RSAEncrypter;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;
import java.util.Map;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/** D-17: what the app sends with the public key opens here; nothing else does. */
class JweCardPayloadDecryptorTest {

    private static final Map<String, Object> FIELDS =
            Map.of("idNumber", "079123456789", "dateOfBirth", "1990-05-01", "placeOfResidence", "HA NOI");
    private static final SealedCardFields OPENED = new SealedCardFields("079123456789", "1990-05-01", "HA NOI");

    private static KeyPair pair;
    private static JweCardPayloadDecryptor decryptor;

    @BeforeAll
    static void setUp() throws Exception {
        pair = newKeyPair();
        decryptor = new JweCardPayloadDecryptor(pkcs8(pair));
    }

    @Test
    void opensJweMadeWithItsPublicKey() throws Exception {
        assertEquals(OPENED, decryptor.decrypt(encrypt(pair, FIELDS)).orElseThrow());
    }

    @Test
    void acceptsTheWholePemToo() throws Exception {
        String pem = "-----BEGIN PRIVATE KEY----- " + pkcs8(pair) + " -----END PRIVATE KEY-----";

        assertEquals(
                OPENED,
                new JweCardPayloadDecryptor(pem).decrypt(encrypt(pair, FIELDS)).orElseThrow());
    }

    @Test
    void fieldThatIsNoTextComesOutAsMissing() throws Exception {
        Map<String, Object> payload = Map.of("idNumber", 79123456789L, "placeOfResidence", "HA NOI");

        assertEquals(
                new SealedCardFields(null, null, "HA NOI"),
                decryptor.decrypt(encrypt(pair, payload)).orElseThrow());
    }

    @Test
    void refusesWeakerAlgorithmsOtherKeysAndGarbage() throws Exception {
        assertTrue(decryptor
                .decrypt(encrypt(pair, EncryptionMethod.A128GCM, FIELDS))
                .isEmpty());
        assertTrue(decryptor
                .decrypt(encrypt(newKeyPair(), EncryptionMethod.A256GCM, FIELDS))
                .isEmpty());
        assertTrue(decryptor.decrypt("not-a-jwe").isEmpty());
        assertTrue(decryptor.decrypt(" ").isEmpty());
        assertTrue(decryptor.decrypt(null).isEmpty());
    }

    @Test
    void missingOrInvalidKeyIsAServerFault() throws Exception {
        String jwe = encrypt(pair, FIELDS);

        assertThrows(IllegalStateException.class, () -> new JweCardPayloadDecryptor("").decrypt(jwe));
        assertThrows(IllegalStateException.class, () -> new JweCardPayloadDecryptor("not-a-key").decrypt(jwe));
    }

    private static KeyPair newKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private static String pkcs8(KeyPair keyPair) {
        return Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded());
    }

    private static String encrypt(KeyPair keyPair, Map<String, Object> payload) throws JOSEException {
        return encrypt(keyPair, EncryptionMethod.A256GCM, payload);
    }

    /** What the app does: RSA-OAEP-256 with the server's public key. */
    private static String encrypt(KeyPair keyPair, EncryptionMethod enc, Map<String, Object> payload)
            throws JOSEException {
        JWEObject jwe = new JWEObject(new JWEHeader(JWEAlgorithm.RSA_OAEP_256, enc), new Payload(payload));
        jwe.encrypt(new RSAEncrypter((RSAPublicKey) keyPair.getPublic()));
        return jwe.serialize();
    }
}

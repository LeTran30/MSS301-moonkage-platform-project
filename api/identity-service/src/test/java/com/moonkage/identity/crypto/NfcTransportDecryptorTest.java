package com.moonkage.identity.crypto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
class NfcTransportDecryptorTest {

    private static final Map<String, Object> FIELDS =
            Map.of("idNumber", "079123456789", "dateOfBirth", "1990-05-01", "placeOfResidence", "HA NOI");

    private static KeyPair pair;
    private static NfcTransportDecryptor decryptor;

    @BeforeAll
    static void setUp() throws Exception {
        pair = newKeyPair();
        decryptor = new NfcTransportDecryptor(pkcs8(pair));
    }

    @Test
    void opensJweMadeWithItsPublicKey() throws Exception {
        assertEquals(
                FIELDS,
                decryptor.decrypt(encrypt(pair, EncryptionMethod.A256GCM)).orElseThrow());
    }

    @Test
    void acceptsTheWholePemToo() throws Exception {
        String pem = "-----BEGIN PRIVATE KEY----- " + pkcs8(pair) + " -----END PRIVATE KEY-----";

        assertEquals(
                FIELDS,
                new NfcTransportDecryptor(pem)
                        .decrypt(encrypt(pair, EncryptionMethod.A256GCM))
                        .orElseThrow());
    }

    @Test
    void refusesWeakerAlgorithmsOtherKeysAndGarbage() throws Exception {
        assertTrue(decryptor.decrypt(encrypt(pair, EncryptionMethod.A128GCM)).isEmpty());
        assertTrue(decryptor
                .decrypt(encrypt(newKeyPair(), EncryptionMethod.A256GCM))
                .isEmpty());
        assertTrue(decryptor.decrypt("not-a-jwe").isEmpty());
        assertTrue(decryptor.decrypt(" ").isEmpty());
        assertTrue(decryptor.decrypt(null).isEmpty());
    }

    @Test
    void missingOrInvalidKeyIsAServerFault() throws Exception {
        String jwe = encrypt(pair, EncryptionMethod.A256GCM);

        assertThrows(IllegalStateException.class, () -> new NfcTransportDecryptor("").decrypt(jwe));
        assertThrows(IllegalStateException.class, () -> new NfcTransportDecryptor("not-a-key").decrypt(jwe));
    }

    private static KeyPair newKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private static String pkcs8(KeyPair keyPair) {
        return Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded());
    }

    /** What the app does: RSA-OAEP-256 with the server's public key. */
    private static String encrypt(KeyPair keyPair, EncryptionMethod enc) throws JOSEException {
        JWEObject jwe = new JWEObject(new JWEHeader(JWEAlgorithm.RSA_OAEP_256, enc), new Payload(FIELDS));
        jwe.encrypt(new RSAEncrypter((RSAPublicKey) keyPair.getPublic()));
        return jwe.serialize();
    }
}

package com.moonkage.identity.nfc;

import com.nimbusds.jose.EncryptionMethod;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWEAlgorithm;
import com.nimbusds.jose.JWEObject;
import com.nimbusds.jose.crypto.RSADecrypter;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.text.ParseException;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Opens {@code encryptedFields}: the app locks idNumber, dateOfBirth and placeOfResidence with the public key of
 * identity-service (compact JWE, RSA-OAEP-256 + A256GCM, AC-04.10, D-17); only this private key opens it.
 */
@Component
public class NfcTransportDecryptor {

    private final String privateKey;

    /** {@code privateKey}: the PKCS#8 PEM body (Base64) on one line; BEGIN / END lines are ignored. */
    public NfcTransportDecryptor(@Value("${nfc.transport-private-key}") String privateKey) {
        this.privateKey = privateKey;
    }

    /**
     * The decrypted JSON object, or empty when the value is not such a JWE or this key does not open it (the caller
     * answers BAD_FORMAT). Throws when no valid key is configured: a server fault, not the user's.
     */
    public Optional<Map<String, Object>> decrypt(String compactJwe) {
        PrivateKey key = key();
        if (compactJwe == null || compactJwe.isBlank()) {
            return Optional.empty();
        }
        try {
            JWEObject jwe = JWEObject.parse(compactJwe.trim());
            // only the algorithms the app uses: anything weaker is refused
            if (!JWEAlgorithm.RSA_OAEP_256.equals(jwe.getHeader().getAlgorithm())
                    || !EncryptionMethod.A256GCM.equals(jwe.getHeader().getEncryptionMethod())) {
                return Optional.empty();
            }
            jwe.decrypt(new RSADecrypter(key));
            // null when the payload is not a JSON object
            return Optional.ofNullable(jwe.getPayload().toJSONObject());
        } catch (ParseException | JOSEException e) {
            return Optional.empty();
        }
    }

    private PrivateKey key() {
        if (privateKey == null || privateKey.isBlank()) {
            throw new IllegalStateException("NFC_TRANSPORT_PRIVATE_KEY_V1 is not set");
        }
        String base64 = privateKey.replaceAll("-----[A-Z ]+-----|\\s", "");
        try {
            return KeyFactory.getInstance("RSA")
                    .generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(base64)));
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("NFC_TRANSPORT_PRIVATE_KEY_V1 is not a PKCS#8 RSA private key", e);
        }
    }
}

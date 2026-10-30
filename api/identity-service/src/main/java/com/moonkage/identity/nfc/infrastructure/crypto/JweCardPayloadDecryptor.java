package com.moonkage.identity.nfc.infrastructure.crypto;

import com.moonkage.identity.nfc.application.port.CardPayloadDecryptor;
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
 * The app seals {@code idNumber}, {@code dateOfBirth} and {@code placeOfResidence} with identity-service's public key
 * as a compact JWE (RSA-OAEP-256 + A256GCM, AC-04.10, D-17); only this private key opens it.
 */
@Component
class JweCardPayloadDecryptor implements CardPayloadDecryptor {

    private static final String ID_NUMBER = "idNumber";
    private static final String DATE_OF_BIRTH = "dateOfBirth";
    private static final String PLACE_OF_RESIDENCE = "placeOfResidence";

    private final String privateKey;

    /** {@code privateKey}: the PKCS#8 PEM body (Base64) on one line; BEGIN / END lines are ignored. */
    JweCardPayloadDecryptor(@Value("${nfc.transport-private-key}") String privateKey) {
        this.privateKey = privateKey;
    }

    @Override
    public Optional<SealedCardFields> decrypt(String sealedFields) {
        PrivateKey key = key();
        if (sealedFields == null || sealedFields.isBlank()) {
            return Optional.empty();
        }
        try {
            JWEObject jwe = JWEObject.parse(sealedFields.trim());
            // only the algorithms the app uses: anything weaker is refused
            if (!JWEAlgorithm.RSA_OAEP_256.equals(jwe.getHeader().getAlgorithm())
                    || !EncryptionMethod.A256GCM.equals(jwe.getHeader().getEncryptionMethod())) {
                return Optional.empty();
            }
            jwe.decrypt(new RSADecrypter(key));
            // null when the payload is not a JSON object
            return Optional.ofNullable(jwe.getPayload().toJSONObject()).map(JweCardPayloadDecryptor::fieldsOf);
        } catch (ParseException | JOSEException e) {
            return Optional.empty();
        }
    }

    private static SealedCardFields fieldsOf(Map<String, Object> payload) {
        return new SealedCardFields(
                text(payload, ID_NUMBER), text(payload, DATE_OF_BIRTH), text(payload, PLACE_OF_RESIDENCE));
    }

    private static String text(Map<String, Object> payload, String field) {
        return payload.get(field) instanceof String value ? value : null;
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

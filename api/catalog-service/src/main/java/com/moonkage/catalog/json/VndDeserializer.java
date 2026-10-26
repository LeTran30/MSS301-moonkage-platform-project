package com.moonkage.catalog.json;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import java.io.IOException;

/** Prevents Jackson from truncating a fractional VND amount or coercing a numeric string. */
public class VndDeserializer extends StdDeserializer<Long> {
    public VndDeserializer() {
        super(Long.class);
    }

    @Override
    public Long deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        if (!parser.hasToken(JsonToken.VALUE_NUMBER_INT)) {
            return context.reportInputMismatch(Long.class, "VND must be an integer JSON number");
        }
        return parser.getLongValue();
    }
}

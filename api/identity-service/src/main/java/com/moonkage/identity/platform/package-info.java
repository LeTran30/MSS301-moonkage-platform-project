/**
 * Technique shared by every module, without business (plan v2 6): configuration, web errors and request parsing,
 * the bearer token filter and its SPI, id generation, persistence base, in-memory expiry, messaging and outbox. Open:
 * every module may use any of its packages; it never depends on a business module.
 */
@ApplicationModule(type = ApplicationModule.Type.OPEN)
package com.moonkage.identity.platform;

import org.springframework.modulith.ApplicationModule;

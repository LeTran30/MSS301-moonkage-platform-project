package com.moonkage.identity.address;

/**
 * FR-03: a delivery address to create, or to replace an existing one with, as the client sent it. The client picks
 * the province from the national list and gives the ward as display text (L-15). Nothing is trusted yet.
 *
 * @param recipientPhone Vietnamese mobile number in the national form 0912345678 (decision C1)
 * @param provinceCode 2-digit national code, e.g. 79 for Thành phố Hồ Chí Minh
 * @param provinceName ignored: the server names the province from {@code provinceCode} (decision C3). Still
 *     accepted so older clients keep working
 * @param detail house number and street
 * @param isDefault true makes this the default. On update false clears it and null keeps the current flag
 */
public record AddressDraft(
        String recipientName,
        String recipientPhone,
        String provinceCode,
        String provinceName,
        String wardName,
        String detail,
        String label,
        Boolean isDefault) {}

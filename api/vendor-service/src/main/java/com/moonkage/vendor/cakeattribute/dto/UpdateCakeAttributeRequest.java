package com.moonkage.vendor.cakeattribute.dto;

/**
 * Partial change of one value; a field left out stays as it is. The group and the code never change.
 *
 * @param label a new name (AC-54.3)
 * @param sortOrder a new position, 0 or more (AC-54.6)
 * @param active false hides the value, true shows it again (AC-54.4, AC-54.5)
 */
public record UpdateCakeAttributeRequest(String label, Integer sortOrder, Boolean active) {}

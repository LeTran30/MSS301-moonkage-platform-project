package com.bake2b.file.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FileUploadResponse {

    /** Save this in the owning service (e.g. Product.imageUrls). Directly viewable only for public folders. */
    private String url;
    private String objectName;
    private String fileName;
    private long fileSize;
    private String contentType;
}

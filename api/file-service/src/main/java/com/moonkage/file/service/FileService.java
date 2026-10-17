package com.moonkage.file.service;

import com.moonkage.file.dto.FileUploadResponse;
import com.moonkage.file.enums.FileFolder;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface FileService {

    List<FileUploadResponse> upload(String accountId, FileFolder folder, List<MultipartFile> files);

    void delete(String accountId, String url);

    String presignedUrl(String accountId, String role, String url);
}

package com.moonkage.file.service;

import com.moonkage.file.dto.FileUploadResponse;
import com.moonkage.file.enums.FileFolder;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface FileService {

    List<FileUploadResponse> upload(String userId, FileFolder folder, List<MultipartFile> files);

    void delete(String userId, String url);

    String presignedUrl(String userId, String role, String url);
}

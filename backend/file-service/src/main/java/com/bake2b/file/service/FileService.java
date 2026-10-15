package com.bake2b.file.service;

import com.bake2b.file.dto.FileUploadResponse;
import com.bake2b.file.enums.FileFolder;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileService {

    List<FileUploadResponse> upload(String userId, FileFolder folder, List<MultipartFile> files);

    void delete(String userId, String url);

    String presignedUrl(String userId, String role, String url);
}

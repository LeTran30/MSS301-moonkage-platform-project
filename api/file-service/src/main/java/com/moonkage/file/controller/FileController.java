package com.moonkage.file.controller;

import com.moonkage.file.dto.FileUploadResponse;
import com.moonkage.file.enums.FileFolder;
import com.moonkage.file.service.FileService;
import io.swagger.v3.oas.annotations.Parameter;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** The gateway sets X-Account-Id / X-User-Role from the access token; clients cannot forge them. */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<FileUploadResponse> upload(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @RequestParam FileFolder folder,
            @RequestPart("files") List<MultipartFile> files) {
        return fileService.upload(accountId, folder, files);
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId, @RequestParam String url) {
        fileService.delete(accountId, url);
        return ResponseEntity.noContent().build();
    }

    /** Short-lived link to open a private file (owner or ADMIN). Public files return their URL unchanged. */
    @GetMapping("/presigned")
    public Map<String, String> presigned(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam String url) {
        return Map.of("url", fileService.presignedUrl(accountId, role, url));
    }
}

package com.bake2b.file.controller;

import com.bake2b.file.dto.FileUploadResponse;
import com.bake2b.file.enums.FileFolder;
import com.bake2b.file.service.FileService;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/** The gateway sets X-User-Id / X-User-Role from the access token; clients cannot forge them. */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<FileUploadResponse> upload(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") String userId,
            @RequestParam FileFolder folder,
            @RequestPart("files") List<MultipartFile> files
    ) {
        return fileService.upload(userId, folder, files);
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") String userId,
            @RequestParam String url
    ) {
        fileService.delete(userId, url);
        return ResponseEntity.noContent().build();
    }

    /** Short-lived link to open a private file (owner or ADMIN). Public files return their URL unchanged. */
    @GetMapping("/presigned")
    public Map<String, String> presigned(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") String userId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam String url
    ) {
        return Map.of("url", fileService.presignedUrl(userId, role, url));
    }
}

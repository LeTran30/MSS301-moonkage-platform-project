package com.bake2b.file;

import com.bake2b.file.config.DotEnvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FileServiceApplication {

    public static void main(String[] args) {
        DotEnvConfig.loadDotEnv();
        SpringApplication.run(FileServiceApplication.class, args);
    }
}

package com.moonkage.orchestrator.application.port;

public interface EmailSender {

    void send(String to, String subject, String htmlContent);
}

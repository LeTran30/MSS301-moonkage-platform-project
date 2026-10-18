package com.moonkage.notification.application.port;

public interface EmailSender {

    void send(String to, String subject, String htmlContent);
}

package com.petory.constant;

public enum ApplyStatus {
    PENDING("대기중"),
    APPROVED("승인"),
    REJECTED("거부");

    private final String description;

    ApplyStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 
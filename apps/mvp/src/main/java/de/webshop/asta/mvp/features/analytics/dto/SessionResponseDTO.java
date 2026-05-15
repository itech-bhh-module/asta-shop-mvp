package de.webshop.asta.mvp.features.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class SessionResponseDTO {
    private UUID analyticsId;
    private Instant loginTimestamp;
}
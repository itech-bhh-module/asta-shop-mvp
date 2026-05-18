package de.webshop.asta.mvp.features.analytics.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class SessionDTO {
    
    @NotNull(message = "Analytics-ID darf nicht null sein.")
    private UUID analyticsId;
    
    private Instant loginTimestamp;
}
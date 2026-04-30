package de.webshop.asta.mvp.features.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class SessionDTO {
    private UUID analyticsId;
    private Timestamp loginTimestamp;
}

package de.webshop.asta.mvp.features.orders.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInvoiceResponseDTO {
    private UUID publicId;
    private UUID sessionId;
    private LocalDateTime orderDate;
    private String status;
    private InvoiceAddress pickupStationAddress;
    private List<InvoiceItemResponseDTO> items;
}
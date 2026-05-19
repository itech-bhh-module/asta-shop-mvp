package de.webshop.asta.mvp.features.orders.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItemResponseDTO {
    private UUID publicId;
    private UUID productPublicId;
    private String productNameAtPurchase;
    private int priceAtPurchase;
    private int quantity;
}
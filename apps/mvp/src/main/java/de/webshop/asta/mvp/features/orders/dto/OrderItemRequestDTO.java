package de.webshop.asta.mvp.features.orders.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequestDTO {
    
    @NotNull(message = "Produkt-ID darf nicht null sein.")
    private UUID productId;

    @Min(value = 1, message = "Menge muss größer als 0 sein.")
    private int quantity;
}
package de.webshop.asta.mvp.features.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class CartDTO {

    @NotNull(message = "Analytics-ID darf nicht null sein.")
    private UUID analyticsId;

    @NotNull(message = "Produkt-ID darf nicht null sein.")
    private UUID publicProductId;

    @Min(value = 1, message = "Cart-Menge muss größer als 0 sein.")
    private int amountSelected;

    private int status;
}
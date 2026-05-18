package de.webshop.asta.mvp.features.orders.dto;

import de.webshop.asta.mvp.features.orders.entity.PickupStation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDTO {

    private UUID publicId;

    @NotNull(message = "Session-ID darf nicht null sein.")
    private UUID sessionId;

    @NotNull(message = "Bitte wähle eine Abholstation aus.")
    private PickupStation pickupStation;

    @NotEmpty(message = "Die Bestellung muss mindestens ein Produkt enthalten.")
    @Valid
    private List<OrderItemRequestDTO> items;
}
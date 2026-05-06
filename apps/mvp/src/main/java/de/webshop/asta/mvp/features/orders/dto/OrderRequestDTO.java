package de.webshop.asta.mvp.features.orders.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class OrderRequestDTO {
    // @Valid sorgt dafür, dass auch jedes einzelne Item in der Liste geprüft wird
    @NotEmpty(message = "Die Bestellung muss mindestens ein Produkt enthalten.")
    @Valid
    private List<OrderItemRequestDTO> items;
}
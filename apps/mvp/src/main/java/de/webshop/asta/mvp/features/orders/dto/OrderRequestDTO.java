package de.webshop.asta.mvp.features.orders.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
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

    @NotEmpty(message = "Die Bestellung muss mindestens ein Produkt enthalten.")
    @Valid
    private List<OrderItemRequestDTO> items;
}
package de.webshop.asta.mvp.features.orders.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID; 

@Data
public class OrderRequestDTO {

    private UUID publicId;

    @NotEmpty(message = "Die Bestellung muss mindestens ein Produkt enthalten.")
    @Valid
    private List<OrderItemRequestDTO> items;
}
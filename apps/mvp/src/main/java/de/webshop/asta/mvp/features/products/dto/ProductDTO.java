package de.webshop.asta.mvp.features.products.dto;

import de.webshop.asta.mvp.common.ProductStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class ProductDTO {
    private UUID publicId;

    @NotBlank(message = "Produktname darf nicht leer sein.")
    private String name;

    private String description;
    private String imagePath;

    @Min(value = 0, message = "Preis muss größer oder gleich 0 sein.")
    private int price;

    @Min(value = 0, message = "Lagerbestand muss größer oder gleich 0 sein.")
    private int amountInStock;

    private String tag;
    private ProductStatus status;
}
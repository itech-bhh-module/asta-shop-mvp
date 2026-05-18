package de.webshop.asta.mvp.features.admin.controller;

import de.webshop.asta.mvp.features.products.dto.ProductDTO;
import de.webshop.asta.mvp.features.products.service.ProductDbService;
import jakarta.validation.Valid; // WICHTIG: Import nicht vergessen!
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminProductManagementController {
    private final ProductDbService productDbService;

    @PutMapping("/updateProduct")
    public ResponseEntity<ProductDTO> updateProduct(@Valid @RequestBody ProductDTO updatedProduct){
        // Ticket-Regel: ID darf beim Update nicht null sein
        if (updatedProduct.getPublicId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Die Product-ID darf beim Update nicht null sein.");
        }
        return ResponseEntity.ok(productDbService.updateProductByPublicId(updatedProduct));
    }

    @PostMapping("/addProduct")
    // @Valid schützt diesen Endpunkt vor fehlerhaften Produktdaten (leerer Name, negativer Preis)
    public ResponseEntity<?> addProduct(@Valid @RequestBody ProductDTO product){
        return ResponseEntity.ok(productDbService.addProduct(product));
    }

    @PostMapping("/deleteProduct/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable("id") UUID publicId){
        productDbService.setProductInactiveByPublicId(publicId);
        return ResponseEntity.ok().build();
    }
}
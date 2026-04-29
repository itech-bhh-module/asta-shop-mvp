package de.webshop.asta.mvp.features.admin.controller;

import de.webshop.asta.mvp.features.products.dto.ProductDTO;
import de.webshop.asta.mvp.features.products.service.ProductDbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminProductManagementController {
    private final ProductDbService productDbService;

    @PutMapping("/updateProduct")
    public ResponseEntity<ProductDTO> updateProduct(@RequestBody ProductDTO updatedProduct, UUID publicId){
        return ResponseEntity.ok(productDbService.updateProductByPublicId(updatedProduct));
    }

    @PostMapping("/addProduct")
    public ResponseEntity addProduct(@RequestBody ProductDTO product){
        return ResponseEntity.ok(productDbService.addProduct(product));
    }

    @PostMapping("/deleteProduct/{id}")
    public ResponseEntity deleteProduct(@PathVariable("id") UUID publicId){
        productDbService.deleteProductByPublicId(publicId);
        return ResponseEntity.ok().build();
    }

}

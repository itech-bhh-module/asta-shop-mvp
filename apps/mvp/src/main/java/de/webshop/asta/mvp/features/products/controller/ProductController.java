package de.webshop.asta.mvp.features.products.controller;

import de.webshop.asta.mvp.features.products.dto.ProductDTO;
import de.webshop.asta.mvp.features.products.service.ProductDbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/product")
public class ProductController {

    private final ProductDbService productDbService;

    @GetMapping("/getProduct/{id}")
    public ResponseEntity<ProductDTO> getProduct(@PathVariable("id") UUID id){
        return ResponseEntity.ok(productDbService.getProductByPublicId(id));
    }

    @GetMapping("/getProducts")
    public ResponseEntity<List<ProductDTO>> getProducts(){
        return ResponseEntity.ok(productDbService.getProducts());
    }

    @PatchMapping("/setProductInactive/{publicId}")
    public ResponseEntity<ProductDTO> setProductInactive(@PathVariable("publicId") UUID publicId){
        // Der Service kümmert sich nun um das Setzen und Zurückgeben
        return ResponseEntity.ok(productDbService.setProductInactiveByPublicId(publicId));
    }
}
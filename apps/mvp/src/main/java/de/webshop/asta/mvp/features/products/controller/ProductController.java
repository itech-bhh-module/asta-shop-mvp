package de.webshop.asta.mvp.features.products.controller;

import de.webshop.asta.mvp.features.products.dto.ProductDTO;
import de.webshop.asta.mvp.features.products.repository.ProductRepository;
import de.webshop.asta.mvp.features.products.service.ProductDbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/product")
public class ProductController {

    private final ProductDbService productDbService;

    @GetMapping("/getProduct/{id}")
    public ResponseEntity<Optional<ProductDTO>> getProduct(@PathVariable("id") UUID id){
        return ResponseEntity.ok(productDbService.getProductByPublicId(id));
    }

    @GetMapping("/getProducts")
    public ResponseEntity getProducts(){
        return ResponseEntity.ok(productDbService.getProducts());
    }
}

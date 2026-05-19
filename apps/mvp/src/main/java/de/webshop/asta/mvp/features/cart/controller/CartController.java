package de.webshop.asta.mvp.features.cart.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.webshop.asta.mvp.features.cart.dto.CartDTO;
import de.webshop.asta.mvp.features.cart.entity.Cart;
import de.webshop.asta.mvp.features.cart.service.CartDbManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/cart")
public class CartController {
    private final CartDbManagementService cartDbManagementService;

    @GetMapping("/getCart/{analyticsId}")
    public ResponseEntity<List<CartDTO>> getCart(@PathVariable("analyticsId") UUID analyticsId){
        return ResponseEntity.ok(cartDbManagementService.getCartByAnalyticsId(analyticsId));
    }

    @PostMapping("/addToCart")
    public ResponseEntity<Cart> addToCart(@Valid @RequestBody CartDTO cartDTO){
        //should expose cart to frontend in final version, this is just for dev
        return ResponseEntity.ok(cartDbManagementService.addToCart(cartDTO));
    }

    @PostMapping("/removeFromCart/{analyticsId}/{publicId}")
    public ResponseEntity removeFromCart(@PathVariable("analyticsId")UUID analyticsId, @PathVariable("publicId")UUID publicId){
        //removing the entry
        cartDbManagementService.removeFromCart(analyticsId,publicId);
        //returning the current cart for the selected analyticsId
        return ResponseEntity.ok(cartDbManagementService.getCartByAnalyticsId(analyticsId));
    }
}

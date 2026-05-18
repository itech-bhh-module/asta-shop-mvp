package de.webshop.asta.mvp.features.cart.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import de.webshop.asta.mvp.features.analytics.service.SessionDbManagementService;
import de.webshop.asta.mvp.features.cart.dto.CartDTO;
import de.webshop.asta.mvp.features.cart.entity.Cart;
import de.webshop.asta.mvp.features.products.service.ProductDbService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CartMapper {

    private final ProductDbService productDbService;
    private final SessionDbManagementService sessionDbManagementService;

    public CartDTO toDto(Cart cart) {
        UUID analyticsId = sessionDbManagementService.getSessionBySessionId(cart.getSessionId())
                .orElseThrow()
                .getAnalyticsId();

        // dont know if the throw here is good for error handling
        UUID publicProductId = productDbService.getProductByProductId(cart.getProductId())
                .orElseThrow()
                .getPublicId();

        return new CartDTO(
                analyticsId,
                publicProductId,
                cart.getAmountSelected(),
                cart.getStatus()
        );
    }

    public Cart toCart(CartDTO dto) {
        Long sessionId = sessionDbManagementService.getSessionIdByAnalyticsId(dto.getAnalyticsId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Session nicht gefunden."
                ));

        Long productId = productDbService.getProductIdByPublicId(dto.getPublicProductId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produkt nicht gefunden."
                ));

        Cart cart = new Cart();
        cart.setSessionId(sessionId);
        cart.setProductId(productId);
        cart.setAmountSelected(dto.getAmountSelected());
        cart.setStatus(dto.getStatus());

        return cart;
    }
}
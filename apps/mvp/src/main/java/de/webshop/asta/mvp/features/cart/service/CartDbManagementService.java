package de.webshop.asta.mvp.features.cart.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import de.webshop.asta.mvp.features.cart.dto.CartDTO;
import de.webshop.asta.mvp.features.cart.entity.Cart;
import de.webshop.asta.mvp.features.cart.repository.CartRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CartDbManagementService {

    private final CartRepository cartRepository;
    private final CartMapper cartMapper;

    public List<CartDTO> getCartByAnalyticsId(UUID analyticsId) {
        return cartRepository.findCartByAnalyticsId(analyticsId)
                .stream()
                .map(cartMapper::toDto)
                .toList();
    }

    public CartDTO addToCart(CartDTO cartDTO) {
        Cart newCart = cartMapper.toCart(cartDTO);

        Cart savedCart = cartRepository.findBySessionIdAndProductId(
                        newCart.getSessionId(),
                        newCart.getProductId()
                )
                .map(existingCart -> {
                    existingCart.setAmountSelected(
                            existingCart.getAmountSelected() + newCart.getAmountSelected()
                    );
                    return cartRepository.save(existingCart);
                })
                .orElseGet(() -> cartRepository.save(newCart));

        return cartMapper.toDto(savedCart);
    }

    public void removeFromCart(UUID analyticsId, UUID publicId) {
        // should return the current cart (list of CartDTO for dev)
        cartRepository.deleteCartEntryByAnalyticsIdAndPublicId(analyticsId, publicId);
    }
}

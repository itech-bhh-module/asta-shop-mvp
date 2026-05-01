package de.webshop.asta.mvp.features.cart.service;

import de.webshop.asta.mvp.features.cart.dto.CartDTO;
import de.webshop.asta.mvp.features.cart.entity.Cart;
import de.webshop.asta.mvp.features.cart.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartDbManagementService {
    private final CartRepository cartRepository;
    private final CartMapper cartMapper;
    public List<CartDTO> getCartByAnalyticsId(UUID analyticsId){
        return cartRepository.findCartByAnalyticsId(analyticsId)
                .stream().map(cartMapper::toDto)
                .toList();
    }
    public Cart addToCart(CartDTO cartDTO){
        return cartRepository.save(cartMapper.toCart(cartDTO));
    }

    public void removeFromCart(UUID analyticsId, UUID publicId){
        //should return the current cart (list of cartdto for dev)
        cartRepository.deleteCartEntryByAnalyticsIdAndPublicId(analyticsId, publicId);
    }
}

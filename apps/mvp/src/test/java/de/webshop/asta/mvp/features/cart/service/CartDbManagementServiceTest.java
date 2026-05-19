package de.webshop.asta.mvp.features.cart.service;

import de.webshop.asta.mvp.features.cart.dto.CartDTO;
import de.webshop.asta.mvp.features.cart.entity.Cart;
import de.webshop.asta.mvp.features.cart.repository.CartRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartDbManagementServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartMapper cartMapper;

    @InjectMocks
    private CartDbManagementService service;

    @Test
    void addToCart_WhenCartEntryDoesNotExist_ThenSavesNewEntry() {
        UUID analyticsId = UUID.randomUUID();
        UUID productPublicId = UUID.randomUUID();

        CartDTO dto = new CartDTO(analyticsId, productPublicId, 2, 0);
        Cart newCart = new Cart(null, 10L, 20L, 2, 0);
        Cart savedCart = new Cart(1L, 10L, 20L, 2, 0);

        when(cartMapper.toCart(dto)).thenReturn(newCart);
        when(cartRepository.findBySessionIdAndProductId(10L, 20L)).thenReturn(Optional.empty());
        when(cartRepository.save(newCart)).thenReturn(savedCart);

        Cart result = service.addToCart(dto);

        assertEquals(savedCart, result);
        verify(cartRepository).save(newCart);
    }

    @Test
    void addToCart_WhenCartEntryExists_ThenIncrementsAmount() {
        UUID analyticsId = UUID.randomUUID();
        UUID productPublicId = UUID.randomUUID();

        CartDTO dto = new CartDTO(analyticsId, productPublicId, 3, 0);
        Cart newCart = new Cart(null, 10L, 20L, 3, 0);
        Cart existingCart = new Cart(1L, 10L, 20L, 2, 0);
        Cart savedCart = new Cart(1L, 10L, 20L, 5, 0);

        when(cartMapper.toCart(dto)).thenReturn(newCart);
        when(cartRepository.findBySessionIdAndProductId(10L, 20L)).thenReturn(Optional.of(existingCart));
        when(cartRepository.save(existingCart)).thenReturn(savedCart);

        Cart result = service.addToCart(dto);

        assertEquals(savedCart, result);
        assertEquals(5, existingCart.getAmountSelected());
        verify(cartRepository).save(existingCart);
    }

    @Test
    void removeFromCart_WhenCalled_ThenDeletesEntryByAnalyticsIdAndPublicId() {
        UUID analyticsId = UUID.randomUUID();
        UUID productPublicId = UUID.randomUUID();

        service.removeFromCart(analyticsId, productPublicId);

        verify(cartRepository).deleteCartEntryByAnalyticsIdAndPublicId(analyticsId, productPublicId);
    }
}
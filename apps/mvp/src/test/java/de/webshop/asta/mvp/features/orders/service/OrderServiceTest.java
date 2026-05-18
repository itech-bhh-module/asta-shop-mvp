package de.webshop.asta.mvp.features.orders.service;

import de.webshop.asta.mvp.features.orders.dto.OrderItemRequestDTO;
import de.webshop.asta.mvp.features.orders.dto.OrderRequestDTO;
import de.webshop.asta.mvp.features.orders.repository.OrderRepository;
import de.webshop.asta.mvp.features.products.entity.Product;
import de.webshop.asta.mvp.features.products.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void shouldThrowExceptionWhenNotEnoughStock() {
        // 1. Vorbereitung (Mock-Daten)
        UUID productId = UUID.randomUUID();
        Product mockProduct = new Product();
        mockProduct.setName("Test Produkt");
        mockProduct.setAmountInStock(5); // Nur 5 auf Lager!

        OrderItemRequestDTO itemDto = new OrderItemRequestDTO();
        itemDto.setProductId(productId);
        itemDto.setQuantity(10); // Wir wollen 10 kaufen!

        OrderRequestDTO requestDto = new OrderRequestDTO();
        requestDto.setItems(List.of(itemDto));

        when(productRepository.findProductByPublicId(productId)).thenReturn(Optional.of(mockProduct));

        // 2. Ausführung & Überprüfung (Erwartet eine Exception!)
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            orderService.createOrder(requestDto);
        });

        assertEquals("Nicht genug auf Lager für Produkt: Test Produkt", exception.getMessage());
        verify(orderRepository, never()).save(any()); // Es darf NICHT gespeichert werden!
    }
}
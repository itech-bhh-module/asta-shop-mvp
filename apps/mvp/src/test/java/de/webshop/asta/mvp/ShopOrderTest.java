package de.webshop.asta.mvp.features.orders.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ShopOrderTest {

    @Test
    @DisplayName("Sollte eine neue Bestellung mit dem Standardstatus PENDING erstellen")
    void shouldCreateOrderWithDefaultStatusPending() {
        ShopOrder order = new ShopOrder();

        assertNotNull(order.getPublicId());
        assertEquals(OrderStatus.PENDING, order.getStatus());
    }

    @Test
    @DisplayName("Sollte den Status der Bestellung erfolgreich auf PAID ändern")
    void shouldUpdateStatusToPaid() {
        ShopOrder order = new ShopOrder();
        
        order.setStatus(OrderStatus.PAID);

        assertEquals(OrderStatus.PAID, order.getStatus());
    }
}
package de.webshop.asta.mvp.features.orders.entity;

import de.webshop.asta.mvp.features.products.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Zu welcher Bestellung gehört diese Position?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_order_id", nullable = false)
    private ShopOrder shopOrder;

    // Welches Produkt wurde gekauft?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // Historische Daten: Falls das Produkt später gelöscht/geändert wird, 
    // behalten wir hier, was der Kunde damals wirklich gekauft hat.
    private String productNameAtPurchase;
    private BigDecimal priceAtPurchase;
    private int quantity;
}
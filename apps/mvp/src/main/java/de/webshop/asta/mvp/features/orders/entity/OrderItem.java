package de.webshop.asta.mvp.features.orders.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long id;

    @Column(nullable = false, unique = true)
    private UUID publicId = UUID.randomUUID();

    @JsonIgnore 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_order_id", nullable = false)
    private ShopOrder shopOrder;

    @Column(nullable = false)
    @JsonIgnore
    private Long productId;

    @Column(nullable = false)
    private UUID productPublicId;

    @Column(nullable = false)
    private String productNameAtPurchase;

    @Column(nullable = false)
    private Integer priceAtPurchase;

    @Column(nullable = false)
    private Integer quantity;
}
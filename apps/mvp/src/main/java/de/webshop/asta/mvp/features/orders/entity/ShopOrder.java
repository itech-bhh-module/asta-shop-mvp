package de.webshop.asta.mvp.features.orders.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "shop_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Wann wurde bestellt? Wichtig für deine spätere Analyse!
    @CreationTimestamp
    private LocalDateTime orderDate;

    // Eine Bestellung kann viele Produkte (Items) enthalten
    @Builder.Default 
    @OneToMany(mappedBy = "shopOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
}
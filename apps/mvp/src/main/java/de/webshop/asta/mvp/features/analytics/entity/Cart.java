package de.webshop.asta.mvp.features.analytics.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Generated;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_id")
    private Long cartId;

    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "amount_selected")
    private int amountSelected;

    @Column
    //muss noch enum werden!
    private int status;
}

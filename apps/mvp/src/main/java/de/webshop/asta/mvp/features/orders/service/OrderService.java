package de.webshop.asta.mvp.features.orders.service;

import de.webshop.asta.mvp.features.orders.dto.OrderRequestDTO;
import de.webshop.asta.mvp.features.orders.entity.OrderItem;
import de.webshop.asta.mvp.features.orders.entity.ShopOrder;
import de.webshop.asta.mvp.features.orders.repository.OrderRepository;
import de.webshop.asta.mvp.features.products.entity.Product;
import de.webshop.asta.mvp.features.products.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository; 

    @Transactional
    public ShopOrder createOrder(OrderRequestDTO orderRequest) {
        ShopOrder order = new ShopOrder();

        List<OrderItem> items = orderRequest.getItems().stream().map(dto -> {
            
            // 1. Produkt suchen
            Product product = productRepository.findProductByPublicId(dto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Produkt nicht gefunden!"));

            // 2. Sicherheits-Check - Haben wir genug auf Lager?
            if (product.getAmountInStock() < dto.getQuantity()) {
                throw new IllegalArgumentException("Nicht genug auf Lager für Produkt: " + product.getName());
            }

            // 3. Lagerbestand abziehen
            product.setAmountInStock(product.getAmountInStock() - dto.getQuantity());
            
            // 4. Produkt sofort speichern
            productRepository.save(product);

            // 5. Bestellposition bauen
            return OrderItem.builder()
                    .shopOrder(order)
                    .product(product)
                    .productNameAtPurchase(product.getName())
                    .priceAtPurchase(BigDecimal.valueOf(product.getPrice())) 
                    .quantity(dto.getQuantity())
                    .build();
        }).toList();

        order.setItems(items);
        
        // 6. Bestellung abspeichern
        return orderRepository.save(order);
    }
}
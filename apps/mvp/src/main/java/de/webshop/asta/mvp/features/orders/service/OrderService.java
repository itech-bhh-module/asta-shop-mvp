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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository; 

    @Transactional
    public ShopOrder createOrder(OrderRequestDTO orderRequest) {
        ShopOrder order = new ShopOrder();
        
        if (orderRequest.getPublicId() != null) {
            order.setPublicId(orderRequest.getPublicId());
        }

        List<OrderItem> items = orderRequest.getItems().stream().map(dto -> {
            
            Product product = productRepository.findProductByPublicId(dto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Produkt nicht gefunden!"));

            if (product.getAmountInStock() < dto.getQuantity()) {
                throw new IllegalArgumentException("Nicht genug auf Lager für Produkt: " + product.getName());
            }

            product.setAmountInStock(product.getAmountInStock() - dto.getQuantity());
            productRepository.save(product);

            OrderItem item = new OrderItem();
            item.setShopOrder(order);
            item.setProductId(product.getProductId());
            item.setProductPublicId(product.getPublicId());
            item.setProductNameAtPurchase(product.getName());
            item.setPriceAtPurchase(product.getPrice());
            item.setQuantity(dto.getQuantity());
            
            return item;
        }).collect(Collectors.toList()); 

        order.setItems(items);

        return orderRepository.save(order);
    }
}
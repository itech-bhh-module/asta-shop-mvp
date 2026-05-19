package de.webshop.asta.mvp.features.orders.controller;

import de.webshop.asta.mvp.features.orders.repository.OrderRepository;
import de.webshop.asta.mvp.features.orders.repository.SalesStatisticsProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin") 
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderRepository orderRepository;

    @GetMapping("/statistics") 
    public ResponseEntity<List<SalesStatisticsProjection>> getStatistics() {
        return ResponseEntity.ok(orderRepository.getSalesStatistics());
    }
}
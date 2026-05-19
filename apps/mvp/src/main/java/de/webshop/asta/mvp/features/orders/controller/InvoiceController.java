package de.webshop.asta.mvp.features.orders.controller;

import de.webshop.asta.mvp.features.orders.dto.AdminInvoiceResponseDTO;
import de.webshop.asta.mvp.features.orders.dto.InvoiceItemResponseDTO;
import de.webshop.asta.mvp.features.orders.dto.UserInvoiceResponseDTO;
import de.webshop.asta.mvp.features.orders.entity.ShopOrder;
import de.webshop.asta.mvp.features.orders.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/invoice")
@RequiredArgsConstructor
public class InvoiceController {

    private final OrderRepository orderRepository;

    @GetMapping("/user/{analyticsId}")
    public ResponseEntity<List<UserInvoiceResponseDTO>> getUserInvoices(@PathVariable UUID analyticsId) {
        List<ShopOrder> orders = orderRepository.findBySessionId(analyticsId);
        
        if (orders.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<UserInvoiceResponseDTO> responseList = orders.stream().map(order -> {
            List<InvoiceItemResponseDTO> itemDTOs = order.getItems().stream().map(item -> 
                new InvoiceItemResponseDTO(
                    item.getPublicId(),
                    item.getProductPublicId(),
                    item.getProductNameAtPurchase(),
                    item.getPriceAtPurchase(),
                    item.getQuantity()
                )
            ).collect(Collectors.toList());

            return new UserInvoiceResponseDTO(
                order.getPublicId(),
                order.getSessionId(),
                order.getOrderDate(),
                order.getStatus().toString(),
                order.getPickupStation().getAddressDetails(),
                itemDTOs
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/admin/{analyticsId}")
    public ResponseEntity<List<AdminInvoiceResponseDTO>> getAdminInvoices(@PathVariable UUID analyticsId) {
        List<ShopOrder> orders = orderRepository.findBySessionId(analyticsId);
        
        if (orders.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<AdminInvoiceResponseDTO> responseList = orders.stream().map(order -> {
            List<InvoiceItemResponseDTO> itemDTOs = order.getItems().stream().map(item -> 
                new InvoiceItemResponseDTO(
                    item.getPublicId(),
                    item.getProductPublicId(),
                    item.getProductNameAtPurchase(),
                    item.getPriceAtPurchase(),
                    item.getQuantity()
                )
            ).collect(Collectors.toList());

            return new AdminInvoiceResponseDTO(
                order.getPublicId(),
                order.getSessionId(),
                order.getOrderDate(),
                order.getStatus().toString(),
                itemDTOs
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }
}
    package de.webshop.asta.mvp.features.orders.controller;

    import jakarta.validation.Valid;
    import de.webshop.asta.mvp.features.orders.dto.OrderRequestDTO;
    import de.webshop.asta.mvp.features.orders.service.OrderService;
    import lombok.RequiredArgsConstructor;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;

    @RestController
    @RequestMapping("/order")
    @RequiredArgsConstructor
    public class OrderController {

        private final OrderService orderService;

        @PostMapping("/createOrder")
        public ResponseEntity<?> createOrder(@Valid @RequestBody OrderRequestDTO orderRequest) {
            orderService.createOrder(orderRequest);
            return ResponseEntity.ok().body("Bestellung erfolgreich angelegt!");
        }
    // Fängt lokale Fehler in diesem Controller ab und macht aus einem 500er einen sauberen 400er!
        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
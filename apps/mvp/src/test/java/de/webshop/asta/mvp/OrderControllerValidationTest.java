package de.webshop.asta.mvp.features.orders.controller;

import de.webshop.asta.mvp.common.ValidationExceptionHandler;
import de.webshop.asta.mvp.features.orders.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean; // Neue Import-Adresse
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@Import(ValidationExceptionHandler.class)
class OrderControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean // Ersetzt @MockBean
    private OrderService orderService;

    @Test
    @WithMockUser
    void createOrder_WhenQuantityIsZero_ThenReturns400() throws Exception {
        String invalidPayload = """
                {
                    "items": [
                        {
                            "productId": "123e4567-e89b-12d3-a456-426614174000",
                            "quantity": 0
                        }
                    ]
                }
                """;

        mockMvc.perform(post("/order/createOrder")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
                .andExpect(status().isBadRequest());
    }
}
package de.webshop.asta.mvp.features.admin.controller;

import de.webshop.asta.mvp.common.ValidationExceptionHandler;
import de.webshop.asta.mvp.features.products.service.ProductDbService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminProductManagementController.class)
@Import(ValidationExceptionHandler.class)
class AdminProductManagementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean // Ersetzt @MockBean
    private ProductDbService productDbService;

    @Test
    @WithMockUser
    void addProduct_WhenInvalidData_ThenReturns400() throws Exception {
        String invalidPayload = """
                {
                    "name": "",
                    "price": -10,
                    "amountInStock": -5
                }
                """;

        mockMvc.perform(post("/admin/addProduct")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.name").exists());
    }

    @Test
    @WithMockUser
    void updateProduct_WhenIdIsNull_ThenReturns400() throws Exception {
        String invalidPayload = """
                {
                    "name": "Test Produkt",
                    "price": 100,
                    "amountInStock": 10
                }
                """;

        mockMvc.perform(put("/admin/updateProduct")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
                .andExpect(status().isBadRequest());
    }
}
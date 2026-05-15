package de.webshop.asta.mvp.features.analytics.controller;

import de.webshop.asta.mvp.features.analytics.dto.SessionDTO;
import de.webshop.asta.mvp.features.analytics.entity.Session;
import de.webshop.asta.mvp.features.analytics.service.SessionDbManagementService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc; // WICHTIGER IMPORT
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@AutoConfigureMockMvc(addFilters = false) // <--- DAS IST DER FIX
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SessionDbManagementService sessionService;

    @Test
    @DisplayName("Sollte im JSON-Response keine interne sessionId ausgeben")
    void shouldNotLeakInternalSessionId() throws Exception {
        UUID id = UUID.randomUUID();
        
        Session internalSession = new Session(500L, id, Instant.now());
        Mockito.when(sessionService.addSessionObject(Mockito.any(SessionDTO.class))).thenReturn(internalSession);

        String requestJson = """
                {
                  "analyticsId": "%s",
                  "loginTimestamp": "2026-05-15T12:00:00Z"
                }
                """.formatted(id.toString());

        mockMvc.perform(post("/analytics/postSession")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.analyticsId").value(id.toString()))
                .andExpect(jsonPath("$.sessionId").doesNotExist());
    }
}
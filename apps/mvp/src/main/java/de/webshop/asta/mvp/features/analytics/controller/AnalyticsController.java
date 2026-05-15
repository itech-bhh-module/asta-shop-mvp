package de.webshop.asta.mvp.features.analytics.controller;

import de.webshop.asta.mvp.features.analytics.dto.SessionDTO;
import de.webshop.asta.mvp.features.analytics.dto.SessionResponseDTO;
import de.webshop.asta.mvp.features.analytics.entity.Session;
import de.webshop.asta.mvp.features.analytics.service.SessionDbManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/analytics")
public class AnalyticsController {
    
    private final SessionDbManagementService analyticsDbManagementService;
    
    @PostMapping("/postSession")
    public ResponseEntity<SessionResponseDTO> postSession(@RequestBody SessionDTO sessionDTO) {
        Session savedSession = analyticsDbManagementService.addSessionObject(sessionDTO);
        
        SessionResponseDTO response = new SessionResponseDTO(
                savedSession.getAnalyticsId(),
                savedSession.getLoginTimestamp()
        );
        
        return ResponseEntity.ok(response);
    }
}
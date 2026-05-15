package de.webshop.asta.mvp.features.analytics.service;

import de.webshop.asta.mvp.features.analytics.dto.SessionDTO;
import de.webshop.asta.mvp.features.analytics.entity.Session;
import de.webshop.asta.mvp.features.analytics.repository.AnalyticsRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionDbManagementServiceTest {

    @Mock
    private AnalyticsRepository analyticsRepository;

    @Mock
    private AnalyticsMapper mapper;

    @InjectMocks
    private SessionDbManagementService service;

    @Test
    @DisplayName("Sollte eine neue Session erstellen, wenn die AnalyticsId noch nicht existiert")
    void shouldCreateNewSession() {
        UUID newId = UUID.randomUUID();
        SessionDTO dto = new SessionDTO(newId, Instant.now());
        Session newSession = new Session(1L, newId, dto.getLoginTimestamp());

        // Mocking: DB findet nichts, Mapper wandelt um, DB speichert
        when(analyticsRepository.findFirstSessionByAnalyticsId(newId)).thenReturn(Optional.empty());
        when(mapper.toSession(dto)).thenReturn(newSession);
        when(analyticsRepository.save(newSession)).thenReturn(newSession);

        Session result = service.addSessionObject(dto);

        assertEquals(newId, result.getAnalyticsId());
        verify(analyticsRepository, times(1)).save(any(Session.class)); // DoD: Erstellung geprüft
    }

    @Test
    @DisplayName("Sollte bestehende Session zurückgeben, wenn AnalyticsId schon existiert (Wiederverwendung)")
    void shouldReuseExistingSession() {
        UUID existingId = UUID.randomUUID();
        SessionDTO dto = new SessionDTO(existingId, Instant.now());
        Session existingSession = new Session(99L, existingId, dto.getLoginTimestamp());

        when(analyticsRepository.findFirstSessionByAnalyticsId(existingId)).thenReturn(Optional.of(existingSession));

        Session result = service.addSessionObject(dto);

        assertEquals(99L, result.getSessionId()); 
        verify(analyticsRepository, never()).save(any(Session.class)); // DoD: Keine neue DB-Speicherung!
    }
}
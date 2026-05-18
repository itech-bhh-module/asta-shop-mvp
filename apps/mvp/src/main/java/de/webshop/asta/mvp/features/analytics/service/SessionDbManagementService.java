package de.webshop.asta.mvp.features.analytics.service;

import de.webshop.asta.mvp.features.analytics.dto.SessionDTO;
import de.webshop.asta.mvp.features.analytics.dto.SessionResponseDTO;
import de.webshop.asta.mvp.features.analytics.entity.Session;
import de.webshop.asta.mvp.features.analytics.repository.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionDbManagementService {

    private final AnalyticsRepository analyticsRepository;
    private final AnalyticsMapper mapper;

    public SessionResponseDTO addSessionObject(SessionDTO sessionDTO) {
        Optional<Session> existingSession = analyticsRepository.findFirstSessionByAnalyticsId(sessionDTO.getAnalyticsId());

        if (existingSession.isPresent()) {
            Session oldSession = existingSession.get();
            return new SessionResponseDTO(oldSession.getAnalyticsId(), oldSession.getLoginTimestamp());
        }

        Session savedSession = analyticsRepository.save(mapper.toSession(sessionDTO));
        return new SessionResponseDTO(savedSession.getAnalyticsId(), savedSession.getLoginTimestamp());
    }

    public Optional<SessionDTO> getSessionBySessionId(Long id) {
        return analyticsRepository.findSessionBySessionId(id).map(mapper::toDto);
    }

    public Optional<Long> getSessionIdByAnalyticsId(UUID analyticsId) {
        return analyticsRepository.findSessionIdByAnalyticsId(analyticsId);
    }
}
package de.webshop.asta.mvp.features.analytics.service;

import de.webshop.asta.mvp.features.analytics.dto.SessionDTO;
import de.webshop.asta.mvp.features.analytics.entity.Session;
import de.webshop.asta.mvp.features.analytics.repository.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SessionDbManagementService {
    private final AnalyticsRepository analyticsRepository;
    private final AnalyticsMapper mapper;

    public Session addSessionObject(SessionDTO sessionDTO){
        //sollte nicht session nach aussen exposen, nur fuer dev aktuell
        return analyticsRepository.save(mapper.toSession(sessionDTO));
    }
}

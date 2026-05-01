package de.webshop.asta.mvp.features.analytics.service;

import de.webshop.asta.mvp.features.analytics.dto.SessionDTO;
import de.webshop.asta.mvp.features.analytics.entity.Session;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsMapper {
    public SessionDTO toDto(Session session){
        return new SessionDTO(
                session.getAnalyticsId(),
                session.getLoginTimestamp()
        );
    }

    public Session toSession(SessionDTO dto){
        Session session = new Session();
        session.setAnalyticsId(dto.getAnalyticsId());
        session.setLoginTimestamp(dto.getLoginTimestamp());
        return session;
    }
}

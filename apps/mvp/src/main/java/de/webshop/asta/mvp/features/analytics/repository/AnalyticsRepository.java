package de.webshop.asta.mvp.features.analytics.repository;

import de.webshop.asta.mvp.features.analytics.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface AnalyticsRepository extends JpaRepository<Session,Long> {
    Optional<Session> findSessionBySessionId(Long id);

    @Query("select s.sessionId from Session s where s.analyticsId = :analyticsId")
    Optional<Long> findSessionIdByAnalyticsId(@Param("analyticsId")UUID analyticsId);
}

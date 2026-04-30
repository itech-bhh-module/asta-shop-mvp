package de.webshop.asta.mvp.features.analytics.repository;

import de.webshop.asta.mvp.features.analytics.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalyticsRepository extends JpaRepository<Session,Long> {
}

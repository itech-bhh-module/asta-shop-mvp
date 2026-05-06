package de.webshop.asta.mvp.features.orders.repository;

import de.webshop.asta.mvp.features.orders.entity.ShopOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<ShopOrder, UUID> {
    // Spring Boot generiert hier automatisch alle Standard-Methoden wie save(), findAll(), etc.
}
package de.webshop.asta.mvp.features.orders.repository;

import de.webshop.asta.mvp.features.orders.entity.ShopOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<ShopOrder, Long> {
    
    List<ShopOrder> findBySessionId(UUID sessionId);
    
    Optional<ShopOrder> findByPublicId(UUID publicId);

    @Query("SELECT i.productNameAtPurchase AS produkt, " +
           "SUM(i.quantity) AS verkaufteAnzahl, " +
           "SUM(i.quantity * i.priceAtPurchase) AS gesamtumsatz " +
           "FROM OrderItem i " +
           "GROUP BY i.productNameAtPurchase")
    List<SalesStatisticsProjection> getSalesStatistics();
}
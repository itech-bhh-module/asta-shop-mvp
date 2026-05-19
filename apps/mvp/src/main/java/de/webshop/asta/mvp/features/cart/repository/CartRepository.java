package de.webshop.asta.mvp.features.cart.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import de.webshop.asta.mvp.features.cart.entity.Cart;

public interface CartRepository extends JpaRepository<Cart,Long> {
    @Query("""
            select c from Cart c inner join Session s on c.sessionId = s.sessionId
            where s.analyticsId = :analyticsId
            """)
    List<Cart> findCartByAnalyticsId(@Param("analyticsId") UUID analyticsId);
    Optional<Cart> findBySessionIdAndProductId(Long sessionId, Long productId);


    @Transactional
    @Modifying
    @Query(value = """
        delete from cart c using product p, session s
        where c.product_id = p.product_id
        and c.session_id = s.session_id
        and s.analytics_id = :analyticsId
        and p.public_id = :publicId
        """,nativeQuery = true)
    //should return only one element ever, needs to be refactored in prod
    void deleteCartEntryByAnalyticsIdAndPublicId(@Param("analyticsId")UUID analyticsId, @Param("publicId") UUID publicId);
}

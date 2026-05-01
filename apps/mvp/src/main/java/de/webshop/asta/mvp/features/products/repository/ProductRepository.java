package de.webshop.asta.mvp.features.products.repository;

import de.webshop.asta.mvp.features.products.dto.ProductDTO;
import de.webshop.asta.mvp.features.products.entity.Product;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    Optional<Product> findProductByPublicId(UUID id);
    void deleteProductByPublicId(UUID id);

    Optional<Product> findProductByProductId(Long id);

    @Query("select p.productId from product p where p.publicId = :publicId")
    Optional<Long> findProductIdByPublicId(@Param("publicId") UUID publicId);
}


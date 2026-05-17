package de.webshop.asta.mvp.features.products.service;

import de.webshop.asta.mvp.features.products.dto.ProductDTO;
import de.webshop.asta.mvp.features.products.entity.Product;
import de.webshop.asta.mvp.common.ProductStatus;
import org.springframework.stereotype.Service;

@Service
public class MapperService {

    public ProductDTO toDto(Product p){
        return new ProductDTO(
                p.getPublicId(),
                p.getName(),
                p.getDescription(),
                p.getImagePath(),
                p.getPrice(),
                p.getAmountInStock(),
                p.getTag(),
                p.getStatus()
        );
    }
    public Product toProduct(ProductDTO dto){
        Product product = new Product();
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setAmountInStock(dto.getAmountInStock());
        product.setImagePath(dto.getImagePath());
        product.setTag(dto.getTag());
        product.setStatus(dto.getStatus() == null ? ProductStatus.ACTIVE : dto.getStatus());

        return product;
    }
}

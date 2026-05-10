package de.webshop.asta.mvp.features.products.service;

import de.webshop.asta.mvp.features.products.dto.ProductDTO;
import de.webshop.asta.mvp.features.products.entity.Product;
import de.webshop.asta.mvp.features.products.repository.ProductRepository;
import de.webshop.asta.mvp.common.ProductStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductDbService {
    private final ProductRepository productRepository;
    private final MapperService mapper; 

    public ProductDTO getProductByPublicId(UUID id){
        return productRepository.findProductByPublicId(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produkt mit dieser ID nicht gefunden."));
    }

    public Optional<ProductDTO> getProductByProductId(Long id){
        return productRepository.findProductByProductId(id).map(mapper::toDto);
    }

    public List<ProductDTO> getAllProducts(){
        return productRepository.findAll().stream()
                .filter(product -> product.getStatus() == ProductStatus.ACTIVE)
                .map(mapper::toDto)
                .toList();
    }

    public ProductDTO updateProductByPublicId(ProductDTO updatedProduct){
        Product current = productRepository.findProductByPublicId(updatedProduct.getPublicId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produkt für Update nicht gefunden."));
        
        current.setName(updatedProduct.getName());
        current.setDescription(updatedProduct.getDescription());
        current.setPrice(updatedProduct.getPrice());
        current.setAmountInStock(updatedProduct.getAmountInStock());
        current.setImagePath(updatedProduct.getImagePath());
        current.setTag(updatedProduct.getTag());

        productRepository.save(current);

        return mapper.toDto(current);
    }

    public ProductDTO setProductInactiveByPublicId(UUID publicId){
        Product product = productRepository.findProductByPublicId(publicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produkt nicht gefunden."));
        
        product.setStatus(ProductStatus.INACTIVE);
        productRepository.save(product);
        return mapper.toDto(product);
    }

    public Product addProduct(ProductDTO dto){
        Product product = mapper.toProduct(dto);
        product.setStatus(ProductStatus.ACTIVE); 
        return productRepository.save(product);
    }

    public Optional<Long> getProductIdByPublicId(UUID publicId){
        return productRepository.findProductIdByPublicId(publicId);
    }
}
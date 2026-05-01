package de.webshop.asta.mvp.features.products.service;

import de.webshop.asta.mvp.features.products.dto.ProductDTO;
import de.webshop.asta.mvp.features.products.entity.Product;
import de.webshop.asta.mvp.features.products.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductDbService {
    private final ProductRepository productRepository;
    private final MapperService mapper;
    public Optional<ProductDTO> getProductByPublicId(UUID id){
        return productRepository.findProductByPublicId(id).map(mapper::toDto);
    }
    public Optional<ProductDTO> getProductByProductId(Long id){
        return productRepository.findProductByProductId(id).map(mapper::toDto);
    }
    public List<ProductDTO> getProducts(){
        return productRepository.findAll().stream().map(mapper::toDto).toList();
    }

    public ProductDTO updateProductByPublicId(ProductDTO updatedProduct){
        Product current = productRepository.findProductByPublicId(updatedProduct.getPublicId()).orElseThrow(()-> new RuntimeException("Product was not found with public id: " + updatedProduct.getPublicId()));
        //mapper benutzen
        current.setName(updatedProduct.getName());
        current.setDescription(updatedProduct.getDescription());
        current.setPrice(updatedProduct.getPrice());
        current.setAmountInStock(updatedProduct.getAmountInStock());
        current.setImagePath(updatedProduct.getImagePath());
        current.setTag(updatedProduct.getTag());

        productRepository.save(current);

        return mapper.toDto(current);
    }

    public void deleteProductByPublicId(UUID id){
        productRepository.deleteProductByPublicId(id);
    }

    public Product addProduct(ProductDTO dto){
        //eigentlich wollen wir nicht das gesamte product returnen, nur in dev
        return productRepository.save(mapper.toProduct(dto));
    }

    public Optional<Long> getProductIdByPublicId(UUID publicId){
        return productRepository.findProductIdByPublicId(publicId);
    }
}

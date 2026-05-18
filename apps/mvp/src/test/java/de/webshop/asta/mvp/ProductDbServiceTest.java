package de.webshop.asta.mvp.features.products.service;

import de.webshop.asta.mvp.features.products.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductDbServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private MapperService mapper;

    @InjectMocks
    private ProductDbService productDbService;

    @Test
    void getProductByPublicId_WhenProductMissing_ThenThrows404() {
        UUID missingId = UUID.randomUUID();
        when(productRepository.findProductByPublicId(missingId)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            productDbService.getProductByPublicId(missingId);
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Produkt mit dieser ID nicht gefunden.", exception.getReason());
    }
}
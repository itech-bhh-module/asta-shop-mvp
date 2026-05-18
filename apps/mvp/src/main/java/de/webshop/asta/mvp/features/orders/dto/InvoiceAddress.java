package de.webshop.asta.mvp.features.orders.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceAddress {
    private String companyName;
    private String street;
    private String zipCode;
    private String city;
}
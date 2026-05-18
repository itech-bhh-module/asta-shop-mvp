package de.webshop.asta.mvp.features.orders.entity;

import de.webshop.asta.mvp.features.orders.dto.InvoiceAddress;
import lombok.Getter;

@Getter
public enum PickupStation {
    
    CAMPUS_BERLINER_TOR(new InvoiceAddress(
        "AStA BHH - Berliner Tor", 
        "Anckelmannstraße 10", 
        "20537", 
        "Hamburg"
    )),

    CAMPUS_ZEUGHAUSMARKT(new InvoiceAddress(
        "AStA BHH - Zeughausmarkt", 
        "Zeughausmarkt 32", 
        "20459", 
        "Hamburg"
    )),

    CAMPUS_ITECH(new InvoiceAddress(
        "AStA BHH - Itech", 
        "Dratelnstraße 26", 
        "21109", 
        "Hamburg"
    ));

    private final InvoiceAddress addressDetails;

    PickupStation(InvoiceAddress addressDetails) {
        this.addressDetails = addressDetails;
    }
}
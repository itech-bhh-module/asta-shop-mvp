package de.webshop.asta.mvp.features.orders.repository;

public interface SalesStatisticsProjection {
    String getProdukt();
    Long getVerkaufteAnzahl();
    Double getGesamtumsatz();
}
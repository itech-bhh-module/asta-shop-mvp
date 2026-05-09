package de.webshop.asta.mvp.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // Aktiviert CORS mit der unten definierten Konfiguration
                .cors(Customizer.withDefaults())
                // CSRF deaktivieren (notwendig für APIs in der Dev-Phase)
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // Explizite Freigabe für Health-Checks und Actuator
                        .requestMatchers("/health/**", "/actuator/**").permitAll()
                        // Alles andere ebenfalls offen (Dev-Modus)
                        .anyRequest().permitAll()
                )
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Erlaubt sowohl den klassischen Port 3000 als auch den neuen Vite-Port 5173
        config.setAllowedOrigins(List.of(
            "http://localhost:3000", 
            "http://localhost:5173"
        ));
        
        // Erlaubt alle gängigen HTTP-Methoden
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // Erlaubt alle Header (wichtig für Authorization-Tokens oder Custom Headers)
        config.setAllowedHeaders(List.of("*"));
        
        // Erlaubt das Senden von Cookies oder Auth-Headern
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Wendet diese Regeln auf alle Pfade (/api/...) an
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
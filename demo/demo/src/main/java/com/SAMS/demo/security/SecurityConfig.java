package com.SAMS.demo.security;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  /* ==================================================
     PASSWORD ENCODER
     ================================================== */

  @Bean
  public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  /* ==================================================
     CORS CONFIGURATION

     Reads allowed frontend URLs from:

     app.frontend.urls=${FRONTEND_URLS:http://localhost:5173}
     ================================================== */

  @Bean
  public CorsConfigurationSource corsConfigurationSource(
      @Value("${app.frontend.urls}") String frontendUrls
  ) {
    List<String> allowedOrigins = Arrays.stream(
            frontendUrls.split(",")
        )
        .map(String::trim)
        .filter(origin -> !origin.isBlank())
        .toList();

    CorsConfiguration configuration =
        new CorsConfiguration();

    /*
     * Example allowed origins:
     *
     * http://localhost:5173
     * https://your-project.vercel.app
     */
    configuration.setAllowedOrigins(allowedOrigins);

    configuration.setAllowedMethods(List.of(
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ));

    configuration.setAllowedHeaders(List.of(
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Cache-Control",
        "Pragma"
    ));

    /*
     * Keep this true if your authentication/refresh
     * implementation uses cookies or credentials.
     *
     * Specific origins must be used; do not use "*".
     */
    configuration.setAllowCredentials(true);

    /*
     * Cache the browser preflight result for one hour.
     */
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source =
        new UrlBasedCorsConfigurationSource();

    source.registerCorsConfiguration(
        "/**",
        configuration
    );

    return source;
  }

  /* ==================================================
     SPRING SECURITY
     ================================================== */

  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http,
      JwtAuthFilter jwtAuthFilter
  ) throws Exception {

    /*
     * This configuration assumes authentication uses
     * JWT Bearer tokens and the backend is stateless.
     */
    http.csrf(AbstractHttpConfigurer::disable);

    /*
     * Uses the CorsConfigurationSource bean above.
     */
    http.cors(Customizer.withDefaults());

    http.sessionManagement(session ->
        session.sessionCreationPolicy(
            SessionCreationPolicy.STATELESS
        )
    );

    http.authorizeHttpRequests(auth -> auth

        /*
         * Allow browser CORS preflight requests.
         */
        .requestMatchers(
            HttpMethod.OPTIONS,
            "/**"
        ).permitAll()

        /*
         * Render health check.
         */
        .requestMatchers(
            "/actuator/health"
        ).permitAll()

        /*
         * Login, registration, refresh-token and other
         * public authentication endpoints.
         */
        .requestMatchers(
            "/api/auth/**"
        ).permitAll()

        /*
         * Keep this only if your application uses /ws.
         * Authentication/authorization should be handled
         * during the WebSocket connection or messages.
         */
        .requestMatchers(
            "/ws/**"
        ).permitAll()

        /*
         * Role-specific API sections.
         *
         * hasRole("ADMIN") checks for ROLE_ADMIN.
         */
        .requestMatchers(
            "/api/admin/**"
        ).hasRole("ADMIN")

        .requestMatchers(
            "/api/student/**"
        ).hasRole("STUDENT")

        .requestMatchers(
            "/api/teacher/**"
        ).hasRole("TEACHER")

        .requestMatchers(
            "/api/parent/**"
        ).hasRole("PARENT")

        /*
         * PaymentController performs its own owner/role
         * validation, so all payment endpoints require
         * at least an authenticated user.
         */
        .requestMatchers(
            "/api/payment/**"
        ).authenticated()

        /*
         * Everything else also requires authentication.
         */
        .anyRequest().authenticated()
    );

    /*
     * Validate JWT before Spring's username/password filter.
     */
    http.addFilterBefore(
        jwtAuthFilter,
        UsernamePasswordAuthenticationFilter.class
    );

    return http.build();
  }
}
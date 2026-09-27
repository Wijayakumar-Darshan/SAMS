package com.SAMS.demo.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

  @Bean
  public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {

    http.csrf(csrf -> csrf.disable());
    http.cors(Customizer.withDefaults());
    http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/h2/**").permitAll()
        .requestMatchers("/ws/**").permitAll()

        .requestMatchers("/api/auth/**").permitAll()

        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .requestMatchers("/api/student/**").hasRole("STUDENT")
        .requestMatchers("/api/teacher/**").hasRole("TEACHER")
        .requestMatchers("/api/parent/**").hasRole("PARENT")

        .requestMatchers(HttpMethod.GET, "/api/payment/**").authenticated()
        .requestMatchers(HttpMethod.POST, "/api/payment/**").authenticated()

        .anyRequest().authenticated()
    );

    http.headers(h -> h.frameOptions(f -> f.disable())); // H2 console
    http.addFilterBefore(jwtAuthFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }
}
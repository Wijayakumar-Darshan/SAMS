package com.SAMS.demo.controller;

import java.util.LinkedHashMap;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
  @GetMapping("/me")
  public Map<String,Object> me(Authentication auth){
    Map<String,Object> out = new LinkedHashMap<>();
    if (auth == null || auth.getPrincipal() == null) {
      out.put("authenticated", false);
      return out;
    }
    out.put("authenticated", true);
    out.put("principal", auth.getPrincipal().toString());
    out.put("authorities", auth.getAuthorities().toString());
    return out;
  }
}
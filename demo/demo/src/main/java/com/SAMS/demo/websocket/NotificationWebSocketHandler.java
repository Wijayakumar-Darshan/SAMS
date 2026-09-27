package com.SAMS.demo.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.SAMS.demo.security.AuthUser;
import com.SAMS.demo.security.JwtService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

  private final JwtService jwtService;
  private final ObjectMapper om = new ObjectMapper();

  // key: role:userId
  private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

  public NotificationWebSocketHandler(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    String token = extractToken(session.getUri());
    AuthUser user = jwtService.toAuthUser(token);

    String key = key(user.role().name(), user.userId());
    sessions.put(key, session);

    session.sendMessage(new TextMessage(om.writeValueAsString(Map.of(
        "type", "CONNECTED",
        "message", "WebSocket connected"
    ))));
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    sessions.entrySet().removeIf(e -> e.getValue().getId().equals(session.getId()));
  }

  public void push(String role, Long userId, Map<String, Object> payload) {
    String k = key(role, userId);
    WebSocketSession s = sessions.get(k);
    if (s == null || !s.isOpen()) return;

    try {
      s.sendMessage(new TextMessage(om.writeValueAsString(payload)));
    } catch (Exception ignored) { }
  }

  private String key(String role, Long userId) {
    return role + ":" + userId;
  }

  private String extractToken(URI uri) {
    if (uri == null || uri.getQuery() == null) throw new IllegalArgumentException("Missing token");
    for (String part : uri.getQuery().split("&")) {
      String[] kv = part.split("=");
      if (kv.length == 2 && kv[0].equals("token")) return kv[1];
    }
    throw new IllegalArgumentException("Missing token");
  }
}
# Calatayud Gastronómico — esqueleto funcional

Plataforma reutilizable para Ruta de la Tortilla, Croqueta, Torrija, Tapeando, Cañas y futuras campañas.

Reglas: cliente con nombre+móvil; QR permanente por campaña; el cliente muestra el QR; el establecimiento valida; primera visita a un establecimiento +2 participaciones; cada repetición +1; sin geolocalización; Facebook fuera del sorteo.

## Arranque
1. Ejecutar `database/schema.sql` y `database/seed.sql` en MySQL 8.
2. `cd backend && npm install && copy .env.example .env && npm run dev`.
3. `cd frontend && npm install && copy .env.example .env && npm run dev`.
4. Web: http://localhost:5173 — API: http://localhost:3000.

Es un esqueleto de desarrollo; antes de producción habrá que endurecer autenticación, HTTPS, rate limiting, consentimiento legal y WhatsApp.

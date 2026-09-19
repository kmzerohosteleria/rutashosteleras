USE calatayud_gastronomico;
INSERT INTO campaigns(name,slug,campaign_type,edition_number,description,start_date,end_date,first_visit_points,repeat_visit_points) VALUES('IV Ruta de la Tortilla de Calatayud','iv-ruta-tortilla-2026','TORTILLA',4,'Campaña de prueba','2026-10-01','2026-10-31',2,1);
INSERT INTO establishments(name,address) VALUES('Mamá Dolores','Calatayud'),('Tizón','Calatayud'),('Bar Capricho','Calatayud'),('Mesón de la Dolores','Calatayud');
INSERT INTO campaign_establishments(campaign_id,establishment_id,display_order) SELECT 1,id,id FROM establishments;
INSERT INTO users(name,phone,phone_normalized,phone_verified) VALUES('Cliente de prueba','600000000','600000000',TRUE);
INSERT INTO prizes(campaign_id,name,description,quantity) VALUES(1,'Jamón','Premio de prueba',3);
INSERT INTO draws(campaign_id,name) VALUES(1,'Sorteo de prueba');

-- Administrador de demostración: admin@calatayud.local / password
INSERT INTO admin_users (name, email, password_hash) VALUES ('Administrador', 'admin@calatayud.local', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro6H1x7vN9cFQw6k3YJ8XyWm');

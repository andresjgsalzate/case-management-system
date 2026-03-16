-- ============================================
-- MIGRACIÓN: Bitácora de autorizaciones Base de Conocimiento
-- Fecha: 2026-03-16
-- Descripción:
--   1) Crear tabla de eventos de revisión/publicación por documento
--   2) Crear índices para historial y conteos rápidos
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS knowledge_document_review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL,
  actor_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  from_status VARCHAR(30),
  to_status VARCHAR(30),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_review_events_document_created
  ON knowledge_document_review_events(document_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_review_events_event_type
  ON knowledge_document_review_events(event_type);

CREATE INDEX IF NOT EXISTS idx_knowledge_review_events_actor
  ON knowledge_document_review_events(actor_user_id);

COMMIT;

--
-- PostgreSQL database dump
--

\restrict IXftKZegqtPOj3TEFFAMpQiyxtr6g6ogva5qwESdO3StNsAfH7EnkOZCfdS13VX

-- Dumped from database version 16.11 (Ubuntu 16.11-1.pgdg24.04+1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: archived_cases_classification_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.archived_cases_classification_enum AS ENUM (
    'INCIDENT',
    'REQUEST',
    'CHANGE',
    'PROBLEM'
);


ALTER TYPE public.archived_cases_classification_enum OWNER TO postgres;

--
-- Name: archived_cases_priority_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.archived_cases_priority_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public.archived_cases_priority_enum OWNER TO postgres;

--
-- Name: archived_cases_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.archived_cases_status_enum AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'PENDING',
    'RESOLVED',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE public.archived_cases_status_enum OWNER TO postgres;

--
-- Name: audit_entity_changes_change_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_entity_changes_change_type_enum AS ENUM (
    'ADDED',
    'MODIFIED',
    'REMOVED'
);


ALTER TYPE public.audit_entity_changes_change_type_enum OWNER TO postgres;

--
-- Name: audit_logs_action_enum; Type: TYPE; Schema: public; Owner: cms_admin
--

CREATE TYPE public.audit_logs_action_enum AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'RESTORE',
    'ARCHIVE',
    'READ',
    'DOWNLOAD',
    'VIEW',
    'EXPORT',
    'LOGIN',
    'LOGOUT',
    'LOGOUT_ALL',
    'FORCE_LOGOUT'
);


ALTER TYPE public.audit_logs_action_enum OWNER TO cms_admin;

--
-- Name: cases_clasificacion_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cases_clasificacion_enum AS ENUM (
    'Baja Complejidad',
    'Media Complejidad',
    'Alta Complejidad'
);


ALTER TYPE public.cases_clasificacion_enum OWNER TO postgres;

--
-- Name: cases_estado_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cases_estado_enum AS ENUM (
    'nuevo',
    'asignado',
    'en_progreso',
    'pendiente',
    'resuelto',
    'cerrado',
    'cancelado',
    'restaurado'
);


ALTER TYPE public.cases_estado_enum OWNER TO postgres;

--
-- Name: knowledge_document_tags_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.knowledge_document_tags_category_enum AS ENUM (
    'priority',
    'technical',
    'type',
    'technology',
    'module',
    'custom'
);


ALTER TYPE public.knowledge_document_tags_category_enum OWNER TO postgres;

--
-- Name: knowledge_tags_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.knowledge_tags_category_enum AS ENUM (
    'priority',
    'technical',
    'type',
    'technology',
    'module',
    'custom'
);


ALTER TYPE public.knowledge_tags_category_enum OWNER TO postgres;

--
-- Name: calculate_todo_time_duration(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_todo_time_duration() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.calculate_todo_time_duration() OWNER TO postgres;

--
-- Name: clean_old_audit_logs(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.clean_old_audit_logs(days_to_keep integer DEFAULT 365) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.clean_old_audit_logs(days_to_keep integer) OWNER TO postgres;

--
-- Name: cleanup_expired_sessions(); Type: FUNCTION; Schema: public; Owner: cms_admin
--

CREATE FUNCTION public.cleanup_expired_sessions() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE user_sessions 
    SET is_active = false, 
        logout_reason = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = true 
    AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_sessions() OWNER TO cms_admin;

--
-- Name: FUNCTION cleanup_expired_sessions(); Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON FUNCTION public.cleanup_expired_sessions() IS 'Limpia sesiones expiradas marcándolas como inactivas';


--
-- Name: complete_todo(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.complete_todo(todo_id_param uuid, user_id_param uuid, control_id_param uuid DEFAULT NULL::uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    todo_exists BOOLEAN := false;
    result JSON;
BEGIN
    -- Verificar que el TODO existe
    SELECT EXISTS (SELECT 1 FROM todos WHERE id = todo_id_param) INTO todo_exists;
    
    IF NOT todo_exists THEN
        RAISE EXCEPTION 'TODO no encontrado';
    END IF;
    
    -- Marcar el TODO como completado
    UPDATE todos SET
        is_completed = true,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = todo_id_param;
    
    -- Actualizar control si se proporciona
    IF control_id_param IS NOT NULL THEN
        UPDATE todo_control SET
            completed_at = NOW(),
            is_timer_active = false,
            timer_start_at = NULL,
            updated_at = NOW()
        WHERE id = control_id_param AND todo_id = todo_id_param;
    END IF;
    
    result := json_build_object(
        'success', true,
        'message', 'TODO completado exitosamente',
        'todo_id', todo_id_param,
        'completed_at', NOW()
    );
    
    RETURN result;
END;
$$;


ALTER FUNCTION public.complete_todo(todo_id_param uuid, user_id_param uuid, control_id_param uuid) OWNER TO postgres;

--
-- Name: create_document_version(uuid, jsonb, character varying, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_document_version(p_note_id uuid, p_content jsonb, p_title character varying, p_change_summary text, p_user_id uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_version_number INTEGER;
    v_version_id UUID;
BEGIN
    -- Obtener siguiente número de versión
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM document_versions
    WHERE note_id = p_note_id;

    -- Crear nueva versión
    INSERT INTO document_versions (
        note_id, version_number, content, title,
        change_summary, created_by
    ) VALUES (
        p_note_id, v_version_number, p_content, p_title,
        p_change_summary, p_user_id
    ) RETURNING id INTO v_version_id;

    -- Actualizar tabla principal con último contenido
    UPDATE notes
    SET
        json_content = p_content,
        title = p_title,
        last_edited_by = p_user_id,
        version = v_version_number,
        updated_at = NOW()
    WHERE id = p_note_id;

    RETURN v_version_id;
END;
$$;


ALTER FUNCTION public.create_document_version(p_note_id uuid, p_content jsonb, p_title character varying, p_change_summary text, p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION create_document_version(p_note_id uuid, p_content jsonb, p_title character varying, p_change_summary text, p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.create_document_version(p_note_id uuid, p_content jsonb, p_title character varying, p_change_summary text, p_user_id uuid) IS 'Crea una nueva versión de documento y actualiza la tabla principal';


--
-- Name: get_archive_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_archive_stats(p_user_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    total_archived_cases INTEGER;
    total_archived_todos INTEGER;
    total_archived_time_minutes INTEGER;
    archived_this_month INTEGER;
    restored_this_month INTEGER;
    result JSON;
BEGIN
    -- Contar casos archivados (solo los que puede ver el usuario)
    SELECT COUNT(*) INTO total_archived_cases
    FROM archived_cases ac
    WHERE ac.user_id = p_user_id 
       OR ac.assigned_user_id = p_user_id 
       OR ac.archived_by = p_user_id
       OR ac.created_by_user_id = p_user_id;
    
    -- Contar TODOs archivados (solo los que puede ver el usuario)
    SELECT COUNT(*) INTO total_archived_todos
    FROM archived_todos at_
    WHERE at_.archived_by = p_user_id;
    
    -- Tiempo total acumulado de casos archivados
    SELECT COALESCE(SUM(ac.total_time_minutes), 0) INTO total_archived_time_minutes
    FROM archived_cases ac
    WHERE ac.user_id = p_user_id 
       OR ac.assigned_user_id = p_user_id 
       OR ac.archived_by = p_user_id
       OR ac.created_by_user_id = p_user_id;
    
    -- Sumar tiempo total de TODOs archivados
    SELECT total_archived_time_minutes + COALESCE(SUM(at_.total_time_minutes), 0) 
    INTO total_archived_time_minutes
    FROM archived_todos at_
    WHERE at_.archived_by = p_user_id;
    
    -- Archivados este mes - casos
    SELECT COUNT(*) INTO archived_this_month
    FROM archived_cases ac
    WHERE (ac.user_id = p_user_id OR ac.assigned_user_id = p_user_id OR ac.archived_by = p_user_id OR ac.created_by_user_id = p_user_id)
      AND ac.archived_at >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Sumar archivados este mes - TODOs  
    SELECT archived_this_month + COUNT(*) INTO archived_this_month
    FROM archived_todos at_
    WHERE at_.archived_by = p_user_id
      AND at_.archived_at >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Restaurados este mes - casos
    SELECT COUNT(*) INTO restored_this_month
    FROM archived_cases ac
    WHERE (ac.user_id = p_user_id OR ac.assigned_user_id = p_user_id OR ac.archived_by = p_user_id OR ac.created_by_user_id = p_user_id)
      AND ac.restored_at >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Sumar restaurados este mes - TODOs
    SELECT restored_this_month + COUNT(*) INTO restored_this_month
    FROM archived_todos at_
    WHERE at_.archived_by = p_user_id
      AND at_.restored_at >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Construir respuesta JSON
    SELECT json_build_object(
        'totalArchivedCases', COALESCE(total_archived_cases, 0),
        'totalArchivedTodos', COALESCE(total_archived_todos, 0),
        'totalArchivedTimeMinutes', COALESCE(total_archived_time_minutes, 0),
        'archivedThisMonth', COALESCE(archived_this_month, 0),
        'restoredThisMonth', COALESCE(restored_this_month, 0)
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION public.get_archive_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_archive_stats(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_archive_stats(p_user_id uuid) IS 'Obtiene estadísticas del archivo para un usuario específico';


--
-- Name: get_audit_statistics(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_audit_statistics(from_date timestamp with time zone DEFAULT (now() - '30 days'::interval)) RETURNS TABLE(total_actions bigint, create_actions bigint, update_actions bigint, delete_actions bigint, unique_users bigint, unique_entities bigint, most_active_user text, most_modified_entity_type text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_actions,
        COUNT(*) FILTER (WHERE action = 'CREATE') as create_actions,
        COUNT(*) FILTER (WHERE action = 'UPDATE') as update_actions,
        COUNT(*) FILTER (WHERE action = 'DELETE') as delete_actions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT entity_id) as unique_entities,
        (SELECT user_email FROM audit_logs WHERE created_at >= from_date GROUP BY user_email ORDER BY COUNT(*) DESC LIMIT 1) as most_active_user,
        (SELECT entity_type FROM audit_logs WHERE created_at >= from_date GROUP BY entity_type ORDER BY COUNT(*) DESC LIMIT 1) as most_modified_entity_type
    FROM audit_logs 
    WHERE created_at >= from_date;
END;
$$;


ALTER FUNCTION public.get_audit_statistics(from_date timestamp with time zone) OWNER TO postgres;

--
-- Name: get_notes_advanced_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_notes_advanced_stats(p_user_id uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_notes', COUNT(*),
    'my_notes', COUNT(*) FILTER (WHERE created_by = p_user_id),
    'assigned_notes', COUNT(*) FILTER (WHERE assigned_to = p_user_id),
    'important_notes', COUNT(*) FILTER (WHERE is_important = true),
    'template_notes', COUNT(*) FILTER (WHERE is_template = true),
    'published_notes', COUNT(*) FILTER (WHERE is_published = true),
    'deprecated_notes', COUNT(*) FILTER (WHERE is_deprecated = true),
    'with_reminders', COUNT(*) FILTER (WHERE reminder_date IS NOT NULL),
    'archived_notes', COUNT(*) FILTER (WHERE is_archived = true),
    'by_type', json_build_object(
      'note', COUNT(*) FILTER (WHERE note_type = 'note'),
      'solution', COUNT(*) FILTER (WHERE note_type = 'solution'),
      'guide', COUNT(*) FILTER (WHERE note_type = 'guide'),
      'faq', COUNT(*) FILTER (WHERE note_type = 'faq'),
      'template', COUNT(*) FILTER (WHERE note_type = 'template'),
      'procedure', COUNT(*) FILTER (WHERE note_type = 'procedure')
    ),
    'by_priority', json_build_object(
      'low', COUNT(*) FILTER (WHERE priority = 'low'),
      'medium', COUNT(*) FILTER (WHERE priority = 'medium'),
      'high', COUNT(*) FILTER (WHERE priority = 'high'),
      'urgent', COUNT(*) FILTER (WHERE priority = 'urgent')
    ),
    'by_difficulty', json_build_object(
      '1', COUNT(*) FILTER (WHERE difficulty_level = 1),
      '2', COUNT(*) FILTER (WHERE difficulty_level = 2),
      '3', COUNT(*) FILTER (WHERE difficulty_level = 3),
      '4', COUNT(*) FILTER (WHERE difficulty_level = 4),
      '5', COUNT(*) FILTER (WHERE difficulty_level = 5)
    ),
    'most_viewed', (
      SELECT json_agg(json_build_object('id', id, 'title', title, 'view_count', view_count))
      FROM (
        SELECT id, title, view_count 
        FROM notes 
        WHERE (created_by = p_user_id OR assigned_to = p_user_id)
          AND view_count > 0
        ORDER BY view_count DESC 
        LIMIT 5
      ) top_viewed
    ),
    'most_helpful', (
      SELECT json_agg(json_build_object('id', id, 'title', title, 'helpful_count', helpful_count))
      FROM (
        SELECT id, title, helpful_count 
        FROM notes 
        WHERE (created_by = p_user_id OR assigned_to = p_user_id)
          AND helpful_count > 0
        ORDER BY helpful_count DESC 
        LIMIT 5
      ) top_helpful
    )
  ) INTO result
  FROM notes
  WHERE created_by = p_user_id OR assigned_to = p_user_id;
  
  RETURN result;
END;
$$;


ALTER FUNCTION public.get_notes_advanced_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_notes_advanced_stats(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_notes_advanced_stats(p_user_id uuid) IS 'Obtiene estadísticas avanzadas de notas para un usuario específico';


--
-- Name: get_notes_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_notes_stats() RETURNS TABLE("totalNotes" bigint, "myNotes" bigint, "assignedNotes" bigint, "importantNotes" bigint, "withReminders" bigint, "archivedNotes" bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM notes WHERE "isArchived" = false)::BIGINT AS "totalNotes",
        (SELECT COUNT(*) FROM notes WHERE "isArchived" = false AND "createdBy" = '7c1b05d7-d98e-4543-ac27-dd1c797517e6')::BIGINT AS "myNotes",
        (SELECT COUNT(*) FROM notes WHERE "isArchived" = false AND "assignedTo" = '7c1b05d7-d98e-4543-ac27-dd1c797517e6')::BIGINT AS "assignedNotes",
        (SELECT COUNT(*) FROM notes WHERE "isArchived" = false AND "isImportant" = true)::BIGINT AS "importantNotes",
        (SELECT COUNT(*) FROM notes WHERE "isArchived" = false AND "reminderDate" IS NOT NULL)::BIGINT AS "withReminders",
        (SELECT COUNT(*) FROM notes WHERE "isArchived" = true)::BIGINT AS "archivedNotes";
END;
$$;


ALTER FUNCTION public.get_notes_stats() OWNER TO postgres;

--
-- Name: get_notes_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_notes_stats(user_id uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_notes', (
            SELECT COUNT(*) FROM notes 
            WHERE (created_by = user_id OR assigned_to = user_id) 
            AND is_archived = false
        ),
        'my_notes', (
            SELECT COUNT(*) FROM notes 
            WHERE created_by = user_id AND is_archived = false
        ),
        'assigned_notes', (
            SELECT COUNT(*) FROM notes 
            WHERE assigned_to = user_id AND is_archived = false
        ),
        'important_notes', (
            SELECT COUNT(*) FROM notes 
            WHERE (created_by = user_id OR assigned_to = user_id) 
            AND is_important = true AND is_archived = false
        ),
        'with_reminders', (
            SELECT COUNT(*) FROM notes 
            WHERE (created_by = user_id OR assigned_to = user_id) 
            AND reminder_date IS NOT NULL AND is_archived = false
        ),
        'archived_notes', (
            SELECT COUNT(*) FROM notes 
            WHERE (created_by = user_id OR assigned_to = user_id) 
            AND is_archived = true
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$;


ALTER FUNCTION public.get_notes_stats(user_id uuid) OWNER TO postgres;

--
-- Name: get_tags_with_usage_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_tags_with_usage_count() RETURNS TABLE(id uuid, tag_name character varying, description text, color character varying, category character varying, is_active boolean, usage_count bigint, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kt.id,
        kt.tag_name,
        kt.description,
        kt.color,
        kt.category,
        kt.is_active,
        COUNT(ktr.document_id) as usage_count,
        kt.created_by,
        kt.created_at,
        kt.updated_at
    FROM knowledge_tags kt
    LEFT JOIN knowledge_document_tag_relations ktr ON kt.id = ktr.tag_id
    GROUP BY kt.id, kt.tag_name, kt.description, kt.color, kt.category, kt.is_active, kt.created_by, kt.created_at, kt.updated_at
    ORDER BY usage_count DESC, kt.tag_name ASC;
END;
$$;


ALTER FUNCTION public.get_tags_with_usage_count() OWNER TO postgres;

--
-- Name: get_todo_total_time(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_todo_total_time(todo_id_param uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    automatic_time INTEGER := 0;
    manual_time INTEGER := 0;
    total_time INTEGER := 0;
BEGIN
    -- Tiempo automático
    SELECT COALESCE(SUM(duration_minutes), 0) INTO automatic_time
    FROM todo_time_entries tte
    INNER JOIN todo_control tc ON tc.id = tte.todo_control_id
    WHERE tc.todo_id = todo_id_param;
    
    -- Tiempo manual
    SELECT COALESCE(SUM(duration_minutes), 0) INTO manual_time
    FROM todo_manual_time_entries tmte
    INNER JOIN todo_control tc ON tc.id = tmte.todo_control_id
    WHERE tc.todo_id = todo_id_param;
    
    total_time := automatic_time + manual_time;
    
    RETURN total_time;
END;
$$;


ALTER FUNCTION public.get_todo_total_time(todo_id_param uuid) OWNER TO postgres;

--
-- Name: search_documents_advanced(text, uuid[], text[], integer[], uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.search_documents_advanced(p_search_term text DEFAULT NULL::text, p_document_types uuid[] DEFAULT NULL::uuid[], p_tags text[] DEFAULT NULL::text[], p_difficulty_range integer[] DEFAULT NULL::integer[], p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS TABLE(note_id uuid, title character varying, content text, json_content jsonb, note_type character varying, document_type_name character varying, difficulty_level integer, view_count integer, helpful_count integer, tags text[], created_at timestamp with time zone, updated_at timestamp with time zone, rank real)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.title,
        n.content,
        n.json_content,
        n.note_type,
        COALESCE(dt.name, 'Sin categoría') as document_type_name,
        n.difficulty_level,
        n.view_count,
        n.helpful_count,
        n.tags,
        n.created_at,
        n.updated_at,
        CASE 
            WHEN p_search_term IS NULL THEN 1.0
            ELSE (
                ts_rank_cd(
                    to_tsvector('spanish', n.title || ' ' || n.content),
                    plainto_tsquery('spanish', p_search_term)
                ) + 
                similarity(n.title, p_search_term) * 0.5
            )::REAL
        END as rank
    FROM notes n
    LEFT JOIN document_types dt ON n.document_type_id = dt.id
    WHERE
        n.is_archived = false
        AND n.is_deprecated = false
        AND n.is_published = true
        AND (p_search_term IS NULL OR (
            to_tsvector('spanish', n.title || ' ' || n.content) @@ plainto_tsquery('spanish', p_search_term)
            OR n.title % p_search_term
        ))
        AND (p_document_types IS NULL OR n.document_type_id = ANY(p_document_types))
        AND (p_tags IS NULL OR n.tags && p_tags)
        AND (p_difficulty_range IS NULL OR n.difficulty_level BETWEEN p_difficulty_range[1] AND p_difficulty_range[2])
        AND (p_user_id IS NULL OR n.created_by = p_user_id)
    ORDER BY rank DESC, n.view_count DESC, n.helpful_count DESC, n.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.search_documents_advanced(p_search_term text, p_document_types uuid[], p_tags text[], p_difficulty_range integer[], p_user_id uuid, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: FUNCTION search_documents_advanced(p_search_term text, p_document_types uuid[], p_tags text[], p_difficulty_range integer[], p_user_id uuid, p_limit integer, p_offset integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.search_documents_advanced(p_search_term text, p_document_types uuid[], p_tags text[], p_difficulty_range integer[], p_user_id uuid, p_limit integer, p_offset integer) IS 'Búsqueda avanzada de documentos con ranking y filtros múltiples';


--
-- Name: search_notes(text, uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.search_notes(search_term text, user_id uuid, limit_count integer DEFAULT 50) RETURNS TABLE(id uuid, title character varying, content text, tags text[], case_id uuid, created_by uuid, assigned_to uuid, is_important boolean, is_archived boolean, created_at timestamp with time zone, updated_at timestamp with time zone, case_number character varying, creator_name character varying, assigned_name character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.content,
        n.tags,
        n.case_id,
        n.created_by,
        n.assigned_to,
        n.is_important,
        n.is_archived,
        n.created_at,
        n.updated_at,
        c.numero_caso as case_number,
        creator.full_name as creator_name,
        assigned.full_name as assigned_name
    FROM notes n
    LEFT JOIN cases c ON n.case_id = c.id
    LEFT JOIN user_profiles creator ON n.created_by = creator.id
    LEFT JOIN user_profiles assigned ON n.assigned_to = assigned.id
    WHERE 
        (n.created_by = user_id OR n.assigned_to = user_id)
        AND (
            to_tsvector('spanish', n.title || ' ' || n.content) @@ plainto_tsquery('spanish', search_term)
            OR n.title ILIKE '%' || search_term || '%'
            OR n.content ILIKE '%' || search_term || '%'
            OR search_term = ANY(n.tags)
        )
        AND n.is_archived = false
    ORDER BY 
        CASE 
            WHEN n.title ILIKE '%' || search_term || '%' THEN 1
            WHEN search_term = ANY(n.tags) THEN 2
            ELSE 3
        END,
        n.updated_at DESC
    LIMIT limit_count;
END;
$$;


ALTER FUNCTION public.search_notes(search_term text, user_id uuid, limit_count integer) OWNER TO postgres;

--
-- Name: update_archived_cases_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_archived_cases_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_archived_cases_timestamp() OWNER TO postgres;

--
-- Name: update_archived_todos_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_archived_todos_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_archived_todos_timestamp() OWNER TO postgres;

--
-- Name: update_dispositions_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_dispositions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_dispositions_updated_at() OWNER TO postgres;

--
-- Name: update_document_tags_json(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_document_tags_json() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Actualizar tags_json del documento afectado
    IF TG_OP = 'DELETE' THEN
        UPDATE knowledge_documents 
        SET tags_json = (
            SELECT COALESCE(jsonb_agg(tag_id), '[]'::jsonb)
            FROM knowledge_document_tag_relations
            WHERE document_id = OLD.document_id
        )
        WHERE id = OLD.document_id;
        RETURN OLD;
    ELSE
        UPDATE knowledge_documents 
        SET tags_json = (
            SELECT COALESCE(jsonb_agg(tag_id), '[]'::jsonb)
            FROM knowledge_document_tag_relations
            WHERE document_id = NEW.document_id
        )
        WHERE id = NEW.document_id;
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.update_document_tags_json() OWNER TO postgres;

--
-- Name: update_manager_role(); Type: FUNCTION; Schema: public; Owner: cms_admin
--

CREATE FUNCTION public.update_manager_role() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW."managerId" IS NOT NULL AND (OLD."managerId" IS NULL OR OLD."managerId" != NEW."managerId") THEN
        UPDATE team_members
        SET role = 'manager', "updatedAt" = NOW()
        WHERE "teamId" = NEW.id
        AND "userId" = NEW."managerId"
        AND "isActive" = true;
        
        IF OLD."managerId" IS NOT NULL THEN
            UPDATE team_members
            SET role = 'lead', "updatedAt" = NOW()
            WHERE "teamId" = NEW.id
            AND "userId" = OLD."managerId"
            AND "isActive" = true;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_manager_role() OWNER TO cms_admin;

--
-- Name: update_note_feedback_counts(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_note_feedback_counts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.was_helpful THEN
      UPDATE notes SET helpful_count = helpful_count + 1 WHERE id = NEW.note_id;
    ELSE
      UPDATE notes SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.note_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambió el valor de was_helpful
    IF OLD.was_helpful != NEW.was_helpful THEN
      IF NEW.was_helpful THEN
        UPDATE notes 
        SET helpful_count = helpful_count + 1,
            not_helpful_count = GREATEST(not_helpful_count - 1, 0)
        WHERE id = NEW.note_id;
      ELSE
        UPDATE notes 
        SET helpful_count = GREATEST(helpful_count - 1, 0),
            not_helpful_count = not_helpful_count + 1
        WHERE id = NEW.note_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.was_helpful THEN
      UPDATE notes SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.note_id;
    ELSE
      UPDATE notes SET not_helpful_count = GREATEST(not_helpful_count - 1, 0) WHERE id = OLD.note_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_note_feedback_counts() OWNER TO postgres;

--
-- Name: update_notes_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_notes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_notes_updated_at() OWNER TO postgres;

--
-- Name: update_permissions_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_permissions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_permissions_updated_at() OWNER TO postgres;

--
-- Name: update_tag_usage_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_tag_usage_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE note_tags 
    SET usage_count = usage_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE note_tags 
    SET usage_count = GREATEST(usage_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_tag_usage_count() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: cms_admin
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO cms_admin;

--
-- Name: update_user_sessions_updated_at(); Type: FUNCTION; Schema: public; Owner: cms_admin
--

CREATE FUNCTION public.update_user_sessions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_sessions_updated_at() OWNER TO cms_admin;

--
-- Name: validate_team_manager(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_team_manager() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Si se está asignando un manager
    IF NEW."managerId" IS NOT NULL THEN
        -- Verificar que el manager sea miembro activo del equipo
        IF NOT EXISTS (
            SELECT 1 FROM team_members 
            WHERE "teamId" = NEW.id 
            AND "userId" = NEW."managerId" 
            AND "isActive" = true
        ) THEN
            RAISE EXCEPTION 'El manager debe ser un miembro activo del equipo';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_team_manager() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aplicaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aplicaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.aplicaciones OWNER TO postgres;

--
-- Name: archived_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archived_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_case_id uuid NOT NULL,
    description text,
    original_created_at timestamp with time zone NOT NULL,
    original_updated_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    archived_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_restored boolean DEFAULT false NOT NULL,
    assigned_to uuid,
    created_by uuid NOT NULL,
    updated_by uuid,
    archived_reason character varying(500),
    timer_entries jsonb DEFAULT '[]'::jsonb,
    manual_time_entries jsonb DEFAULT '[]'::jsonb,
    metadata jsonb,
    case_number character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    status public.archived_cases_status_enum DEFAULT 'OPEN'::public.archived_cases_status_enum NOT NULL,
    priority public.archived_cases_priority_enum DEFAULT 'MEDIUM'::public.archived_cases_priority_enum NOT NULL,
    classification public.archived_cases_classification_enum DEFAULT 'INCIDENT'::public.archived_cases_classification_enum NOT NULL
);


ALTER TABLE public.archived_cases OWNER TO postgres;

--
-- Name: archived_todos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archived_todos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    original_todo_id uuid NOT NULL,
    description text,
    completed_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    archived_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    case_id uuid,
    original_created_at timestamp with time zone NOT NULL,
    original_updated_at timestamp with time zone NOT NULL,
    is_restored boolean DEFAULT false NOT NULL,
    metadata jsonb,
    category character varying(100),
    is_completed boolean DEFAULT false NOT NULL,
    created_by_user_id uuid NOT NULL,
    assigned_user_id uuid,
    archive_reason text,
    restored_at timestamp with time zone,
    restored_by uuid,
    original_data jsonb NOT NULL,
    control_data jsonb NOT NULL,
    timer_entries jsonb DEFAULT '[]'::jsonb NOT NULL,
    manual_time_entries jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_time_minutes integer DEFAULT 0 NOT NULL,
    timer_time_minutes integer DEFAULT 0 NOT NULL,
    manual_time_minutes integer DEFAULT 0 NOT NULL,
    title character varying(500) NOT NULL,
    priority character varying(50) NOT NULL,
    due_date date
);


ALTER TABLE public.archived_todos OWNER TO postgres;

--
-- Name: audit_entity_changes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_entity_changes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    audit_log_id uuid NOT NULL,
    field_name character varying(100) NOT NULL,
    field_type character varying(50) NOT NULL,
    old_value text,
    new_value text,
    is_sensitive boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    change_type public.audit_entity_changes_change_type_enum NOT NULL
);


ALTER TABLE public.audit_entity_changes OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    user_email character varying(255) NOT NULL,
    user_name character varying(500),
    user_role character varying(100),
    entity_type character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    entity_name character varying(500),
    module character varying(50) NOT NULL,
    operation_context jsonb,
    ip_address inet,
    user_agent text,
    session_id character varying(255),
    request_path character varying(500),
    request_method character varying(10),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    action public.audit_logs_action_enum NOT NULL,
    operation_success boolean DEFAULT true NOT NULL,
    error_message text
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: case_control; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.case_control (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "caseId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "statusId" uuid NOT NULL,
    "totalTimeMinutes" integer DEFAULT 0 NOT NULL,
    "timerStartAt" timestamp without time zone,
    "isTimerActive" boolean DEFAULT false NOT NULL,
    "assignedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.case_control OWNER TO postgres;

--
-- Name: case_status_control; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.case_status_control (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color character varying(20) DEFAULT '#6B7280'::character varying NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.case_status_control OWNER TO postgres;

--
-- Name: cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    clasificacion public.cases_clasificacion_enum NOT NULL,
    estado public.cases_estado_enum DEFAULT 'nuevo'::public.cases_estado_enum NOT NULL,
    observaciones text,
    "fechaVencimiento" timestamp without time zone,
    "fechaResolucion" timestamp without time zone,
    "userId" uuid,
    "assignedToId" uuid,
    "applicationId" uuid,
    "originId" uuid,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "numeroCaso" character varying NOT NULL,
    descripcion text NOT NULL,
    fecha date NOT NULL,
    "historialCaso" integer NOT NULL,
    "conocimientoModulo" integer NOT NULL,
    "manipulacionDatos" integer NOT NULL,
    "claridadDescripcion" integer NOT NULL,
    "causaFallo" integer NOT NULL,
    puntuacion numeric(5,2) NOT NULL
);


ALTER TABLE public.cases OWNER TO postgres;

--
-- Name: dispositions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispositions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    case_id uuid,
    case_number character varying NOT NULL,
    script_name text NOT NULL,
    svn_revision_number text,
    application_id uuid,
    observations text,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    application_name character varying(100) NOT NULL
);


ALTER TABLE public.dispositions OWNER TO postgres;

--
-- Name: document_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(50),
    color character varying(7) DEFAULT '#6B7280'::character varying NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.document_types OWNER TO postgres;

--
-- Name: knowledge_document_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_document_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    file_type character varying(20),
    file_hash character varying(64),
    thumbnail_path text,
    processed_path text,
    is_embedded boolean DEFAULT false NOT NULL,
    uploaded_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    upload_session_id character varying(255)
);


ALTER TABLE public.knowledge_document_attachments OWNER TO postgres;

--
-- Name: knowledge_document_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_document_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_helpful boolean NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.knowledge_document_feedback OWNER TO postgres;

--
-- Name: knowledge_document_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_document_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_document_id uuid NOT NULL,
    child_document_id uuid NOT NULL,
    relation_type character varying(50) DEFAULT 'related'::character varying NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.knowledge_document_relations OWNER TO postgres;

--
-- Name: knowledge_document_tag_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_document_tag_relations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    document_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.knowledge_document_tag_relations OWNER TO postgres;

--
-- Name: knowledge_document_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_document_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid,
    tag_name character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    color character varying(7) DEFAULT '#6B7280'::character varying NOT NULL,
    category public.knowledge_document_tags_category_enum DEFAULT 'custom'::public.knowledge_document_tags_category_enum NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.knowledge_document_tags OWNER TO postgres;

--
-- Name: knowledge_document_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_document_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    version_number integer NOT NULL,
    content jsonb NOT NULL,
    title character varying(500) NOT NULL,
    change_summary text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.knowledge_document_versions OWNER TO postgres;

--
-- Name: knowledge_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(500) NOT NULL,
    content text,
    json_content jsonb NOT NULL,
    document_type_id uuid,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    difficulty_level integer DEFAULT 1 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    is_template boolean DEFAULT false NOT NULL,
    is_deprecated boolean DEFAULT false NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    helpful_count integer DEFAULT 0 NOT NULL,
    not_helpful_count integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    published_at timestamp with time zone,
    deprecated_at timestamp with time zone,
    archived_at timestamp with time zone,
    created_by uuid NOT NULL,
    last_edited_by uuid,
    archived_by uuid,
    replacement_document_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tags_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    associated_cases jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.knowledge_documents OWNER TO postgres;

--
-- Name: knowledge_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tag_name character varying(50) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#6B7280'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category public.knowledge_tags_category_enum DEFAULT 'custom'::public.knowledge_tags_category_enum NOT NULL
);


ALTER TABLE public.knowledge_tags OWNER TO postgres;

--
-- Name: manual_time_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manual_time_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "caseControlId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    date date NOT NULL,
    "durationMinutes" integer NOT NULL,
    description text NOT NULL,
    "createdBy" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.manual_time_entries OWNER TO postgres;

--
-- Name: note_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.note_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    note_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer,
    comment text,
    was_helpful boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT note_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.note_feedback OWNER TO postgres;

--
-- Name: TABLE note_feedback; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.note_feedback IS 'Feedback y valoraciones de las notas';


--
-- Name: COLUMN note_feedback.rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.note_feedback.rating IS 'Rating del 1 al 5 (opcional)';


--
-- Name: COLUMN note_feedback.was_helpful; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.note_feedback.was_helpful IS 'Si la nota fue útil o no';


--
-- Name: note_tag_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.note_tag_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    note_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_by uuid NOT NULL
);


ALTER TABLE public.note_tag_assignments OWNER TO postgres;

--
-- Name: TABLE note_tag_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.note_tag_assignments IS 'Relación many-to-many entre notas y etiquetas';


--
-- Name: note_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.note_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#6B7280'::character varying NOT NULL,
    category character varying(20) DEFAULT 'custom'::character varying NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_tag_category CHECK (((category)::text = ANY (ARRAY[('priority'::character varying)::text, ('technical'::character varying)::text, ('type'::character varying)::text, ('technology'::character varying)::text, ('module'::character varying)::text, ('custom'::character varying)::text]))),
    CONSTRAINT check_tag_usage_count_positive CHECK ((usage_count >= 0))
);


ALTER TABLE public.note_tags OWNER TO postgres;

--
-- Name: TABLE note_tags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.note_tags IS 'Etiquetas reutilizables para notas';


--
-- Name: COLUMN note_tags.category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.note_tags.category IS 'Categoría: priority, technical, type, technology, module, custom';


--
-- Name: COLUMN note_tags.usage_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.note_tags.usage_count IS 'Número de veces que se ha usado esta etiqueta';


--
-- Name: notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(500) NOT NULL,
    content text NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    case_id uuid,
    created_by uuid NOT NULL,
    assigned_to uuid,
    is_important boolean DEFAULT false NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    archived_at timestamp with time zone,
    archived_by uuid,
    reminder_date timestamp with time zone,
    is_reminder_sent boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    note_type character varying(50) DEFAULT 'note'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    difficulty_level integer DEFAULT 1 NOT NULL,
    is_template boolean DEFAULT false NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    is_deprecated boolean DEFAULT false NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    helpful_count integer DEFAULT 0 NOT NULL,
    not_helpful_count integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    complexity_notes text,
    prerequisites text,
    estimated_solution_time integer,
    deprecation_reason text,
    replacement_note_id uuid,
    last_reviewed_at timestamp with time zone,
    last_reviewed_by uuid
);


ALTER TABLE public.notes OWNER TO postgres;

--
-- Name: origenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.origenes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.origenes OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    module character varying(50) NOT NULL,
    action character varying(20) NOT NULL,
    scope character varying(10) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "roleId" uuid NOT NULL,
    "permissionId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "teamId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "joinedAt" timestamp with time zone DEFAULT now(),
    "leftAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.team_members OWNER TO postgres;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(10) NOT NULL,
    description text,
    color character varying(7),
    "managerId" uuid,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: team_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.team_stats AS
 SELECT t.id,
    t.name,
    t.code,
    t.color,
    t."isActive",
    count(tm.id) AS total_members,
    count(
        CASE
            WHEN (tm."isActive" = true) THEN 1
            ELSE NULL::integer
        END) AS active_members,
    count(
        CASE
            WHEN (((tm.role)::text = 'manager'::text) AND (tm."isActive" = true)) THEN 1
            ELSE NULL::integer
        END) AS managers,
    count(
        CASE
            WHEN (((tm.role)::text = 'lead'::text) AND (tm."isActive" = true)) THEN 1
            ELSE NULL::integer
        END) AS leads,
    count(
        CASE
            WHEN (((tm.role)::text = 'senior'::text) AND (tm."isActive" = true)) THEN 1
            ELSE NULL::integer
        END) AS seniors,
    count(
        CASE
            WHEN (((tm.role)::text = 'member'::text) AND (tm."isActive" = true)) THEN 1
            ELSE NULL::integer
        END) AS members,
    max(tm."joinedAt") AS last_member_joined,
    t."createdAt",
    t."updatedAt"
   FROM (public.teams t
     LEFT JOIN public.team_members tm ON ((t.id = tm."teamId")))
  GROUP BY t.id, t.name, t.code, t.color, t."isActive", t."createdAt", t."updatedAt"
  ORDER BY t.name;


ALTER VIEW public.team_stats OWNER TO postgres;

--
-- Name: VIEW team_stats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.team_stats IS 'Vista que proporciona estadísticas básicas de equipos y sus miembros';


--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "caseControlId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "startTime" timestamp without time zone NOT NULL,
    "endTime" timestamp without time zone,
    "durationMinutes" integer DEFAULT 0 NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.time_entries OWNER TO postgres;

--
-- Name: todo_control; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.todo_control (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    todo_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status_id uuid NOT NULL,
    total_time_minutes integer DEFAULT 0 NOT NULL,
    timer_start_at timestamp with time zone,
    is_timer_active boolean DEFAULT false NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.todo_control OWNER TO postgres;

--
-- Name: todo_manual_time_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.todo_manual_time_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    todo_control_id uuid NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    duration_minutes integer NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL
);


ALTER TABLE public.todo_manual_time_entries OWNER TO postgres;

--
-- Name: todo_priorities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.todo_priorities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color character varying(20) DEFAULT '#6B7280'::character varying NOT NULL,
    level integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.todo_priorities OWNER TO postgres;

--
-- Name: todo_time_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.todo_time_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    todo_control_id uuid NOT NULL,
    user_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration_minutes integer,
    entry_type character varying(20) DEFAULT 'automatic'::character varying NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.todo_time_entries OWNER TO postgres;

--
-- Name: todos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.todos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    priority_id uuid NOT NULL,
    assigned_user_id uuid,
    created_by_user_id uuid NOT NULL,
    estimated_minutes integer DEFAULT 0 NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "dueDate" date
);


ALTER TABLE public.todos OWNER TO postgres;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    "fullName" character varying,
    password character varying,
    "roleId" uuid,
    "roleName" character varying DEFAULT 'user'::character varying NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: cms_admin
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(64) NOT NULL,
    refresh_token_hash character varying(64),
    device_info jsonb,
    ip_address inet,
    location_info jsonb,
    is_active boolean DEFAULT true,
    expires_at timestamp without time zone NOT NULL,
    last_activity_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    logout_reason character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO cms_admin;

--
-- Name: TABLE user_sessions; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON TABLE public.user_sessions IS 'Almacena sesiones activas de usuarios para control de sesión única';


--
-- Name: COLUMN user_sessions.id; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.id IS 'Identificador único de la sesión';


--
-- Name: COLUMN user_sessions.user_id; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.user_id IS 'Referencia al usuario propietario de la sesión';


--
-- Name: COLUMN user_sessions.token_hash; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.token_hash IS 'Hash SHA-256 del JWT token para identificación segura';


--
-- Name: COLUMN user_sessions.refresh_token_hash; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.refresh_token_hash IS 'Hash SHA-256 del refresh token';


--
-- Name: COLUMN user_sessions.device_info; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.device_info IS 'Información del dispositivo/navegador (JSON)';


--
-- Name: COLUMN user_sessions.ip_address; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.ip_address IS 'Dirección IP desde donde se creó la sesión';


--
-- Name: COLUMN user_sessions.location_info; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.location_info IS 'Información geográfica aproximada (JSON)';


--
-- Name: COLUMN user_sessions.is_active; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.is_active IS 'Indica si la sesión está activa';


--
-- Name: COLUMN user_sessions.expires_at; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.expires_at IS 'Fecha y hora de expiración de la sesión';


--
-- Name: COLUMN user_sessions.last_activity_at; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.last_activity_at IS 'Última actividad registrada en la sesión';


--
-- Name: COLUMN user_sessions.logout_reason; Type: COMMENT; Schema: public; Owner: cms_admin
--

COMMENT ON COLUMN public.user_sessions.logout_reason IS 'Razón del cierre de sesión (manual, forced, expired, new_login)';


--
-- Data for Name: aplicaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aplicaciones (id, nombre, descripcion, activo, "createdAt", "updatedAt") FROM stdin;
cfbb7397-ec2e-44f5-86c3-7e685cff32a2	ACTIVIDAD	Procesos de actividad	t	2025-09-18 19:06:23.012813+00	2025-09-18 19:06:23.012813+00
f0fdda4a-bb19-4a9e-9e09-0e7b1a9af863	SIGLA	\N	t	2025-09-18 19:06:41.853388+00	2025-09-18 19:06:41.853388+00
afb99065-64c4-48bd-a4ae-319fa96fd1cc	FALLO	Registro parra fallos que se generen sobre el equipo	t	2025-09-18 19:07:32.017293+00	2025-09-18 19:07:32.017293+00
783da041-f6ca-44dc-b724-e4bb9d3e729e	WSM LAB	\N	t	2025-09-18 19:07:49.371612+00	2025-09-18 19:07:49.371612+00
ff15732d-5c3f-4c0a-bdae-79aae28e8a9a	GARANTIAS	\N	t	2025-09-18 19:08:00.950819+00	2025-09-18 19:08:00.950819+00
345b36ab-9434-4b39-badb-af97924a81f5	KOMPENDIUM	\N	t	2025-09-18 19:08:15.40259+00	2025-09-18 19:08:15.40259+00
\.


--
-- Data for Name: archived_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.archived_cases (id, original_case_id, description, original_created_at, original_updated_at, archived_at, archived_by, created_at, updated_at, is_restored, assigned_to, created_by, updated_by, archived_reason, timer_entries, manual_time_entries, metadata, case_number, title, status, priority, classification) FROM stdin;
\.


--
-- Data for Name: archived_todos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.archived_todos (id, original_todo_id, description, completed_at, archived_at, archived_by, created_at, updated_at, case_id, original_created_at, original_updated_at, is_restored, metadata, category, is_completed, created_by_user_id, assigned_user_id, archive_reason, restored_at, restored_by, original_data, control_data, timer_entries, manual_time_entries, total_time_minutes, timer_time_minutes, manual_time_minutes, title, priority, due_date) FROM stdin;
\.


--
-- Data for Name: audit_entity_changes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_entity_changes (id, audit_log_id, field_name, field_type, old_value, new_value, is_sensitive, created_at, change_type) FROM stdin;
bfde27ea-a7a6-4e25-b30d-541ab05f7069	935159e4-9289-465e-b1fd-7f592a18dc07	email	string	\N	hjurgensen@todosistemassti.co	f	2025-12-16 13:08:05.069601+00	ADDED
ffdf8b74-fb8d-40a2-9d6d-f90c01814c30	935159e4-9289-465e-b1fd-7f592a18dc07	fullName	string	\N	Henry Andrés Jurgensen Álzate	f	2025-12-16 13:08:05.069601+00	ADDED
73ede424-51cb-481d-9911-fa75533e6d75	935159e4-9289-465e-b1fd-7f592a18dc07	password	string	\N	.10121992.	t	2025-12-16 13:08:05.069601+00	ADDED
1ebd67c1-b7eb-45f5-8c9a-1d27b09c828d	935159e4-9289-465e-b1fd-7f592a18dc07	roleName	string	\N	Analista de Aplicaciones	f	2025-12-16 13:08:05.069601+00	ADDED
2f6649a4-2996-4b19-85ee-f67dad3c80e6	935159e4-9289-465e-b1fd-7f592a18dc07	isActive	boolean	\N	true	f	2025-12-16 13:08:05.069601+00	ADDED
61ed8523-fc11-4390-91d1-1e86e827b9f0	e9084c5a-0aad-411e-8716-949dfa967538	email	string	\N	wvega@todosistemassti.co	f	2025-12-16 13:09:34.282269+00	ADDED
4e14e825-1c3a-4263-86c8-c7ac777467c8	e9084c5a-0aad-411e-8716-949dfa967538	fullName	string	\N	William Vega Baquero	f	2025-12-16 13:09:34.282269+00	ADDED
d7294590-585d-4b2d-b0a2-bc89cb2db766	e9084c5a-0aad-411e-8716-949dfa967538	password	string	\N	.123456.	t	2025-12-16 13:09:34.282269+00	ADDED
32893243-b65c-49c0-a936-efea32eacc04	e9084c5a-0aad-411e-8716-949dfa967538	roleName	string	\N	Usuario	f	2025-12-16 13:09:34.282269+00	ADDED
bb5970fa-b8fb-4615-9baf-16536f6eb648	e9084c5a-0aad-411e-8716-949dfa967538	isActive	boolean	\N	true	f	2025-12-16 13:09:34.282269+00	ADDED
aa9e3bd8-2404-43f7-b03b-16ace2f952db	f5234c6d-7be8-42c1-a445-b4e7b1515caa	email	string	\N	wvega@todosistemassti.co	f	2025-12-16 13:10:46.379981+00	MODIFIED
91c461f4-0891-4619-bff7-212c74a74dbd	f5234c6d-7be8-42c1-a445-b4e7b1515caa	fullName	string	\N	William Vega Baquero	f	2025-12-16 13:10:46.379981+00	MODIFIED
659c91a8-13c7-4429-96e8-39d7a20e43e0	f5234c6d-7be8-42c1-a445-b4e7b1515caa	roleName	string	\N	Administrador	f	2025-12-16 13:10:46.379981+00	MODIFIED
1e4d9019-b4e8-4335-be90-ba8ef8a13ac7	f5234c6d-7be8-42c1-a445-b4e7b1515caa	isActive	boolean	\N	true	f	2025-12-16 13:10:46.379981+00	MODIFIED
deb4b622-91dc-47ce-bf8a-f5f32ebeb258	14e9b84f-1eca-44f9-85d7-1032c1594fbe	email	string	\N	wvega@todosistemassti.co	f	2025-12-16 13:12:36.772144+00	MODIFIED
6163685e-ca86-4698-a055-2cdd7b0e3d80	14e9b84f-1eca-44f9-85d7-1032c1594fbe	fullName	string	\N	William Vega Baquero	f	2025-12-16 13:12:36.772144+00	MODIFIED
82c0393e-628c-4a97-8c64-1bd08eeeea9d	14e9b84f-1eca-44f9-85d7-1032c1594fbe	roleName	string	\N	Administrador	f	2025-12-16 13:12:36.772144+00	MODIFIED
3447d401-f202-483e-8e3b-0c627c75b8ae	14e9b84f-1eca-44f9-85d7-1032c1594fbe	isActive	boolean	\N	true	f	2025-12-16 13:12:36.772144+00	MODIFIED
36067a40-965f-47d2-b29f-c76ee5b6d92e	46ec5056-f3ae-4b5e-8ee3-16c490a113e3	email	string	\N	wvega@todosistemassti.co	f	2025-12-16 13:12:40.850798+00	MODIFIED
e24a89e5-a147-47ad-845d-49e89b53c65a	46ec5056-f3ae-4b5e-8ee3-16c490a113e3	fullName	string	\N	William Vega Baquero	f	2025-12-16 13:12:40.850798+00	MODIFIED
bf09cd6d-3e3e-4d3b-b51e-5f6dd18ce8ea	46ec5056-f3ae-4b5e-8ee3-16c490a113e3	roleName	string	\N	Administrador	f	2025-12-16 13:12:40.850798+00	MODIFIED
1532f44e-231c-4974-a781-ed594f9a18c4	46ec5056-f3ae-4b5e-8ee3-16c490a113e3	isActive	boolean	\N	true	f	2025-12-16 13:12:40.850798+00	MODIFIED
54695dc8-c0da-4c84-b4d2-98aa51182adf	9c0cf056-f569-4180-a6f1-f10f056423e7	email	string	\N	wvega@todosistemassti.co	f	2025-12-16 13:13:47.370334+00	ADDED
b2998b2b-6509-400b-a876-5ccaf07b9d01	9c0cf056-f569-4180-a6f1-f10f056423e7	fullName	string	\N	William Vega Baquero	f	2025-12-16 13:13:47.370334+00	ADDED
3b5964bf-d4f4-43cd-a5f4-a46e71b98136	9c0cf056-f569-4180-a6f1-f10f056423e7	password	string	\N	.123456.	t	2025-12-16 13:13:47.370334+00	ADDED
5f249634-6951-4edf-90e9-2ce6a86b6143	9c0cf056-f569-4180-a6f1-f10f056423e7	roleName	string	\N	Administrador	f	2025-12-16 13:13:47.370334+00	ADDED
0c153e5f-945f-45ab-b121-0958f06fe5a0	9c0cf056-f569-4180-a6f1-f10f056423e7	isActive	boolean	\N	true	f	2025-12-16 13:13:47.370334+00	ADDED
a24edb27-dfdc-44b2-8dab-daceef65d87d	3df57949-d260-4b91-8fe0-21eee9f0c560	title	string	\N	Prueba	f	2025-12-16 13:15:05.243843+00	ADDED
c766fcd2-51de-4f94-bdee-e4c714f02a39	3df57949-d260-4b91-8fe0-21eee9f0c560	content	string	\N	\N	f	2025-12-16 13:15:05.243843+00	ADDED
3e99d55a-8e10-4de1-be2f-017467e20c6c	3df57949-d260-4b91-8fe0-21eee9f0c560	jsonContent	json	\N	{"type":"doc","content":[{"type":"paragraph","content":[]}]}	f	2025-12-16 13:15:05.243843+00	ADDED
184de885-489f-40c7-8392-54a8848a6ff2	3df57949-d260-4b91-8fe0-21eee9f0c560	priority	string	\N	medium	f	2025-12-16 13:15:05.243843+00	ADDED
7d687b73-8de0-403b-9e98-ac555c673165	3df57949-d260-4b91-8fe0-21eee9f0c560	isTemplate	boolean	\N	false	f	2025-12-16 13:15:05.243843+00	ADDED
315573aa-c064-4c84-92ac-766118889b21	ad73137f-32f2-4fc9-9728-caebdfc9e1c9	title	string	\N	Prueba	f	2025-12-16 14:45:09.834675+00	MODIFIED
2aab3b48-491c-46a7-be5b-6823c5159124	ad73137f-32f2-4fc9-9728-caebdfc9e1c9	content	string	\N	\N	f	2025-12-16 14:45:09.834675+00	MODIFIED
7024b8eb-791f-450a-ab6a-ae93af345cb4	ad73137f-32f2-4fc9-9728-caebdfc9e1c9	jsonContent	array	\N	[{"id":"94610123-d261-47e1-ae07-6868f341a538","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 14:45:09.834675+00	MODIFIED
3fd68dcc-2fe5-4766-bd59-406a4b1a7a3b	ad73137f-32f2-4fc9-9728-caebdfc9e1c9	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 14:45:09.834675+00	MODIFIED
26c98686-23cc-48ad-aedb-dfd94ef91b8b	ad73137f-32f2-4fc9-9728-caebdfc9e1c9	priority	string	\N	medium	f	2025-12-16 14:45:09.834675+00	MODIFIED
99ae80f1-1fcf-4d3f-b317-f2772457c553	ad73137f-32f2-4fc9-9728-caebdfc9e1c9	difficultyLevel	number	\N	1	f	2025-12-16 14:45:09.834675+00	MODIFIED
aa360238-0257-4c41-bee3-84fbb49af3c9	ad73137f-32f2-4fc9-9728-caebdfc9e1c9	isTemplate	boolean	\N	false	f	2025-12-16 14:45:09.834675+00	MODIFIED
9a2c4d19-c56a-4e1d-b5a6-03c2a80515bc	ad73137f-32f2-4fc9-9728-caebdfc9e1c9	isPublished	boolean	\N	false	f	2025-12-16 14:45:09.834675+00	MODIFIED
0b8929a5-c999-431e-8846-f6bc8a800433	ad73137f-32f2-4fc9-9728-caebdfc9e1c9	associatedCases	array	\N	[]	f	2025-12-16 14:45:09.834675+00	MODIFIED
81989843-a4c8-4c65-a5c1-a8f20125edf4	9ae8fef4-02f3-424d-8d36-cf4cd3b8d058	title	string	\N	Prueba	f	2025-12-16 14:49:43.229107+00	MODIFIED
67f6a018-a382-4ab2-88c3-df837c87d007	9ae8fef4-02f3-424d-8d36-cf4cd3b8d058	content	string	\N	Pruebas!!	f	2025-12-16 14:49:43.229107+00	MODIFIED
afd9ce4b-8ffd-4d1c-b6ec-df711b6913df	9ae8fef4-02f3-424d-8d36-cf4cd3b8d058	jsonContent	array	\N	[{"id":"94610123-d261-47e1-ae07-6868f341a538","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":1,"isToggleable":false},"content":[{"type":"text","text":"Pruebas!!","styles":{}}],"children":[]},{"id":"1ebd160b-4ccb-4e07-a94d-51f2ed1fe35e","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 14:49:43.229107+00	MODIFIED
7f2094bb-4535-4b80-bc27-e0b8ee41916c	9ae8fef4-02f3-424d-8d36-cf4cd3b8d058	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 14:49:43.229107+00	MODIFIED
11179157-abcd-4481-9a60-087b7138928e	9ae8fef4-02f3-424d-8d36-cf4cd3b8d058	priority	string	\N	medium	f	2025-12-16 14:49:43.229107+00	MODIFIED
9c7b7792-18cd-4828-b5f9-60e53d388afc	9ae8fef4-02f3-424d-8d36-cf4cd3b8d058	difficultyLevel	number	\N	1	f	2025-12-16 14:49:43.229107+00	MODIFIED
36fdd58d-383c-4027-b9c5-3abc6013de66	9ae8fef4-02f3-424d-8d36-cf4cd3b8d058	isTemplate	boolean	\N	false	f	2025-12-16 14:49:43.229107+00	MODIFIED
af314e9a-a043-4f02-a5ef-1d1609d55623	9ae8fef4-02f3-424d-8d36-cf4cd3b8d058	isPublished	boolean	\N	false	f	2025-12-16 14:49:43.229107+00	MODIFIED
fd79cd1e-1248-446b-a464-12833094b5e0	9ae8fef4-02f3-424d-8d36-cf4cd3b8d058	associatedCases	array	\N	[]	f	2025-12-16 14:49:43.229107+00	MODIFIED
6458d920-262f-45ba-b0a2-3b9b1f9d7c12	89192930-8131-440d-a48e-f0f02251ab7e	title	string	\N	Pruebas D	f	2025-12-16 15:47:54.483791+00	ADDED
712a6952-3dc2-4fef-a210-78324f28a92e	89192930-8131-440d-a48e-f0f02251ab7e	content	string	\N	\N	f	2025-12-16 15:47:54.483791+00	ADDED
2e038b33-6667-40cd-bd69-662fe529e601	89192930-8131-440d-a48e-f0f02251ab7e	jsonContent	json	\N	{"type":"doc","content":[{"type":"paragraph","content":[]}]}	f	2025-12-16 15:47:54.483791+00	ADDED
a94f44dd-cd36-4bd8-8df7-9aebfc8e2577	89192930-8131-440d-a48e-f0f02251ab7e	priority	string	\N	medium	f	2025-12-16 15:47:54.483791+00	ADDED
7f08b975-1945-4fa2-ba7a-f069f93bc41d	89192930-8131-440d-a48e-f0f02251ab7e	isTemplate	boolean	\N	false	f	2025-12-16 15:47:54.483791+00	ADDED
9413834e-d1aa-4da1-8b7b-950ce6576366	2d95a8e2-f4e6-4075-8f97-954b8a196d4f	title	string	\N	Pruebas D	f	2025-12-16 15:48:10.234973+00	MODIFIED
e097a9a5-7002-4448-843d-cec306d423a1	2d95a8e2-f4e6-4075-8f97-954b8a196d4f	content	string	\N	\N	f	2025-12-16 15:48:10.234973+00	MODIFIED
0d9ba701-9e44-4579-b083-f79ed2dafa69	2d95a8e2-f4e6-4075-8f97-954b8a196d4f	jsonContent	array	\N	[{"id":"20ea3402-7b28-4c39-84b7-4f622380d2f7","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 15:48:10.234973+00	MODIFIED
27ded721-ad5b-4649-944e-64f4f2b07a28	2d95a8e2-f4e6-4075-8f97-954b8a196d4f	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 15:48:10.234973+00	MODIFIED
86f3750f-b14b-41ba-a0b4-bcd082f54caf	2d95a8e2-f4e6-4075-8f97-954b8a196d4f	priority	string	\N	medium	f	2025-12-16 15:48:10.234973+00	MODIFIED
ecea7a0c-c626-498d-9636-ab68f0e1d44d	2d95a8e2-f4e6-4075-8f97-954b8a196d4f	difficultyLevel	number	\N	1	f	2025-12-16 15:48:10.234973+00	MODIFIED
6b516975-f832-48f9-80b1-6ea40a9bab91	2d95a8e2-f4e6-4075-8f97-954b8a196d4f	isTemplate	boolean	\N	false	f	2025-12-16 15:48:10.234973+00	MODIFIED
eebcc75f-4a98-4cf7-bbe3-3de868e64922	2d95a8e2-f4e6-4075-8f97-954b8a196d4f	isPublished	boolean	\N	false	f	2025-12-16 15:48:10.234973+00	MODIFIED
95185c67-edaa-43d5-a76a-55b3a38e1b39	2d95a8e2-f4e6-4075-8f97-954b8a196d4f	associatedCases	array	\N	[]	f	2025-12-16 15:48:10.234973+00	MODIFIED
e08e55d7-a39e-4f2b-b35e-d6bdd2989f9d	d2235a37-5188-4c90-8122-9866fef326e2	title	string	\N	Pruebas D	f	2025-12-16 15:48:56.660064+00	MODIFIED
a9f23312-fd00-477b-bb7d-7657295b3b2b	d2235a37-5188-4c90-8122-9866fef326e2	content	string	\N	Pruebas de adjuntos	f	2025-12-16 15:48:56.660064+00	MODIFIED
4129b3f8-68c9-42a3-be4c-091a4a449e0b	d2235a37-5188-4c90-8122-9866fef326e2	jsonContent	array	\N	[{"id":"20ea3402-7b28-4c39-84b7-4f622380d2f7","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":1,"isToggleable":false},"content":[{"type":"text","text":"Pruebas de adjuntos","styles":{}}],"children":[]},{"id":"ff268a36-fe3a-456a-be12-7281ec7a8491","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"ef79f0f4-a44b-46cd-86b4-9cd434f640f8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 15:48:56.660064+00	MODIFIED
2952d650-e064-434d-b5ba-60065e31fcce	d2235a37-5188-4c90-8122-9866fef326e2	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 15:48:56.660064+00	MODIFIED
dfbf0249-7ebe-45bb-9d23-c3736a827534	d2235a37-5188-4c90-8122-9866fef326e2	priority	string	\N	medium	f	2025-12-16 15:48:56.660064+00	MODIFIED
eef6d9df-a18c-4b67-9e8f-2d5b36e2e811	d2235a37-5188-4c90-8122-9866fef326e2	difficultyLevel	number	\N	2	f	2025-12-16 15:48:56.660064+00	MODIFIED
ce63b0f4-df5e-4faf-932c-fdd551e1c47a	d2235a37-5188-4c90-8122-9866fef326e2	isTemplate	boolean	\N	false	f	2025-12-16 15:48:56.660064+00	MODIFIED
6f58b2a2-2ac8-420b-a385-b78a2bc2462b	d2235a37-5188-4c90-8122-9866fef326e2	isPublished	boolean	\N	false	f	2025-12-16 15:48:56.660064+00	MODIFIED
3d332efb-b264-48cd-8006-c3ac97e54daa	d2235a37-5188-4c90-8122-9866fef326e2	tags	array	\N	["FD"]	f	2025-12-16 15:48:56.660064+00	MODIFIED
c40030b1-7349-4747-ae43-874ed1db98da	d2235a37-5188-4c90-8122-9866fef326e2	associatedCases	array	\N	[]	f	2025-12-16 15:48:56.660064+00	MODIFIED
02d3b0bc-827b-47b3-8d14-5d8f0c99ef09	3b698bc5-03ad-4c7f-b084-644ce89213a7	title	string	\N	Pruebas D	f	2025-12-16 15:52:20.145209+00	MODIFIED
749a521c-d313-480b-985f-a00169b65148	3b698bc5-03ad-4c7f-b084-644ce89213a7	content	string	\N	Pruebas de adjuntos	f	2025-12-16 15:52:20.145209+00	MODIFIED
7c37f24e-d197-42f8-98dc-ef036e11d54e	3b698bc5-03ad-4c7f-b084-644ce89213a7	jsonContent	array	\N	[{"id":"20ea3402-7b28-4c39-84b7-4f622380d2f7","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":1,"isToggleable":false},"content":[{"type":"text","text":"Pruebas de adjuntos","styles":{}}],"children":[]},{"id":"ff268a36-fe3a-456a-be12-7281ec7a8491","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"ef79f0f4-a44b-46cd-86b4-9cd434f640f8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 15:52:20.145209+00	MODIFIED
6be4ea38-d695-454d-a547-ed92c4d0f47f	3b698bc5-03ad-4c7f-b084-644ce89213a7	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 15:52:20.145209+00	MODIFIED
f6663f17-3c6e-4c10-bd7e-973b9f54b9d2	3b698bc5-03ad-4c7f-b084-644ce89213a7	priority	string	\N	medium	f	2025-12-16 15:52:20.145209+00	MODIFIED
e27cc6ca-0dc8-450d-9a12-867a00833884	3b698bc5-03ad-4c7f-b084-644ce89213a7	difficultyLevel	number	\N	2	f	2025-12-16 15:52:20.145209+00	MODIFIED
ab633c95-c590-4da2-b40c-5d4a8e6c255e	3b698bc5-03ad-4c7f-b084-644ce89213a7	isTemplate	boolean	\N	false	f	2025-12-16 15:52:20.145209+00	MODIFIED
8f8afd26-776d-42eb-a989-7d86cfb1b52b	3b698bc5-03ad-4c7f-b084-644ce89213a7	isPublished	boolean	\N	false	f	2025-12-16 15:52:20.145209+00	MODIFIED
b4f9c2a5-a834-443a-9bd5-9b28a47890ba	3b698bc5-03ad-4c7f-b084-644ce89213a7	tags	array	\N	["FD"]	f	2025-12-16 15:52:20.145209+00	MODIFIED
42db92aa-a3b4-4bce-9d3b-85120fc008df	3b698bc5-03ad-4c7f-b084-644ce89213a7	associatedCases	array	\N	[]	f	2025-12-16 15:52:20.145209+00	MODIFIED
07cb1d88-d279-46ac-aa94-b0f54d61cfcd	b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	title	string	\N	Pruebas D	f	2025-12-16 16:27:06.54453+00	MODIFIED
17477724-b691-4cac-b5ac-4502d26481a1	b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	content	string	\N	Pruebas de adjuntos	f	2025-12-16 16:27:06.54453+00	MODIFIED
1abdfeb9-7b19-4f75-95a9-00045fd35091	b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	jsonContent	array	\N	[{"id":"20ea3402-7b28-4c39-84b7-4f622380d2f7","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":1,"isToggleable":false},"content":[{"type":"text","text":"Pruebas de adjuntos","styles":{}}],"children":[]},{"id":"ff268a36-fe3a-456a-be12-7281ec7a8491","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"ef79f0f4-a44b-46cd-86b4-9cd434f640f8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 16:27:06.54453+00	MODIFIED
d7bb71de-fbc8-4217-9edc-a650e56f415e	b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 16:27:06.54453+00	MODIFIED
9839fd0b-bf7e-4545-9efe-27e1fc496758	b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	priority	string	\N	medium	f	2025-12-16 16:27:06.54453+00	MODIFIED
d559ad9c-7a4e-4456-b4a2-3610d9efe33b	b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	difficultyLevel	number	\N	2	f	2025-12-16 16:27:06.54453+00	MODIFIED
ecff15f8-c4f4-448e-8be6-35636e056920	b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	isTemplate	boolean	\N	false	f	2025-12-16 16:27:06.54453+00	MODIFIED
6dc7d54b-b917-42cf-a1e0-a37b8384ce33	b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	isPublished	boolean	\N	false	f	2025-12-16 16:27:06.54453+00	MODIFIED
5bf3fd64-f73d-4d94-958c-d1e642b4fb94	b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	tags	array	\N	["FD"]	f	2025-12-16 16:27:06.54453+00	MODIFIED
ca1e6681-35bc-429e-9a7f-9c818399ea12	b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	associatedCases	array	\N	[]	f	2025-12-16 16:27:06.54453+00	MODIFIED
7e6f8b2f-cda3-418e-90da-2f1cc00a1f09	65479071-ae39-4cbd-9096-040ec70ff438	title	string	\N	Pruebas D	f	2025-12-16 17:05:51.759483+00	MODIFIED
aa580ee2-e2fc-4487-b262-aa00e93cc9f1	65479071-ae39-4cbd-9096-040ec70ff438	content	string	\N	Pruebas de adjuntos	f	2025-12-16 17:05:51.759483+00	MODIFIED
a3ba7e7b-d7bd-4122-8819-9207db862e3f	65479071-ae39-4cbd-9096-040ec70ff438	jsonContent	array	\N	[{"id":"20ea3402-7b28-4c39-84b7-4f622380d2f7","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":1,"isToggleable":false},"content":[{"type":"text","text":"Pruebas de adjuntos","styles":{}}],"children":[]},{"id":"ff268a36-fe3a-456a-be12-7281ec7a8491","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"ef79f0f4-a44b-46cd-86b4-9cd434f640f8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 17:05:51.759483+00	MODIFIED
cc05ea35-769c-4fbf-9977-ac9e8c2151c5	65479071-ae39-4cbd-9096-040ec70ff438	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 17:05:51.759483+00	MODIFIED
85183507-b094-49b0-be95-752840796774	65479071-ae39-4cbd-9096-040ec70ff438	priority	string	\N	medium	f	2025-12-16 17:05:51.759483+00	MODIFIED
3b6f50e1-481b-436e-af60-c9ccdbdbda58	65479071-ae39-4cbd-9096-040ec70ff438	difficultyLevel	number	\N	2	f	2025-12-16 17:05:51.759483+00	MODIFIED
358ff778-43fb-44aa-97be-121a3eb87015	65479071-ae39-4cbd-9096-040ec70ff438	isTemplate	boolean	\N	false	f	2025-12-16 17:05:51.759483+00	MODIFIED
72b10a98-e628-4ca0-80f4-03f94604f8cc	65479071-ae39-4cbd-9096-040ec70ff438	isPublished	boolean	\N	false	f	2025-12-16 17:05:51.759483+00	MODIFIED
733beb6b-d2b4-4db0-afb7-ed27d1bb5f04	65479071-ae39-4cbd-9096-040ec70ff438	tags	array	\N	["FD"]	f	2025-12-16 17:05:51.759483+00	MODIFIED
8a309600-14be-49b9-af33-0854c58a4044	65479071-ae39-4cbd-9096-040ec70ff438	associatedCases	array	\N	[]	f	2025-12-16 17:05:51.759483+00	MODIFIED
02e76a2e-0fd7-4691-950f-400edea1a0fa	fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	title	string	\N	Pruebas D	f	2025-12-16 18:42:27.230814+00	MODIFIED
6252c4c7-1415-48b4-8b19-a90ce1311037	fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	content	string	\N	Pruebas de adjuntos	f	2025-12-16 18:42:27.230814+00	MODIFIED
0a5d49e0-0ee0-4a5b-95a7-654252bece83	65cba637-ae5c-470b-abf5-0ca3efce802c	manipulacionDatos	number	\N	1	f	2025-12-17 12:55:46.305737+00	ADDED
efccdd40-80fc-4cff-aea4-025e40d57d11	65cba637-ae5c-470b-abf5-0ca3efce802c	claridadDescripcion	number	\N	2	f	2025-12-17 12:55:46.305737+00	ADDED
512c3eb5-9a15-460f-9c43-e6bd40ee87b0	65cba637-ae5c-470b-abf5-0ca3efce802c	causaFallo	number	\N	2	f	2025-12-17 12:55:46.305737+00	ADDED
de74503f-ff2f-41d9-bad9-9e50bd94db49	65cba637-ae5c-470b-abf5-0ca3efce802c	puntuacion	number	\N	7	f	2025-12-17 12:55:46.305737+00	ADDED
d2f61141-e6d5-4d42-b960-2ffe164b7a38	fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	jsonContent	array	\N	[{"id":"20ea3402-7b28-4c39-84b7-4f622380d2f7","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":1,"isToggleable":false},"content":[{"type":"text","text":"Pruebas de adjuntos","styles":{}}],"children":[]},{"id":"ff268a36-fe3a-456a-be12-7281ec7a8491","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"ef79f0f4-a44b-46cd-86b4-9cd434f640f8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 18:42:27.230814+00	MODIFIED
bcdbfcee-65ed-4674-9783-324220d7f570	fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 18:42:27.230814+00	MODIFIED
a8f95728-fe14-4d42-8219-418b693933c2	fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	priority	string	\N	medium	f	2025-12-16 18:42:27.230814+00	MODIFIED
effe2057-62a0-486a-9195-075ceb20b8a9	fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	difficultyLevel	number	\N	2	f	2025-12-16 18:42:27.230814+00	MODIFIED
f3afb671-a6d8-49c9-9fca-a1d4c4852683	fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	isTemplate	boolean	\N	false	f	2025-12-16 18:42:27.230814+00	MODIFIED
388ba54a-e861-4bb5-8b34-4f100307ea4b	fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	isPublished	boolean	\N	false	f	2025-12-16 18:42:27.230814+00	MODIFIED
b71ee2b4-cc05-46f9-8d8e-2b6fd0b1c564	fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	tags	array	\N	["FD"]	f	2025-12-16 18:42:27.230814+00	MODIFIED
61bd06f8-a4f6-4b2f-91ba-513e3e77948f	fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	associatedCases	array	\N	[]	f	2025-12-16 18:42:27.230814+00	MODIFIED
54c95cd3-5f00-4bcd-905b-4e480b01e9d3	f672d784-d23b-4879-920e-c9b2040de1b4	title	string	\N	Pruebas D	f	2025-12-16 18:42:37.933343+00	MODIFIED
4dbf448f-d9f6-4ec1-8620-70f28f86d3dd	f672d784-d23b-4879-920e-c9b2040de1b4	content	string	\N	Pruebas de adjuntos	f	2025-12-16 18:42:37.933343+00	MODIFIED
13db6a8b-3a8d-40db-a0ba-584487dd8425	f672d784-d23b-4879-920e-c9b2040de1b4	jsonContent	array	\N	[{"id":"20ea3402-7b28-4c39-84b7-4f622380d2f7","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":1,"isToggleable":false},"content":[{"type":"text","text":"Pruebas de adjuntos","styles":{}}],"children":[]},{"id":"ff268a36-fe3a-456a-be12-7281ec7a8491","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"ef79f0f4-a44b-46cd-86b4-9cd434f640f8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 18:42:37.933343+00	MODIFIED
50ea37b0-8cf1-4bfd-acc2-35aadc1a0e44	f672d784-d23b-4879-920e-c9b2040de1b4	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 18:42:37.933343+00	MODIFIED
9ea28379-80cf-4672-aa07-07a11893bb50	f672d784-d23b-4879-920e-c9b2040de1b4	priority	string	\N	medium	f	2025-12-16 18:42:37.933343+00	MODIFIED
6cd87940-ee95-4079-803d-cf39fafc0e8b	f672d784-d23b-4879-920e-c9b2040de1b4	difficultyLevel	number	\N	2	f	2025-12-16 18:42:37.933343+00	MODIFIED
58524aaf-016c-40b8-884c-84e2e3dd53f5	f672d784-d23b-4879-920e-c9b2040de1b4	isTemplate	boolean	\N	false	f	2025-12-16 18:42:37.933343+00	MODIFIED
d029739c-0e99-4ee3-b6ec-abdfb4cdc508	f672d784-d23b-4879-920e-c9b2040de1b4	isPublished	boolean	\N	false	f	2025-12-16 18:42:37.933343+00	MODIFIED
204c79d0-fce4-4672-8868-41b184b43064	f672d784-d23b-4879-920e-c9b2040de1b4	tags	array	\N	["FD"]	f	2025-12-16 18:42:37.933343+00	MODIFIED
1a823140-b0a9-4deb-a857-b2ee49b9f9ce	f672d784-d23b-4879-920e-c9b2040de1b4	associatedCases	array	\N	[]	f	2025-12-16 18:42:37.933343+00	MODIFIED
6739d7dd-1e79-4bc7-a039-20c59609554a	d758ac3a-e923-4bea-86e8-698c5929c6d1	title	string	\N	Pruebas D	f	2025-12-16 18:43:49.835295+00	MODIFIED
7a5f8ae5-67af-4e2a-a7e9-fc9889f71743	d758ac3a-e923-4bea-86e8-698c5929c6d1	content	string	\N	Pruebas de adjuntos	f	2025-12-16 18:43:49.835295+00	MODIFIED
d9bf5a69-1877-4b97-b76f-90f5952256c4	d758ac3a-e923-4bea-86e8-698c5929c6d1	jsonContent	array	\N	[{"id":"20ea3402-7b28-4c39-84b7-4f622380d2f7","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":1,"isToggleable":false},"content":[{"type":"text","text":"Pruebas de adjuntos","styles":{}}],"children":[]},{"id":"ff268a36-fe3a-456a-be12-7281ec7a8491","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"ef79f0f4-a44b-46cd-86b4-9cd434f640f8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 18:43:49.835295+00	MODIFIED
63bdf712-e0f7-4a8e-bedf-369640b7592c	d758ac3a-e923-4bea-86e8-698c5929c6d1	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 18:43:49.835295+00	MODIFIED
a9cbff3e-1141-4d67-b829-6f89e2626856	d758ac3a-e923-4bea-86e8-698c5929c6d1	priority	string	\N	medium	f	2025-12-16 18:43:49.835295+00	MODIFIED
61a6ff84-b4e3-450e-b252-3f3404b736da	d758ac3a-e923-4bea-86e8-698c5929c6d1	difficultyLevel	number	\N	2	f	2025-12-16 18:43:49.835295+00	MODIFIED
91399267-742e-4432-afd8-605206084dfb	d758ac3a-e923-4bea-86e8-698c5929c6d1	isTemplate	boolean	\N	false	f	2025-12-16 18:43:49.835295+00	MODIFIED
a2665db3-3665-44d4-8ed7-3650f4b756e9	d758ac3a-e923-4bea-86e8-698c5929c6d1	isPublished	boolean	\N	false	f	2025-12-16 18:43:49.835295+00	MODIFIED
e6ebbf7a-d271-48d2-bdda-7986675735db	d758ac3a-e923-4bea-86e8-698c5929c6d1	tags	array	\N	["FD"]	f	2025-12-16 18:43:49.835295+00	MODIFIED
fe31e496-4d13-4b59-9dd0-5d360c399791	d758ac3a-e923-4bea-86e8-698c5929c6d1	associatedCases	array	\N	[]	f	2025-12-16 18:43:49.835295+00	MODIFIED
cc7d5862-c23a-4b1a-95a1-90d2f619c388	93c789c6-c7a0-481c-8cc2-927f78dd1c18	title	string	\N	Pruebas D	f	2025-12-16 19:54:51.806985+00	MODIFIED
0fff2f90-8b3b-483f-82ea-bf779b8991e8	93c789c6-c7a0-481c-8cc2-927f78dd1c18	content	string	\N	Pruebas de adjuntos	f	2025-12-16 19:54:51.806985+00	MODIFIED
90ce4274-e39d-4154-a1c3-cf440b7c45d0	93c789c6-c7a0-481c-8cc2-927f78dd1c18	jsonContent	array	\N	[{"id":"20ea3402-7b28-4c39-84b7-4f622380d2f7","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":1,"isToggleable":false},"content":[{"type":"text","text":"Pruebas de adjuntos","styles":{}}],"children":[]},{"id":"ff268a36-fe3a-456a-be12-7281ec7a8491","type":"image","props":{"backgroundColor":"default","textAlignment":"left","name":"KaOzAnd (1).jpg","url":"https://casemanagement.todosistemassti.co/api/files/knowledge/view/58dbb2db6a2d31b6_KaOzAnd (1).jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YzFiMDVkNy1kOThlLTQ1NDMtYWMyNy1kZDFjNzk3NTE3ZTYiLCJpYXQiOjE3NjU5MTQxNDYsImV4cCI6MTc2NjAwMDU0Nn0.G5LFrWErKRJ8Re3hcW0XQJtdbLDL5_d7ES7LIgBuUYs","caption":"","showPreview":true},"children":[]},{"id":"ef79f0f4-a44b-46cd-86b4-9cd434f640f8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]	f	2025-12-16 19:54:51.806985+00	MODIFIED
36040cde-ec36-47e5-a977-eb63a0d05e36	93c789c6-c7a0-481c-8cc2-927f78dd1c18	documentTypeId	string	\N	6acb8396-e3ba-4513-8c9e-afea81f7f411	f	2025-12-16 19:54:51.806985+00	MODIFIED
6f6dc0ae-d2de-4e56-a325-bc857133646d	93c789c6-c7a0-481c-8cc2-927f78dd1c18	priority	string	\N	medium	f	2025-12-16 19:54:51.806985+00	MODIFIED
f6301ace-7da4-41af-9b89-4d18080685da	93c789c6-c7a0-481c-8cc2-927f78dd1c18	difficultyLevel	number	\N	2	f	2025-12-16 19:54:51.806985+00	MODIFIED
5a7ac2f9-9324-4291-9c7f-301b5fb7a46a	93c789c6-c7a0-481c-8cc2-927f78dd1c18	isTemplate	boolean	\N	false	f	2025-12-16 19:54:51.806985+00	MODIFIED
a4aa663a-88f5-40bc-88ae-a74383582089	93c789c6-c7a0-481c-8cc2-927f78dd1c18	isPublished	boolean	\N	false	f	2025-12-16 19:54:51.806985+00	MODIFIED
7235fb88-6d15-4bef-9fbc-57302efc7712	93c789c6-c7a0-481c-8cc2-927f78dd1c18	tags	array	\N	["FD"]	f	2025-12-16 19:54:51.806985+00	MODIFIED
219698b2-21eb-450a-bd2f-17f0c6c3a5ef	93c789c6-c7a0-481c-8cc2-927f78dd1c18	associatedCases	array	\N	[]	f	2025-12-16 19:54:51.806985+00	MODIFIED
797fbc54-96ca-4156-88c4-3137792a5d0c	65cba637-ae5c-470b-abf5-0ca3efce802c	numeroCaso	string	\N	Pruebas1	f	2025-12-17 12:55:46.305737+00	ADDED
be8ab59c-5bfd-49b4-a94d-800ffde992eb	65cba637-ae5c-470b-abf5-0ca3efce802c	descripcion	string	\N	Pruebas 1	f	2025-12-17 12:55:46.305737+00	ADDED
0fd5c1fa-69b5-40c6-a758-bf44832bd894	65cba637-ae5c-470b-abf5-0ca3efce802c	fecha	date	\N	2025-12-17	f	2025-12-17 12:55:46.305737+00	ADDED
ea66c363-eb1f-442e-8e42-ade1f3eac8c3	65cba637-ae5c-470b-abf5-0ca3efce802c	originId	string	\N	dd706d37-eec7-4f76-a46e-35bdd0f60d40	f	2025-12-17 12:55:46.305737+00	ADDED
2fa122c6-7f79-4c57-b769-02bbea28d792	65cba637-ae5c-470b-abf5-0ca3efce802c	applicationId	string	\N	f0fdda4a-bb19-4a9e-9e09-0e7b1a9af863	f	2025-12-17 12:55:46.305737+00	ADDED
ad5a8c79-ae22-4fcd-98c6-916e1e52eb43	65cba637-ae5c-470b-abf5-0ca3efce802c	historialCaso	number	\N	1	f	2025-12-17 12:55:46.305737+00	ADDED
78d0e734-42cf-4d66-9655-3a68f25cd593	65cba637-ae5c-470b-abf5-0ca3efce802c	conocimientoModulo	number	\N	1	f	2025-12-17 12:55:46.305737+00	ADDED
efaeaa51-4039-4801-a67f-1cd4c0f6f6d3	65cba637-ae5c-470b-abf5-0ca3efce802c	clasificacion	string	\N	Media Complejidad	f	2025-12-17 12:55:46.305737+00	ADDED
11657470-6592-4fb7-81e3-a69c7cc96deb	65cba637-ae5c-470b-abf5-0ca3efce802c	estado	string	\N	nuevo	f	2025-12-17 12:55:46.305737+00	ADDED
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, user_email, user_name, user_role, entity_type, entity_id, entity_name, module, operation_context, ip_address, user_agent, session_id, request_path, request_method, created_at, action, operation_success, error_message) FROM stdin;
935159e4-9289-465e-b1fd-7f592a18dc07	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	user_profiles	7bbf35d0-ba0e-4eee-a7da-624175592b63	Henry Andrés Jurgensen Álzate	users	{"requestBody": {"email": "hjurgensen@todosistemassti.co", "fullName": "Henry Andrés Jurgensen Álzate", "isActive": true, "password": ".10121992.", "roleName": "Analista de Aplicaciones"}, "responseStatus": 201}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/users	POST	2025-12-16 13:08:05.065325+00	CREATE	t	\N
e9084c5a-0aad-411e-8716-949dfa967538	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	user_profiles	49eca648-3aba-4f64-bd3e-23c60331dc7d	William Vega Baquero	users	{"requestBody": {"email": "wvega@todosistemassti.co", "fullName": "William Vega Baquero", "isActive": true, "password": ".123456.", "roleName": "Usuario"}, "responseStatus": 201}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/users	POST	2025-12-16 13:09:34.279575+00	CREATE	t	\N
f5234c6d-7be8-42c1-a445-b4e7b1515caa	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	user_profiles	49eca648-3aba-4f64-bd3e-23c60331dc7d	William Vega Baquero	users	{"updateData": {"email": "wvega@todosistemassti.co", "fullName": "William Vega Baquero", "isActive": true, "roleName": "Administrador"}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/users/49eca648-3aba-4f64-bd3e-23c60331dc7d	PUT	2025-12-16 13:10:46.376994+00	UPDATE	t	\N
14e9b84f-1eca-44f9-85d7-1032c1594fbe	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	user_profiles	49eca648-3aba-4f64-bd3e-23c60331dc7d	William Vega Baquero	users	{"updateData": {"email": "wvega@todosistemassti.co", "fullName": "William Vega Baquero", "isActive": true, "roleName": "Administrador"}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/users/49eca648-3aba-4f64-bd3e-23c60331dc7d	PUT	2025-12-16 13:12:36.768186+00	UPDATE	t	\N
46ec5056-f3ae-4b5e-8ee3-16c490a113e3	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	user_profiles	49eca648-3aba-4f64-bd3e-23c60331dc7d	William Vega Baquero	users	{"updateData": {"email": "wvega@todosistemassti.co", "fullName": "William Vega Baquero", "isActive": true, "roleName": "Administrador"}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/users/49eca648-3aba-4f64-bd3e-23c60331dc7d	PUT	2025-12-16 13:12:40.848081+00	UPDATE	t	\N
9c0cf056-f569-4180-a6f1-f10f056423e7	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	user_profiles	6188fc14-ce7e-43f2-98e4-fcb8a75d705b	William Vega Baquero	users	{"requestBody": {"email": "wvega@todosistemassti.co", "fullName": "William Vega Baquero", "isActive": true, "password": ".123456.", "roleName": "Administrador"}, "responseStatus": 201}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/users	POST	2025-12-16 13:13:47.36719+00	CREATE	t	\N
3df57949-d260-4b91-8fe0-21eee9f0c560	6188fc14-ce7e-43f2-98e4-fcb8a75d705b	wvega@todosistemassti.co	William Vega Baquero	Administrador	knowledge_documents	f7f42986-9497-41d8-b106-c63510d3737a	Prueba	knowledge	{"requestBody": {"title": "Prueba", "content": "", "priority": "medium", "isTemplate": false, "jsonContent": {"type": "doc", "content": [{"type": "paragraph", "content": []}]}}, "responseStatus": 201}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	/api/knowledge	POST	2025-12-16 13:15:05.239908+00	CREATE	t	\N
ad73137f-32f2-4fc9-9728-caebdfc9e1c9	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	f7f42986-9497-41d8-b106-c63510d3737a	Prueba	knowledge	{"updateData": {"title": "Prueba", "content": "", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "94610123-d261-47e1-ae07-6868f341a538", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 1}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/f7f42986-9497-41d8-b106-c63510d3737a	PUT	2025-12-16 14:45:09.830856+00	UPDATE	t	\N
9ae8fef4-02f3-424d-8d36-cf4cd3b8d058	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	f7f42986-9497-41d8-b106-c63510d3737a	Prueba	knowledge	{"updateData": {"title": "Prueba", "content": "Pruebas!!", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "94610123-d261-47e1-ae07-6868f341a538", "type": "heading", "props": {"level": 1, "textColor": "default", "isToggleable": false, "textAlignment": "left", "backgroundColor": "default"}, "content": [{"text": "Pruebas!!", "type": "text", "styles": {}}], "children": []}, {"id": "1ebd160b-4ccb-4e07-a94d-51f2ed1fe35e", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 1}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/f7f42986-9497-41d8-b106-c63510d3737a	PUT	2025-12-16 14:49:43.225808+00	UPDATE	t	\N
89192930-8131-440d-a48e-f0f02251ab7e	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	Pruebas D	knowledge	{"requestBody": {"title": "Pruebas D", "content": "", "priority": "medium", "isTemplate": false, "jsonContent": {"type": "doc", "content": [{"type": "paragraph", "content": []}]}}, "responseStatus": 201}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge	POST	2025-12-16 15:47:54.480858+00	CREATE	t	\N
2d95a8e2-f4e6-4075-8f97-954b8a196d4f	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	Pruebas D	knowledge	{"updateData": {"title": "Pruebas D", "content": "", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "20ea3402-7b28-4c39-84b7-4f622380d2f7", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 1}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	PUT	2025-12-16 15:48:10.231685+00	UPDATE	t	\N
d2235a37-5188-4c90-8122-9866fef326e2	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	Pruebas D	knowledge	{"updateData": {"tags": ["FD"], "title": "Pruebas D", "content": "Pruebas de adjuntos", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "20ea3402-7b28-4c39-84b7-4f622380d2f7", "type": "heading", "props": {"level": 1, "textColor": "default", "isToggleable": false, "textAlignment": "left", "backgroundColor": "default"}, "content": [{"text": "Pruebas de adjuntos", "type": "text", "styles": {}}], "children": []}, {"id": "ff268a36-fe3a-456a-be12-7281ec7a8491", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}, {"id": "ef79f0f4-a44b-46cd-86b4-9cd434f640f8", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 2}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	PUT	2025-12-16 15:48:56.657008+00	UPDATE	t	\N
3b698bc5-03ad-4c7f-b084-644ce89213a7	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	Pruebas D	knowledge	{"updateData": {"tags": ["FD"], "title": "Pruebas D", "content": "Pruebas de adjuntos", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "20ea3402-7b28-4c39-84b7-4f622380d2f7", "type": "heading", "props": {"level": 1, "textColor": "default", "isToggleable": false, "textAlignment": "left", "backgroundColor": "default"}, "content": [{"text": "Pruebas de adjuntos", "type": "text", "styles": {}}], "children": []}, {"id": "ff268a36-fe3a-456a-be12-7281ec7a8491", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}, {"id": "ef79f0f4-a44b-46cd-86b4-9cd434f640f8", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 2}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	PUT	2025-12-16 15:52:20.141743+00	UPDATE	t	\N
b4874ee3-d8ef-4a4e-82a1-2cbd2b05aa8a	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	Pruebas D	knowledge	{"updateData": {"tags": ["FD"], "title": "Pruebas D", "content": "Pruebas de adjuntos", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "20ea3402-7b28-4c39-84b7-4f622380d2f7", "type": "heading", "props": {"level": 1, "textColor": "default", "isToggleable": false, "textAlignment": "left", "backgroundColor": "default"}, "content": [{"text": "Pruebas de adjuntos", "type": "text", "styles": {}}], "children": []}, {"id": "ff268a36-fe3a-456a-be12-7281ec7a8491", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}, {"id": "ef79f0f4-a44b-46cd-86b4-9cd434f640f8", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 2}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	PUT	2025-12-16 16:27:06.538489+00	UPDATE	t	\N
65479071-ae39-4cbd-9096-040ec70ff438	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	Pruebas D	knowledge	{"updateData": {"tags": ["FD"], "title": "Pruebas D", "content": "Pruebas de adjuntos", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "20ea3402-7b28-4c39-84b7-4f622380d2f7", "type": "heading", "props": {"level": 1, "textColor": "default", "isToggleable": false, "textAlignment": "left", "backgroundColor": "default"}, "content": [{"text": "Pruebas de adjuntos", "type": "text", "styles": {}}], "children": []}, {"id": "ff268a36-fe3a-456a-be12-7281ec7a8491", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}, {"id": "ef79f0f4-a44b-46cd-86b4-9cd434f640f8", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 2}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	PUT	2025-12-16 17:05:51.756737+00	UPDATE	t	\N
fb8a4675-4b6d-4192-84ae-f8b4bb1086bb	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	Pruebas D	knowledge	{"updateData": {"tags": ["FD"], "title": "Pruebas D", "content": "Pruebas de adjuntos", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "20ea3402-7b28-4c39-84b7-4f622380d2f7", "type": "heading", "props": {"level": 1, "textColor": "default", "isToggleable": false, "textAlignment": "left", "backgroundColor": "default"}, "content": [{"text": "Pruebas de adjuntos", "type": "text", "styles": {}}], "children": []}, {"id": "ff268a36-fe3a-456a-be12-7281ec7a8491", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}, {"id": "ef79f0f4-a44b-46cd-86b4-9cd434f640f8", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 2}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	PUT	2025-12-16 18:42:27.227774+00	UPDATE	t	\N
f672d784-d23b-4879-920e-c9b2040de1b4	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	Pruebas D	knowledge	{"updateData": {"tags": ["FD"], "title": "Pruebas D", "content": "Pruebas de adjuntos", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "20ea3402-7b28-4c39-84b7-4f622380d2f7", "type": "heading", "props": {"level": 1, "textColor": "default", "isToggleable": false, "textAlignment": "left", "backgroundColor": "default"}, "content": [{"text": "Pruebas de adjuntos", "type": "text", "styles": {}}], "children": []}, {"id": "ff268a36-fe3a-456a-be12-7281ec7a8491", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}, {"id": "ef79f0f4-a44b-46cd-86b4-9cd434f640f8", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 2}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	PUT	2025-12-16 18:42:37.931072+00	UPDATE	t	\N
d758ac3a-e923-4bea-86e8-698c5929c6d1	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	Pruebas D	knowledge	{"updateData": {"tags": ["FD"], "title": "Pruebas D", "content": "Pruebas de adjuntos", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "20ea3402-7b28-4c39-84b7-4f622380d2f7", "type": "heading", "props": {"level": 1, "textColor": "default", "isToggleable": false, "textAlignment": "left", "backgroundColor": "default"}, "content": [{"text": "Pruebas de adjuntos", "type": "text", "styles": {}}], "children": []}, {"id": "ff268a36-fe3a-456a-be12-7281ec7a8491", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}, {"id": "ef79f0f4-a44b-46cd-86b4-9cd434f640f8", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 2}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	PUT	2025-12-16 18:43:49.832684+00	UPDATE	t	\N
93c789c6-c7a0-481c-8cc2-927f78dd1c18	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	Administrador	knowledge_documents	2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	Pruebas D	knowledge	{"updateData": {"tags": ["FD"], "title": "Pruebas D", "content": "Pruebas de adjuntos", "priority": "medium", "isTemplate": false, "isPublished": false, "jsonContent": [{"id": "20ea3402-7b28-4c39-84b7-4f622380d2f7", "type": "heading", "props": {"level": 1, "textColor": "default", "isToggleable": false, "textAlignment": "left", "backgroundColor": "default"}, "content": [{"text": "Pruebas de adjuntos", "type": "text", "styles": {}}], "children": []}, {"id": "ff268a36-fe3a-456a-be12-7281ec7a8491", "type": "image", "props": {"url": "https://casemanagement.todosistemassti.co/api/files/knowledge/view/58dbb2db6a2d31b6_KaOzAnd (1).jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YzFiMDVkNy1kOThlLTQ1NDMtYWMyNy1kZDFjNzk3NTE3ZTYiLCJpYXQiOjE3NjU5MTQxNDYsImV4cCI6MTc2NjAwMDU0Nn0.G5LFrWErKRJ8Re3hcW0XQJtdbLDL5_d7ES7LIgBuUYs", "name": "KaOzAnd (1).jpg", "caption": "", "showPreview": true, "textAlignment": "left", "backgroundColor": "default"}, "children": []}, {"id": "ef79f0f4-a44b-46cd-86b4-9cd434f640f8", "type": "paragraph", "props": {"textColor": "default", "textAlignment": "left", "backgroundColor": "default"}, "content": [], "children": []}], "documentTypeId": "6acb8396-e3ba-4513-8c9e-afea81f7f411", "associatedCases": [], "difficultyLevel": 2}, "originalData": null, "responseStatus": 200}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/knowledge/2c5d2e2b-8bcb-4c7a-b003-cc7f60609d3d	PUT	2025-12-16 19:54:51.801578+00	UPDATE	t	\N
fb6e6aca-bb5b-47fa-bb09-ba9a7c2a5adb	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	1cf234fc-8db1-414d-b736-cd2c73cb9d07	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 00:06:35.372602+00	FORCE_LOGOUT	t	\N
d86e284b-b4ef-4c86-8da7-4da71ea9b9ae	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	9afd4934-e15f-44df-baeb-0bf012959219	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "9afd4934-e15f-44df-baeb-0bf012959219", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 00:06:35.392054+00	LOGIN	t	\N
9f572c47-d437-4b12-82ef-0b9104537027	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	9afd4934-e15f-44df-baeb-0bf012959219	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 00:07:18.344527+00	FORCE_LOGOUT	t	\N
c79d2123-c7ae-4f10-bd6b-be4849e3fdb4	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	747d5daa-a48a-4046-8fe2-c588c3a036a9	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "747d5daa-a48a-4046-8fe2-c588c3a036a9", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 00:07:18.354975+00	LOGIN	t	\N
e3b90d88-1176-40ab-9b76-8ee6b93252c4	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	747d5daa-a48a-4046-8fe2-c588c3a036a9	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 00:11:30.921954+00	FORCE_LOGOUT	t	\N
eeaa0788-df93-4b29-8e72-f1af6feaf4ab	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	aac38d3c-1146-487d-968c-a439f0e577a1	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "aac38d3c-1146-487d-968c-a439f0e577a1", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 00:11:30.928352+00	LOGIN	t	\N
78e7711a-b611-41f1-b621-dd9921c9d3fc	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	aac38d3c-1146-487d-968c-a439f0e577a1	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 00:51:26.227425+00	FORCE_LOGOUT	t	\N
84d31767-9f37-4749-84f0-301ad7b64387	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	fd9ce7da-45fe-4266-a038-bb5c14d3a7d3	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "fd9ce7da-45fe-4266-a038-bb5c14d3a7d3", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 00:51:26.245978+00	LOGIN	t	\N
d68c38c9-523b-4333-ab89-2e9813851faf	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	fd9ce7da-45fe-4266-a038-bb5c14d3a7d3	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 00:51:56.245906+00	FORCE_LOGOUT	t	\N
7d4bddfd-0773-4396-8370-7d49c8d71e0e	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	5c4cf398-b7a4-45bf-9ae8-9ec2b0774e5e	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "5c4cf398-b7a4-45bf-9ae8-9ec2b0774e5e", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 00:51:56.256813+00	LOGIN	t	\N
9c25cf34-8acc-4411-a82f-be000b375368	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	5c4cf398-b7a4-45bf-9ae8-9ec2b0774e5e	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 01:48:54.586781+00	FORCE_LOGOUT	t	\N
5800ea30-2a84-44ec-aff9-c7d6e10f7a26	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	e408f809-b8e1-4d81-82f9-11db28a9f1b6	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "e408f809-b8e1-4d81-82f9-11db28a9f1b6", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 01:48:54.595057+00	LOGIN	t	\N
5bb2f1c4-84cb-417e-9e5d-73245605c602	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	e408f809-b8e1-4d81-82f9-11db28a9f1b6	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:11:43.337981+00	FORCE_LOGOUT	t	\N
4179aa67-3c66-4c35-b058-0c6e11021df5	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	53bc007d-2abb-4483-9fe7-eda0e507ea64	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "53bc007d-2abb-4483-9fe7-eda0e507ea64", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:11:43.353272+00	LOGIN	t	\N
1285393d-7d52-4e1e-96cd-20a0b8ae81c9	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	53bc007d-2abb-4483-9fe7-eda0e507ea64	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:13:14.530305+00	FORCE_LOGOUT	t	\N
af38acae-25c8-4871-9b13-faaf8faa65ab	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	dc20a018-9d09-4aa3-8c39-20bddfaaffd2	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "dc20a018-9d09-4aa3-8c39-20bddfaaffd2", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:13:14.546188+00	LOGIN	t	\N
dfb8bcd9-5008-4bde-bf7e-30951ef874b3	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	dc20a018-9d09-4aa3-8c39-20bddfaaffd2	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:21:15.433724+00	FORCE_LOGOUT	t	\N
7514f4c3-9a2e-4f8c-a651-ed8773fadae6	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	ebcd9760-47bb-4fa3-86d9-9e606d519fd9	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "ebcd9760-47bb-4fa3-86d9-9e606d519fd9", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:21:15.445985+00	LOGIN	t	\N
09f5d8fa-a83c-4a44-b38e-f4b4819ce394	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	ebcd9760-47bb-4fa3-86d9-9e606d519fd9	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:21:59.290501+00	FORCE_LOGOUT	t	\N
c25a11dd-5ee6-4e71-ba81-ccbe3bc42335	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	7e24a852-192c-4226-b593-9a3182216cda	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "7e24a852-192c-4226-b593-9a3182216cda", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:21:59.296012+00	LOGIN	t	\N
31ec4320-e41e-4afc-8223-b383a937aba1	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	7e24a852-192c-4226-b593-9a3182216cda	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:26:47.487738+00	FORCE_LOGOUT	t	\N
a8f50288-1792-4536-b949-9047517f6c87	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	44961211-5649-4997-9849-7c31f14cb5f0	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "44961211-5649-4997-9849-7c31f14cb5f0", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:26:47.49399+00	LOGIN	t	\N
3287e65a-2ea9-483b-aab0-18f3ae2cf748	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	44961211-5649-4997-9849-7c31f14cb5f0	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:27:15.132568+00	FORCE_LOGOUT	t	\N
37b95514-19e9-4e8a-9e20-7197651af5be	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	8b235011-1087-48eb-bcb8-bdfd6855c53f	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "8b235011-1087-48eb-bcb8-bdfd6855c53f", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:27:15.138802+00	LOGIN	t	\N
49f7781d-cd6f-4fab-bc38-d7bb97fc712d	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	dcaa4d55-5ea7-404c-8be8-eed928d1fc6f	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "dcaa4d55-5ea7-404c-8be8-eed928d1fc6f", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:28:20.091542+00	LOGIN	t	\N
e1b43a5c-917e-4b18-8326-4a8cf602dc23	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	dcaa4d55-5ea7-404c-8be8-eed928d1fc6f	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:29:00.054439+00	FORCE_LOGOUT	t	\N
a58b62cb-b59f-4bf0-8bea-e7eb93e5e546	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	be959f8e-ec19-46fa-82f0-94f04373d916	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "be959f8e-ec19-46fa-82f0-94f04373d916", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:29:00.059154+00	LOGIN	t	\N
d9806146-9029-4829-8ac5-30d16a6d4162	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	8b235011-1087-48eb-bcb8-bdfd6855c53f	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:45:15.34286+00	FORCE_LOGOUT	t	\N
5483ccdf-98c3-4141-8f50-71efdba5e1be	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	f4f69413-7eed-4d32-bf80-2240de3873bf	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "f4f69413-7eed-4d32-bf80-2240de3873bf", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 02:45:15.360159+00	LOGIN	t	\N
52564b91-9113-4e15-9da6-c0918bc0da59	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	f4f69413-7eed-4d32-bf80-2240de3873bf	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	\N	\N	2025-12-17 02:46:20.558649+00	FORCE_LOGOUT	t	\N
f0927d02-a227-4bfe-bd0b-4052c01f8bca	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	cc25f7f3-afc2-4510-ae9a-77722b760c7e	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "cc25f7f3-afc2-4510-ae9a-77722b760c7e", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Chrome 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	\N	\N	2025-12-17 02:46:20.571189+00	LOGIN	t	\N
99e3e1c2-84a3-4e8a-8d84-375e564611c0	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	cc25f7f3-afc2-4510-ae9a-77722b760c7e	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Chrome 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 03:30:34.589796+00	FORCE_LOGOUT	t	\N
5fb2a9e3-6758-4fca-85ef-46f7ebadabad	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	9f11646f-af5e-489d-92fd-0f87dd64337d	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "9f11646f-af5e-489d-92fd-0f87dd64337d", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 03:30:34.607477+00	LOGIN	t	\N
1e539e5c-ad07-4871-8f0c-9879145a41f4	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	be959f8e-ec19-46fa-82f0-94f04373d916	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 03:44:52.97942+00	FORCE_LOGOUT	t	\N
4119d28e-e449-4973-9306-aa7bb14bb8b5	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	070f0784-f12a-4081-a2fa-76c19bc08f8d	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "070f0784-f12a-4081-a2fa-76c19bc08f8d", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 03:44:52.996428+00	LOGIN	t	\N
48fc24ea-86f3-4a4d-a45f-4e87802b0048	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	070f0784-f12a-4081-a2fa-76c19bc08f8d	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 03:58:24.121857+00	FORCE_LOGOUT	t	\N
5c6ed8a2-6dae-40ca-838d-e30e5c01f7bf	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	b3e2e6b3-04c4-4e6d-ad2f-766f7966e469	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "b3e2e6b3-04c4-4e6d-ad2f-766f7966e469", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 03:58:24.134353+00	LOGIN	t	\N
8a6f49b0-ed71-4b73-916f-b17445f29b81	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	b3e2e6b3-04c4-4e6d-ad2f-766f7966e469	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 12:52:03.085977+00	FORCE_LOGOUT	t	\N
90fc5ed0-19cc-43d6-b5ae-6bcc63fbee51	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	dadbae05-0f6a-4149-aed9-c139303d31a7	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "dadbae05-0f6a-4149-aed9-c139303d31a7", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 12:52:03.091743+00	LOGIN	t	\N
100c6538-ddfa-4a04-8de5-9da914557f42	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	dadbae05-0f6a-4149-aed9-c139303d31a7	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 12:52:42.143013+00	FORCE_LOGOUT	t	\N
78eb6426-e68d-4373-acb8-3becc25e9e6e	7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	\N	UserSession	96613dce-4c38-4360-a488-8564b0598bfc	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "96613dce-4c38-4360-a488-8564b0598bfc", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 12:52:42.148608+00	LOGIN	t	\N
acd8ffa7-32bb-42d2-9f35-85f2ad654f98	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	9f11646f-af5e-489d-92fd-0f87dd64337d	\N	SessionManagement	{"device": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}, "reason": "new_login", "message": "Sesión cerrada automáticamente por nuevo login"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 12:54:02.396357+00	FORCE_LOGOUT	t	\N
41c54cef-ff22-4a39-83dc-8b022abc6300	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	\N	UserSession	ee829f6d-6e07-4ef8-8561-36b6ff955a5b	\N	SessionManagement	{"message": "Usuario inició sesión exitosamente", "sessionId": "ee829f6d-6e07-4ef8-8561-36b6ff955a5b", "deviceInfo": {"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	\N	2025-12-17 12:54:02.402139+00	LOGIN	t	\N
65cba637-ae5c-470b-abf5-0ca3efce802c	7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	Analista de Aplicaciones	cases	d4b69325-5de4-4a55-a27e-834cfe0759b4	ID: d4b69325-5de4-4a55-a27e-834cfe0759b4	cases	{"requestBody": {"fecha": "2025-12-17", "estado": "nuevo", "originId": "dd706d37-eec7-4f76-a46e-35bdd0f60d40", "causaFallo": 2, "numeroCaso": "Pruebas1", "puntuacion": 7, "descripcion": "Pruebas 1", "applicationId": "f0fdda4a-bb19-4a9e-9e09-0e7b1a9af863", "clasificacion": "Media Complejidad", "historialCaso": 1, "manipulacionDatos": 1, "conocimientoModulo": 1, "claridadDescripcion": 2}, "responseStatus": 201}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	/api/cases	POST	2025-12-17 12:55:46.302914+00	CREATE	t	\N
\.


--
-- Data for Name: case_control; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.case_control (id, "caseId", "userId", "statusId", "totalTimeMinutes", "timerStartAt", "isTimerActive", "assignedAt", "startedAt", "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: case_status_control; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.case_status_control (id, name, description, color, "displayOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
106b1ddc-3b62-422e-bfd2-ea483eea1399	EN CURSO	Caso siendo trabajado activamente	#3B82F6	2	t	2025-08-27 23:12:23.624765	2025-08-27 23:12:23.624765
ebac9557-6533-4dce-b597-3cb2786f41c4	ESCALADA	Caso escalado a nivel superior	#F59E0B	3	t	2025-08-27 23:12:23.624765	2025-08-27 23:12:23.624765
c263e819-e9b1-48c0-a6d0-c26930570588	TERMINADA	Caso completado exitosamente	#10B981	4	t	2025-08-27 23:12:23.624765	2025-08-27 23:12:23.624765
1f62952a-e5d0-4595-8758-30761bf9fd95	PENDIENTE	Caso asignado pero no iniciado	#6B7280	0	t	2025-08-27 23:12:23.61477	2025-08-27 23:12:23.61477
455ea878-9dfc-4326-871b-f0fdd8b3535e	CDC	Estado  para saber los casos que están en Control De Cambios	#00d9ff	1	t	2025-09-18 19:09:03.282638	2025-09-18 19:09:03.282638
\.


--
-- Data for Name: cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cases (id, clasificacion, estado, observaciones, "fechaVencimiento", "fechaResolucion", "userId", "assignedToId", "applicationId", "originId", "createdAt", "updatedAt", "numeroCaso", descripcion, fecha, "historialCaso", "conocimientoModulo", "manipulacionDatos", "claridadDescripcion", "causaFallo", puntuacion) FROM stdin;
d4b69325-5de4-4a55-a27e-834cfe0759b4	Media Complejidad	nuevo	\N	\N	\N	\N	\N	f0fdda4a-bb19-4a9e-9e09-0e7b1a9af863	dd706d37-eec7-4f76-a46e-35bdd0f60d40	2025-12-17 12:55:46.297471+00	2025-12-17 12:55:46.297471+00	Pruebas1	Pruebas 1	2025-12-17	1	1	1	2	2	7.00
\.


--
-- Data for Name: dispositions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dispositions (id, date, case_id, case_number, script_name, svn_revision_number, application_id, observations, user_id, created_at, updated_at, application_name) FROM stdin;
\.


--
-- Data for Name: document_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_types (id, code, name, description, icon, color, created_by, created_at, updated_at, "isActive", "displayOrder") FROM stdin;
ae2cccde-e7bb-4582-95a9-be90a5da2d61	DOCUMENTACION	DOCUMENTACIÓN CASO	Documentación Caso	📝	#06B6D4	7c1b05d7-d98e-4543-ac27-dd1c797517e6	2025-09-18 19:27:07.413301+00	2025-09-18 19:27:07.413301+00	t	0
6acb8396-e3ba-4513-8c9e-afea81f7f411	ANALISIS	ANÁLISIS DEL CASO	Análisis del Caso	📕	#EAB308	7c1b05d7-d98e-4543-ac27-dd1c797517e6	2025-09-18 19:28:37.067452+00	2025-09-18 19:28:37.067452+00	t	0
4ff6dae3-6ea9-40ce-83e5-79d325226620	PRUEBAS	PRUEBAS	Pruebas	🛠️	#EF4444	7c1b05d7-d98e-4543-ac27-dd1c797517e6	2025-09-18 19:29:08.478738+00	2025-09-18 19:29:08.478738+00	t	0
\.


--
-- Data for Name: knowledge_document_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_document_attachments (id, document_id, file_name, file_path, file_size, mime_type, file_type, file_hash, thumbnail_path, processed_path, is_embedded, uploaded_by, created_at, updated_at, upload_session_id) FROM stdin;
\.


--
-- Data for Name: knowledge_document_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_document_feedback (id, document_id, user_id, is_helpful, comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: knowledge_document_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_document_relations (id, parent_document_id, child_document_id, relation_type, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: knowledge_document_tag_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_document_tag_relations (id, document_id, tag_id, created_at) FROM stdin;
\.


--
-- Data for Name: knowledge_document_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_document_tags (id, document_id, tag_name, created_at, description, color, category, usage_count, is_active, created_by, updated_at) FROM stdin;
2a7e8ff7-68a6-4cfa-80db-90ce2e6221e7	\N	Pruebas	2025-09-10 17:50:59.437399+00	Etiqueta creada automáticamente	#8B5CF6	custom	8	t	7c1b05d7-d98e-4543-ac27-dd1c797517e6	2025-09-10 22:24:15.238397+00
91c7c825-e453-4bfb-8ea1-16d87712cf2a	\N	React	2025-09-10 22:24:15.254389+00	Etiqueta creada automáticamente	#3B82F6	technology	1	t	\N	2025-09-10 22:24:15.254389+00
90723cdf-ca9c-4425-853d-690064752df9	\N	Pruebas	2025-09-10 22:24:15.263384+00	Etiqueta creada automáticamente	#8B5CF6	custom	0	t	7c1b05d7-d98e-4543-ac27-dd1c797517e6	2025-09-10 23:35:52.046918+00
5f6ca263-66cd-4870-8756-cbed79acef08	\N	React	2025-09-10 22:24:15.263384+00	Etiqueta creada automáticamente	#3B82F6	technology	0	t	\N	2025-09-10 23:35:52.046918+00
\.


--
-- Data for Name: knowledge_document_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_document_versions (id, document_id, version_number, content, title, change_summary, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: knowledge_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_documents (id, title, content, json_content, document_type_id, priority, difficulty_level, is_published, is_template, is_deprecated, is_archived, view_count, helpful_count, not_helpful_count, version, published_at, deprecated_at, archived_at, created_by, last_edited_by, archived_by, replacement_document_id, created_at, updated_at, tags_json, associated_cases) FROM stdin;
\.


--
-- Data for Name: knowledge_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_tags (id, tag_name, description, color, is_active, created_by, created_at, updated_at, category) FROM stdin;
b61745a5-0812-4ba0-95ba-7c482e2997a2	FD	Etiqueta creada automáticamente	#F59E0B	t	7c1b05d7-d98e-4543-ac27-dd1c797517e6	2025-12-16 15:48:56.643574+00	2025-12-16 15:48:56.643574+00	custom
\.


--
-- Data for Name: manual_time_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.manual_time_entries (id, "caseControlId", "userId", date, "durationMinutes", description, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: note_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.note_feedback (id, note_id, user_id, rating, comment, was_helpful, created_at) FROM stdin;
\.


--
-- Data for Name: note_tag_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.note_tag_assignments (id, note_id, tag_id, assigned_at, assigned_by) FROM stdin;
\.


--
-- Data for Name: note_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.note_tags (id, name, description, color, category, usage_count, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notes (id, title, content, tags, case_id, created_by, assigned_to, is_important, is_archived, archived_at, archived_by, reminder_date, is_reminder_sent, created_at, updated_at, note_type, priority, difficulty_level, is_template, is_published, is_deprecated, view_count, helpful_count, not_helpful_count, version, complexity_notes, prerequisites, estimated_solution_time, deprecation_reason, replacement_note_id, last_reviewed_at, last_reviewed_by) FROM stdin;
\.


--
-- Data for Name: origenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.origenes (id, nombre, descripcion, activo, "createdAt", "updatedAt") FROM stdin;
594727f5-373b-4d25-8d54-8d051e3a1fde	ACTIVIDAD	Caso de actividades regulares	t	2025-09-18 19:03:31.40366+00	2025-09-18 19:03:31.40366+00
f86eaead-9796-41c5-a4e7-2d8b7ce5e7ec	BACKLOG	Casos provenientes del backlog	t	2025-09-18 19:03:58.214248+00	2025-09-18 19:03:58.214248+00
9ba50872-aed8-4dc1-8255-a27dd7307b6c	CON_CAMBIOS	Casos que requieren control de cambios	t	2025-09-18 19:04:25.715491+00	2025-09-18 19:04:25.715491+00
3e6a0e5a-d54a-4616-a27f-4e09f5a59da1	FALLO	Casos de fallos sobre equipos personales	t	2025-09-18 19:04:47.322682+00	2025-09-18 19:04:47.322682+00
dd706d37-eec7-4f76-a46e-35bdd0f60d40	PRIORIZADA	Casos priorizados	t	2025-09-18 19:05:10.896889+00	2025-09-18 19:05:10.896889+00
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, description, module, action, scope, "isActive", "createdAt", "updatedAt") FROM stdin;
2cbb4f8d-ffa5-4e5c-baa4-4329a54de306	applications.admin.all	Administrar completamente aplicaciones	applications	admin	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
9953e8cf-8c8e-40ba-a494-fc5c46120d73	applications.create.all	Crear aplicaciones	applications	create	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
1006ad31-2cd4-4669-b8a7-0d044d8d7651	applications.delete.all	Eliminar aplicaciones	applications	delete	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
35321f6a-3d79-4837-999b-92c7cc0b8a60	applications.read.all	Ver todas las aplicaciones	applications	read	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
47eedd39-e70b-477b-97ef-131c0a8cec00	applications.update.all	Actualizar aplicaciones	applications	update	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
d5447b3a-c938-4de4-9ff5-8c0abf5a8d7a	archive.create.own	Archivar elementos	archive	create	own	t	2025-09-05 18:06:57.950151+00	2025-09-15 00:42:01.841072+00
63c0f483-d561-4982-b60f-3cf06922d381	archive.delete.admin	Eliminar permanentemente elementos archivados	archive	delete	admin	t	2025-09-05 18:06:57.950151+00	2025-09-15 00:42:01.841072+00
7c39dc69-0821-48cd-a8a0-6f8589becb8c	archive.restore.own	Restaurar elementos archivados	archive	restore	own	t	2025-09-05 18:06:57.950151+00	2025-09-15 00:42:01.841072+00
9061c6a3-3a00-4a47-afb9-1d721c137645	archive.stats.own	Ver estadísticas del archivo	archive	stats	own	t	2025-09-05 18:06:57.950151+00	2025-09-15 00:42:01.841072+00
9e4e583d-abcf-471a-8a4d-56fedb86ce4e	archive.view.own	Ver elementos archivados	archive	view	own	t	2025-09-05 18:06:57.950151+00	2025-09-15 00:42:01.841072+00
093b61dc-b12b-43dd-977a-880c52855ec1	case_statuses.admin.all	Administrar completamente estados de casos	case_statuses	admin	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
0ed81734-5273-44dd-9341-e0ae7eb4dbca	case_statuses.create.all	Crear estados de casos	case_statuses	create	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
8679cf25-2e5b-4941-9c6d-8c4634963285	case_statuses.delete.all	Eliminar estados de casos	case_statuses	delete	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
5bd4214a-0719-4313-8c4f-15c93f764913	case_statuses.read.all	Ver todos los estados de casos	case_statuses	read	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
8e6547cf-357b-4685-92cf-16f34c9bfe17	users.audit.all	Ver auditoría de cambios en usuarios	users	audit	all	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
ab29dea2-bbda-4524-b658-8b8a0de491b5	users.create.all	Crear cualquier usuario en el sistema	users	create	all	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
569bc27d-b531-4695-8c19-a4c15cc1c031	users.create.own	Crear su propio perfil (registro)	users	create	own	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
e6b84acb-76cc-4a3a-8b17-7dfda688361a	users.create.team	Crear usuarios para el equipo	users	create	team	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
580c30d0-c4d5-4e50-9c78-b509bfccf983	users.delete.all	Eliminar cualquier usuario del sistema	users	delete	all	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
1d1b6352-ad86-407c-8f39-2898377cdcbd	users.delete.own	Eliminar su propio perfil	users	delete	own	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
9539932e-de3a-4a45-ba29-689090545bf7	users.delete.team	Eliminar usuarios del mismo equipo	users	delete	team	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
4e9401d3-e56a-4259-b41e-6c657f574971	users.edit.all	Editar cualquier usuario del sistema	users	edit	all	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
8e601213-50e1-48f9-aafb-d6db4bac0abc	users.edit.own	Editar su propio perfil	users	edit	own	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
05c8fc06-57aa-41cf-93bb-b53e0a11bfcc	users.edit.team	Editar usuarios del mismo equipo	users	edit	team	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
d0ba23b4-96f8-48b9-bfc1-5508fff04a94	users.report.all	Ver reportes de todos los usuarios	users	report	all	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
db3d14d8-caf3-4804-aaa0-99681e9192c8	users.report.team	Ver reportes de usuarios del equipo	users	report	team	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
d18e0c73-7118-40de-a9a2-3a680dfb26ef	case_statuses.reorder.all	Reordenar estados de casos	case_statuses	reorder	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
a4c87291-0e60-4376-bfd2-50c6eda88c77	case_statuses.update.all	Actualizar estados de casos	case_statuses	update	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
5385b19f-50f6-433e-8d4c-ef10ce581086	origins.admin.all	Administrar completamente orígenes	origins	admin	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
b0de17f8-ae0e-4856-acf6-68d3a19f1ef7	origins.create.all	Crear orígenes	origins	create	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
f367844a-3f53-410b-b5b7-6ef90925346e	origins.delete.all	Eliminar orígenes	origins	delete	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
e60a43db-0ce1-4e29-9306-cda86cec765f	origins.read.all	Ver todos los orígenes	origins	read	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
eff031b7-0791-4810-baac-d4675556b2ee	origins.update.all	Actualizar orígenes	origins	update	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:01.841072+00
6d36d6a4-4970-4996-b1a8-4d3a7747eb83	permissions.admin.all	Administración completa de permisos	permissions	admin	all	t	2025-08-30 01:56:28.234466+00	2025-09-15 00:42:01.841072+00
5514d6ce-f44b-4fa6-8452-b2cf2db1c6f4	roles.export.team	Permiso para export roles con scope team	roles	export	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
81479c2a-d521-4cba-a21e-1f0e3f2f7aab	roles.manage.team	Permiso para manage roles con scope team	roles	manage	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
2fd7e563-c514-4a0d-8df3-45acac02bcc9	roles.report.own	Permiso para report roles con scope own	roles	report	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
e52931d5-fd73-437e-a751-6613d4bf686b	roles.report.team	Permiso para report roles con scope team	roles	report	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
de256dc8-4c7c-4d54-8ae7-4ec1ddf25fea	tags.create.own	Permiso para create tags con scope own	tags	create	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
f76602a4-6308-4a69-8329-b6fba7d2e15c	users.manage.all	Gestionar contraseñas de usuarios	users	manage	all	t	2025-08-30 00:10:57.736298+00	2025-11-27 22:11:04.53266+00
54263e9d-5fdd-4497-843e-597dfb052454	attachments.download.all	Descargar archivos adjuntos de documentos de conocimiento	attachments	download	all	t	2025-09-15 20:06:43.117143+00	2025-11-28 00:16:11.861878+00
dff98efd-ddb6-4990-82b3-02cc25861952	knowledge.download.all	Descargar cualquier contenido o archivo de conocimiento	knowledge	download	all	t	2025-09-15 20:06:43.117143+00	2025-09-15 20:06:43.117143+00
15d39765-f31a-4c21-b084-a43d06e7d567	knowledge.download.own	Descargar contenido o archivos de documentos propios	knowledge	download	own	t	2025-09-15 20:06:43.117143+00	2025-09-15 20:06:43.117143+00
c5e99d0a-d393-4180-a9a8-3a81fd562def	knowledge.download.team	Descargar contenido o archivos de documentos del equipo	knowledge	download	team	t	2025-09-15 20:06:43.117143+00	2025-09-15 20:06:43.117143+00
c3902928-35f9-4558-b052-58bb3fbbf9f3	todos.assign.all	Asignar tareas a cualquier usuario	todos	assign	all	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.406343+00
79e3cdc6-0771-43e5-9b58-4b4ad45250f5	todos.assign.team	Asignar tareas a miembros del equipo	todos	assign	team	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.406343+00
e151a464-e4fa-4463-a18c-8f15156464e1	todos.create.team	Crear tareas para el equipo	todos	create	team	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.406343+00
5ac3cc9a-16ba-487f-8e59-1b31887adc0f	dashboard.view.own	Ver dashboard personal	dashboard	view	own	t	2025-08-29 03:23:32.095232+00	2025-11-27 22:11:04.53266+00
84dd00d7-9552-4937-a75c-186ec4c3669d	dashboard.view.team	Ver dashboard del equipo	dashboard	view	team	t	2025-08-29 03:23:32.095232+00	2025-11-27 22:11:04.53266+00
ec0aaecf-c338-41b5-9013-f1c8c1bf498b	dashboard.view.all	Ver dashboard completo	dashboard	view	all	t	2025-08-29 03:23:32.095232+00	2025-11-27 22:11:04.53266+00
9522d931-21ab-447a-b0ad-403aac0bf4a2	users.admin.all	Administración completa de usuarios	users	admin	all	t	2025-11-27 22:49:08.380291+00	2025-11-27 22:49:08.380291+00
8d8e0212-2b50-4fe8-b6b9-2f355ffa7903	cases.view.own	Ver casos propios	cases	view	own	t	2025-11-27 22:49:08.380291+00	2025-11-27 22:49:08.380291+00
8c8c63b0-0fe0-40f8-9f8c-6fd7bbb369df	cases.view.team	Ver casos del equipo	cases	view	team	t	2025-11-27 22:49:08.380291+00	2025-11-27 22:49:08.380291+00
cae6b8c1-66db-44fe-b46e-a3dd3f4b1eef	tags.create.team	Permiso para create tags con scope team	tags	create	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
fca38e7a-3747-4c97-876b-c3f7e93e05a4	tags.delete.own	Permiso para delete tags con scope own	tags	delete	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
8d6de130-e6e2-42f3-a390-085833a87bb9	tags.delete.team	Permiso para delete tags con scope team	tags	delete	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
1fcf8b48-7273-497a-9906-76d19040a612	tags.manage.own	Permiso para manage tags con scope own	tags	manage	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
5351e92c-70cc-491d-b213-d212df505ee0	tags.manage.team	Permiso para manage tags con scope team	tags	manage	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
15163679-e79b-4553-8990-4c3808cb23f6	tags.read.own	Permiso para read tags con scope own	tags	read	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
b62d17f5-7a4a-4cfb-b76e-9fb0740ea52d	tags.read.team	Permiso para read tags con scope team	tags	read	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
d34c3771-2d4a-46ab-b369-25a2707d8685	cases.view.all	Ver todos los casos	cases	view	all	t	2025-11-27 22:49:08.380291+00	2025-11-27 22:49:08.380291+00
1ef43c73-40ad-420d-a8d6-131e2c2e3187	cases.create.own	Crear casos propios	cases	create	own	t	2025-11-27 22:49:08.380291+00	2025-11-27 22:49:08.380291+00
c47a03d0-89d8-48ec-a48f-cc5f034f1784	cases.create.team	Crear casos para equipo	cases	create	team	t	2025-11-27 22:49:08.380291+00	2025-11-27 22:49:08.380291+00
d041a332-7c4c-4c09-ba6d-cdb2b3c64187	cases.create.all	Crear cualquier caso	cases	create	all	t	2025-11-27 22:49:08.380291+00	2025-11-27 22:49:08.380291+00
84de449d-c046-42f8-a933-956debcc45e7	metrics.view.own	Ver métricas propias	metrics	view	own	t	2025-11-27 22:49:08.380291+00	2025-11-27 22:49:08.380291+00
b67b5295-280e-4037-bb5f-14148fd7f80d	metrics.view.team	Ver métricas del equipo	metrics	view	team	t	2025-11-27 22:49:08.380291+00	2025-11-27 22:49:08.380291+00
8d373133-a45a-4f91-9daf-e472420bd58b	metrics.view.all	Ver todas las métricas	metrics	view	all	t	2025-11-27 22:49:08.380291+00	2025-11-27 22:49:08.380291+00
e3987fed-27c2-4555-8c58-4c27954880a6	admin.full	Acceso administrativo completo	admin	full	all	t	2025-11-27 23:01:20.421794+00	2025-11-27 23:01:20.421794+00
5e4efbf7-05c6-44e2-8d03-65f1ca8c35d2	cases.delete.all	Eliminar todos los casos	cases	delete	all	t	2025-11-27 23:43:39.424311+00	2025-11-27 23:43:39.424311+00
e46a22de-eeda-4e01-be13-0cb354355b15	reports.generate.own	Generar reportes propios	reports	generate	own	t	2025-11-27 23:43:52.053173+00	2025-11-27 23:43:52.053173+00
5b6e7a76-d418-448e-8353-3368b7fed8a3	reports.generate.team	Generar reportes del equipo	reports	generate	team	t	2025-11-27 23:43:52.053173+00	2025-11-27 23:43:52.053173+00
f422fdec-4087-4aa1-aecc-bb0e03688901	reports.generate.all	Generar todos los reportes	reports	generate	all	t	2025-11-27 23:43:52.053173+00	2025-11-27 23:43:52.053173+00
4549daff-81d6-4338-b523-da94f041608d	cases.assign.all	Assign cases to any user	cases	assign	all	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
8c2d3f16-b86d-477b-9a8d-0409ae18891c	cases.assign.team	Assign cases to team members	cases	assign	team	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
c2b0309f-db53-4d87-8d7c-91f8ff99628e	case_control.manage.all	Manage all case control	case_control	manage	all	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
2fe4b626-57b9-4007-8813-cf7734d37c4b	case_control.manage.own	Manage own case control	case_control	manage	own	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
a9383391-f34d-46ec-a3f2-bfdbb4a61039	case_control.manage.team	Manage team case control	case_control	manage	team	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
5cdebce9-c04c-4a26-b6be-17192e724c8e	case_control.read.all	Read all case control	case_control	read	all	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
81a0c48c-12be-4c1a-81fd-c473d1e29272	audit.view.own	Ver auditorías propias	audit	view	own	t	2025-09-16 01:09:45.377837+00	2025-09-16 01:09:45.377837+00
235c5199-4f6d-4ca9-9945-3c7b469359f1	audit.view.team	Ver auditorías del equipo	audit	view	team	t	2025-09-16 01:09:45.377837+00	2025-09-16 01:09:45.377837+00
ed8085c0-805f-4f19-8b4c-20e30124e958	audit.view.all	Ver todas las auditorías	audit	view	all	t	2025-09-16 01:09:45.377837+00	2025-09-16 01:09:45.377837+00
57d4079d-cac4-4a8c-97b1-8682e408643f	audit.admin.all	Administrar sistema de auditoría completo	audit	admin	all	t	2025-09-16 01:09:45.377837+00	2025-09-16 01:09:45.377837+00
9b33b581-a445-456b-ab58-c4f96e0595a0	audit.export.own	Exportar auditorías propias	audit	export	own	t	2025-09-16 01:09:45.377837+00	2025-09-16 01:09:45.377837+00
3f553bd2-1b9c-445a-8832-ae83aa3e8d09	audit.export.team	Exportar auditorías del equipo	audit	export	team	t	2025-09-16 01:09:45.377837+00	2025-09-16 01:09:45.377837+00
1db2c213-15b6-4042-95e0-76988807353a	audit.export.all	Exportar todas las auditorías	audit	export	all	t	2025-09-16 01:09:45.377837+00	2025-09-16 01:09:45.377837+00
82a9a1b0-32a7-4960-bfd7-b866f3e9f1a3	audit.config.all	Configurar parámetros del sistema de auditoría	audit	config	all	t	2025-09-16 01:09:45.377837+00	2025-09-16 01:09:45.377837+00
37ffab8e-2431-448f-a2fc-340d883933ac	teams.view.all	Ver todos los equipos	teams	view	all	t	2025-11-21 05:31:19.346333+00	2025-11-21 05:31:19.346333+00
6e9d4285-851f-40e2-99bc-dd994926fde9	teams.create.all	Crear equipos	teams	create	all	t	2025-11-21 05:31:19.346333+00	2025-11-21 05:31:19.346333+00
1828213b-0b3a-45af-a0c3-959c28a95c19	teams.edit.all	Editar equipos	teams	edit	all	t	2025-11-21 05:31:19.346333+00	2025-11-21 05:31:19.346333+00
29ded83e-fec8-4d72-b544-433187a16e9b	teams.delete.all	Eliminar equipos	teams	delete	all	t	2025-11-21 05:31:19.346333+00	2025-11-21 05:31:19.346333+00
9a594590-2a6d-456d-948e-95d9ec5361ea	teams.manage.members	Gestionar miembros de equipos	teams	manage	members	t	2025-11-21 05:31:19.346333+00	2025-11-21 05:31:19.346333+00
e8dff0f6-e1e2-4e21-a729-36411576da21	admin.config.own	Permiso para config admin con scope own	admin	config	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
393d15c0-aa2b-4965-bec8-d04b4f3a902d	admin.config.team	Permiso para config admin con scope team	admin	config	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
6c0abc65-2469-4c62-b4f9-dd01abff8ba2	applications.admin.own	Permiso para admin applications con scope own	applications	admin	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
ce01e2a2-155e-4f25-9828-e28f1a4e33ed	applications.admin.team	Permiso para admin applications con scope team	applications	admin	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
b50ce0cb-20b7-4383-bcae-e1e68d4acb4b	applications.create.own	Permiso para create applications con scope own	applications	create	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
5655d7ff-5329-445a-b680-3c787594c38b	applications.create.team	Permiso para create applications con scope team	applications	create	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
07b23621-dd11-4bac-9e65-17fdaba9b01a	applications.delete.own	Permiso para delete applications con scope own	applications	delete	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
f92d8a70-6d4f-4f75-865e-9e875e1cf8a5	applications.delete.team	Permiso para delete applications con scope team	applications	delete	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
41975953-6bce-40fe-b131-6a2ad03744c7	applications.read.own	Permiso para read applications con scope own	applications	read	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
db52d995-f2a7-4366-aefd-8853afc54892	applications.read.team	Permiso para read applications con scope team	applications	read	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
72a04b9b-2b6e-40be-9a8e-ab1f652223fd	applications.update.own	Permiso para update applications con scope own	applications	update	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
c3010c5f-4f5c-4f93-ae54-0febf855b14a	applications.update.team	Permiso para update applications con scope team	applications	update	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
94ba86ba-919d-435b-aba0-3e0bef8da8b6	archive.create.team	Permiso para create archive con scope team	archive	create	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
cdb7c991-69e4-4cd6-9e29-2c27b7c51963	archive.create.all	Permiso para create archive con scope all	archive	create	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
cbb86afd-886f-45cd-b9ad-f51ec151ea60	archive.delete.own	Permiso para delete archive con scope own	archive	delete	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
f90cb2b1-95f1-4abb-ab50-42bf3b3d7ffc	archive.delete.team	Permiso para delete archive con scope team	archive	delete	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
c15a1e22-74bf-45ab-bf7b-7ba5c9ff13af	archive.delete.all	Permiso para delete archive con scope all	archive	delete	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
8c8366ce-2d35-463b-9cc7-a299b1331c6e	archive.restore.team	Permiso para restore archive con scope team	archive	restore	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
c9673e60-4a85-4422-91e6-8685042cd0ed	archive.restore.all	Permiso para restore archive con scope all	archive	restore	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
9b572bb2-610b-4d1b-b62b-773685a5fc3b	archive.stats.team	Permiso para stats archive con scope team	archive	stats	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
d3602338-8c65-4725-a27f-83247e4ff558	archive.stats.all	Permiso para stats archive con scope all	archive	stats	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
cc25f420-09ce-4bc4-8be6-f58f1a0a3299	archive.view.team	Permiso para view archive con scope team	archive	view	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
48c4cf7f-7059-4cca-bdda-46febbf1fe56	archive.view.all	Permiso para view archive con scope all	archive	view	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
e630d343-b0ea-4e82-840d-d245aa525225	audit.admin.own	Permiso para admin audit con scope own	audit	admin	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
37a6c6c3-92c8-4529-9472-ddb94ddc778a	audit.admin.team	Permiso para admin audit con scope team	audit	admin	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
5dbeca45-8eea-4720-a9c5-d1ae600c0910	audit.config.own	Permiso para config audit con scope own	audit	config	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
95069e32-4be0-4ac8-9295-ebb1bd60788c	audit.config.team	Permiso para config audit con scope team	audit	config	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
cd9dba3f-70b1-4b19-bfb4-a43fa043fb0d	case_statuses.admin.own	Permiso para admin case_statuses con scope own	case_statuses	admin	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
f527a64f-a41a-419d-9094-5d6b8dea60ca	case_statuses.admin.team	Permiso para admin case_statuses con scope team	case_statuses	admin	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
d395f48f-2f03-4acb-9241-9941bafbfaa3	case_statuses.create.own	Permiso para create case_statuses con scope own	case_statuses	create	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
b1965c3d-a87b-4426-be5b-0488aab1bfde	case_statuses.create.team	Permiso para create case_statuses con scope team	case_statuses	create	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
6811e7fe-8609-44c5-9ca8-dd967cd56278	case_statuses.delete.own	Permiso para delete case_statuses con scope own	case_statuses	delete	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
8ce5d6fc-a4ee-425b-9043-8debb248fab4	case_statuses.delete.team	Permiso para delete case_statuses con scope team	case_statuses	delete	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
64efab12-f3f2-490c-a54e-ae26373af6fc	case_statuses.read.own	Permiso para read case_statuses con scope own	case_statuses	read	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
af0027ba-73a5-4ada-9305-39c09a7e1854	case_statuses.read.team	Permiso para read case_statuses con scope team	case_statuses	read	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
0499a1a4-3638-427e-a7b7-57019309c498	case_statuses.update.own	Permiso para update case_statuses con scope own	case_statuses	update	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
5f5a62d5-58cb-4e2c-bb9b-4ab670dd6ae2	case_statuses.update.team	Permiso para update case_statuses con scope team	case_statuses	update	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
42b4257f-77c3-4515-b4a6-dc312db77d98	teams.view.own	Permiso para view teams con scope own	teams	view	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
eeab7024-04b4-45b8-b8ae-c8e0cb091e7d	teams.view.team	Permiso para view teams con scope team	teams	view	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
dcc41858-d2e2-4ed3-b7e2-80c36be85383	teams.create.own	Permiso para create teams con scope own	teams	create	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
05d4903b-59fa-4be1-845f-2559bd28d3c8	teams.create.team	Permiso para create teams con scope team	teams	create	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
0ce3884b-5f9f-40f3-8c88-175e3925e17d	teams.edit.own	Permiso para edit teams con scope own	teams	edit	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
ec4faa3d-5ee8-42da-b9b7-2819659e5831	teams.edit.team	Permiso para edit teams con scope team	teams	edit	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
31cc9c2c-2ee7-41de-ba50-3bb20de3d95d	teams.delete.own	Permiso para delete teams con scope own	teams	delete	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
542bff80-5808-4fab-912b-f299b0291ab2	teams.delete.team	Permiso para delete teams con scope team	teams	delete	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
3f0c0daf-f66b-4add-a4a1-64da8275bbbc	teams.manage.own	Permiso para manage teams con scope own	teams	manage	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
4c378841-f5f0-46f1-a008-3c9dc322ecb5	teams.manage.team	Permiso para manage teams con scope team	teams	manage	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
7a7ae668-6bb1-4f81-bf4a-c47fbebb2d7e	teams.manage.all	Permiso para manage teams con scope all	teams	manage	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
d5aca651-c332-44d7-982c-82fae2181c0a	metrics.applications.team	Permiso para applications metrics con scope team	metrics	applications	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
547e9a9f-2e00-452f-adf6-15a3d94c2e54	metrics.applications.all	Permiso para applications metrics con scope all	metrics	applications	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
ebedfe11-8730-4021-90ee-18a40a8423b7	metrics.cases.own	Permiso para cases metrics con scope own	metrics	cases	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
94eae3ba-e92e-4782-8227-30919711fe25	metrics.cases.all	Permiso para cases metrics con scope all	metrics	cases	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
0dd12ebf-3e4b-4445-85f9-baac078bcf86	metrics.performance.own	Permiso para performance metrics con scope own	metrics	performance	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
a84f58b8-23b5-4d75-ae3d-0bd62b86a82e	metrics.performance.team	Permiso para performance metrics con scope team	metrics	performance	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
4e749caf-a2bd-45a7-9ead-9956f22dbd6f	metrics.performance.all	Permiso para performance metrics con scope all	metrics	performance	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
6be2319c-35e9-4334-88a6-6f9de248bd06	metrics.status.own	Permiso para status metrics con scope own	metrics	status	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
2a4c4b3c-8751-4b3f-84ee-0fb429977ad9	metrics.status.team	Permiso para status metrics con scope team	metrics	status	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
f8db5086-6680-4a4c-ac46-bc6f7886cbbb	metrics.status.all	Permiso para status metrics con scope all	metrics	status	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
92e2c814-a965-4cc7-886d-5069563c82da	metrics.general.own	Permiso para general metrics con scope own	metrics	general	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
c5f2616d-e6ca-4eed-8046-375243c75301	metrics.general.team	Permiso para general metrics con scope team	metrics	general	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
3eb48a6e-0a16-4980-80aa-9be415245a49	metrics.general.all	Permiso para general metrics con scope all	metrics	general	all	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
837aabfc-1ee7-4f7d-9caf-9bae075c0a00	origins.admin.own	Permiso para admin origins con scope own	origins	admin	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
5d82d10d-414c-4fc3-a5e5-a9b7f7bc6878	origins.admin.team	Permiso para admin origins con scope team	origins	admin	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
396ed45a-cd1f-4de3-941b-77857adc21c4	origins.create.own	Permiso para create origins con scope own	origins	create	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
4851ee00-1b9c-4682-af0e-025d93b1905c	origins.create.team	Permiso para create origins con scope team	origins	create	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
285bd1f6-ff9b-4a8b-8950-fff4656cb563	origins.delete.own	Permiso para delete origins con scope own	origins	delete	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
50f379d0-3f54-440c-8110-89c66d86595b	origins.delete.team	Permiso para delete origins con scope team	origins	delete	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
de832538-ae55-4258-a521-e5b7ae5bad97	origins.read.own	Permiso para read origins con scope own	origins	read	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
9770ffa4-ac48-44b7-b8fc-a9b2d26148d3	todos.create.all	Crear tareas para cualquiera	todos	create	all	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.406343+00
7f6faf52-df76-4683-b1c7-817a6f050bf4	todos.create.own	Crear tareas propias	todos	create	own	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.406343+00
5bd13d12-b2fb-4188-a156-e27208d64716	todos.edit.all	Editar todas las tareas	todos	edit	all	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.420342+00
8892b990-2d05-4411-872c-0ad262baa8c9	todos.edit.own	Editar tareas propias	todos	edit	own	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.420342+00
07d8a24a-f58e-45e9-b394-fc20b7180d87	todos.edit.team	Editar tareas del equipo	todos	edit	team	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.420342+00
be8c46b3-125d-4354-b35b-4984db5d3a5f	todos.delete.all	Eliminar todas las tareas	todos	delete	all	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.424342+00
44adfed1-c618-44a7-9e27-2b8206f8f59e	todos.delete.own	Eliminar tareas propias	todos	delete	own	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.424342+00
bb00cb22-76f1-4cb1-bdad-7a30cce0055c	todos.delete.team	Eliminar tareas del equipo	todos	delete	team	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.424342+00
bf0491e3-f0cf-4a4c-a47a-768b5fcbadc2	todos.view.all	Ver todas las tareas	todos	view	all	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.427342+00
9a866358-4982-427d-bcc5-cdb145a30e88	todos.view.own	Ver tareas propias	todos	view	own	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.427342+00
ee114738-957b-40d1-b6ce-5fe0c45d17dc	todos.view.team	Ver tareas del equipo	todos	view	team	t	2025-08-29 03:23:13.583492+00	2025-11-27 22:09:55.427342+00
eed166fd-5bc5-4272-b655-fbbf75e01190	permissions.assign.all	Asignar permisos a roles	permissions	assign	all	t	2025-08-30 01:56:28.234466+00	2025-09-15 00:42:01.841072+00
391b2d10-19fb-4413-b9a5-5aafda8e8c79	permissions.create.all	Crear nuevos permisos	permissions	create	all	t	2025-08-30 01:56:28.234466+00	2025-09-15 00:42:01.841072+00
55195c00-c8dd-4091-9a31-978db3d87a6f	permissions.delete.all	Eliminar permisos	permissions	delete	all	t	2025-08-30 01:56:28.234466+00	2025-09-15 00:42:01.841072+00
9c400ddd-846f-441d-8585-5f633d63f9c5	permissions.manage.all	Gestionar todas las asignaciones de permisos	permissions	manage	all	t	2025-08-30 01:56:28.234466+00	2025-09-15 00:42:01.841072+00
b22e5879-b661-435c-9f88-454d6daddb2d	permissions.read.all	Ver todos los permisos del sistema	permissions	read	all	t	2025-08-30 01:56:28.234466+00	2025-09-15 00:42:01.841072+00
3f9d9f01-afdf-43fa-9744-e9f879ea48b0	permissions.read_structure.all	Ver estructura de permisos por módulos	permissions	read_structure	all	t	2025-08-30 01:56:28.234466+00	2025-09-15 00:42:01.841072+00
e0c37cb7-0f22-4e5c-b162-9f5c4f9e999d	permissions.update.all	Actualizar permisos existentes	permissions	update	all	t	2025-08-30 01:56:28.234466+00	2025-09-15 00:42:01.841072+00
a35f84df-1ac3-4e1c-9776-58ef23424ca8	origins.read.team	Permiso para read origins con scope team	origins	read	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
af10b399-62cf-4b7b-9fae-a8ec90d6fe81	origins.update.own	Permiso para update origins con scope own	origins	update	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
20b11d87-7d50-4895-a380-1fe9e85236e7	origins.update.team	Permiso para update origins con scope team	origins	update	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
87e79756-f55f-42ab-84be-c7e5d08f7c14	permissions.admin.own	Permiso para admin permissions con scope own	permissions	admin	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
6c26fe01-d745-49f8-8929-e8914e074cf7	permissions.admin.team	Permiso para admin permissions con scope team	permissions	admin	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
24f31641-4e0c-4417-9ce6-43112aebdec2	permissions.assign.own	Permiso para assign permissions con scope own	permissions	assign	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
81e84cda-897a-466b-9afd-9c362924e04f	permissions.assign.team	Permiso para assign permissions con scope team	permissions	assign	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
1238d785-1ac1-4fa1-a646-cdf81b16a2da	permissions.create.own	Permiso para create permissions con scope own	permissions	create	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
68a0b4d1-e348-414d-8dd8-a3d9053e719f	permissions.create.team	Permiso para create permissions con scope team	permissions	create	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
dd9c4f86-55da-441e-9ace-0db505d690b0	permissions.delete.own	Permiso para delete permissions con scope own	permissions	delete	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
9d1ea120-43a3-4d39-9ff5-0622f4d2c9b2	permissions.delete.team	Permiso para delete permissions con scope team	permissions	delete	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
9cbe8716-4d26-4b9e-ab32-df199dbffa03	permissions.manage.own	Permiso para manage permissions con scope own	permissions	manage	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
b7fe9b3f-e53d-46ff-a0e8-d8b0d5d0b341	permissions.manage.team	Permiso para manage permissions con scope team	permissions	manage	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
b49be44b-57e7-4b27-befe-7037ebb6b8f0	permissions.read.own	Permiso para read permissions con scope own	permissions	read	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
f0b9170f-22b6-4e84-9613-fad1a2266a5e	permissions.read.team	Permiso para read permissions con scope team	permissions	read	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
eeb7bab2-12e8-4f1e-9507-b4507e64cc01	permissions.read_structure.own	Permiso para read_structure permissions con scope own	permissions	read_structure	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
8d7c1b85-929e-4c51-a07d-22cbf2858991	tags.update.own	Permiso para update tags con scope own	tags	update	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
480bd7d6-0b24-4cf7-abf9-9af41452b34c	tags.update.team	Permiso para update tags con scope team	tags	update	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
dbde6cd1-238f-4474-a0f0-302eff6873c2	todos.assign.own	Permiso para assign todos con scope own	todos	assign	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
29f6123d-5807-43f0-a636-1827c5cec620	users.audit.own	Permiso para audit users con scope own	users	audit	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
1cac9f64-4529-4f0c-a9c9-6a971ae437dd	users.audit.team	Permiso para audit users con scope team	users	audit	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
dcd1cae3-ab92-43cb-adf9-515ab78aa05d	users.manage.own	Permiso para manage users con scope own	users	manage	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
cd94de86-be60-4933-a01c-17ce8bf11b53	users.manage.team	Permiso para manage users con scope team	users	manage	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
2f8e7e8e-32fa-47f2-93a5-1d3c515eb588	roles.manage.all	Gestionar roles y permisos del sistema	roles	manage	all	t	2025-08-29 03:23:32.095232+00	2025-11-27 22:11:04.53266+00
145fe323-76ba-4755-843c-5404c8d65cdb	roles.audit.all	Ver auditoría de roles	roles	audit	all	t	2025-08-30 00:41:16.029697+00	2025-09-15 00:36:54.911599+00
c06cf691-aa7a-46c0-9f1a-e035f249bf64	roles.clone.all	Clonar roles existentes	roles	clone	all	t	2025-08-30 00:41:16.029697+00	2025-09-15 00:36:54.911599+00
ab7ea1b9-d528-402f-b67f-7e279f0e2024	roles.create.all	Crear nuevos roles	roles	create	all	t	2025-08-30 00:41:16.029697+00	2025-09-15 00:36:54.911599+00
bba25f99-8a1b-467e-8187-ccd1f1823188	roles.delete.all	Eliminar roles	roles	delete	all	t	2025-08-30 00:41:16.029697+00	2025-09-15 00:36:54.911599+00
30d1552a-8c2d-4800-bb07-71437ace854d	roles.edit.all	Editar roles existentes	roles	edit	all	t	2025-08-30 00:41:16.029697+00	2025-09-15 00:36:54.911599+00
eb33f431-2f42-4394-95f4-745135ea7758	roles.export.all	Exportar datos de roles	roles	export	all	t	2025-08-30 00:41:16.029697+00	2025-09-15 00:36:54.911599+00
857c9997-8636-4a08-8a05-212032afa15f	roles.report.all	Generar reportes de roles	roles	report	all	t	2025-08-30 00:41:16.029697+00	2025-09-15 00:36:54.911599+00
5a2ebd33-9b63-4a17-b0a9-39cb9190f3f7	roles.view.all	Ver todos los roles	roles	view	all	t	2025-08-30 00:41:16.029697+00	2025-09-15 00:36:54.911599+00
97f4c2cc-fa6c-4acb-9a66-00d3ea18e951	roles.view.own	Ver propios roles	roles	view	own	t	2025-08-30 00:41:16.029697+00	2025-09-15 00:36:54.911599+00
507e3be4-e149-43ed-ba55-139aaeb34757	roles.view.team	Ver roles del equipo	roles	view	team	t	2025-08-30 00:41:16.029697+00	2025-09-15 00:36:54.911599+00
96afa44f-6eae-49e0-b823-350841686d9e	users.view.all	Ver todos los usuarios del sistema	users	view	all	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
fe26ef14-421b-4403-82e4-676bad92632b	users.view.own	Ver su propio perfil de usuario	users	view	own	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
3ba07a02-9aa4-4be1-831d-0118162ec1cb	users.view.team	Ver usuarios del mismo equipo	users	view	team	t	2025-08-30 00:10:57.736298+00	2025-09-15 00:36:54.911599+00
dd04ac40-7ad6-4729-acae-5aeaf9e8b9b3	dashboard.export.own	Exportar métricas propias del dashboard	dashboard	export	own	t	2025-09-03 00:55:01.867715+00	2025-09-15 00:36:54.911599+00
55d37a41-5ed2-4f73-a155-3f4fbe97fdec	dashboard.export.team	Exportar métricas del equipo del dashboard	dashboard	export	team	t	2025-09-03 00:55:01.867715+00	2025-09-15 00:36:54.911599+00
dfa16e6f-0b8e-4881-b4b6-75e5d43b33cc	dashboard.export.all	Exportar todas las métricas del dashboard	dashboard	export	all	t	2025-09-03 00:55:01.867715+00	2025-09-15 00:36:54.911599+00
f041880a-2798-47dd-b8a7-18aa27c97fa6	roles.manage.own	Permiso para gestionar roles con scope own	roles	manage	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 22:11:04.53266+00
314adf20-58b8-439b-915a-8ea5445a07f8	dashboard.manage.all	Gestionar configuración de métricas del dashboard	dashboard	manage	all	t	2025-09-03 00:55:01.867715+00	2025-11-27 22:11:04.53266+00
7708d96f-dce4-4a5b-aa67-6a284ed264d3	metrics.read.own	Ver métricas de tiempo propias	metrics	read	own	t	2025-09-03 00:55:01.867715+00	2025-11-27 22:11:04.53266+00
a53cc7cb-c4ad-4e99-93f2-ad34b908f4c3	metrics.read.team	Ver métricas de usuarios del equipo	metrics	read	team	t	2025-09-03 00:55:01.867715+00	2025-11-27 22:11:04.53266+00
c07c7bcf-a7da-4d47-932f-72b2fa955083	metrics.read.all	Ver métricas de todos los usuarios	metrics	read	all	t	2025-09-03 00:55:01.867715+00	2025-11-27 22:11:04.53266+00
2b8b088a-952b-4465-8238-65f9aac1a61e	dispositions.view.own	Ver disposiciones propias	dispositions	view	own	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
60de088a-14dd-405d-b428-3f646f5d42fa	dispositions.view.team	Ver disposiciones equipo	dispositions	view	team	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
b7169d21-ddaf-460b-8375-020698eb2823	knowledge.read.own	Ver documentos de conocimiento propios	knowledge	read	own	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
027c491a-7941-420b-8794-4b3284a07151	knowledge.read.team	Ver documentos de conocimiento del equipo	knowledge	read	team	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
a3cc434f-464d-454a-99ba-4b04d1a1ab72	knowledge.read.all	Ver todos los documentos de conocimiento	knowledge	read	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
d61a2688-730f-4312-99c6-979a7dc11241	knowledge.create.own	Crear documentos de conocimiento	knowledge	create	own	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
072e69e1-2ab1-4f2e-a970-3b363ad6c745	knowledge.create.team	Crear documentos para el equipo	knowledge	create	team	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
2fe8fb3e-0e43-4b56-bb7c-9287cc5e7184	knowledge.create.all	Crear cualquier documento de conocimiento	knowledge	create	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
4f28f708-656f-4676-a0a5-9b5c586637b0	knowledge.update.own	Actualizar documentos de conocimiento propios	knowledge	update	own	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
224f89d5-b02b-4598-ba82-83dd81b08ca2	knowledge.update.team	Actualizar documentos del equipo	knowledge	update	team	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
57ab4d19-3efd-47bf-8533-13ee3d26736f	knowledge.update.all	Actualizar cualquier documento de conocimiento	knowledge	update	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
bd7e8536-9ca4-4035-b434-d12e2ce0faac	knowledge.delete.own	Eliminar documentos de conocimiento propios	knowledge	delete	own	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
f01df662-e204-4f74-a96f-5e219d33d709	knowledge.delete.team	Eliminar documentos del equipo	knowledge	delete	team	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
14dc438f-cb6d-42b7-a1c9-a41792de2b24	knowledge.delete.all	Eliminar cualquier documento de conocimiento	knowledge	delete	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
58cf951d-83ea-4983-9cec-6acc57096650	knowledge.publish.own	Publicar documentos de conocimiento propios	knowledge	publish	own	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
8f6853d5-df7d-4538-a7a3-1286b1e39026	knowledge.publish.team	Publicar documentos del equipo	knowledge	publish	team	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
10fd145a-105e-4daa-974a-0a8b511238aa	knowledge.publish.all	Publicar cualquier documento de conocimiento	knowledge	publish	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
c6d42364-3d6c-44f4-a8ed-eae5e05120c8	knowledge.archive.own	Archivar documentos de conocimiento propios	knowledge	archive	own	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
ea28ae3f-b52b-499a-ba1f-3338f30a4b84	knowledge.archive.team	Archivar documentos del equipo	knowledge	archive	team	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
c499c0a4-7280-4a10-8827-3ad577ad3c12	knowledge.archive.all	Archivar cualquier documento de conocimiento	knowledge	archive	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
2edc308c-2e9d-444f-a9fe-3d7d60f4631f	knowledge_types.read.all	Ver tipos de documentos de conocimiento	knowledge_types	read	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
667627f2-d6f0-4d74-9bbf-759c144dcb7a	admin.config.all	Administrar configuración del sistema	admin	config	all	t	2025-09-09 00:09:48.680898+00	2025-09-15 00:42:38.865493+00
92362eac-1447-4934-ab48-8a6ba3780856	dispositions.view.all	Ver todas disposiciones	dispositions	view	all	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
3df0d147-cd4b-414d-894e-979fac81dd9f	dispositions.create.own	Crear disposiciones propias	dispositions	create	own	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
9104b2f8-2030-44c5-964b-530a8a437b1e	dispositions.create.team	Crear disposiciones equipo	dispositions	create	team	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
b8c89518-ad76-4de0-8d8d-1dfe466066c0	dispositions.create.all	Crear todas disposiciones	dispositions	create	all	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
00002a70-460b-4b50-97bf-f36809bcda34	dispositions.edit.own	Editar disposiciones propias	dispositions	edit	own	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
dfb9898b-ff4a-4111-8654-f3e994a3f657	dispositions.edit.team	Editar disposiciones equipo	dispositions	edit	team	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
27000332-45ee-42c0-9557-00b4caa15f83	dispositions.edit.all	Editar todas disposiciones	dispositions	edit	all	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
7f4d97c9-69ed-4532-9246-196b77486e61	dispositions.delete.own	Eliminar disposiciones propias	dispositions	delete	own	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
6f266de4-309d-4b08-a0c8-52e331d5d27b	dispositions.delete.team	Eliminar disposiciones equipo	dispositions	delete	team	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
4ce359b1-9308-4017-a3dd-deaa7a3300d0	dispositions.delete.all	Eliminar todas disposiciones	dispositions	delete	all	t	2025-11-27 22:56:43.945364+00	2025-11-27 22:56:43.945364+00
7e7beef9-84b6-43ac-a8a8-5f7af60143cc	cases.edit.own	Editar casos propios	cases	edit	own	t	2025-11-27 23:43:25.992458+00	2025-11-27 23:43:25.992458+00
63110d33-ef8d-4b8b-b29f-dc5ac9ffa32b	cases.edit.team	Editar casos del equipo	cases	edit	team	t	2025-11-27 23:43:25.992458+00	2025-11-27 23:43:25.992458+00
3d9db295-c035-4963-9b93-72d33ce64390	knowledge_types.create.all	Crear tipos de documentos de conocimiento	knowledge_types	create	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
5d72a4d2-2a85-47d5-a009-9f5684494c39	knowledge_types.update.all	Actualizar tipos de documentos de conocimiento	knowledge_types	update	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
437a194a-339f-4629-86ab-15ca6a41d4c5	knowledge_types.delete.all	Eliminar tipos de documentos de conocimiento	knowledge_types	delete	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
afd713c4-f0ad-41fd-bbe0-b11d45c9e8be	knowledge_feedback.create.own	Dar feedback en documentos de conocimiento	knowledge_feedback	create	own	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
1a064b59-1665-4dc7-9b37-479114b0754a	knowledge_feedback.read.all	Ver todo el feedback de documentos	knowledge_feedback	read	all	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
e22c20c7-e539-42db-be79-7031bb4e6d7d	knowledge_feedback.update.own	Actualizar mi feedback	knowledge_feedback	update	own	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
b24b35b0-24ef-494b-82c4-ad8de99ce897	knowledge_feedback.delete.own	Eliminar mi feedback	knowledge_feedback	delete	own	t	2025-09-10 00:42:06.445792+00	2025-09-15 00:36:54.911599+00
837f96ab-7a27-41b2-aaff-f158a05cc436	knowledge.export.own	Exportar documentos de conocimiento propios	knowledge	export	own	t	2025-09-15 00:21:45.480752+00	2025-09-15 00:36:54.911599+00
01af9538-b4fe-4ef4-8a06-f2c9cd700ce7	knowledge.export.team	Exportar documentos del equipo	knowledge	export	team	t	2025-09-15 00:21:45.480752+00	2025-09-15 00:36:54.911599+00
28c6a072-cd7f-41f4-ada6-b2548cea7f10	knowledge.export.all	Exportar cualquier documento de conocimiento	knowledge	export	all	t	2025-09-15 00:21:45.480752+00	2025-09-15 00:36:54.911599+00
fccdf8d3-5be4-40cb-86c8-d86cb4a6ca9a	knowledge.duplicate.own	Duplicar documentos de conocimiento propios	knowledge	duplicate	own	t	2025-09-15 00:21:45.480752+00	2025-09-15 00:36:54.911599+00
3bfdb7e6-bb25-4160-b71b-e9454088b211	knowledge.duplicate.team	Duplicar documentos del equipo	knowledge	duplicate	team	t	2025-09-15 00:21:45.480752+00	2025-09-15 00:36:54.911599+00
b8d42dcb-dbed-42ce-9522-20c3818df4c2	knowledge.duplicate.all	Duplicar cualquier documento de conocimiento	knowledge	duplicate	all	t	2025-09-15 00:21:45.480752+00	2025-09-15 00:36:54.911599+00
1774b21f-e144-45b5-b12e-616bc1ff4651	tags.create.all	Permite crear nuevas etiquetas	tags	create	all	t	2025-09-10 19:57:18.378033+00	2025-09-15 00:42:01.841072+00
ee7de8ff-4b16-4c42-add4-06dc3fd2d13d	tags.delete.all	Permite eliminar etiquetas del sistema	tags	delete	all	t	2025-09-10 19:57:18.378033+00	2025-09-15 00:42:01.841072+00
e5cd89e0-9310-431e-9d8d-2c7ed54c8e4f	tags.manage.all	Acceso completo al sistema de gestión de etiquetas	tags	manage	all	t	2025-09-10 19:57:18.378033+00	2025-09-15 00:42:01.841072+00
8e1dc130-070d-446c-af26-68627478ba4b	tags.read.all	Permite ver y listar etiquetas del sistema	tags	read	all	t	2025-09-10 19:57:18.378033+00	2025-09-15 00:42:01.841072+00
ca4de1ff-8d08-4aae-ad4c-03dac044f1dc	tags.update.all	Permite modificar etiquetas existentes	tags	update	all	t	2025-09-10 19:57:18.378033+00	2025-09-15 00:42:01.841072+00
7d00240e-0753-45f7-b5d9-32bc40e70220	permissions.read_structure.team	Permiso para read_structure permissions con scope team	permissions	read_structure	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
ab3270da-a66d-49f8-a168-4e41c1a71bc0	permissions.update.own	Permiso para update permissions con scope own	permissions	update	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
01877a8f-e53f-4cae-baca-4545b4c6f4fb	permissions.update.team	Permiso para update permissions con scope team	permissions	update	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
707ddd8b-269e-4977-8cce-d3d4c13a3c7c	roles.audit.own	Permiso para audit roles con scope own	roles	audit	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
dcead44c-058c-4d16-9328-9742188a57c0	roles.audit.team	Permiso para audit roles con scope team	roles	audit	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
8de50491-f232-4ecb-afb7-09ada2f21ed6	roles.clone.own	Permiso para clone roles con scope own	roles	clone	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
865b9be4-96da-4018-9ae0-286dedca0f03	roles.clone.team	Permiso para clone roles con scope team	roles	clone	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
84f61d28-6b58-477b-9953-cd88bb2eb25e	roles.create.own	Permiso para create roles con scope own	roles	create	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
c1df2714-7fc4-4feb-be1c-8d3534a8bb48	roles.create.team	Permiso para create roles con scope team	roles	create	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
c4a77291-391d-4209-8b70-f432f682dc8a	roles.delete.own	Permiso para delete roles con scope own	roles	delete	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
26251bbf-5846-4a8b-bb93-8d86725916ce	roles.delete.team	Permiso para delete roles con scope team	roles	delete	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
90fbae35-6951-4fc3-8363-13f7a1c43d58	roles.edit.own	Permiso para edit roles con scope own	roles	edit	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
fd3220e6-1427-4831-b972-fd2e1e55e01a	roles.edit.team	Permiso para edit roles con scope team	roles	edit	team	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
4219e519-f3e0-4248-87f5-5ac2b6b4fea7	roles.export.own	Permiso para export roles con scope own	roles	export	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
4efab391-fddb-4e48-9e43-d9a83274a5f1	users.report.own	Permiso para report users con scope own	users	report	own	t	2025-11-27 02:58:13.439507+00	2025-11-27 02:58:13.439507+00
3a0bf3e2-ebb6-40c6-bd2b-c50085f1e8ba	case_statuses.reorder.own	Permiso para reorder case_statuses con scope own	case_statuses	reorder	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
b3522814-9b90-49de-b0ce-c607497fbc0c	case_statuses.reorder.team	Permiso para reorder case_statuses con scope team	case_statuses	reorder	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
9e7cdc77-41f3-4426-be65-ff86949ed456	cases.assign.own	Permiso para assign cases con scope own	cases	assign	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
80fc7b9d-939e-41fe-bdf2-147c03037278	dashboard.manage.own	Permiso para manage dashboard con scope own	dashboard	manage	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
10677ff4-d5fd-4ddd-8e5e-4071219d46bf	dashboard.manage.team	Permiso para manage dashboard con scope team	dashboard	manage	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
5a0c62b4-9ea9-4c92-9996-60d557d9e513	knowledge.attachments.own	Permiso para attachments knowledge con scope own	knowledge	attachments	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
5cc4d261-f843-44f2-a966-dbfaf22fe742	knowledge.attachments.team	Permiso para attachments knowledge con scope team	knowledge	attachments	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
e6e6be79-b64d-4b14-b087-6559f82937f4	knowledge.attachments.all	Permiso para attachments knowledge con scope all	knowledge	attachments	all	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
3bff5f10-55c2-4bf3-9b19-8ace38bdef8a	knowledge_feedback.create.team	Permiso para create knowledge_feedback con scope team	knowledge_feedback	create	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
f4b6bfdc-5660-4e32-b7f2-4311f8abc6fe	knowledge_feedback.create.all	Permiso para create knowledge_feedback con scope all	knowledge_feedback	create	all	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
e3c61f4e-37c0-4f0b-ae6d-2ffd7b406824	knowledge_feedback.delete.team	Permiso para delete knowledge_feedback con scope team	knowledge_feedback	delete	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
a4ec676e-65b6-4c37-8f9d-3b86333364b0	knowledge_feedback.delete.all	Permiso para delete knowledge_feedback con scope all	knowledge_feedback	delete	all	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
4876b30e-7025-45f9-bc56-e5ff22ef9981	knowledge_feedback.read.own	Permiso para read knowledge_feedback con scope own	knowledge_feedback	read	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
a2688f24-8ab4-4e2c-bc30-0a93f6da6e6d	knowledge_feedback.read.team	Permiso para read knowledge_feedback con scope team	knowledge_feedback	read	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
665e7de4-4bd4-4534-8c0a-c9cb37e7c46b	knowledge_feedback.update.team	Permiso para update knowledge_feedback con scope team	knowledge_feedback	update	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
3f924def-d4dd-47d7-b3c0-9cd94e70e1e8	knowledge_feedback.update.all	Permiso para update knowledge_feedback con scope all	knowledge_feedback	update	all	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
8156b371-7d38-4a82-b3fa-f8c60737f450	knowledge_types.create.own	Permiso para create knowledge_types con scope own	knowledge_types	create	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
c8f4c3ee-c0cd-4a0b-9ed0-51a2c997bdf6	knowledge_types.create.team	Permiso para create knowledge_types con scope team	knowledge_types	create	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
1c4d4fde-3f97-4a20-87c2-003f01d078f9	knowledge_types.delete.own	Permiso para delete knowledge_types con scope own	knowledge_types	delete	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
933963f3-8dbf-49fe-9fc7-a9abbd4a1479	knowledge_types.delete.team	Permiso para delete knowledge_types con scope team	knowledge_types	delete	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
25366017-b134-447f-8992-7f94704288d4	knowledge_types.read.own	Permiso para read knowledge_types con scope own	knowledge_types	read	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
79a1d2ef-665d-4e9d-89e1-539367d73fca	knowledge_types.read.team	Permiso para read knowledge_types con scope team	knowledge_types	read	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
63af4055-fd94-4980-aaca-59914fb36334	knowledge_types.update.own	Permiso para update knowledge_types con scope own	knowledge_types	update	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
399ba16c-5a8c-4232-99ed-9b529dcefcf3	knowledge_types.update.team	Permiso para update knowledge_types con scope team	knowledge_types	update	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
e456ca65-285b-4164-a1f9-a56c11d10be5	metrics.applications.own	Permiso para applications metrics con scope own	metrics	applications	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
2a6516d4-e303-4656-86ea-b01ba52e734b	metrics.cases.team	Permiso para cases metrics con scope team	metrics	cases	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
c187f455-5a20-4d26-8183-5d3804d77782	metrics.todos.own	Permiso para todos metrics con scope own	metrics	todos	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
201a2db4-ca7e-4da6-8c45-175270a8435a	metrics.todos.team	Permiso para todos metrics con scope team	metrics	todos	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
58a5206b-4e07-43e3-a40b-148011b7dffd	metrics.todos.all	Permiso para todos metrics con scope all	metrics	todos	all	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
b12244d7-aedc-4d0d-b327-0933fa383828	metrics.users.own	Permiso para users metrics con scope own	metrics	users	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
6466c77c-0f31-4083-be0e-7ffa55cb0994	metrics.users.team	Permiso para users metrics con scope team	metrics	users	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
494d2c29-90db-4413-b491-8095169df62d	metrics.users.all	Permiso para users metrics con scope all	metrics	users	all	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
aa424194-1402-416e-a3ae-6447fdb27254	metrics.time.own	Permiso para time metrics con scope own	metrics	time	own	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
33593364-743a-40a6-9520-a31fbb4af06a	metrics.time.team	Permiso para time metrics con scope team	metrics	time	team	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
f78642ca-fdb2-4238-807c-a2a016b6c414	metrics.time.all	Permiso para time metrics con scope all	metrics	time	all	t	2025-11-27 03:07:38.047837+00	2025-11-27 03:07:38.047837+00
71ea6bbf-4040-4ce7-853a-b22da2a9eb36	cases.edit.all	Editar todos los casos	cases	edit	all	t	2025-11-27 23:43:25.992458+00	2025-11-27 23:43:25.992458+00
8c14c8be-2643-444c-96d5-693fe34b0657	notes.view.own	Ver notas propias	notes	view	own	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
050fb1ee-3ebb-4900-a88d-ba06bf3e9fdc	notes.view.team	Ver notas del equipo	notes	view	team	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
f801ea45-212c-44fa-8bdb-4638a52aeb5e	notes.view.all	Ver todas las notas	notes	view	all	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
59beb044-fb41-4825-bda5-ec670c4b1c70	notes.create.own	Crear notas propias	notes	create	own	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
cfc238f4-4dc3-4c7a-b201-ff0909ebeb40	notes.create.team	Crear notas del equipo	notes	create	team	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
3bf65a02-d793-4e52-972f-81431e404a6c	notes.create.all	Crear todas las notas	notes	create	all	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
80832630-0157-42ca-be4d-6f0660098b9d	notes.edit.own	Editar notas propias	notes	edit	own	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
0312bea0-575e-43b0-94b3-6f68aab14634	notes.edit.team	Editar notas del equipo	notes	edit	team	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
56c18a9b-ea6e-4788-9093-d9551ca27625	notes.edit.all	Editar todas las notas	notes	edit	all	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
a3bbd4d9-9744-4a23-8c49-69a655181872	notes.delete.own	Eliminar notas propias	notes	delete	own	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
f825d197-9d1e-40e2-bab0-9cfa168296dd	notes.delete.team	Eliminar notas del equipo	notes	delete	team	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
99a4c97d-e5c5-4fdb-80b5-298b4b648d27	notes.delete.all	Eliminar todas las notas	notes	delete	all	t	2025-11-27 22:57:50.103354+00	2025-11-27 22:57:50.103354+00
2d4f8072-5038-43d9-9862-6d519a8a83f4	cases.delete.own	Eliminar casos propios	cases	delete	own	t	2025-11-27 23:43:39.424311+00	2025-11-27 23:43:39.424311+00
5fc9e739-dab2-40c0-bd7c-02d233a9a6b9	cases.delete.team	Eliminar casos del equipo	cases	delete	team	t	2025-11-27 23:43:39.424311+00	2025-11-27 23:43:39.424311+00
afbd41e1-8a9e-4be0-9290-5b7a843abb3e	case_control.read.own	Read own case control	case_control	read	own	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
a0ed5882-a841-43f8-bad7-134bb83abff2	case_control.read.team	Read team case control	case_control	read	team	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
b02a5b1c-d6d1-41b4-b346-a9bbd2b6b5e0	time.manage.all	Manage all time tracking	time	manage	all	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
ea46b60b-6e44-467c-bc3d-6105af7ec2ab	time.manage.own	Manage own time tracking	time	manage	own	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
95e342fa-7dac-4d5e-9e55-338238143a7e	time.manage.team	Manage team time tracking	time	manage	team	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
31be4771-1c82-485e-86e5-c415d6b95d32	time.read.all	Read all time tracking	time	read	all	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
3319ccb1-ce22-4a8e-867d-05375c9abaee	time.read.own	Read own time tracking	time	read	own	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
ba9648a9-efe8-4569-b664-34ea0be06e4d	time.read.team	Read team time tracking	time	read	team	t	2025-11-28 00:10:52.567387+00	2025-11-28 00:10:52.567387+00
9aa01863-e2b3-440d-b6d2-946eb3a92280	metrics.cases.read.own	Ver métricas de casos propios	metrics	read	own	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
3193f671-e2f1-4ff6-b197-98f02a9cb822	metrics.cases.read.team	Ver métricas de casos del equipo	metrics	read	team	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
fe007bbb-c3a1-4f4e-8915-36546596d2e9	metrics.cases.read.all	Ver métricas de todos los casos	metrics	read	all	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
31d5a50d-9064-423b-aabb-2c5fab4b1f58	metrics.time.read.own	Ver métricas de tiempo propias	metrics	read	own	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
0188c4c8-478f-4a41-878c-32d45462b351	metrics.time.read.team	Ver métricas de tiempo del equipo	metrics	read	team	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
3f4b0693-cd99-42fd-8391-ab9d6c8f76f9	metrics.time.read.all	Ver métricas de tiempo de todos	metrics	read	all	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
7e11a7d4-3e31-4774-ad72-80389ac45d01	metrics.general.read.own	Ver métricas generales propias	metrics	read	own	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
24a03971-a2ca-43b5-b2c8-1ce814c348ae	metrics.general.read.team	Ver métricas generales del equipo	metrics	read	team	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
f96386ec-87d7-4d00-8f29-4170a05eeff8	metrics.general.read.all	Ver métricas generales de todos	metrics	read	all	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
01a26eb6-755d-4434-aa11-634dec9aaf64	metrics.status.read.own	Ver métricas de estados propios	metrics	read	own	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
8a6c6b67-5c5d-47e2-b0f4-e59b2de9f4ff	metrics.status.read.team	Ver métricas de estados del equipo	metrics	read	team	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
d6af720c-c555-463a-92a0-f61e1611692e	metrics.status.read.all	Ver métricas de estados de todos	metrics	read	all	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
e0ff023e-0fcb-41a4-86e3-48c7b378e5f1	metrics.applications.read.own	Ver métricas de aplicaciones propias	metrics	read	own	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
dd31f900-ce1f-449c-9c40-077e6c4a640b	metrics.applications.read.team	Ver métricas de aplicaciones del equipo	metrics	read	team	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
05da8fb2-1ccd-40e6-8778-07e01ddef92c	metrics.applications.read.all	Ver métricas de aplicaciones de todos	metrics	read	all	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
50eecfa4-00db-41e8-b1c2-9e642643ca49	metrics.performance.read.own	Ver métricas de rendimiento propias	metrics	read	own	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
667f6124-9eb0-4c66-80e9-e5d5dd5b8ed6	metrics.performance.read.team	Ver métricas de rendimiento del equipo	metrics	read	team	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
e362a3ed-1989-4ad1-a3ec-4756639df51b	metrics.performance.read.all	Ver métricas de rendimiento de todos	metrics	read	all	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
8312993b-75a9-44da-9658-c10de09a4239	metrics.users.read.own	Ver métricas de usuarios propias	metrics	read	own	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
c76b0fb1-1ef1-4fc7-998a-04c6fdfebf10	metrics.users.read.team	Ver métricas de usuarios del equipo	metrics	read	team	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
8b5a9803-37e1-4afd-9d00-234cd2a4d55a	metrics.users.read.all	Ver métricas de usuarios de todos	metrics	read	all	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
d579a914-2a38-405b-a481-e9e0cdcac860	dashboard.read.own	Acceder al dashboard propio	dashboard	read	own	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
383ffa53-5076-4cc1-ad5f-ed7fb6bf956f	dashboard.read.team	Acceder al dashboard del equipo	dashboard	read	team	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
dcc37019-0f03-4cbe-9ad8-319f16dab8d3	dashboard.read.all	Acceder a todos los dashboards	dashboard	read	all	t	2025-12-16 23:52:37.352051+00	2025-12-16 23:52:37.352051+00
e090b768-19f3-4054-a373-e05d08499b85	cases.update.own	Editar casos propios	cases	update	own	t	2025-12-17 00:10:28.82694+00	2025-12-17 00:10:28.82694+00
075d75b1-3373-4fa7-909a-c64b68a99e0e	cases.update.team	Editar casos del equipo	cases	update	team	t	2025-12-17 00:10:28.82694+00	2025-12-17 00:10:28.82694+00
0e7648e0-9cea-4dab-8122-54224461e946	cases.update.all	Editar todos los casos	cases	update	all	t	2025-12-17 00:10:28.82694+00	2025-12-17 00:10:28.82694+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, "roleId", "permissionId", "createdAt") FROM stdin;
21bd9221-d409-47df-8a01-92462e55dbd2	49eee68f-ff93-4c0c-a064-f4a14894c598	d5447b3a-c938-4de4-9ff5-8c0abf5a8d7a	2025-09-15 23:20:37.439344+00
9779ca7c-f4c2-42e6-97c2-4f7c0eb5319b	49eee68f-ff93-4c0c-a064-f4a14894c598	7c39dc69-0821-48cd-a8a0-6f8589becb8c	2025-09-15 23:20:37.439344+00
bc49973d-c19e-4b31-9367-2ec0a0b2db66	49eee68f-ff93-4c0c-a064-f4a14894c598	9061c6a3-3a00-4a47-afb9-1d721c137645	2025-09-15 23:20:37.439344+00
fbebd55d-a835-4de8-b3f9-cb7e3cdcbb27	49eee68f-ff93-4c0c-a064-f4a14894c598	9e4e583d-abcf-471a-8a4d-56fedb86ce4e	2025-09-15 23:20:37.439344+00
a1f545d0-41eb-40cf-8ea7-5a1796631966	49eee68f-ff93-4c0c-a064-f4a14894c598	dd04ac40-7ad6-4729-acae-5aeaf9e8b9b3	2025-09-15 23:20:37.439344+00
1fa4d2a0-1d8a-4a72-87d4-ac16ee5452b2	49eee68f-ff93-4c0c-a064-f4a14894c598	5ac3cc9a-16ba-487f-8e59-1b31887adc0f	2025-09-15 23:20:37.439344+00
f2667047-ede5-45ca-9215-b59933544ca2	49eee68f-ff93-4c0c-a064-f4a14894c598	9aa01863-e2b3-440d-b6d2-946eb3a92280	2025-12-16 23:54:06.748417+00
141f585f-9493-4f30-a39a-cff530c2dd27	49eee68f-ff93-4c0c-a064-f4a14894c598	1ef43c73-40ad-420d-a8d6-131e2c2e3187	2025-09-15 23:20:37.439344+00
46520213-d329-45b7-b3e7-c44e0ccf6c46	49eee68f-ff93-4c0c-a064-f4a14894c598	2d4f8072-5038-43d9-9862-6d519a8a83f4	2025-09-15 23:20:37.439344+00
351b5a06-9c7d-43c2-a5ff-836cb5f2444c	49eee68f-ff93-4c0c-a064-f4a14894c598	7e7beef9-84b6-43ac-a8a8-5f7af60143cc	2025-09-15 23:20:37.439344+00
5f365afe-572f-48eb-abd2-5032b1934172	49eee68f-ff93-4c0c-a064-f4a14894c598	8d8e0212-2b50-4fe8-b6b9-2f355ffa7903	2025-09-15 23:20:37.439344+00
367ddd26-864a-46a4-b95c-e18685b50202	49eee68f-ff93-4c0c-a064-f4a14894c598	01a26eb6-755d-4434-aa11-634dec9aaf64	2025-12-16 23:54:06.748417+00
f8554da2-732e-4890-94d0-7b6e5c9db3ff	49eee68f-ff93-4c0c-a064-f4a14894c598	3df0d147-cd4b-414d-894e-979fac81dd9f	2025-09-15 23:20:37.439344+00
890019a2-fdcb-422c-9f24-9dfcdb694888	49eee68f-ff93-4c0c-a064-f4a14894c598	e0ff023e-0fcb-41a4-86e3-48c7b378e5f1	2025-12-16 23:54:06.748417+00
d3c6ad65-3933-415b-b184-537851840337	49eee68f-ff93-4c0c-a064-f4a14894c598	c6d42364-3d6c-44f4-a8ed-eae5e05120c8	2025-09-15 23:20:37.439344+00
df8c938d-d8f0-4559-a98f-bc08f18d43e8	49eee68f-ff93-4c0c-a064-f4a14894c598	d61a2688-730f-4312-99c6-979a7dc11241	2025-09-15 23:20:37.439344+00
b5c2af20-36f6-4f92-a372-446065aa05ad	49eee68f-ff93-4c0c-a064-f4a14894c598	bd7e8536-9ca4-4035-b434-d12e2ce0faac	2025-09-15 23:20:37.439344+00
95f767f0-f1e9-451e-9c1b-56d8ca0994f2	49eee68f-ff93-4c0c-a064-f4a14894c598	15d39765-f31a-4c21-b084-a43d06e7d567	2025-09-15 23:20:37.439344+00
77c8d56f-335d-4409-8c3a-f5f3996651c1	49eee68f-ff93-4c0c-a064-f4a14894c598	fccdf8d3-5be4-40cb-86c8-d86cb4a6ca9a	2025-09-15 23:20:37.439344+00
5b325db7-0106-475e-84db-508253ded1fd	49eee68f-ff93-4c0c-a064-f4a14894c598	31d5a50d-9064-423b-aabb-2c5fab4b1f58	2025-12-16 23:54:06.748417+00
58186696-4e07-4380-a9ec-9e10f17b600c	49eee68f-ff93-4c0c-a064-f4a14894c598	7e11a7d4-3e31-4774-ad72-80389ac45d01	2025-12-16 23:54:06.748417+00
901668f7-dbc3-448d-b459-177d01136c5f	49eee68f-ff93-4c0c-a064-f4a14894c598	d579a914-2a38-405b-a481-e9e0cdcac860	2025-12-16 23:54:06.748417+00
b0ed04a8-37a4-461c-af12-8b86b42235d1	49eee68f-ff93-4c0c-a064-f4a14894c598	837f96ab-7a27-41b2-aaff-f158a05cc436	2025-09-15 23:20:37.439344+00
cfeed0a5-cbc8-42c2-97b5-c0d71d4c396c	49eee68f-ff93-4c0c-a064-f4a14894c598	58cf951d-83ea-4983-9cec-6acc57096650	2025-09-15 23:20:37.439344+00
3c9da4d7-ae1d-4b9a-b5d9-0734adc47cb0	49eee68f-ff93-4c0c-a064-f4a14894c598	7f4d97c9-69ed-4532-9246-196b77486e61	2025-09-15 23:20:37.439344+00
2116139c-f4ae-4aad-bb17-b698b7b64a4f	49eee68f-ff93-4c0c-a064-f4a14894c598	00002a70-460b-4b50-97bf-f36809bcda34	2025-09-15 23:20:37.439344+00
61bacf99-7b17-41ee-8e40-5178fc759ef4	49eee68f-ff93-4c0c-a064-f4a14894c598	2fe4b626-57b9-4007-8813-cf7734d37c4b	2025-09-15 23:20:37.439344+00
ec75eeb6-918e-47d1-a41c-ce7b9630870c	49eee68f-ff93-4c0c-a064-f4a14894c598	afbd41e1-8a9e-4be0-9290-5b7a843abb3e	2025-09-15 23:20:37.439344+00
4426209b-28bc-4329-bc9a-01ef8a8f4ae6	49eee68f-ff93-4c0c-a064-f4a14894c598	b7169d21-ddaf-460b-8375-020698eb2823	2025-09-15 23:20:37.439344+00
664000f8-193f-48d1-b245-294e76c4c8d2	49eee68f-ff93-4c0c-a064-f4a14894c598	4f28f708-656f-4676-a0a5-9b5c586637b0	2025-09-15 23:20:37.439344+00
2473d248-9c96-407c-a61e-e31766be7726	49eee68f-ff93-4c0c-a064-f4a14894c598	afd713c4-f0ad-41fd-bbe0-b11d45c9e8be	2025-09-15 23:20:37.439344+00
c30c5c83-08e6-4fc3-8695-c15f66ac1f1a	49eee68f-ff93-4c0c-a064-f4a14894c598	b24b35b0-24ef-494b-82c4-ad8de99ce897	2025-09-15 23:20:37.439344+00
ecb05f0c-e4ae-4fe0-ab12-60169a404469	49eee68f-ff93-4c0c-a064-f4a14894c598	e22c20c7-e539-42db-be79-7031bb4e6d7d	2025-09-15 23:20:37.439344+00
d87c34df-8fcf-41c8-8647-b12fbcc2e851	49eee68f-ff93-4c0c-a064-f4a14894c598	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-15 23:20:37.439344+00
29ee2fbe-1747-454c-bbff-39db993cbe8a	49eee68f-ff93-4c0c-a064-f4a14894c598	97f4c2cc-fa6c-4acb-9a66-00d3ea18e951	2025-09-15 23:20:37.439344+00
17f457d6-20fe-43d6-9263-6cdbb0ee81ea	2997dd13-faad-4a67-83f4-a62e142898e5	a3cc434f-464d-454a-99ba-4b04d1a1ab72	2025-09-15 19:07:11.786537+00
4b3505f5-ac56-40b9-ad5a-b35569992c7a	2997dd13-faad-4a67-83f4-a62e142898e5	569bc27d-b531-4695-8c19-a4c15cc1c031	2025-09-15 19:07:11.786537+00
76a543d6-0310-4c7c-ae17-59f7a4efffc5	2997dd13-faad-4a67-83f4-a62e142898e5	8e601213-50e1-48f9-aafb-d6db4bac0abc	2025-09-15 19:07:11.786537+00
f7159653-1af0-4b51-9528-49d7d0999139	2997dd13-faad-4a67-83f4-a62e142898e5	fe26ef14-421b-4403-82e4-676bad92632b	2025-09-15 19:07:11.786537+00
c8d543fe-e5f5-4726-92a0-3a67631a5226	2997dd13-faad-4a67-83f4-a62e142898e5	8e1dc130-070d-446c-af26-68627478ba4b	2025-09-15 19:07:11.786537+00
b9a9616d-c65a-4385-8337-c5ee2ac9ba92	00000000-0000-0000-0000-000000000001	667627f2-d6f0-4d74-9bbf-759c144dcb7a	2025-12-17 03:46:04.282941+00
c43189da-e425-4890-8ed0-dd8aef96a3dc	00000000-0000-0000-0000-000000000001	e8dff0f6-e1e2-4e21-a729-36411576da21	2025-12-17 03:46:04.282941+00
25132d74-fe67-42d1-a012-c97dffe80f52	00000000-0000-0000-0000-000000000001	393d15c0-aa2b-4965-bec8-d04b4f3a902d	2025-12-17 03:46:04.282941+00
02d94f09-abb9-40dc-a643-b1a14174365b	00000000-0000-0000-0000-000000000001	e3987fed-27c2-4555-8c58-4c27954880a6	2025-12-17 03:46:04.282941+00
675b15b9-6dc1-4344-938f-a8fd22b9dcef	00000000-0000-0000-0000-000000000001	2cbb4f8d-ffa5-4e5c-baa4-4329a54de306	2025-12-17 03:46:04.282941+00
baa7cf33-15dd-47d7-a24d-022d7dceb3a2	49eee68f-ff93-4c0c-a064-f4a14894c598	7f6faf52-df76-4683-b1c7-817a6f050bf4	2025-09-15 23:20:37.439344+00
d25cf811-0d57-4aaa-9baa-971e0bd599a5	49eee68f-ff93-4c0c-a064-f4a14894c598	8892b990-2d05-4411-872c-0ad262baa8c9	2025-09-15 23:20:37.439344+00
530a0068-d308-4481-bb53-f0c01082ae9e	49eee68f-ff93-4c0c-a064-f4a14894c598	44adfed1-c618-44a7-9e27-2b8206f8f59e	2025-09-15 23:20:37.439344+00
ebbb5df6-8e1f-48cf-8609-d7d699f588a7	49eee68f-ff93-4c0c-a064-f4a14894c598	9a866358-4982-427d-bcc5-cdb145a30e88	2025-09-15 23:20:37.439344+00
052cc96f-c744-4297-b564-6157880d15d8	49eee68f-ff93-4c0c-a064-f4a14894c598	569bc27d-b531-4695-8c19-a4c15cc1c031	2025-09-15 23:20:37.439344+00
65d7fc39-0051-4813-bc52-d5aa34a4ec87	49eee68f-ff93-4c0c-a064-f4a14894c598	8e601213-50e1-48f9-aafb-d6db4bac0abc	2025-09-15 23:20:37.439344+00
24564fd9-1e37-4960-820b-ef01ef1f8db8	49eee68f-ff93-4c0c-a064-f4a14894c598	fe26ef14-421b-4403-82e4-676bad92632b	2025-09-15 23:20:37.439344+00
3d6f4de2-f652-4015-b70d-e3ea99c1d8b6	49eee68f-ff93-4c0c-a064-f4a14894c598	a3cc434f-464d-454a-99ba-4b04d1a1ab72	2025-09-15 23:20:37.439344+00
fdeb286b-0497-47ed-8169-8fae265a3b94	49eee68f-ff93-4c0c-a064-f4a14894c598	027c491a-7941-420b-8794-4b3284a07151	2025-09-15 23:20:37.439344+00
60ad5572-58e2-48e8-93bc-718e0bb7b800	00000000-0000-0000-0000-000000000001	6c0abc65-2469-4c62-b4f9-dd01abff8ba2	2025-12-17 03:46:04.282941+00
8fbcb5b0-8246-405b-a7be-c847056a2397	00000000-0000-0000-0000-000000000001	ce01e2a2-155e-4f25-9828-e28f1a4e33ed	2025-12-17 03:46:04.282941+00
9db81af8-d59b-4dab-a9c2-6ad89fbf860a	00000000-0000-0000-0000-000000000001	9953e8cf-8c8e-40ba-a494-fc5c46120d73	2025-12-17 03:46:04.282941+00
8e1386da-be2a-4695-98a4-c8446f9912f9	00000000-0000-0000-0000-000000000001	b50ce0cb-20b7-4383-bcae-e1e68d4acb4b	2025-12-17 03:46:04.282941+00
4a7e6b5a-cb02-4c21-8718-28660fa35464	00000000-0000-0000-0000-000000000001	5655d7ff-5329-445a-b680-3c787594c38b	2025-12-17 03:46:04.282941+00
44df1f7f-617a-43bf-b102-12a97f721f50	49eee68f-ff93-4c0c-a064-f4a14894c598	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-15 23:20:37.439344+00
bc361829-0ca6-4a43-9e14-860142cbc70d	49eee68f-ff93-4c0c-a064-f4a14894c598	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-15 23:20:37.439344+00
da0f9fc0-f24c-4129-b817-65948b6d79a4	00000000-0000-0000-0000-000000000001	1006ad31-2cd4-4669-b8a7-0d044d8d7651	2025-12-17 03:46:04.282941+00
1ab50dee-6bae-4797-826b-66a43b41775a	00000000-0000-0000-0000-000000000001	07b23621-dd11-4bac-9e65-17fdaba9b01a	2025-12-17 03:46:04.282941+00
451d8e6e-fd0e-439d-adc9-5659e1a43057	00000000-0000-0000-0000-000000000001	f92d8a70-6d4f-4f75-865e-9e875e1cf8a5	2025-12-17 03:46:04.282941+00
3167009b-9a96-406e-814f-31def2603808	00000000-0000-0000-0000-000000000001	35321f6a-3d79-4837-999b-92c7cc0b8a60	2025-12-17 03:46:04.282941+00
58ad575f-aa44-47ce-ac71-584d988fdd21	00000000-0000-0000-0000-000000000001	41975953-6bce-40fe-b131-6a2ad03744c7	2025-12-17 03:46:04.282941+00
551b7a18-5776-4441-922e-e5d6f9b44b9d	00000000-0000-0000-0000-000000000001	db52d995-f2a7-4366-aefd-8853afc54892	2025-12-17 03:46:04.282941+00
aaf00069-a526-44ab-a0fe-d90356b18f04	00000000-0000-0000-0000-000000000001	47eedd39-e70b-477b-97ef-131c0a8cec00	2025-12-17 03:46:04.282941+00
897f7143-aacc-4631-9c6d-7480b463d40e	00000000-0000-0000-0000-000000000001	72a04b9b-2b6e-40be-9a8e-ab1f652223fd	2025-12-17 03:46:04.282941+00
8c461a17-2387-4831-a2db-8b408430b8ed	00000000-0000-0000-0000-000000000001	c3010c5f-4f5c-4f93-ae54-0febf855b14a	2025-12-17 03:46:04.282941+00
bf4b0eb1-9f68-465d-95d6-745934c0c6d8	00000000-0000-0000-0000-000000000001	cdb7c991-69e4-4cd6-9e29-2c27b7c51963	2025-12-17 03:46:04.282941+00
47fc41a8-4cf5-42f0-aa43-6b616b046dd7	00000000-0000-0000-0000-000000000001	d5447b3a-c938-4de4-9ff5-8c0abf5a8d7a	2025-12-17 03:46:04.282941+00
eee18b83-90cf-4e18-b471-e8cfc074f5b9	00000000-0000-0000-0000-000000000001	94ba86ba-919d-435b-aba0-3e0bef8da8b6	2025-12-17 03:46:04.282941+00
924face4-7267-4ff7-8393-4f71ee166bf9	00000000-0000-0000-0000-000000000001	63c0f483-d561-4982-b60f-3cf06922d381	2025-12-17 03:46:04.282941+00
08307188-a741-477e-be64-2e1952544233	00000000-0000-0000-0000-000000000001	c15a1e22-74bf-45ab-bf7b-7ba5c9ff13af	2025-12-17 03:46:04.282941+00
f7be2239-abdb-48c9-b826-c52c2371bcb8	00000000-0000-0000-0000-000000000001	cbb86afd-886f-45cd-b9ad-f51ec151ea60	2025-12-17 03:46:04.282941+00
00fe30ab-02e4-4ce2-bed3-d2fc27d84604	00000000-0000-0000-0000-000000000001	f90cb2b1-95f1-4abb-ab50-42bf3b3d7ffc	2025-12-17 03:46:04.282941+00
74f1b261-227e-43af-acf0-9d28d9e97e1d	00000000-0000-0000-0000-000000000001	c9673e60-4a85-4422-91e6-8685042cd0ed	2025-12-17 03:46:04.282941+00
fadfa575-f41d-4ad9-95f1-3be4967a92f0	00000000-0000-0000-0000-000000000001	7c39dc69-0821-48cd-a8a0-6f8589becb8c	2025-12-17 03:46:04.282941+00
282c6986-8475-4867-a4ca-3ad9552c45e9	00000000-0000-0000-0000-000000000001	8c8366ce-2d35-463b-9cc7-a299b1331c6e	2025-12-17 03:46:04.282941+00
39f3552f-e209-45ac-bc64-0781d47cc642	00000000-0000-0000-0000-000000000001	d3602338-8c65-4725-a27f-83247e4ff558	2025-12-17 03:46:04.282941+00
056c1a43-b871-41d2-bc07-25fbc8b4a869	00000000-0000-0000-0000-000000000001	9061c6a3-3a00-4a47-afb9-1d721c137645	2025-12-17 03:46:04.282941+00
ad0ebe27-dcd0-4557-8369-1ed55ba80a50	00000000-0000-0000-0000-000000000001	9b572bb2-610b-4d1b-b62b-773685a5fc3b	2025-12-17 03:46:04.282941+00
98a7a939-a48d-4c70-8c07-307f13968fc8	00000000-0000-0000-0000-000000000001	48c4cf7f-7059-4cca-bdda-46febbf1fe56	2025-12-17 03:46:04.282941+00
3837119b-5a39-4fa8-b64e-dad8ebbbfdfd	00000000-0000-0000-0000-000000000001	9e4e583d-abcf-471a-8a4d-56fedb86ce4e	2025-12-17 03:46:04.282941+00
2eee2ced-e077-4451-bb32-645ff9e867e4	00000000-0000-0000-0000-000000000001	cc25f420-09ce-4bc4-8be6-f58f1a0a3299	2025-12-17 03:46:04.282941+00
811449ff-18b6-4823-8a1a-3ab5fb28354c	00000000-0000-0000-0000-000000000001	54263e9d-5fdd-4497-843e-597dfb052454	2025-12-17 03:46:04.282941+00
bdf680b1-b2d4-4119-85af-1c6017f3fb5c	00000000-0000-0000-0000-000000000001	57d4079d-cac4-4a8c-97b1-8682e408643f	2025-12-17 03:46:04.282941+00
9e227144-3033-4f30-9e6f-70932b4a01a7	00000000-0000-0000-0000-000000000001	e630d343-b0ea-4e82-840d-d245aa525225	2025-12-17 03:46:04.282941+00
ee1ea5b1-ebc6-4677-8966-41a3f4cfd51f	00000000-0000-0000-0000-000000000001	37a6c6c3-92c8-4529-9472-ddb94ddc778a	2025-12-17 03:46:04.282941+00
a5ce2526-36ff-410c-b3b5-66a793696ddb	00000000-0000-0000-0000-000000000001	82a9a1b0-32a7-4960-bfd7-b866f3e9f1a3	2025-12-17 03:46:04.282941+00
ef3785fe-9554-4507-aeff-5833a5bc26b8	00000000-0000-0000-0000-000000000001	5dbeca45-8eea-4720-a9c5-d1ae600c0910	2025-12-17 03:46:04.282941+00
67df2039-63b7-43ce-92fe-1dfca4b9769a	00000000-0000-0000-0000-000000000001	95069e32-4be0-4ac8-9295-ebb1bd60788c	2025-12-17 03:46:04.282941+00
68c6b8e4-e057-4504-ad7f-353f68886e6f	00000000-0000-0000-0000-000000000001	1db2c213-15b6-4042-95e0-76988807353a	2025-12-17 03:46:04.282941+00
c6914280-39b4-4442-8ac0-855ad70d806c	00000000-0000-0000-0000-000000000001	9b33b581-a445-456b-ab58-c4f96e0595a0	2025-12-17 03:46:04.282941+00
b688c526-adf6-463a-8bf9-0b4b57bf4fcc	00000000-0000-0000-0000-000000000001	3f553bd2-1b9c-445a-8832-ae83aa3e8d09	2025-12-17 03:46:04.282941+00
cb96a944-64f0-43cd-ad1d-27c642a983a1	00000000-0000-0000-0000-000000000001	ed8085c0-805f-4f19-8b4c-20e30124e958	2025-12-17 03:46:04.282941+00
a776a9eb-4ed9-4462-b10c-68a978b95150	00000000-0000-0000-0000-000000000001	81a0c48c-12be-4c1a-81fd-c473d1e29272	2025-12-17 03:46:04.282941+00
b88ed1fe-b1ba-4ce2-a6ab-cde737c871aa	00000000-0000-0000-0000-000000000001	235c5199-4f6d-4ca9-9945-3c7b469359f1	2025-12-17 03:46:04.282941+00
31a2e0bd-91c9-41dc-8cee-e87592c7cdb9	49eee68f-ff93-4c0c-a064-f4a14894c598	59beb044-fb41-4825-bda5-ec670c4b1c70	2025-09-15 23:20:37.439344+00
a34d7455-ba3d-457c-9220-1bdeec4327a6	00000000-0000-0000-0000-000000000001	c2b0309f-db53-4d87-8d7c-91f8ff99628e	2025-12-17 03:46:04.282941+00
e3abd487-8355-48c0-8572-59bb514dffee	49eee68f-ff93-4c0c-a064-f4a14894c598	a3bbd4d9-9744-4a23-8c49-69a655181872	2025-09-15 23:20:37.439344+00
b4445343-4b6b-4145-9238-92a1af143e43	00000000-0000-0000-0000-000000000001	2fe4b626-57b9-4007-8813-cf7734d37c4b	2025-12-17 03:46:04.282941+00
077417f8-e151-4fcc-b28a-82c7d0f44de1	00000000-0000-0000-0000-000000000001	a9383391-f34d-46ec-a3f2-bfdbb4a61039	2025-12-17 03:46:04.282941+00
606b2392-b427-4432-afe8-352486ce93b4	49eee68f-ff93-4c0c-a064-f4a14894c598	e46a22de-eeda-4e01-be13-0cb354355b15	2025-09-15 23:20:37.439344+00
370cac47-a698-444d-88a8-c747f528115b	00000000-0000-0000-0000-000000000001	5cdebce9-c04c-4a26-b6be-17192e724c8e	2025-12-17 03:46:04.282941+00
48792835-8725-426b-8886-0119d488accc	2997dd13-faad-4a67-83f4-a62e142898e5	fe26ef14-421b-4403-82e4-676bad92632b	2025-09-15 19:07:11.786537+00
ba3ce4a3-93aa-472a-a7aa-d7d3eb035553	49eee68f-ff93-4c0c-a064-f4a14894c598	fe26ef14-421b-4403-82e4-676bad92632b	2025-09-15 23:20:37.439344+00
aee7bd58-312c-417e-bd4c-c4280796eb88	00000000-0000-0000-0000-000000000001	afbd41e1-8a9e-4be0-9290-5b7a843abb3e	2025-12-17 03:46:04.282941+00
3171abf9-8be1-4055-a64b-fa45adb9baab	00000000-0000-0000-0000-000000000001	a0ed5882-a841-43f8-bad7-134bb83abff2	2025-12-17 03:46:04.282941+00
e49c6a94-1e86-4f8c-964c-f7188683b817	49eee68f-ff93-4c0c-a064-f4a14894c598	ea46b60b-6e44-467c-bc3d-6105af7ec2ab	2025-09-15 23:20:37.439344+00
73fe2847-2ffe-46be-bee4-9c05d7eccd53	00000000-0000-0000-0000-000000000001	093b61dc-b12b-43dd-977a-880c52855ec1	2025-12-17 03:46:04.282941+00
c2fc1a7c-db2b-4015-b2e0-a1c88c59fe7c	49eee68f-ff93-4c0c-a064-f4a14894c598	3319ccb1-ce22-4a8e-867d-05375c9abaee	2025-09-15 23:20:37.439344+00
7cfcc035-3281-470e-a21e-0fcadd512c1b	00000000-0000-0000-0000-000000000001	cd9dba3f-70b1-4b19-bfb4-a43fa043fb0d	2025-12-17 03:46:04.282941+00
5282e679-3d37-42a0-ae2a-1f42a89d076c	00000000-0000-0000-0000-000000000001	f527a64f-a41a-419d-9094-5d6b8dea60ca	2025-12-17 03:46:04.282941+00
36d24cf4-68cc-4934-a5fd-f7d54a77b9ba	00000000-0000-0000-0000-000000000001	0ed81734-5273-44dd-9341-e0ae7eb4dbca	2025-12-17 03:46:04.282941+00
404a73db-8a99-458f-bf9c-c7a2712de5f5	00000000-0000-0000-0000-000000000001	d395f48f-2f03-4acb-9241-9941bafbfaa3	2025-12-17 03:46:04.282941+00
bd425bc9-43ae-44dd-a53b-a96a2c139f9c	00000000-0000-0000-0000-000000000001	b1965c3d-a87b-4426-be5b-0488aab1bfde	2025-12-17 03:46:04.282941+00
2f1900dd-da1e-4850-b0ef-646a9a07b44d	00000000-0000-0000-0000-000000000001	8679cf25-2e5b-4941-9c6d-8c4634963285	2025-12-17 03:46:04.282941+00
bcd5d97d-b602-4fd6-a92b-886e8c568d71	00000000-0000-0000-0000-000000000001	6811e7fe-8609-44c5-9ca8-dd967cd56278	2025-12-17 03:46:04.282941+00
59c4a168-b58f-4b2e-9b9c-d06825efdd29	00000000-0000-0000-0000-000000000001	8ce5d6fc-a4ee-425b-9043-8debb248fab4	2025-12-17 03:46:04.282941+00
2e3233f7-c4dd-46fa-bfcd-0ecec7a552d5	00000000-0000-0000-0000-000000000001	5bd4214a-0719-4313-8c4f-15c93f764913	2025-12-17 03:46:04.282941+00
c012e5b7-86d6-4453-8309-0d56c6e16ed6	00000000-0000-0000-0000-000000000001	64efab12-f3f2-490c-a54e-ae26373af6fc	2025-12-17 03:46:04.282941+00
372823fd-eb84-4faf-a190-07690afcffb5	00000000-0000-0000-0000-000000000001	af0027ba-73a5-4ada-9305-39c09a7e1854	2025-12-17 03:46:04.282941+00
8e84bfb6-3d2b-4eb5-8275-6ae36071ef16	00000000-0000-0000-0000-000000000001	d18e0c73-7118-40de-a9a2-3a680dfb26ef	2025-12-17 03:46:04.282941+00
291f8082-b23b-4a6a-bedc-0e28256196a1	00000000-0000-0000-0000-000000000001	3a0bf3e2-ebb6-40c6-bd2b-c50085f1e8ba	2025-12-17 03:46:04.282941+00
42596d38-8be6-42f3-b755-bd2023faf3e5	00000000-0000-0000-0000-000000000001	b3522814-9b90-49de-b0ce-c607497fbc0c	2025-12-17 03:46:04.282941+00
9e5777fb-fa07-4e21-97d1-51207b086353	00000000-0000-0000-0000-000000000001	a4c87291-0e60-4376-bfd2-50c6eda88c77	2025-12-17 03:46:04.282941+00
015d54b3-b255-4c18-ad98-be3b9c738d61	00000000-0000-0000-0000-000000000001	0499a1a4-3638-427e-a7b7-57019309c498	2025-12-17 03:46:04.282941+00
13c3e569-6a70-4732-9bbf-d916f593dde2	00000000-0000-0000-0000-000000000001	5f5a62d5-58cb-4e2c-bb9b-4ab670dd6ae2	2025-12-17 03:46:04.282941+00
546ebd47-b3d8-4b21-a65a-9be232cce0c4	00000000-0000-0000-0000-000000000001	4549daff-81d6-4338-b523-da94f041608d	2025-12-17 03:46:04.282941+00
09143a26-fdf9-433d-ad8b-c3c1dd3d89af	00000000-0000-0000-0000-000000000001	9e7cdc77-41f3-4426-be65-ff86949ed456	2025-12-17 03:46:04.282941+00
46881e40-87f9-4026-b504-06c316f790cb	00000000-0000-0000-0000-000000000001	8c2d3f16-b86d-477b-9a8d-0409ae18891c	2025-12-17 03:46:04.282941+00
a78387dc-3ae1-445d-9fb6-f0573047259d	00000000-0000-0000-0000-000000000001	d041a332-7c4c-4c09-ba6d-cdb2b3c64187	2025-12-17 03:46:04.282941+00
db750dd8-ba77-454c-8a68-f2b632ec5b9c	00000000-0000-0000-0000-000000000001	1ef43c73-40ad-420d-a8d6-131e2c2e3187	2025-12-17 03:46:04.282941+00
af79c0be-ac95-476c-8ecd-25863fdce886	00000000-0000-0000-0000-000000000001	c47a03d0-89d8-48ec-a48f-cc5f034f1784	2025-12-17 03:46:04.282941+00
f38d4a79-de92-4095-8b72-36e0bd8a3583	00000000-0000-0000-0000-000000000001	5e4efbf7-05c6-44e2-8d03-65f1ca8c35d2	2025-12-17 03:46:04.282941+00
85e243d6-953c-45ef-947e-3741f7e4189b	00000000-0000-0000-0000-000000000001	2d4f8072-5038-43d9-9862-6d519a8a83f4	2025-12-17 03:46:04.282941+00
2099b4ba-4f96-4214-a86f-a8c7e107d99f	00000000-0000-0000-0000-000000000001	5fc9e739-dab2-40c0-bd7c-02d233a9a6b9	2025-12-17 03:46:04.282941+00
bd8737b4-3428-4d84-a15b-26a8bc487850	00000000-0000-0000-0000-000000000001	71ea6bbf-4040-4ce7-853a-b22da2a9eb36	2025-12-17 03:46:04.282941+00
c511386f-d6f1-4578-8319-7e5e890b551e	00000000-0000-0000-0000-000000000001	7e7beef9-84b6-43ac-a8a8-5f7af60143cc	2025-12-17 03:46:04.282941+00
5f5d8194-d403-4218-8831-6524e3fd80f3	00000000-0000-0000-0000-000000000001	63110d33-ef8d-4b8b-b29f-dc5ac9ffa32b	2025-12-17 03:46:04.282941+00
3dfccee3-3323-4da4-bb76-addfaee42439	00000000-0000-0000-0000-000000000001	d34c3771-2d4a-46ab-b369-25a2707d8685	2025-12-17 03:46:04.282941+00
627a3f8b-66cf-404e-b1d2-59ff4229cec0	00000000-0000-0000-0000-000000000001	8d8e0212-2b50-4fe8-b6b9-2f355ffa7903	2025-12-17 03:46:04.282941+00
20861675-695e-4d06-aaee-9c0549820d4e	00000000-0000-0000-0000-000000000001	8c8c63b0-0fe0-40f8-9f8c-6fd7bbb369df	2025-12-17 03:46:04.282941+00
b875fc86-947c-43f5-9c56-153d5e056ab4	00000000-0000-0000-0000-000000000001	dfa16e6f-0b8e-4881-b4b6-75e5d43b33cc	2025-12-17 03:46:04.282941+00
f2ce297c-e055-468b-8e27-15baa8bba45e	00000000-0000-0000-0000-000000000001	dd04ac40-7ad6-4729-acae-5aeaf9e8b9b3	2025-12-17 03:46:04.282941+00
673ff550-7fcb-43ac-a2c2-edd185b0f60c	00000000-0000-0000-0000-000000000001	55d37a41-5ed2-4f73-a155-3f4fbe97fdec	2025-12-17 03:46:04.282941+00
31e63a4a-7630-474d-933b-27411908718c	00000000-0000-0000-0000-000000000001	314adf20-58b8-439b-915a-8ea5445a07f8	2025-12-17 03:46:04.282941+00
2371156c-0988-4720-b0a2-e689e223a956	00000000-0000-0000-0000-000000000001	80fc7b9d-939e-41fe-bdf2-147c03037278	2025-12-17 03:46:04.282941+00
f176a87b-398b-4a22-8734-de0a634fc44f	00000000-0000-0000-0000-000000000001	10677ff4-d5fd-4ddd-8e5e-4071219d46bf	2025-12-17 03:46:04.282941+00
f776e08f-a454-46c4-9544-17033cb6084a	00000000-0000-0000-0000-000000000001	ec0aaecf-c338-41b5-9013-f1c8c1bf498b	2025-12-17 03:46:04.282941+00
b5b0ef62-3366-41cc-bb68-2cfaec107069	00000000-0000-0000-0000-000000000001	5ac3cc9a-16ba-487f-8e59-1b31887adc0f	2025-12-17 03:46:04.282941+00
ac6e0578-d3ba-4d47-b63c-11e4334a2a9a	00000000-0000-0000-0000-000000000001	84dd00d7-9552-4937-a75c-186ec4c3669d	2025-12-17 03:46:04.282941+00
ab847d06-1ac0-417f-adfa-33dd1a4613c3	00000000-0000-0000-0000-000000000001	b8c89518-ad76-4de0-8d8d-1dfe466066c0	2025-12-17 03:46:04.282941+00
91248dac-2348-4606-9588-72d0244f4633	00000000-0000-0000-0000-000000000001	3df0d147-cd4b-414d-894e-979fac81dd9f	2025-12-17 03:46:04.282941+00
274b8b06-44f6-459d-8af2-bcc3c4438c8e	00000000-0000-0000-0000-000000000001	9104b2f8-2030-44c5-964b-530a8a437b1e	2025-12-17 03:46:04.282941+00
a0e36986-8d9b-40d1-814f-041549277588	00000000-0000-0000-0000-000000000001	4ce359b1-9308-4017-a3dd-deaa7a3300d0	2025-12-17 03:46:04.282941+00
6f684f6c-cd53-4feb-a3c5-26c53d00122c	00000000-0000-0000-0000-000000000001	7f4d97c9-69ed-4532-9246-196b77486e61	2025-12-17 03:46:04.282941+00
30cf7b74-05b3-4649-9796-7c57126a48bc	00000000-0000-0000-0000-000000000001	6f266de4-309d-4b08-a0c8-52e331d5d27b	2025-12-17 03:46:04.282941+00
52fa2f23-6782-483a-832d-e7f175d5473a	00000000-0000-0000-0000-000000000001	27000332-45ee-42c0-9557-00b4caa15f83	2025-12-17 03:46:04.282941+00
f0400f48-a7b0-4ab7-ba25-9bac5013f645	00000000-0000-0000-0000-000000000001	00002a70-460b-4b50-97bf-f36809bcda34	2025-12-17 03:46:04.282941+00
9bc137db-561a-4798-bed4-895d0fa808ce	00000000-0000-0000-0000-000000000001	dfb9898b-ff4a-4111-8654-f3e994a3f657	2025-12-17 03:46:04.282941+00
7e8c91c8-38e6-46f2-87ee-a76597138cfc	00000000-0000-0000-0000-000000000001	92362eac-1447-4934-ab48-8a6ba3780856	2025-12-17 03:46:04.282941+00
663d484b-8b3c-4176-9cb4-ef13da91e394	00000000-0000-0000-0000-000000000001	2b8b088a-952b-4465-8238-65f9aac1a61e	2025-12-17 03:46:04.282941+00
8a0654e8-4041-4abc-a5c9-dc3736059bc8	00000000-0000-0000-0000-000000000001	60de088a-14dd-405d-b428-3f646f5d42fa	2025-12-17 03:46:04.282941+00
a208bbed-716d-4f37-8c13-d7800d9a23e5	00000000-0000-0000-0000-000000000001	c499c0a4-7280-4a10-8827-3ad577ad3c12	2025-12-17 03:46:04.282941+00
035ea936-2f59-4e1e-97d2-9eb5de30aba7	00000000-0000-0000-0000-000000000001	c6d42364-3d6c-44f4-a8ed-eae5e05120c8	2025-12-17 03:46:04.282941+00
5cfce12e-550c-476d-b7e5-f2514be9df03	00000000-0000-0000-0000-000000000001	ea28ae3f-b52b-499a-ba1f-3338f30a4b84	2025-12-17 03:46:04.282941+00
9936b64b-8641-4ddb-9d01-1043a6754fb0	00000000-0000-0000-0000-000000000001	e6e6be79-b64d-4b14-b087-6559f82937f4	2025-12-17 03:46:04.282941+00
481df7f0-632c-4cd3-9ee1-af6b8d3b8e31	00000000-0000-0000-0000-000000000001	5a0c62b4-9ea9-4c92-9996-60d557d9e513	2025-12-17 03:46:04.282941+00
73622c86-aa92-43bc-90f1-cff885fe2185	00000000-0000-0000-0000-000000000001	5cc4d261-f843-44f2-a966-dbfaf22fe742	2025-12-17 03:46:04.282941+00
6870d4df-dd1f-46a1-8446-5f646ff65d27	00000000-0000-0000-0000-000000000001	2fe8fb3e-0e43-4b56-bb7c-9287cc5e7184	2025-12-17 03:46:04.282941+00
8a83e153-24ef-4474-9881-6fc3e2e04801	00000000-0000-0000-0000-000000000001	d61a2688-730f-4312-99c6-979a7dc11241	2025-12-17 03:46:04.282941+00
57690316-46bc-4ecd-9bc8-de89c727554a	00000000-0000-0000-0000-000000000001	072e69e1-2ab1-4f2e-a970-3b363ad6c745	2025-12-17 03:46:04.282941+00
633fd1d5-7753-4f73-b067-7ba5fe3a16a1	00000000-0000-0000-0000-000000000001	14dc438f-cb6d-42b7-a1c9-a41792de2b24	2025-12-17 03:46:04.282941+00
48e5a658-3086-4c31-b1c4-bfc2f27e5461	00000000-0000-0000-0000-000000000001	bd7e8536-9ca4-4035-b434-d12e2ce0faac	2025-12-17 03:46:04.282941+00
7d871354-9cde-4bea-818c-48dbd3ee6904	00000000-0000-0000-0000-000000000001	f01df662-e204-4f74-a96f-5e219d33d709	2025-12-17 03:46:04.282941+00
1cf98c9a-0178-4da4-aaf7-8f3f656527a5	00000000-0000-0000-0000-000000000001	dff98efd-ddb6-4990-82b3-02cc25861952	2025-12-17 03:46:04.282941+00
43962652-7fcf-4a71-b6ad-1d5e722e5cfc	00000000-0000-0000-0000-000000000001	15d39765-f31a-4c21-b084-a43d06e7d567	2025-12-17 03:46:04.282941+00
bb576bbb-5ade-4644-b940-839d30769df7	00000000-0000-0000-0000-000000000001	c5e99d0a-d393-4180-a9a8-3a81fd562def	2025-12-17 03:46:04.282941+00
a6bf5ff6-0047-4077-aea6-ebf83862f5a3	00000000-0000-0000-0000-000000000001	b8d42dcb-dbed-42ce-9522-20c3818df4c2	2025-12-17 03:46:04.282941+00
f67dae7c-7b6f-4eb8-8ea2-9c72a91e56d3	00000000-0000-0000-0000-000000000001	fccdf8d3-5be4-40cb-86c8-d86cb4a6ca9a	2025-12-17 03:46:04.282941+00
ad570180-c061-4dca-a6b1-74b191980a53	00000000-0000-0000-0000-000000000001	3bfdb7e6-bb25-4160-b71b-e9454088b211	2025-12-17 03:46:04.282941+00
34c24817-ad73-4f37-96fd-8e7af92bb4f0	00000000-0000-0000-0000-000000000001	28c6a072-cd7f-41f4-ada6-b2548cea7f10	2025-12-17 03:46:04.282941+00
4b438a2b-d17e-46c1-bdf3-aaab62a5d717	00000000-0000-0000-0000-000000000001	837f96ab-7a27-41b2-aaff-f158a05cc436	2025-12-17 03:46:04.282941+00
5a0710c8-9332-40fe-8dbc-de85bf29f7dd	00000000-0000-0000-0000-000000000001	01af9538-b4fe-4ef4-8a06-f2c9cd700ce7	2025-12-17 03:46:04.282941+00
eaeba91b-4b76-46fc-9f5e-76f4f80baaf2	00000000-0000-0000-0000-000000000001	10fd145a-105e-4daa-974a-0a8b511238aa	2025-12-17 03:46:04.282941+00
3beff6a1-e9ff-4870-99df-23481fdf9227	00000000-0000-0000-0000-000000000001	58cf951d-83ea-4983-9cec-6acc57096650	2025-12-17 03:46:04.282941+00
eccc9422-e601-4094-bf4b-7632f6bab472	00000000-0000-0000-0000-000000000001	8f6853d5-df7d-4538-a7a3-1286b1e39026	2025-12-17 03:46:04.282941+00
08f92542-e041-47b8-8b94-41162b0314f1	00000000-0000-0000-0000-000000000001	a3cc434f-464d-454a-99ba-4b04d1a1ab72	2025-12-17 03:46:04.282941+00
ddfeaee2-8a54-4933-87bf-0e9d2c594e08	00000000-0000-0000-0000-000000000001	b7169d21-ddaf-460b-8375-020698eb2823	2025-12-17 03:46:04.282941+00
586a261e-6b4b-431a-a119-4f2a6aab9ce4	00000000-0000-0000-0000-000000000001	027c491a-7941-420b-8794-4b3284a07151	2025-12-17 03:46:04.282941+00
868ef7ce-5167-4ae2-b1f9-32d497dd5074	00000000-0000-0000-0000-000000000001	57ab4d19-3efd-47bf-8533-13ee3d26736f	2025-12-17 03:46:04.282941+00
8ab7e7da-dade-43f8-9973-382af165c4cd	00000000-0000-0000-0000-000000000001	4f28f708-656f-4676-a0a5-9b5c586637b0	2025-12-17 03:46:04.282941+00
8bfb512a-2108-48f1-9457-0eefa4016225	00000000-0000-0000-0000-000000000001	224f89d5-b02b-4598-ba82-83dd81b08ca2	2025-12-17 03:46:04.282941+00
ab7f1184-1f95-4253-8136-46ce79c872c6	00000000-0000-0000-0000-000000000001	f4b6bfdc-5660-4e32-b7f2-4311f8abc6fe	2025-12-17 03:46:04.282941+00
4c1faf00-c8bc-4515-97e5-c7286dbf57bd	00000000-0000-0000-0000-000000000001	afd713c4-f0ad-41fd-bbe0-b11d45c9e8be	2025-12-17 03:46:04.282941+00
1e7f343f-7b23-43fd-8a2d-77ef687f1b22	00000000-0000-0000-0000-000000000001	3bff5f10-55c2-4bf3-9b19-8ace38bdef8a	2025-12-17 03:46:04.282941+00
ddd9f7b6-c470-41c7-9a48-162e1390e548	00000000-0000-0000-0000-000000000001	a4ec676e-65b6-4c37-8f9d-3b86333364b0	2025-12-17 03:46:04.282941+00
0baf78ab-a460-42d1-ba72-f4e4ba118f00	00000000-0000-0000-0000-000000000001	b24b35b0-24ef-494b-82c4-ad8de99ce897	2025-12-17 03:46:04.282941+00
e56c3299-d073-44b0-9a0e-ef5f286a38ae	00000000-0000-0000-0000-000000000001	e3c61f4e-37c0-4f0b-ae6d-2ffd7b406824	2025-12-17 03:46:04.282941+00
4914bea6-20b1-4fac-b335-0ba2083419e4	00000000-0000-0000-0000-000000000001	1a064b59-1665-4dc7-9b37-479114b0754a	2025-12-17 03:46:04.282941+00
8d1623d3-5d18-4a9b-9363-41e529e32b54	00000000-0000-0000-0000-000000000001	4876b30e-7025-45f9-bc56-e5ff22ef9981	2025-12-17 03:46:04.282941+00
58749628-b108-45d4-bc9a-963f3625c165	00000000-0000-0000-0000-000000000001	a2688f24-8ab4-4e2c-bc30-0a93f6da6e6d	2025-12-17 03:46:04.282941+00
4389dc23-d1e9-4ced-b856-b3dfd674f0a3	00000000-0000-0000-0000-000000000001	3f924def-d4dd-47d7-b3c0-9cd94e70e1e8	2025-12-17 03:46:04.282941+00
7ea3ef16-7801-4a52-85f5-903948930db0	00000000-0000-0000-0000-000000000001	e22c20c7-e539-42db-be79-7031bb4e6d7d	2025-12-17 03:46:04.282941+00
b99da0ad-7e5c-4b1a-bb86-e74501937066	00000000-0000-0000-0000-000000000001	665e7de4-4bd4-4534-8c0a-c9cb37e7c46b	2025-12-17 03:46:04.282941+00
ec71054b-4cbf-47d3-adc9-c5a2550aa78b	00000000-0000-0000-0000-000000000001	3d9db295-c035-4963-9b93-72d33ce64390	2025-12-17 03:46:04.282941+00
e047551f-644a-4536-a4fe-4d1e894c2af6	00000000-0000-0000-0000-000000000001	8156b371-7d38-4a82-b3fa-f8c60737f450	2025-12-17 03:46:04.282941+00
12664e9d-48db-4f89-ac65-53587797ed87	00000000-0000-0000-0000-000000000001	c8f4c3ee-c0cd-4a0b-9ed0-51a2c997bdf6	2025-12-17 03:46:04.282941+00
a7463b0b-38d2-47c5-ab5f-d36688a6ba31	00000000-0000-0000-0000-000000000001	437a194a-339f-4629-86ab-15ca6a41d4c5	2025-12-17 03:46:04.282941+00
70a503f4-92ee-44bb-98c6-035794f9c8fe	00000000-0000-0000-0000-000000000001	1c4d4fde-3f97-4a20-87c2-003f01d078f9	2025-12-17 03:46:04.282941+00
904efab7-ba3f-42f3-8ab1-0d71b9d70951	00000000-0000-0000-0000-000000000001	933963f3-8dbf-49fe-9fc7-a9abbd4a1479	2025-12-17 03:46:04.282941+00
88f21905-2ae9-4d34-8626-2f3a4e6a46f7	00000000-0000-0000-0000-000000000001	2edc308c-2e9d-444f-a9fe-3d7d60f4631f	2025-12-17 03:46:04.282941+00
22d7998b-c831-4d86-8ff1-07699c4f2aa3	2997dd13-faad-4a67-83f4-a62e142898e5	54263e9d-5fdd-4497-843e-597dfb052454	2025-09-15 20:11:32.805113+00
2e4fc1f3-127d-47c2-89f9-8557b7b6694c	00000000-0000-0000-0000-000000000001	25366017-b134-447f-8992-7f94704288d4	2025-12-17 03:46:04.282941+00
5c11fc6f-178f-40d4-b352-99b4fedc9c00	00000000-0000-0000-0000-000000000001	79a1d2ef-665d-4e9d-89e1-539367d73fca	2025-12-17 03:46:04.282941+00
1ca1eded-9daf-4088-bdfc-05d9f8b2017a	49eee68f-ff93-4c0c-a064-f4a14894c598	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-19 00:18:40.978143+00
8afa4542-7e9c-4c7d-8838-5d9c04b3b8a4	49eee68f-ff93-4c0c-a064-f4a14894c598	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-19 00:18:40.978143+00
04aa849e-e192-4433-b586-b2d691b37b2c	49eee68f-ff93-4c0c-a064-f4a14894c598	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-19 00:18:40.978143+00
f5df7f8c-f280-4b60-952c-c98a86ebd049	2997dd13-faad-4a67-83f4-a62e142898e5	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-19 00:18:40.978143+00
cb5cc677-0981-4b5e-8a27-546eac556576	49eee68f-ff93-4c0c-a064-f4a14894c598	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-19 00:18:40.978143+00
b43f4b30-e098-473b-8c4f-84bffb02af23	2997dd13-faad-4a67-83f4-a62e142898e5	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-19 00:18:40.978143+00
966e0b34-1437-4b95-84df-c62a1ed9b965	2997dd13-faad-4a67-83f4-a62e142898e5	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-19 00:18:40.978143+00
03b644de-308a-4893-a102-e7d9a1121065	2997dd13-faad-4a67-83f4-a62e142898e5	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-09-19 00:18:40.978143+00
a980540d-aebf-4f10-b062-238b8e9e5ac8	00000000-0000-0000-0000-000000000001	5d72a4d2-2a85-47d5-a009-9f5684494c39	2025-12-17 03:46:04.282941+00
0ffc7d28-2897-4316-98ed-25a56c7c3b81	00000000-0000-0000-0000-000000000001	63af4055-fd94-4980-aaca-59914fb36334	2025-12-17 03:46:04.282941+00
aaef2065-e6fd-49ce-a790-f56192716364	00000000-0000-0000-0000-000000000001	399ba16c-5a8c-4232-99ed-9b529dcefcf3	2025-12-17 03:46:04.282941+00
7d9a6a34-7fc4-4a44-ab3d-3481e2137c97	00000000-0000-0000-0000-000000000001	547e9a9f-2e00-452f-adf6-15a3d94c2e54	2025-12-17 03:46:04.282941+00
3ded9fbf-e58b-4eb1-8440-ddffe4f99e4a	00000000-0000-0000-0000-000000000001	e456ca65-285b-4164-a1f9-a56c11d10be5	2025-12-17 03:46:04.282941+00
c2334b47-e1ec-4dfc-b930-220833f07e64	00000000-0000-0000-0000-000000000001	d5aca651-c332-44d7-982c-82fae2181c0a	2025-12-17 03:46:04.282941+00
eaea2f6a-cdcb-447f-a026-b2399369c3a7	00000000-0000-0000-0000-000000000001	94eae3ba-e92e-4782-8227-30919711fe25	2025-12-17 03:46:04.282941+00
9cac5fee-553d-4c18-a76b-fbd5b48692e6	00000000-0000-0000-0000-000000000001	ebedfe11-8730-4021-90ee-18a40a8423b7	2025-12-17 03:46:04.282941+00
6f7e39ab-12fb-400c-940c-fbff8b62af16	00000000-0000-0000-0000-000000000001	2a6516d4-e303-4656-86ea-b01ba52e734b	2025-12-17 03:46:04.282941+00
361004e8-ff4e-4ca5-aad7-81b074202044	00000000-0000-0000-0000-000000000001	3eb48a6e-0a16-4980-80aa-9be415245a49	2025-12-17 03:46:04.282941+00
4b56092d-9672-4eb6-aac2-83d329e103c4	00000000-0000-0000-0000-000000000001	92e2c814-a965-4cc7-886d-5069563c82da	2025-12-17 03:46:04.282941+00
3abccd7a-c6f1-4dd8-a262-95faf2f24ea1	00000000-0000-0000-0000-000000000001	c5f2616d-e6ca-4eed-8046-375243c75301	2025-12-17 03:46:04.282941+00
c1d0e13f-1b08-4817-8857-1c56492ac5cc	00000000-0000-0000-0000-000000000001	4e749caf-a2bd-45a7-9ead-9956f22dbd6f	2025-12-17 03:46:04.282941+00
d7dbd78e-454c-4d6c-8972-1892c4f5e844	00000000-0000-0000-0000-000000000001	0dd12ebf-3e4b-4445-85f9-baac078bcf86	2025-12-17 03:46:04.282941+00
671a436e-f468-4390-8921-20c2981d58e8	00000000-0000-0000-0000-000000000001	a84f58b8-23b5-4d75-ae3d-0bd62b86a82e	2025-12-17 03:46:04.282941+00
9c489b89-b8c2-448d-89d1-698d9f58ced0	00000000-0000-0000-0000-000000000001	c07c7bcf-a7da-4d47-932f-72b2fa955083	2025-12-17 03:46:04.282941+00
439a8722-980c-45a3-a2ee-90a78fa1dc72	00000000-0000-0000-0000-000000000001	7708d96f-dce4-4a5b-aa67-6a284ed264d3	2025-12-17 03:46:04.282941+00
76c0f5c5-cd78-42c7-be20-7d8dcd062c6c	00000000-0000-0000-0000-000000000001	a53cc7cb-c4ad-4e99-93f2-ad34b908f4c3	2025-12-17 03:46:04.282941+00
7ea95af9-26f2-4583-ba0d-a150365dc45b	00000000-0000-0000-0000-000000000001	f8db5086-6680-4a4c-ac46-bc6f7886cbbb	2025-12-17 03:46:04.282941+00
be68f4ef-b057-413f-a212-1e3e3764646e	00000000-0000-0000-0000-000000000001	6be2319c-35e9-4334-88a6-6f9de248bd06	2025-12-17 03:46:04.282941+00
95b4326d-e272-42ce-967c-b891d4805875	00000000-0000-0000-0000-000000000001	2a4c4b3c-8751-4b3f-84ee-0fb429977ad9	2025-12-17 03:46:04.282941+00
3d10d3f3-23f2-4bfe-8514-719bb97c684d	00000000-0000-0000-0000-000000000001	f78642ca-fdb2-4238-807c-a2a016b6c414	2025-12-17 03:46:04.282941+00
0cd6ec23-27e0-46ea-b15d-5a9a1e747fd4	00000000-0000-0000-0000-000000000001	aa424194-1402-416e-a3ae-6447fdb27254	2025-12-17 03:46:04.282941+00
ae4cc554-eb81-4fce-bf3d-54d71a86140b	00000000-0000-0000-0000-000000000001	33593364-743a-40a6-9520-a31fbb4af06a	2025-12-17 03:46:04.282941+00
0aaf5876-49b8-4f5c-9362-7fcce1a3db96	00000000-0000-0000-0000-000000000001	58a5206b-4e07-43e3-a40b-148011b7dffd	2025-12-17 03:46:04.282941+00
9ece69e2-7f7e-485b-927f-78e0daf35b20	00000000-0000-0000-0000-000000000001	c187f455-5a20-4d26-8183-5d3804d77782	2025-12-17 03:46:04.282941+00
9f0ccc9a-281e-4c98-a22a-a2609a309e06	00000000-0000-0000-0000-000000000001	201a2db4-ca7e-4da6-8c45-175270a8435a	2025-12-17 03:46:04.282941+00
a9aaac11-08dd-46dc-82bd-0f207aaf2025	00000000-0000-0000-0000-000000000001	494d2c29-90db-4413-b491-8095169df62d	2025-12-17 03:46:04.282941+00
3e2880b6-4f35-43cf-b473-6021f6ea4d6a	00000000-0000-0000-0000-000000000001	b12244d7-aedc-4d0d-b327-0933fa383828	2025-12-17 03:46:04.282941+00
96953fce-4f8e-4438-86be-17f8de0b0ea8	00000000-0000-0000-0000-000000000001	6466c77c-0f31-4083-be0e-7ffa55cb0994	2025-12-17 03:46:04.282941+00
c5aafee9-8ecc-4e26-892e-f2c2cfbbd7bd	00000000-0000-0000-0000-000000000001	8d373133-a45a-4f91-9daf-e472420bd58b	2025-12-17 03:46:04.282941+00
0520f075-7e07-4e86-bcd6-5c38b7ddfc36	00000000-0000-0000-0000-000000000001	84de449d-c046-42f8-a933-956debcc45e7	2025-12-17 03:46:04.282941+00
c799df41-a5da-4ca5-89d8-3bceeba2abea	00000000-0000-0000-0000-000000000001	b67b5295-280e-4037-bb5f-14148fd7f80d	2025-12-17 03:46:04.282941+00
42580d5e-34c3-467e-9ed7-a6e8d3f987fc	00000000-0000-0000-0000-000000000001	3bf65a02-d793-4e52-972f-81431e404a6c	2025-12-17 03:46:04.282941+00
a426ba55-5527-46ba-af60-20708e95ee3b	00000000-0000-0000-0000-000000000001	59beb044-fb41-4825-bda5-ec670c4b1c70	2025-12-17 03:46:04.282941+00
a2f2f826-fe1c-48d9-8e98-2c25da7875d9	00000000-0000-0000-0000-000000000001	cfc238f4-4dc3-4c7a-b201-ff0909ebeb40	2025-12-17 03:46:04.282941+00
22eec05f-7697-4014-8f88-c35cb51f4802	00000000-0000-0000-0000-000000000001	99a4c97d-e5c5-4fdb-80b5-298b4b648d27	2025-12-17 03:46:04.282941+00
7c2a820b-3a93-47a0-ad12-c78c057faf9b	00000000-0000-0000-0000-000000000001	a3bbd4d9-9744-4a23-8c49-69a655181872	2025-12-17 03:46:04.282941+00
d3c9334b-7d18-4494-9d21-8c5d2eaf7c87	00000000-0000-0000-0000-000000000001	f825d197-9d1e-40e2-bab0-9cfa168296dd	2025-12-17 03:46:04.282941+00
9567682f-1288-43f1-9d98-88fa43b09712	00000000-0000-0000-0000-000000000001	56c18a9b-ea6e-4788-9093-d9551ca27625	2025-12-17 03:46:04.282941+00
4dccfeb8-4a37-4261-8e6d-edb784a6f093	00000000-0000-0000-0000-000000000001	80832630-0157-42ca-be4d-6f0660098b9d	2025-12-17 03:46:04.282941+00
a36b7ff3-60ac-425e-9c60-97cd4d88bcbb	00000000-0000-0000-0000-000000000001	0312bea0-575e-43b0-94b3-6f68aab14634	2025-12-17 03:46:04.282941+00
8770649d-e412-4477-88ba-336100b8b8c2	00000000-0000-0000-0000-000000000001	f801ea45-212c-44fa-8bdb-4638a52aeb5e	2025-12-17 03:46:04.282941+00
1c48a3cf-e4bf-45ca-8953-aa32ebdda8f0	00000000-0000-0000-0000-000000000001	8c14c8be-2643-444c-96d5-693fe34b0657	2025-12-17 03:46:04.282941+00
dbf599fc-ee73-41c5-98af-073aac3bf122	00000000-0000-0000-0000-000000000001	050fb1ee-3ebb-4900-a88d-ba06bf3e9fdc	2025-12-17 03:46:04.282941+00
a3bf4c72-57ac-4e61-9adb-313d8fe57fa5	00000000-0000-0000-0000-000000000001	5385b19f-50f6-433e-8d4c-ef10ce581086	2025-12-17 03:46:04.282941+00
04b256fa-6412-471b-8e06-4c8deaf27c89	00000000-0000-0000-0000-000000000001	837aabfc-1ee7-4f7d-9caf-9bae075c0a00	2025-12-17 03:46:04.282941+00
834a132b-06d2-4dbc-92ac-51bae7c400ab	00000000-0000-0000-0000-000000000001	5d82d10d-414c-4fc3-a5e5-a9b7f7bc6878	2025-12-17 03:46:04.282941+00
226ff63a-dc7b-407a-95a1-e887a9d372ff	00000000-0000-0000-0000-000000000001	b0de17f8-ae0e-4856-acf6-68d3a19f1ef7	2025-12-17 03:46:04.282941+00
5dba33a2-46db-412d-b212-7ce5c0583b5f	00000000-0000-0000-0000-000000000001	396ed45a-cd1f-4de3-941b-77857adc21c4	2025-12-17 03:46:04.282941+00
8a60d937-1023-47b2-85c5-ff0732bdaa81	00000000-0000-0000-0000-000000000001	4851ee00-1b9c-4682-af0e-025d93b1905c	2025-12-17 03:46:04.282941+00
285c35c6-4658-4f73-b02e-2d15f0fc7af5	00000000-0000-0000-0000-000000000001	f367844a-3f53-410b-b5b7-6ef90925346e	2025-12-17 03:46:04.282941+00
8df10952-e845-489d-94f7-a08d64f201cb	00000000-0000-0000-0000-000000000001	285bd1f6-ff9b-4a8b-8950-fff4656cb563	2025-12-17 03:46:04.282941+00
89186506-8c58-40e3-875b-c0de51a068cf	00000000-0000-0000-0000-000000000001	50f379d0-3f54-440c-8110-89c66d86595b	2025-12-17 03:46:04.282941+00
f24e8ed1-baaa-4603-bf71-a129412bf7e6	00000000-0000-0000-0000-000000000001	e60a43db-0ce1-4e29-9306-cda86cec765f	2025-12-17 03:46:04.282941+00
75c3735f-e8e9-459f-8483-2f93657138c4	00000000-0000-0000-0000-000000000001	de832538-ae55-4258-a521-e5b7ae5bad97	2025-12-17 03:46:04.282941+00
a4840fda-c3e9-47e5-94ce-cc6d81d5782f	00000000-0000-0000-0000-000000000001	a35f84df-1ac3-4e1c-9776-58ef23424ca8	2025-12-17 03:46:04.282941+00
712f0be2-f121-4b48-bde6-3464e1a00247	00000000-0000-0000-0000-000000000001	eff031b7-0791-4810-baac-d4675556b2ee	2025-12-17 03:46:04.282941+00
39cac235-7d5d-41c1-8931-f522c4d9f4ae	00000000-0000-0000-0000-000000000001	af10b399-62cf-4b7b-9fae-a8ec90d6fe81	2025-12-17 03:46:04.282941+00
3c5be2d6-346a-4892-81d7-df520020ce89	00000000-0000-0000-0000-000000000001	20b11d87-7d50-4895-a380-1fe9e85236e7	2025-12-17 03:46:04.282941+00
f3865e2b-2191-45fd-836f-b10ddbea6a09	00000000-0000-0000-0000-000000000001	6d36d6a4-4970-4996-b1a8-4d3a7747eb83	2025-12-17 03:46:04.282941+00
f04e5fb4-9a2b-4e78-b10a-3dd6cf48f186	00000000-0000-0000-0000-000000000001	87e79756-f55f-42ab-84be-c7e5d08f7c14	2025-12-17 03:46:04.282941+00
6c8730c2-9e28-49d9-ba94-d1aa042499cb	00000000-0000-0000-0000-000000000001	6c26fe01-d745-49f8-8929-e8914e074cf7	2025-12-17 03:46:04.282941+00
d53ceee4-9696-490f-a2ee-dce9d5013678	00000000-0000-0000-0000-000000000001	eed166fd-5bc5-4272-b655-fbbf75e01190	2025-12-17 03:46:04.282941+00
c684f3b2-9600-42f7-b8b8-10635ffa3727	00000000-0000-0000-0000-000000000001	24f31641-4e0c-4417-9ce6-43112aebdec2	2025-12-17 03:46:04.282941+00
f0f5c45f-b356-4eb6-8810-f80510779dbb	00000000-0000-0000-0000-000000000001	81e84cda-897a-466b-9afd-9c362924e04f	2025-12-17 03:46:04.282941+00
35344804-22bd-4bf1-bd10-6cb4a5f5fef6	00000000-0000-0000-0000-000000000001	391b2d10-19fb-4413-b9a5-5aafda8e8c79	2025-12-17 03:46:04.282941+00
aafb6644-103a-48f9-a0c0-6baf5e91d272	00000000-0000-0000-0000-000000000001	1238d785-1ac1-4fa1-a646-cdf81b16a2da	2025-12-17 03:46:04.282941+00
cfff3319-e4cc-4181-b330-df9f946833e2	00000000-0000-0000-0000-000000000001	68a0b4d1-e348-414d-8dd8-a3d9053e719f	2025-12-17 03:46:04.282941+00
9c9a2a11-9612-460d-b9d9-d9adc2437a7f	00000000-0000-0000-0000-000000000001	55195c00-c8dd-4091-9a31-978db3d87a6f	2025-12-17 03:46:04.282941+00
955abc9d-daf9-4950-9aa5-0ca03ad0fe2d	00000000-0000-0000-0000-000000000001	dd9c4f86-55da-441e-9ace-0db505d690b0	2025-12-17 03:46:04.282941+00
b9c7fe86-aed5-4054-a5db-500a4c63b712	00000000-0000-0000-0000-000000000001	9d1ea120-43a3-4d39-9ff5-0622f4d2c9b2	2025-12-17 03:46:04.282941+00
17dfe93f-58ed-4db0-a65d-77a3bdb5e0ea	00000000-0000-0000-0000-000000000001	9c400ddd-846f-441d-8585-5f633d63f9c5	2025-12-17 03:46:04.282941+00
438fa10a-039e-4f7e-bb0d-efa2dd2a875b	00000000-0000-0000-0000-000000000001	9cbe8716-4d26-4b9e-ab32-df199dbffa03	2025-12-17 03:46:04.282941+00
05525eeb-6bb8-4233-bef0-afa751d955b6	00000000-0000-0000-0000-000000000001	b7fe9b3f-e53d-46ff-a0e8-d8b0d5d0b341	2025-12-17 03:46:04.282941+00
341b7f43-e6df-4b0e-b1b0-ed194ffaf22d	00000000-0000-0000-0000-000000000001	b22e5879-b661-435c-9f88-454d6daddb2d	2025-12-17 03:46:04.282941+00
72c9b39a-ffca-4a26-93fd-af5c41e29588	00000000-0000-0000-0000-000000000001	b49be44b-57e7-4b27-befe-7037ebb6b8f0	2025-12-17 03:46:04.282941+00
1d177fff-3896-498b-a43f-e03694c883c4	00000000-0000-0000-0000-000000000001	f0b9170f-22b6-4e84-9613-fad1a2266a5e	2025-12-17 03:46:04.282941+00
eb8f6406-b30f-4852-8d10-57b3e9aefd46	00000000-0000-0000-0000-000000000001	3f9d9f01-afdf-43fa-9744-e9f879ea48b0	2025-12-17 03:46:04.282941+00
607074ed-7141-465a-b967-884d04795f41	00000000-0000-0000-0000-000000000001	eeb7bab2-12e8-4f1e-9507-b4507e64cc01	2025-12-17 03:46:04.282941+00
74be9d8a-50e8-4e3e-9eea-120814c942d2	00000000-0000-0000-0000-000000000001	7d00240e-0753-45f7-b5d9-32bc40e70220	2025-12-17 03:46:04.282941+00
440136c3-b6e9-4931-b3a2-810faa92f530	00000000-0000-0000-0000-000000000001	e0c37cb7-0f22-4e5c-b162-9f5c4f9e999d	2025-12-17 03:46:04.282941+00
c432af11-dfd3-4db1-96ca-f7aab9a9a52b	00000000-0000-0000-0000-000000000001	ab3270da-a66d-49f8-a168-4e41c1a71bc0	2025-12-17 03:46:04.282941+00
9439ffb5-b5de-42eb-a6ba-17d6576360cd	00000000-0000-0000-0000-000000000001	01877a8f-e53f-4cae-baca-4545b4c6f4fb	2025-12-17 03:46:04.282941+00
461c2b6f-df75-4da4-bfc1-fac62c374ec4	00000000-0000-0000-0000-000000000001	f422fdec-4087-4aa1-aecc-bb0e03688901	2025-12-17 03:46:04.282941+00
27c6780e-8ffb-4ae6-a935-308a6a729c35	00000000-0000-0000-0000-000000000001	e46a22de-eeda-4e01-be13-0cb354355b15	2025-12-17 03:46:04.282941+00
f166479c-5277-40e9-b21d-11fa488e1438	00000000-0000-0000-0000-000000000001	5b6e7a76-d418-448e-8353-3368b7fed8a3	2025-12-17 03:46:04.282941+00
bd2435aa-db13-44fa-86c8-ef9d1cf230e0	00000000-0000-0000-0000-000000000001	145fe323-76ba-4755-843c-5404c8d65cdb	2025-12-17 03:46:04.282941+00
14c30d83-b391-45c5-bb8e-5daf3f1406fc	00000000-0000-0000-0000-000000000001	707ddd8b-269e-4977-8cce-d3d4c13a3c7c	2025-12-17 03:46:04.282941+00
96c976ee-1f56-4501-bf2f-79ad0a291094	00000000-0000-0000-0000-000000000001	dcead44c-058c-4d16-9328-9742188a57c0	2025-12-17 03:46:04.282941+00
67983f82-4342-49d9-a218-15bda9aa7f52	00000000-0000-0000-0000-000000000001	c06cf691-aa7a-46c0-9f1a-e035f249bf64	2025-12-17 03:46:04.282941+00
79249bc2-93f1-413c-81f1-61ebc57740e3	00000000-0000-0000-0000-000000000001	8de50491-f232-4ecb-afb7-09ada2f21ed6	2025-12-17 03:46:04.282941+00
f50560ef-ee9c-443e-a55d-34d27989fc54	00000000-0000-0000-0000-000000000001	865b9be4-96da-4018-9ae0-286dedca0f03	2025-12-17 03:46:04.282941+00
9c527e45-0a9c-42fb-af77-a9485fbd8258	00000000-0000-0000-0000-000000000001	ab7ea1b9-d528-402f-b67f-7e279f0e2024	2025-12-17 03:46:04.282941+00
499f3878-4f5a-4b7c-b930-7c199b98f189	00000000-0000-0000-0000-000000000001	84f61d28-6b58-477b-9953-cd88bb2eb25e	2025-12-17 03:46:04.282941+00
aad12bad-42bd-4d7e-9ea0-946551b82628	00000000-0000-0000-0000-000000000001	c1df2714-7fc4-4feb-be1c-8d3534a8bb48	2025-12-17 03:46:04.282941+00
0a35a867-280f-42ca-80f5-fc9b0498c81c	00000000-0000-0000-0000-000000000001	bba25f99-8a1b-467e-8187-ccd1f1823188	2025-12-17 03:46:04.282941+00
72dfe67f-859c-4d49-a66d-daeb9f9fbb0f	00000000-0000-0000-0000-000000000001	c4a77291-391d-4209-8b70-f432f682dc8a	2025-12-17 03:46:04.282941+00
ba49f765-f9f0-4ab0-bf96-e8aefdccc8f4	00000000-0000-0000-0000-000000000001	26251bbf-5846-4a8b-bb93-8d86725916ce	2025-12-17 03:46:04.282941+00
930aec31-2f4e-41f4-bda6-d5f5cc94dbc1	00000000-0000-0000-0000-000000000001	30d1552a-8c2d-4800-bb07-71437ace854d	2025-12-17 03:46:04.282941+00
63e89237-c221-4e9a-b17a-28c70d9af08d	00000000-0000-0000-0000-000000000001	90fbae35-6951-4fc3-8363-13f7a1c43d58	2025-12-17 03:46:04.282941+00
aa7166e4-9d94-4f63-ad77-6d88dfaf2376	00000000-0000-0000-0000-000000000001	fd3220e6-1427-4831-b972-fd2e1e55e01a	2025-12-17 03:46:04.282941+00
978c9bab-4d46-4b69-9f49-4d93376f8e33	00000000-0000-0000-0000-000000000001	eb33f431-2f42-4394-95f4-745135ea7758	2025-12-17 03:46:04.282941+00
206c056b-4349-4742-b8e7-836d21e1f5e1	00000000-0000-0000-0000-000000000001	4219e519-f3e0-4248-87f5-5ac2b6b4fea7	2025-12-17 03:46:04.282941+00
4beebc29-5fc1-48cb-a047-b3ec82bd2082	00000000-0000-0000-0000-000000000001	5514d6ce-f44b-4fa6-8452-b2cf2db1c6f4	2025-12-17 03:46:04.282941+00
c72e6e06-c7aa-4a49-895d-c316fe541d9e	00000000-0000-0000-0000-000000000001	2f8e7e8e-32fa-47f2-93a5-1d3c515eb588	2025-12-17 03:46:04.282941+00
b0883009-de48-4dce-b745-ebfa97aea6c3	00000000-0000-0000-0000-000000000001	f041880a-2798-47dd-b8a7-18aa27c97fa6	2025-12-17 03:46:04.282941+00
1709de6e-121a-41bc-ba4b-163241f01366	00000000-0000-0000-0000-000000000001	81479c2a-d521-4cba-a21e-1f0e3f2f7aab	2025-12-17 03:46:04.282941+00
1248dd3a-38ad-4de8-b107-2f6280c21b31	00000000-0000-0000-0000-000000000001	857c9997-8636-4a08-8a05-212032afa15f	2025-12-17 03:46:04.282941+00
f451eff4-92e7-4f06-a29b-9ba49dafd133	00000000-0000-0000-0000-000000000001	2fd7e563-c514-4a0d-8df3-45acac02bcc9	2025-12-17 03:46:04.282941+00
5be67e34-bc69-4e2f-8404-e77d6e5660d2	00000000-0000-0000-0000-000000000001	e52931d5-fd73-437e-a751-6613d4bf686b	2025-12-17 03:46:04.282941+00
dd0b2499-8799-44c3-82be-39f0f4d21b50	00000000-0000-0000-0000-000000000001	5a2ebd33-9b63-4a17-b0a9-39cb9190f3f7	2025-12-17 03:46:04.282941+00
03699c05-de7c-40d7-a931-86e0f63501ba	00000000-0000-0000-0000-000000000001	97f4c2cc-fa6c-4acb-9a66-00d3ea18e951	2025-12-17 03:46:04.282941+00
86b098b2-5fd7-43ae-88d1-4b8cada16978	00000000-0000-0000-0000-000000000001	507e3be4-e149-43ed-ba55-139aaeb34757	2025-12-17 03:46:04.282941+00
c0cef137-af9b-4530-9937-d844d15fd359	00000000-0000-0000-0000-000000000001	1774b21f-e144-45b5-b12e-616bc1ff4651	2025-12-17 03:46:04.282941+00
b0947bd7-d8fa-4265-a798-a4f3c493c5db	00000000-0000-0000-0000-000000000001	de256dc8-4c7c-4d54-8ae7-4ec1ddf25fea	2025-12-17 03:46:04.282941+00
bd20c703-d7af-4cf2-b89e-e628cc8bd4ae	00000000-0000-0000-0000-000000000001	cae6b8c1-66db-44fe-b46e-a3dd3f4b1eef	2025-12-17 03:46:04.282941+00
aa548bdc-d552-4c11-976b-d2c9fbc36b7a	00000000-0000-0000-0000-000000000001	ee7de8ff-4b16-4c42-add4-06dc3fd2d13d	2025-12-17 03:46:04.282941+00
ffa29baf-0d8d-4b1d-bbb0-dd9b77dd39c6	00000000-0000-0000-0000-000000000001	fca38e7a-3747-4c97-876b-c3f7e93e05a4	2025-12-17 03:46:04.282941+00
f3edce29-531e-4d08-aeaf-053cff425017	49eee68f-ff93-4c0c-a064-f4a14894c598	80832630-0157-42ca-be4d-6f0660098b9d	2025-09-15 23:20:37.439344+00
64e45de9-b040-45ca-80d2-9bfec2f611f7	00000000-0000-0000-0000-000000000001	8d6de130-e6e2-42f3-a390-085833a87bb9	2025-12-17 03:46:04.282941+00
95eb3e0c-8416-47ab-8347-534b45030733	00000000-0000-0000-0000-000000000001	e5cd89e0-9310-431e-9d8d-2c7ed54c8e4f	2025-12-17 03:46:04.282941+00
c9a7a10c-90bf-4191-a1b6-37084575ea62	49eee68f-ff93-4c0c-a064-f4a14894c598	8c14c8be-2643-444c-96d5-693fe34b0657	2025-09-15 23:20:37.439344+00
f598f619-77fa-4447-a52c-9d0b179ae18e	00000000-0000-0000-0000-000000000001	1fcf8b48-7273-497a-9906-76d19040a612	2025-12-17 03:46:04.282941+00
cfde8f3e-95e7-4078-886e-3cc79b3f6f94	00000000-0000-0000-0000-000000000001	5351e92c-70cc-491d-b213-d212df505ee0	2025-12-17 03:46:04.282941+00
1cc1dcfa-335c-4437-92a0-b9fdfc142ae2	00000000-0000-0000-0000-000000000001	8e1dc130-070d-446c-af26-68627478ba4b	2025-12-17 03:46:04.282941+00
89a53ea6-7266-4d9a-b013-2d2ca1c60cc5	49eee68f-ff93-4c0c-a064-f4a14894c598	2b8b088a-952b-4465-8238-65f9aac1a61e	2025-09-15 23:20:37.439344+00
1ef8ab46-4088-4b87-910d-8997126d47de	00000000-0000-0000-0000-000000000001	15163679-e79b-4553-8990-4c3808cb23f6	2025-12-17 03:46:04.282941+00
fdcad8b7-4b87-4204-b5a9-60c7515b4a78	00000000-0000-0000-0000-000000000001	b62d17f5-7a4a-4cfb-b76e-9fb0740ea52d	2025-12-17 03:46:04.282941+00
f7dcf495-11f7-4e3b-9e39-835e2cc08a4d	00000000-0000-0000-0000-000000000001	ca4de1ff-8d08-4aae-ad4c-03dac044f1dc	2025-12-17 03:46:04.282941+00
6ffc58f8-09e0-4fbb-a5df-4943b5d4a116	00000000-0000-0000-0000-000000000001	8d7c1b85-929e-4c51-a07d-22cbf2858991	2025-12-17 03:46:04.282941+00
cb60c2e1-3473-42c8-a989-f0b103f0e2d8	00000000-0000-0000-0000-000000000001	480bd7d6-0b24-4cf7-abf9-9af41452b34c	2025-12-17 03:46:04.282941+00
448a327f-cafe-461e-863b-2c68783c8ba7	00000000-0000-0000-0000-000000000001	6e9d4285-851f-40e2-99bc-dd994926fde9	2025-12-17 03:46:04.282941+00
703df35c-3c2e-4362-b4c7-c48ee65f7929	00000000-0000-0000-0000-000000000001	dcc41858-d2e2-4ed3-b7e2-80c36be85383	2025-12-17 03:46:04.282941+00
45ff6f11-a48d-4dfa-a562-081a066a9d12	00000000-0000-0000-0000-000000000001	05d4903b-59fa-4be1-845f-2559bd28d3c8	2025-12-17 03:46:04.282941+00
4247b46f-0438-4b44-9f4b-59df4b882ea3	00000000-0000-0000-0000-000000000001	29ded83e-fec8-4d72-b544-433187a16e9b	2025-12-17 03:46:04.282941+00
5a7c19fd-2de6-4a3a-8f3b-d9b56e2ee459	00000000-0000-0000-0000-000000000001	31cc9c2c-2ee7-41de-ba50-3bb20de3d95d	2025-12-17 03:46:04.282941+00
62affb5a-bf4b-4161-b779-723507282cd6	00000000-0000-0000-0000-000000000001	542bff80-5808-4fab-912b-f299b0291ab2	2025-12-17 03:46:04.282941+00
38d60e05-2a65-4136-b214-a97217b7f3e8	00000000-0000-0000-0000-000000000001	1828213b-0b3a-45af-a0c3-959c28a95c19	2025-12-17 03:46:04.282941+00
935a4f20-7d44-4104-be67-80f0185be8d7	00000000-0000-0000-0000-000000000001	0ce3884b-5f9f-40f3-8c88-175e3925e17d	2025-12-17 03:46:04.282941+00
981408fb-b526-40af-9a9f-a0144a0b25b9	00000000-0000-0000-0000-000000000001	ec4faa3d-5ee8-42da-b9b7-2819659e5831	2025-12-17 03:46:04.282941+00
e4c4d22e-6a1f-4170-9e2c-43c4bfa7c4ef	00000000-0000-0000-0000-000000000001	7a7ae668-6bb1-4f81-bf4a-c47fbebb2d7e	2025-12-17 03:46:04.282941+00
7bfe99e7-bc64-462f-8727-72338a8f5273	00000000-0000-0000-0000-000000000001	9a594590-2a6d-456d-948e-95d9ec5361ea	2025-12-17 03:46:04.282941+00
6cc5c71e-f528-4b4d-b83a-90c5b402241c	00000000-0000-0000-0000-000000000001	3f0c0daf-f66b-4add-a4a1-64da8275bbbc	2025-12-17 03:46:04.282941+00
0802f688-e69a-4022-8121-66c79c674bc5	00000000-0000-0000-0000-000000000001	4c378841-f5f0-46f1-a008-3c9dc322ecb5	2025-12-17 03:46:04.282941+00
38cb9ba0-085f-4b5d-a003-810eef666b5b	00000000-0000-0000-0000-000000000001	37ffab8e-2431-448f-a2fc-340d883933ac	2025-12-17 03:46:04.282941+00
1c7cf98b-82ba-477d-bb47-44dc29dedc6f	00000000-0000-0000-0000-000000000001	42b4257f-77c3-4515-b4a6-dc312db77d98	2025-12-17 03:46:04.282941+00
e1828ed3-810f-4b6c-ba73-fa3aa63d7b7a	00000000-0000-0000-0000-000000000001	eeab7024-04b4-45b8-b8ae-c8e0cb091e7d	2025-12-17 03:46:04.282941+00
5f6d4d18-5a9c-4404-bf56-206ff74fca28	00000000-0000-0000-0000-000000000001	b02a5b1c-d6d1-41b4-b346-a9bbd2b6b5e0	2025-12-17 03:46:04.282941+00
c3f54806-29c4-4751-8453-ceb1ae0f326d	00000000-0000-0000-0000-000000000001	ea46b60b-6e44-467c-bc3d-6105af7ec2ab	2025-12-17 03:46:04.282941+00
d188bc73-773d-4ce4-ba27-399a650932e1	00000000-0000-0000-0000-000000000001	95e342fa-7dac-4d5e-9e55-338238143a7e	2025-12-17 03:46:04.282941+00
926e92b9-3878-4e0a-8177-806c22ccb8f1	00000000-0000-0000-0000-000000000001	31be4771-1c82-485e-86e5-c415d6b95d32	2025-12-17 03:46:04.282941+00
4cb4ace2-f8d9-46f8-b2fd-e312de608069	00000000-0000-0000-0000-000000000001	3319ccb1-ce22-4a8e-867d-05375c9abaee	2025-12-17 03:46:04.282941+00
a77d0fb0-8446-4862-b4cb-682b9c9ec686	00000000-0000-0000-0000-000000000001	ba9648a9-efe8-4569-b664-34ea0be06e4d	2025-12-17 03:46:04.282941+00
e6d68f58-4a7c-413f-b4bc-df059cd5c78e	00000000-0000-0000-0000-000000000001	c3902928-35f9-4558-b052-58bb3fbbf9f3	2025-12-17 03:46:04.282941+00
bb3c7eeb-1ad6-46b3-9892-322b7ccb76e0	00000000-0000-0000-0000-000000000001	dbde6cd1-238f-4474-a0f0-302eff6873c2	2025-12-17 03:46:04.282941+00
2b4e31cc-29fe-4439-bd1b-3cbc8c234062	00000000-0000-0000-0000-000000000001	79e3cdc6-0771-43e5-9b58-4b4ad45250f5	2025-12-17 03:46:04.282941+00
c0d2a0f3-b7ff-48d1-bc65-9da1516239f4	00000000-0000-0000-0000-000000000001	9770ffa4-ac48-44b7-b8fc-a9b2d26148d3	2025-12-17 03:46:04.282941+00
e9fbb418-2942-43dd-b8c2-355bea00cb9b	00000000-0000-0000-0000-000000000001	7f6faf52-df76-4683-b1c7-817a6f050bf4	2025-12-17 03:46:04.282941+00
d65bdded-f68e-4f4b-aa6b-7539e033f429	00000000-0000-0000-0000-000000000001	e151a464-e4fa-4463-a18c-8f15156464e1	2025-12-17 03:46:04.282941+00
f779d63f-afe9-430b-90fa-02493a655baa	00000000-0000-0000-0000-000000000001	be8c46b3-125d-4354-b35b-4984db5d3a5f	2025-12-17 03:46:04.282941+00
46cd827f-918e-4bb1-8d93-b6ac0f138159	00000000-0000-0000-0000-000000000001	44adfed1-c618-44a7-9e27-2b8206f8f59e	2025-12-17 03:46:04.282941+00
e6399263-46a4-4062-9b88-4c9456e97e9a	00000000-0000-0000-0000-000000000001	bb00cb22-76f1-4cb1-bdad-7a30cce0055c	2025-12-17 03:46:04.282941+00
136d2ce4-beb9-4c40-a002-bc032abd19d2	00000000-0000-0000-0000-000000000001	5bd13d12-b2fb-4188-a156-e27208d64716	2025-12-17 03:46:04.282941+00
77302fc5-87c9-4d4b-a0aa-b5cd80ef27d2	00000000-0000-0000-0000-000000000001	8892b990-2d05-4411-872c-0ad262baa8c9	2025-12-17 03:46:04.282941+00
ca954242-ceaf-47c1-9028-488585a0efa5	00000000-0000-0000-0000-000000000001	07d8a24a-f58e-45e9-b394-fc20b7180d87	2025-12-17 03:46:04.282941+00
96a8368e-4db2-402b-a078-5f68ecc6b348	00000000-0000-0000-0000-000000000001	bf0491e3-f0cf-4a4c-a47a-768b5fcbadc2	2025-12-17 03:46:04.282941+00
3a007003-8bed-4c07-b546-02e4782a9571	00000000-0000-0000-0000-000000000001	9a866358-4982-427d-bcc5-cdb145a30e88	2025-12-17 03:46:04.282941+00
8773cce0-5b5c-4aa6-b128-ce28710de1f1	00000000-0000-0000-0000-000000000001	ee114738-957b-40d1-b6ce-5fe0c45d17dc	2025-12-17 03:46:04.282941+00
41f23851-e5ff-4049-9e33-8eace35aacff	00000000-0000-0000-0000-000000000001	9522d931-21ab-447a-b0ad-403aac0bf4a2	2025-12-17 03:46:04.282941+00
28d0341c-5665-4371-b40d-1b89eaba4433	00000000-0000-0000-0000-000000000001	8e6547cf-357b-4685-92cf-16f34c9bfe17	2025-12-17 03:46:04.282941+00
4971be00-ea45-41a8-b5d0-e031c1565f57	00000000-0000-0000-0000-000000000001	29f6123d-5807-43f0-a636-1827c5cec620	2025-12-17 03:46:04.282941+00
ba14bc53-468d-462e-966f-827e7d3b34ce	00000000-0000-0000-0000-000000000001	1cac9f64-4529-4f0c-a9c9-6a971ae437dd	2025-12-17 03:46:04.282941+00
44606be9-0edb-42b2-90b8-920cd718e6ff	00000000-0000-0000-0000-000000000001	ab29dea2-bbda-4524-b658-8b8a0de491b5	2025-12-17 03:46:04.282941+00
6b955dc9-505e-4288-8573-65802cbd6d2b	00000000-0000-0000-0000-000000000001	569bc27d-b531-4695-8c19-a4c15cc1c031	2025-12-17 03:46:04.282941+00
d0d6b60c-2661-4660-9e31-7127a6c19b32	00000000-0000-0000-0000-000000000001	e6b84acb-76cc-4a3a-8b17-7dfda688361a	2025-12-17 03:46:04.282941+00
c64084ef-cfb1-4a39-8c06-c14745ab7436	00000000-0000-0000-0000-000000000001	580c30d0-c4d5-4e50-9c78-b509bfccf983	2025-12-17 03:46:04.282941+00
795011ab-f9f8-4145-be9a-83c3a7dc9812	00000000-0000-0000-0000-000000000001	1d1b6352-ad86-407c-8f39-2898377cdcbd	2025-12-17 03:46:04.282941+00
4d0a1728-6d0c-4860-8988-286a4876349a	00000000-0000-0000-0000-000000000001	9539932e-de3a-4a45-ba29-689090545bf7	2025-12-17 03:46:04.282941+00
c1190a83-6c0b-4278-8d29-57b225841caa	00000000-0000-0000-0000-000000000001	4e9401d3-e56a-4259-b41e-6c657f574971	2025-12-17 03:46:04.282941+00
5ad834a9-6258-4bc3-9447-8b98a0da8938	00000000-0000-0000-0000-000000000001	8e601213-50e1-48f9-aafb-d6db4bac0abc	2025-12-17 03:46:04.282941+00
a31b2060-b0f3-4aeb-98df-34698957d595	00000000-0000-0000-0000-000000000001	05c8fc06-57aa-41cf-93bb-b53e0a11bfcc	2025-12-17 03:46:04.282941+00
475da979-e68a-45a7-a1d2-13845b43d9eb	00000000-0000-0000-0000-000000000001	f76602a4-6308-4a69-8329-b6fba7d2e15c	2025-12-17 03:46:04.282941+00
d25b27b0-7b80-4b9c-ae05-ff674c2a4298	00000000-0000-0000-0000-000000000001	dcd1cae3-ab92-43cb-adf9-515ab78aa05d	2025-12-17 03:46:04.282941+00
9a71c4f8-7a90-4ec9-beae-223943e44bfd	00000000-0000-0000-0000-000000000001	cd94de86-be60-4933-a01c-17ce8bf11b53	2025-12-17 03:46:04.282941+00
b6d6d106-0b77-4312-8f96-ad1dccf8261f	00000000-0000-0000-0000-000000000001	d0ba23b4-96f8-48b9-bfc1-5508fff04a94	2025-12-17 03:46:04.282941+00
e16025b5-9e8c-4bcf-8649-83e339fc40ff	00000000-0000-0000-0000-000000000001	4efab391-fddb-4e48-9e43-d9a83274a5f1	2025-12-17 03:46:04.282941+00
7fc78623-3c67-45f5-90bc-b295e7abc89c	00000000-0000-0000-0000-000000000001	db3d14d8-caf3-4804-aaa0-99681e9192c8	2025-12-17 03:46:04.282941+00
4e770c22-3c67-490f-8473-57446a7ccf4d	00000000-0000-0000-0000-000000000001	96afa44f-6eae-49e0-b823-350841686d9e	2025-12-17 03:46:04.282941+00
68e1b5be-1b7b-4ed4-9468-07ad59414ae2	00000000-0000-0000-0000-000000000001	fe26ef14-421b-4403-82e4-676bad92632b	2025-12-17 03:46:04.282941+00
baffaf02-775c-4601-8349-ec0247b23dd6	00000000-0000-0000-0000-000000000001	3ba07a02-9aa4-4be1-831d-0118162ec1cb	2025-12-17 03:46:04.282941+00
d3036f2f-1d71-4706-9623-78139ce4848b	00000000-0000-0000-0000-000000000001	0e7648e0-9cea-4dab-8122-54224461e946	2025-12-17 03:46:04.282941+00
85586744-d997-45ad-a875-ef27e3c12ec8	00000000-0000-0000-0000-000000000001	e090b768-19f3-4054-a373-e05d08499b85	2025-12-17 03:46:04.282941+00
541e4eb3-33ca-4acf-a036-a59fbbbdfe46	00000000-0000-0000-0000-000000000001	075d75b1-3373-4fa7-909a-c64b68a99e0e	2025-12-17 03:46:04.282941+00
d02cc8be-84ed-4caa-9da4-cb6539e10154	00000000-0000-0000-0000-000000000001	dcc37019-0f03-4cbe-9ad8-319f16dab8d3	2025-12-17 03:46:04.282941+00
3719329e-87bf-4aec-ba6f-7683e2ef7e77	00000000-0000-0000-0000-000000000001	d579a914-2a38-405b-a481-e9e0cdcac860	2025-12-17 03:46:04.282941+00
b2e9d46b-dcca-48e4-8dba-b9d4ce44a7d0	00000000-0000-0000-0000-000000000001	383ffa53-5076-4cc1-ad5f-ed7fb6bf956f	2025-12-17 03:46:04.282941+00
a2ff492b-d1f0-4930-b505-dccbe1c34b52	00000000-0000-0000-0000-000000000001	05da8fb2-1ccd-40e6-8778-07e01ddef92c	2025-12-17 03:46:04.282941+00
7fd23b71-9e99-4d2b-ae73-f55a8ccf4edb	00000000-0000-0000-0000-000000000001	fe007bbb-c3a1-4f4e-8915-36546596d2e9	2025-12-17 03:46:04.282941+00
f13a9f97-5cb0-4973-a7f2-cf07af53098e	00000000-0000-0000-0000-000000000001	8b5a9803-37e1-4afd-9d00-234cd2a4d55a	2025-12-17 03:46:04.282941+00
32b7766c-ac65-4613-87b0-18b955c0714f	00000000-0000-0000-0000-000000000001	3f4b0693-cd99-42fd-8391-ab9d6c8f76f9	2025-12-17 03:46:04.282941+00
6628fa1f-328b-49cd-88f6-00b6db89533d	00000000-0000-0000-0000-000000000001	d6af720c-c555-463a-92a0-f61e1611692e	2025-12-17 03:46:04.282941+00
aca8447b-dde7-402b-91bd-e844572eed83	00000000-0000-0000-0000-000000000001	f96386ec-87d7-4d00-8f29-4170a05eeff8	2025-12-17 03:46:04.282941+00
4e2e82ca-cd15-4d5f-8e12-dad7959dc906	00000000-0000-0000-0000-000000000001	e362a3ed-1989-4ad1-a3ec-4756639df51b	2025-12-17 03:46:04.282941+00
90bcec6e-2727-4a69-a210-6d4ee9c46d80	00000000-0000-0000-0000-000000000001	e0ff023e-0fcb-41a4-86e3-48c7b378e5f1	2025-12-17 03:46:04.282941+00
8d962107-a530-4807-9d56-24adba4bb691	00000000-0000-0000-0000-000000000001	9aa01863-e2b3-440d-b6d2-946eb3a92280	2025-12-17 03:46:04.282941+00
b84c9650-cd59-412d-bddc-e04b0e0d7cb2	00000000-0000-0000-0000-000000000001	31d5a50d-9064-423b-aabb-2c5fab4b1f58	2025-12-17 03:46:04.282941+00
5753e450-ecb9-466c-a7dc-02e9e0e611f5	00000000-0000-0000-0000-000000000001	7e11a7d4-3e31-4774-ad72-80389ac45d01	2025-12-17 03:46:04.282941+00
c7f69e72-9f32-4272-a2d6-d87d454c6eb1	00000000-0000-0000-0000-000000000001	8312993b-75a9-44da-9658-c10de09a4239	2025-12-17 03:46:04.282941+00
b8103299-7c1b-48bb-ad52-c85a61d23d16	00000000-0000-0000-0000-000000000001	01a26eb6-755d-4434-aa11-634dec9aaf64	2025-12-17 03:46:04.282941+00
6f208e41-9719-45c7-818a-d918ecdb9a21	00000000-0000-0000-0000-000000000001	50eecfa4-00db-41e8-b1c2-9e642643ca49	2025-12-17 03:46:04.282941+00
a5935c9e-9c48-444f-a4c8-527b5a62965f	00000000-0000-0000-0000-000000000001	c76b0fb1-1ef1-4fc7-998a-04c6fdfebf10	2025-12-17 03:46:04.282941+00
35374c36-a576-4ed6-b129-d4bf17618270	00000000-0000-0000-0000-000000000001	667f6124-9eb0-4c66-80e9-e5d5dd5b8ed6	2025-12-17 03:46:04.282941+00
9d3cfd91-f64e-463a-8d68-de95c081e82f	00000000-0000-0000-0000-000000000001	24a03971-a2ca-43b5-b2c8-1ce814c348ae	2025-12-17 03:46:04.282941+00
41a4aac6-acef-43c7-8c82-5dda10801522	00000000-0000-0000-0000-000000000001	dd31f900-ce1f-449c-9c40-077e6c4a640b	2025-12-17 03:46:04.282941+00
8f340608-d3f8-4041-8971-e2360c3a232e	00000000-0000-0000-0000-000000000001	8a6c6b67-5c5d-47e2-b0f4-e59b2de9f4ff	2025-12-17 03:46:04.282941+00
4d7e0987-4514-4801-afad-f8087edc697d	00000000-0000-0000-0000-000000000001	3193f671-e2f1-4ff6-b197-98f02a9cb822	2025-12-17 03:46:04.282941+00
1d11f4ee-496c-4157-a9e7-33326bcf1789	00000000-0000-0000-0000-000000000001	0188c4c8-478f-4a41-878c-32d45462b351	2025-12-17 03:46:04.282941+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
00000000-0000-0000-0000-000000000001	Administrador	Acceso completo al sistema con todos los permisos	t	2025-08-29 03:22:21.197698+00	2025-08-29 03:22:21.197698+00
2997dd13-faad-4a67-83f4-a62e142898e5	Usuario	Usuario básico con permisos limitados	t	2025-08-30 00:14:55.445384+00	2025-09-15 01:43:34.444923+00
49eee68f-ff93-4c0c-a064-f4a14894c598	Analista de Aplicaciones	Rol para analistas que pueden gestionar sus propios casos, notas, TODOs y ver métricas propias. Sin acceso a administración.	t	2025-09-15 22:00:29.651026+00	2025-09-15 22:00:29.651026+00
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_members (id, "teamId", "userId", role, "isActive", "joinedAt", "leftAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (id, name, code, description, color, "managerId", "isActive", "createdAt", "updatedAt") FROM stdin;
10000000-0000-0000-0000-000000000099	Sin Asignar	UNASSIGN	Equipo temporal para usuarios que aún no han sido asignados a un equipo específico	#6C757D	\N	t	2025-11-21 04:17:07.895575+00	2025-11-21 04:17:07.895575+00
10000000-0000-0000-0000-000000000001	Desarrollo	DEV	Equipo encargado del desarrollo de software, programación y creación de nuevas funcionalidades del sistema	#007ACC	\N	t	2025-11-21 04:17:07.890575+00	2025-11-21 04:21:34.767494+00
10000000-0000-0000-0000-000000000002	Soporte de Aplicaciones	SUPP	Equipo responsable del soporte técnico, mantenimiento de aplicaciones y resolución de incidencias	#28A745	\N	t	2025-11-21 04:17:07.890575+00	2025-11-28 01:24:04.047755+00
\.


--
-- Data for Name: time_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.time_entries (id, "caseControlId", "userId", "startTime", "endTime", "durationMinutes", description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: todo_control; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.todo_control (id, todo_id, user_id, status_id, total_time_minutes, timer_start_at, is_timer_active, assigned_at, started_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: todo_manual_time_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.todo_manual_time_entries (id, todo_control_id, user_id, date, duration_minutes, description, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: todo_priorities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.todo_priorities (id, name, description, color, level, is_active, display_order, created_at, updated_at) FROM stdin;
38f68462-7fb1-47e3-a8d0-2ff80a9ed88c	Muy Baja	Prioridad muy baja - puede esperar	#10B981	1	t	1	2025-08-28 13:48:44.895255+00	2025-08-28 13:48:44.895255+00
7bc244a6-9a89-42d9-878a-69b08b7f5e54	Baja	Prioridad baja - no urgente	#3B82F6	2	t	2	2025-08-28 13:48:44.895255+00	2025-08-28 13:48:44.895255+00
94406496-1645-43a8-96de-02642117078a	Media	Prioridad media - importante	#F59E0B	3	t	3	2025-08-28 13:48:44.895255+00	2025-08-28 13:48:44.895255+00
407a5b3f-a16d-4a9a-8faa-8c4cb7a26109	Alta	Prioridad alta - urgente	#EF4444	4	t	4	2025-08-28 13:48:44.895255+00	2025-08-28 13:48:44.895255+00
b764429b-179e-48c6-92c0-314fed480643	Crítica	Prioridad crítica - inmediato	#DC2626	5	t	5	2025-08-28 13:48:44.895255+00	2025-08-28 13:48:44.895255+00
\.


--
-- Data for Name: todo_time_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.todo_time_entries (id, todo_control_id, user_id, start_time, end_time, duration_minutes, entry_type, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: todos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.todos (id, title, description, priority_id, assigned_user_id, created_by_user_id, estimated_minutes, is_completed, completed_at, created_at, updated_at, "dueDate") FROM stdin;
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_profiles (id, email, "fullName", password, "roleId", "roleName", "isActive", "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
7c1b05d7-d98e-4543-ac27-dd1c797517e6	andresjgsalzate@gmail.com	Andres Jurgensen	$2a$12$Kyp7hPPrmHlBzG36eH.4COYfDiX2J.4tTkdosEpMYglhkwyVjc5.W	00000000-0000-0000-0000-000000000001	Administrador	t	2025-12-17 12:52:42.125+00	2025-08-27 23:29:30.109266+00	2025-12-17 12:52:42.126392+00
7bbf35d0-ba0e-4eee-a7da-624175592b63	hjurgensen@todosistemassti.co	Henry Andrés Jurgensen Álzate	$2a$10$cId.lYuSJ.Kbi/5nRk.wKOF4a79MVH/cnXIXk7QHc00mQDR98.dti	49eee68f-ff93-4c0c-a064-f4a14894c598	Analista de Aplicaciones	t	2025-12-17 12:54:02.376+00	2025-12-16 13:08:05.059224+00	2025-12-17 12:54:02.377915+00
6188fc14-ce7e-43f2-98e4-fcb8a75d705b	wvega@todosistemassti.co	William Vega Baquero	$2a$10$t5Ddw94FJKcpRDhTJ9MMhOPzIqCmU0cmyVAk1rIwtnYfQ8BGzEB6C	00000000-0000-0000-0000-000000000001	Administrador	t	2025-12-16 13:22:06.335+00	2025-12-16 13:13:47.363189+00	2025-12-16 13:22:06.337294+00
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: cms_admin
--

COPY public.user_sessions (id, user_id, token_hash, refresh_token_hash, device_info, ip_address, location_info, is_active, expires_at, last_activity_at, logout_reason, created_at, updated_at) FROM stdin;
5c4cf398-b7a4-45bf-9ae8-9ec2b0774e5e	7bbf35d0-ba0e-4eee-a7da-624175592b63	8f7ee876b9f74649498cf0280d3d19417d1978b5b9cce88f6da610b176b2fe7e	1499360395a872e15b74f8db524daca8f86db2d95bec45263064a883d21bdf8b	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 00:51:56.253	2025-12-17 00:52:25.128	new_login	2025-12-17 00:51:56.254163	2025-12-17 01:48:54.582393
5ea44c8e-be1f-4e91-94ea-5b4432823381	7bbf35d0-ba0e-4eee-a7da-624175592b63	755a760222b7f878a85546e74c0d6a9858dbbb985f75f8cd45b016c4cc4e099e	dee2bbe58c340ce2e4dbde7d4ebf33f8970d307f7dc7c081d0ac2924b4a78b6f	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-17 23:56:09.26	2025-12-16 23:57:00.454	new_login	2025-12-16 23:56:09.261082	2025-12-16 23:57:26.084395
dc20a018-9d09-4aa3-8c39-20bddfaaffd2	7bbf35d0-ba0e-4eee-a7da-624175592b63	a02f9bbbcc0bd09cd3bb1d491ab82a03d4dd0172e85fba1827f92a80a3fa2ef2	1d6cd1e284514b9bef09e059ca9e0d097ca1f044ec9b2871b5ac4ab1702482da	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 02:13:14.542	2025-12-17 02:13:53.743	new_login	2025-12-17 02:13:14.542676	2025-12-17 02:21:15.430085
e408f809-b8e1-4d81-82f9-11db28a9f1b6	7bbf35d0-ba0e-4eee-a7da-624175592b63	5968e509da3936d0870e261b0d0da57c8f76a19250719c1b8836952c0d0f165a	ac04c16082aee0185b5401dcb6c07ab8e5ba49ced3a1b51b2b819dba0220831b	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 01:48:54.591	2025-12-17 01:48:56.217	new_login	2025-12-17 01:48:54.591662	2025-12-17 02:11:43.333138
ebcd9760-47bb-4fa3-86d9-9e606d519fd9	7bbf35d0-ba0e-4eee-a7da-624175592b63	7cb5a7f707d75752bb937fdef95bab10979c1935e446aabff8c4d6d1ae06d869	add81f38eb03252181e3fc5924da531c2b683efffa3ecad59d3c11bd77faaa17	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 02:21:15.442	2025-12-17 02:21:17.06	new_login	2025-12-17 02:21:15.44244	2025-12-17 02:21:59.287406
747d5daa-a48a-4046-8fe2-c588c3a036a9	7bbf35d0-ba0e-4eee-a7da-624175592b63	4a5d107383b0d56bbab9d4a28790945addfe0015f65e4e2ea6f219ac8be4460c	c281f41bba100a071792da4a8faead6a5a0ff9c6524a137aa3d1f5d289a50817	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 00:07:18.351	2025-12-17 00:11:24.889	new_login	2025-12-17 00:07:18.351843	2025-12-17 00:11:30.919361
1cf234fc-8db1-414d-b736-cd2c73cb9d07	7bbf35d0-ba0e-4eee-a7da-624175592b63	1dc01c67ea8034557996649889890b8794398f6bbb160a358af140dcfd1cc23a	f3de572412e092a95ef01b1d499222c53939f0dcc2fd35e1e64c34404d97ec68	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-17 23:57:26.095	2025-12-16 23:57:36.996	new_login	2025-12-16 23:57:26.096227	2025-12-17 00:06:35.368374
ec043aa9-6ce5-4e30-8388-5709488bdef0	7bbf35d0-ba0e-4eee-a7da-624175592b63	74d034224808c9b1494e5ecf61968626615d2dbc2cbbedd8c70f756c4386af69	c528d2790f2c29231835b1e970879bf95bfbf4b9f8905b1d9cf5b9273bcbaac8	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-17 23:41:42.365	2025-12-16 23:45:03.967	new_login	2025-12-16 23:41:42.366351	2025-12-16 23:56:09.244739
aac38d3c-1146-487d-968c-a439f0e577a1	7bbf35d0-ba0e-4eee-a7da-624175592b63	3b8347833a3f29b29194cc7358cfe0b1d0e8dde4f9af1eec7b9f7e77d287e583	a165922d82523c84f89c29bf2656fad8ebe1ade46d34b65f31af9377ad766066	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 00:11:30.925	2025-12-17 00:13:07.749	new_login	2025-12-17 00:11:30.926001	2025-12-17 00:51:26.222868
7e24a852-192c-4226-b593-9a3182216cda	7bbf35d0-ba0e-4eee-a7da-624175592b63	30183cca8941397e9ddcc2eb037fcc812ad391edb9a6aa30e84929768e4637cf	2c3f3c5d3104468be42b949ca8409ced8bd99d408d4e359cdaa128a40f4a6b0f	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 02:21:59.293	2025-12-17 02:22:04.155	new_login	2025-12-17 02:21:59.293817	2025-12-17 02:26:47.484275
53bc007d-2abb-4483-9fe7-eda0e507ea64	7bbf35d0-ba0e-4eee-a7da-624175592b63	8b373becef7d2b5ba21880d209c03d232f00505f90b03db9fa155e0b4907f051	da7c7576040b25198feaa18309ee66a78f5c2ce8e8724671f283a460e1b0c0f7	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 02:11:43.349	2025-12-17 02:12:40.718	new_login	2025-12-17 02:11:43.349702	2025-12-17 02:13:14.526288
44961211-5649-4997-9849-7c31f14cb5f0	7bbf35d0-ba0e-4eee-a7da-624175592b63	675f0f2d78d0d4cea69630172e879c181dd563d50a02fd0b5193d801a06cbf41	53cdfb12f76a4689dd6441e9a913f7e9917bff0c3bc30dae533b57c162f3369f	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 02:26:47.491	2025-12-17 02:26:49.06	new_login	2025-12-17 02:26:47.491534	2025-12-17 02:27:15.129665
fd9ce7da-45fe-4266-a038-bb5c14d3a7d3	7bbf35d0-ba0e-4eee-a7da-624175592b63	432efd0f066f50a8bf003ce88bb5338458a909747b310882bbb4c8e07c207a29	865ba8fb35d60fbdecc18df1a1e677d3452eef9817cbe1e4f409b8080cae7349	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 00:51:26.241	2025-12-17 00:51:27.884	new_login	2025-12-17 00:51:26.241672	2025-12-17 00:51:56.242627
9afd4934-e15f-44df-baeb-0bf012959219	7bbf35d0-ba0e-4eee-a7da-624175592b63	184df6856cc6149afbfa06e8f58108baa4e75313b8bac69cdb0cfe66e2a4ddce	a14cb8a0165c2f68e3ddc7053cebbb1c570fddb3cd8442b658a5223322df9e02	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 00:06:35.386	2025-12-17 00:07:00.732	new_login	2025-12-17 00:06:35.387681	2025-12-17 00:07:18.341846
cc25f7f3-afc2-4510-ae9a-77722b760c7e	7bbf35d0-ba0e-4eee-a7da-624175592b63	58e1e0cff32dced3ace3a033f306d8243999f38c0c98bb644a59a39182e4d229	c0e0f0cf1a697bb14c1a91e38f0020fbf5022d44a2cc005970fcbfa1d3b7d4b1	{"os": "Windows 10", "device": "desktop", "browser": "Chrome 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"}	::ffff:127.0.0.1	\N	f	2025-12-18 02:46:20.567	2025-12-17 02:46:26.055	new_login	2025-12-17 02:46:20.568266	2025-12-17 03:30:34.585546
dadbae05-0f6a-4149-aed9-c139303d31a7	7c1b05d7-d98e-4543-ac27-dd1c797517e6	894e5aa1df873ebdd779d85fa4ec44767ae87e9103e43a2aa36c58c5c6856990	95c797feabd15157220277cd212d55259076684f8b5ed3b5252f83bf7d0b8395	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 12:52:03.089	2025-12-17 12:52:05.036	new_login	2025-12-17 12:52:03.089388	2025-12-17 12:52:42.139906
dcaa4d55-5ea7-404c-8be8-eed928d1fc6f	7c1b05d7-d98e-4543-ac27-dd1c797517e6	223b661e160bdbf5bd2f4a213cbfc8c06eed08a490ce4b269dbc1952a43414c8	c1714f178eeb92845d71e719de6333ffbd5e1e47179a9bc8b3bc886c82057741	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 02:28:20.088	2025-12-17 02:28:23.714	new_login	2025-12-17 02:28:20.08844	2025-12-17 02:29:00.05199
be959f8e-ec19-46fa-82f0-94f04373d916	7c1b05d7-d98e-4543-ac27-dd1c797517e6	e41c7302abca559cc43340cde974229365fdfa62a9527b43b6a555980df71374	bd9b5dd500394ea48d084b6e9ab0cb28469794d03e90fd47d96a753913df4103	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 02:29:00.057	2025-12-17 02:29:02.026	new_login	2025-12-17 02:29:00.057286	2025-12-17 03:44:52.97588
8b235011-1087-48eb-bcb8-bdfd6855c53f	7bbf35d0-ba0e-4eee-a7da-624175592b63	af31f69367dcf9b56edff06177fe7a054cfad3d9b4648d79a14e33070adea037	86fd5901c8b45bd29c2f3127383bd06fce1ba7236f6fa4d8a546913d190add20	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 02:27:15.135	2025-12-17 02:27:16.713	new_login	2025-12-17 02:27:15.135943	2025-12-17 02:45:15.338074
070f0784-f12a-4081-a2fa-76c19bc08f8d	7c1b05d7-d98e-4543-ac27-dd1c797517e6	1ce11e793df2c2b789da9e6c99e73999c411d0078abb81e8764c45cd92985c01	57a610ff535284b8111b9cfefe803ae79837cf45b775e4d8271ca680f85434af	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 03:44:52.992	2025-12-17 03:46:15.394	new_login	2025-12-17 03:44:52.993148	2025-12-17 03:58:24.118416
ee829f6d-6e07-4ef8-8561-36b6ff955a5b	7bbf35d0-ba0e-4eee-a7da-624175592b63	f157765339495abac6c3cc71420d20677523e1c7161bbabdcb4223fd942c2be1	967c5d2a84c3f7b141a10697f315fc9a57cc81b053f5d65bdb5371d7fcec0073	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	t	2025-12-18 12:54:02.399	2025-12-17 13:00:56.177	\N	2025-12-17 12:54:02.399762	2025-12-17 13:00:56.17934
b3e2e6b3-04c4-4e6d-ad2f-766f7966e469	7c1b05d7-d98e-4543-ac27-dd1c797517e6	837b5f7703cae171b7c27dcdfca3f36757e1d1b184cc6efc694525840d60d640	4600ab96211d588a0fbec71a8cb44b9a375d27d9e193bea087d7c24f9aa27c70	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 03:58:24.131	2025-12-17 03:58:26.127	new_login	2025-12-17 03:58:24.1315	2025-12-17 12:52:03.082773
f4f69413-7eed-4d32-bf80-2240de3873bf	7bbf35d0-ba0e-4eee-a7da-624175592b63	e6cb282e4ff0a076dee57a8687205d688d4bda52a7e80eefb5ecbb2efac1ac64	c664df77bb59fb107f1bce4b96286def6b02611accdedd56b3eb1ddda9ecf559	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 02:45:15.356	2025-12-17 02:45:21.801	new_login	2025-12-17 02:45:15.356731	2025-12-17 02:46:20.555915
96613dce-4c38-4360-a488-8564b0598bfc	7c1b05d7-d98e-4543-ac27-dd1c797517e6	334171bffe1232abf35ee9ebbafe9270c6a5bedf5ace69b1b93a0c44ed2ea3f9	e62e6413037c993ab1f9fad4adb21e99ef8ccf6ac991ff4bea5ca9ff5ad1e769	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	t	2025-12-18 12:52:42.146	2025-12-17 12:53:08.66	\N	2025-12-17 12:52:42.146351	2025-12-17 12:53:08.661073
9f11646f-af5e-489d-92fd-0f87dd64337d	7bbf35d0-ba0e-4eee-a7da-624175592b63	9c97f0b87f501a1b653ba5fa364405b48667ecdfcfd96bdda109cf2c56e79c21	2589c963e2959bf0c04c0b71aa8ae77b3ab867c8e728ca8622ec049470bf27f7	{"os": "Windows 10", "device": "desktop", "browser": "Edge 143.0.0.0", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"}	::ffff:127.0.0.1	\N	f	2025-12-18 03:30:34.602	2025-12-17 03:41:26.291	new_login	2025-12-17 03:30:34.603211	2025-12-17 12:54:02.39351
\.


--
-- Name: user_profiles PK_1ec6662219f4605723f1e41b6cb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY (id);


--
-- Name: cases PK_264acb3048c240fb89aa34626db; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT "PK_264acb3048c240fb89aa34626db" PRIMARY KEY (id);


--
-- Name: case_control PK_3ed708b985ab46d77289b24aacc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_control
    ADD CONSTRAINT "PK_3ed708b985ab46d77289b24aacc" PRIMARY KEY (id);


--
-- Name: manual_time_entries PK_4c80ca1ead0a108a1df2c9ed4f5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_time_entries
    ADD CONSTRAINT "PK_4c80ca1ead0a108a1df2c9ed4f5" PRIMARY KEY (id);


--
-- Name: origenes PK_5aae78aaf97b2ccd53c9a328e1e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.origenes
    ADD CONSTRAINT "PK_5aae78aaf97b2ccd53c9a328e1e" PRIMARY KEY (id);


--
-- Name: aplicaciones PK_61ea0ecaa98e4f6708282e9c0bd; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aplicaciones
    ADD CONSTRAINT "PK_61ea0ecaa98e4f6708282e9c0bd" PRIMARY KEY (id);


--
-- Name: case_status_control PK_7fa5b687ce6a3654b5deb4afcc1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_status_control
    ADD CONSTRAINT "PK_7fa5b687ce6a3654b5deb4afcc1" PRIMARY KEY (id);


--
-- Name: time_entries PK_b8bc5f10269ba2fe88708904aa0; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT "PK_b8bc5f10269ba2fe88708904aa0" PRIMARY KEY (id);


--
-- Name: roles PK_c1433d71a4838793a49dcad46ab; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY (id);


--
-- Name: knowledge_document_feedback UQ_1a60c8808d53f0e72c51e941c60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_feedback
    ADD CONSTRAINT "UQ_1a60c8808d53f0e72c51e941c60" UNIQUE (document_id, user_id);


--
-- Name: knowledge_document_relations UQ_1b8383d28f4e73c80069d01a683; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_relations
    ADD CONSTRAINT "UQ_1b8383d28f4e73c80069d01a683" UNIQUE (parent_document_id, child_document_id, relation_type);


--
-- Name: case_status_control UQ_226191a18778b7e24690b520208; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_status_control
    ADD CONSTRAINT "UQ_226191a18778b7e24690b520208" UNIQUE (name);


--
-- Name: roles UQ_648e3f5447f725579d7d4ffdfb7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE (name);


--
-- Name: aplicaciones UQ_99ad8e8c8600086edf72ac53022; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aplicaciones
    ADD CONSTRAINT "UQ_99ad8e8c8600086edf72ac53022" UNIQUE (nombre);


--
-- Name: knowledge_document_tag_relations UQ_a0e2684c60ed08b596adc68bfa7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_tag_relations
    ADD CONSTRAINT "UQ_a0e2684c60ed08b596adc68bfa7" UNIQUE (document_id, tag_id);


--
-- Name: cases UQ_ec12f6f2704e03fd3d631398899; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT "UQ_ec12f6f2704e03fd3d631398899" UNIQUE ("numeroCaso");


--
-- Name: knowledge_document_versions UQ_f85cabeb6e0e94bbf9c8523871d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_versions
    ADD CONSTRAINT "UQ_f85cabeb6e0e94bbf9c8523871d" UNIQUE (document_id, version_number);


--
-- Name: origenes UQ_fd725a76ccb1daa18a37c916945; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.origenes
    ADD CONSTRAINT "UQ_fd725a76ccb1daa18a37c916945" UNIQUE (nombre);


--
-- Name: archived_cases archived_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_cases
    ADD CONSTRAINT archived_cases_pkey PRIMARY KEY (id);


--
-- Name: archived_todos archived_todos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_todos
    ADD CONSTRAINT archived_todos_pkey PRIMARY KEY (id);


--
-- Name: audit_entity_changes audit_entity_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_entity_changes
    ADD CONSTRAINT audit_entity_changes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: dispositions dispositions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispositions
    ADD CONSTRAINT dispositions_pkey PRIMARY KEY (id);


--
-- Name: document_types document_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_code_key UNIQUE (code);


--
-- Name: document_types document_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_pkey PRIMARY KEY (id);


--
-- Name: knowledge_document_attachments knowledge_document_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_attachments
    ADD CONSTRAINT knowledge_document_attachments_pkey PRIMARY KEY (id);


--
-- Name: knowledge_document_feedback knowledge_document_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_feedback
    ADD CONSTRAINT knowledge_document_feedback_pkey PRIMARY KEY (id);


--
-- Name: knowledge_document_relations knowledge_document_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_relations
    ADD CONSTRAINT knowledge_document_relations_pkey PRIMARY KEY (id);


--
-- Name: knowledge_document_tag_relations knowledge_document_tag_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_tag_relations
    ADD CONSTRAINT knowledge_document_tag_relations_pkey PRIMARY KEY (id);


--
-- Name: knowledge_document_tags knowledge_document_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_tags
    ADD CONSTRAINT knowledge_document_tags_pkey PRIMARY KEY (id);


--
-- Name: knowledge_document_versions knowledge_document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_versions
    ADD CONSTRAINT knowledge_document_versions_pkey PRIMARY KEY (id);


--
-- Name: knowledge_documents knowledge_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_documents
    ADD CONSTRAINT knowledge_documents_pkey PRIMARY KEY (id);


--
-- Name: knowledge_tags knowledge_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_tags
    ADD CONSTRAINT knowledge_tags_pkey PRIMARY KEY (id);


--
-- Name: knowledge_tags knowledge_tags_tag_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_tags
    ADD CONSTRAINT knowledge_tags_tag_name_key UNIQUE (tag_name);


--
-- Name: note_feedback note_feedback_note_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_feedback
    ADD CONSTRAINT note_feedback_note_id_user_id_key UNIQUE (note_id, user_id);


--
-- Name: note_feedback note_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_feedback
    ADD CONSTRAINT note_feedback_pkey PRIMARY KEY (id);


--
-- Name: note_tag_assignments note_tag_assignments_note_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_tag_assignments
    ADD CONSTRAINT note_tag_assignments_note_id_tag_id_key UNIQUE (note_id, tag_id);


--
-- Name: note_tag_assignments note_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_tag_assignments
    ADD CONSTRAINT note_tag_assignments_pkey PRIMARY KEY (id);


--
-- Name: note_tags note_tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_tags
    ADD CONSTRAINT note_tags_name_key UNIQUE (name);


--
-- Name: note_tags note_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_tags
    ADD CONSTRAINT note_tags_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: teams teams_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_code_key UNIQUE (code);


--
-- Name: teams teams_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_name_key UNIQUE (name);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: todo_control todo_control_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_control
    ADD CONSTRAINT todo_control_pkey PRIMARY KEY (id);


--
-- Name: todo_control todo_control_todo_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_control
    ADD CONSTRAINT todo_control_todo_id_key UNIQUE (todo_id);


--
-- Name: todo_manual_time_entries todo_manual_time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_manual_time_entries
    ADD CONSTRAINT todo_manual_time_entries_pkey PRIMARY KEY (id);


--
-- Name: todo_priorities todo_priorities_level_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_priorities
    ADD CONSTRAINT todo_priorities_level_key UNIQUE (level);


--
-- Name: todo_priorities todo_priorities_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_priorities
    ADD CONSTRAINT todo_priorities_name_key UNIQUE (name);


--
-- Name: todo_priorities todo_priorities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_priorities
    ADD CONSTRAINT todo_priorities_pkey PRIMARY KEY (id);


--
-- Name: todo_time_entries todo_time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_time_entries
    ADD CONSTRAINT todo_time_entries_pkey PRIMARY KEY (id);


--
-- Name: todos todos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: cms_admin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: cms_admin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: IDX_04ef7a289a039495d38e705d02; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_04ef7a289a039495d38e705d02" ON public.notes USING btree (case_id);


--
-- Name: IDX_0bed8d2f18a8192ee5db71fcc4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_0bed8d2f18a8192ee5db71fcc4" ON public.audit_entity_changes USING btree (audit_log_id);


--
-- Name: IDX_1083887917fbfa6b55aea3a379; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_1083887917fbfa6b55aea3a379" ON public.notes USING btree (reminder_date);


--
-- Name: IDX_2cd10fda8276bb995288acfbfb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_2cd10fda8276bb995288acfbfb" ON public.audit_logs USING btree (created_at);


--
-- Name: IDX_32aad7ff3a246cf17ada622c28; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_32aad7ff3a246cf17ada622c28" ON public.archived_todos USING btree (title);


--
-- Name: IDX_335e0320612ff64bcdf9169c60; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_335e0320612ff64bcdf9169c60" ON public.notes USING btree (is_archived);


--
-- Name: IDX_498d81315f41eff30c2745d2d3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_498d81315f41eff30c2745d2d3" ON public.audit_entity_changes USING btree (field_name);


--
-- Name: IDX_53651d992d0665696601a11c4e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_53651d992d0665696601a11c4e" ON public.audit_logs USING btree (user_id, action, created_at);


--
-- Name: IDX_691aa961f6e2910307bc5d9713; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_691aa961f6e2910307bc5d9713" ON public.notes USING btree (assigned_to);


--
-- Name: IDX_7421efc125d95e413657efa3c6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_7421efc125d95e413657efa3c6" ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: IDX_78963a9e0249d69a17f60c95fb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_78963a9e0249d69a17f60c95fb" ON public.archived_todos USING btree (original_todo_id);


--
-- Name: IDX_85c204d8e47769ac183b32bf9c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_85c204d8e47769ac183b32bf9c" ON public.audit_logs USING btree (entity_id);


--
-- Name: IDX_8e5e23ee6fccba37f99df331d1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_8e5e23ee6fccba37f99df331d1" ON public.audit_logs USING btree (ip_address);


--
-- Name: IDX_9af62b1434b839da2e4ebe7a53; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_9af62b1434b839da2e4ebe7a53" ON public.archived_todos USING btree (priority);


--
-- Name: IDX_9c248efae5c3aded21fddae284; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_9c248efae5c3aded21fddae284" ON public.archived_todos USING btree (case_id);


--
-- Name: IDX_9fbabe493cc44e58282e4e2a33; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_9fbabe493cc44e58282e4e2a33" ON public.case_control USING btree ("caseId");


--
-- Name: IDX_aca9ec48e47f56efca7d45898d; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_aca9ec48e47f56efca7d45898d" ON public.audit_logs USING btree (module);


--
-- Name: IDX_b86c5f2b5de1e7a3d2a428cfb5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_b86c5f2b5de1e7a3d2a428cfb5" ON public.notes USING btree (created_by);


--
-- Name: IDX_bd2726fd31b35443f2245b93ba; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_bd2726fd31b35443f2245b93ba" ON public.audit_logs USING btree (user_id);


--
-- Name: IDX_c43bfeb2ed2b1ab52000ab2558; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_c43bfeb2ed2b1ab52000ab2558" ON public.archived_todos USING btree (archived_at);


--
-- Name: IDX_caf79ee299d8c74aa113b00eda; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_caf79ee299d8c74aa113b00eda" ON public.archived_todos USING btree (archived_by);


--
-- Name: IDX_cee5459245f652b75eb2759b4c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON public.audit_logs USING btree (action);


--
-- Name: IDX_deaa236c281b992ff6fb132f0b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deaa236c281b992ff6fb132f0b" ON public.knowledge_documents USING btree (title, content);


--
-- Name: IDX_def4674be2d6ae6b8496cb1c3e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_def4674be2d6ae6b8496cb1c3e" ON public.notes USING btree (created_at);


--
-- Name: IDX_e5bd8366d8f74d99204e0c8289; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e5bd8366d8f74d99204e0c8289" ON public.archived_todos USING btree (is_restored);


--
-- Name: IDX_ea8ece04bf963e242654d6f6f9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_ea8ece04bf963e242654d6f6f9" ON public.notes USING btree (is_important);


--
-- Name: IDX_ea9ba3dfb39050f831ee3be40d; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_ea9ba3dfb39050f831ee3be40d" ON public.audit_logs USING btree (entity_type);


--
-- Name: IDX_f57fb4e8251ae7a251213321e9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_f57fb4e8251ae7a251213321e9" ON public.archived_todos USING btree (category);


--
-- Name: IDX_fbb0000df1aea76fb2438f98f4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fbb0000df1aea76fb2438f98f4" ON public.audit_entity_changes USING btree (change_type);


--
-- Name: idx_archived_cases_archived_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_archived_cases_archived_at ON public.archived_cases USING btree (archived_at);


--
-- Name: idx_archived_cases_archived_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_archived_cases_archived_by ON public.archived_cases USING btree (archived_by);


--
-- Name: idx_archived_cases_case_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_archived_cases_case_number ON public.archived_cases USING btree (case_number);


--
-- Name: idx_archived_cases_original_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_archived_cases_original_case_id ON public.archived_cases USING btree (original_case_id);


--
-- Name: idx_archived_cases_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_archived_cases_status ON public.archived_cases USING btree (status);


--
-- Name: idx_knowledge_documents_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_knowledge_documents_search ON public.knowledge_documents USING gin (to_tsvector('spanish'::regconfig, (((title)::text || ' '::text) || COALESCE(content, ''::text))));


--
-- Name: idx_note_feedback_note_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_feedback_note_id ON public.note_feedback USING btree (note_id);


--
-- Name: idx_note_feedback_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_feedback_rating ON public.note_feedback USING btree (rating);


--
-- Name: idx_note_feedback_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_feedback_user_id ON public.note_feedback USING btree (user_id);


--
-- Name: idx_note_feedback_was_helpful; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_feedback_was_helpful ON public.note_feedback USING btree (was_helpful);


--
-- Name: idx_note_tag_assignments_assigned_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_tag_assignments_assigned_by ON public.note_tag_assignments USING btree (assigned_by);


--
-- Name: idx_note_tag_assignments_note_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_tag_assignments_note_id ON public.note_tag_assignments USING btree (note_id);


--
-- Name: idx_note_tag_assignments_tag_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_tag_assignments_tag_id ON public.note_tag_assignments USING btree (tag_id);


--
-- Name: idx_note_tags_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_tags_category ON public.note_tags USING btree (category);


--
-- Name: idx_note_tags_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_tags_created_by ON public.note_tags USING btree (created_by);


--
-- Name: idx_note_tags_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_tags_is_active ON public.note_tags USING btree (is_active);


--
-- Name: idx_note_tags_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_tags_name ON public.note_tags USING btree (name);


--
-- Name: idx_note_tags_usage_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_note_tags_usage_count ON public.note_tags USING btree (usage_count DESC);


--
-- Name: idx_notes_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_search ON public.notes USING gin (to_tsvector('spanish'::regconfig, (((title)::text || ' '::text) || content)));


--
-- Name: idx_team_members_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_members_active ON public.team_members USING btree ("isActive") WHERE ("isActive" = true);


--
-- Name: idx_team_members_joined_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_members_joined_at ON public.team_members USING btree ("joinedAt");


--
-- Name: idx_team_members_left_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_members_left_at ON public.team_members USING btree ("leftAt") WHERE ("leftAt" IS NOT NULL);


--
-- Name: idx_team_members_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_members_role ON public.team_members USING btree (role);


--
-- Name: idx_team_members_team; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_members_team ON public.team_members USING btree ("teamId");


--
-- Name: idx_team_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_members_user ON public.team_members USING btree ("userId");


--
-- Name: idx_teams_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teams_active ON public.teams USING btree ("isActive") WHERE ("isActive" = true);


--
-- Name: idx_teams_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teams_code ON public.teams USING btree (code);


--
-- Name: idx_teams_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teams_manager ON public.teams USING btree ("managerId") WHERE ("managerId" IS NOT NULL);


--
-- Name: idx_teams_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teams_name ON public.teams USING btree (name);


--
-- Name: idx_user_sessions_expires_at; Type: INDEX; Schema: public; Owner: cms_admin
--

CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_last_activity; Type: INDEX; Schema: public; Owner: cms_admin
--

CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions USING btree (last_activity_at);


--
-- Name: idx_user_sessions_token_hash; Type: INDEX; Schema: public; Owner: cms_admin
--

CREATE INDEX idx_user_sessions_token_hash ON public.user_sessions USING btree (token_hash);


--
-- Name: idx_user_sessions_user_id_active; Type: INDEX; Schema: public; Owner: cms_admin
--

CREATE INDEX idx_user_sessions_user_id_active ON public.user_sessions USING btree (user_id, is_active);


--
-- Name: notes notes_update_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER notes_update_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_notes_updated_at();


--
-- Name: archived_cases tr_archived_cases_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_archived_cases_updated_at BEFORE UPDATE ON public.archived_cases FOR EACH ROW EXECUTE FUNCTION public.update_archived_cases_timestamp();


--
-- Name: archived_todos tr_archived_todos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_archived_todos_updated_at BEFORE UPDATE ON public.archived_todos FOR EACH ROW EXECUTE FUNCTION public.update_archived_todos_timestamp();


--
-- Name: note_tags tr_note_tags_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_note_tags_updated_at BEFORE UPDATE ON public.note_tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: note_feedback tr_update_note_feedback_counts; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_update_note_feedback_counts AFTER INSERT OR DELETE OR UPDATE ON public.note_feedback FOR EACH ROW EXECUTE FUNCTION public.update_note_feedback_counts();


--
-- Name: note_tag_assignments tr_update_tag_usage_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_update_tag_usage_count AFTER INSERT OR DELETE ON public.note_tag_assignments FOR EACH ROW EXECUTE FUNCTION public.update_tag_usage_count();


--
-- Name: todo_time_entries trigger_calculate_todo_time_duration; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_calculate_todo_time_duration BEFORE INSERT OR UPDATE ON public.todo_time_entries FOR EACH ROW EXECUTE FUNCTION public.calculate_todo_time_duration();


--
-- Name: todo_control trigger_todo_control_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_todo_control_updated_at BEFORE UPDATE ON public.todo_control FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: todos trigger_todos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dispositions trigger_update_dispositions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_dispositions_updated_at BEFORE UPDATE ON public.dispositions FOR EACH ROW EXECUTE FUNCTION public.update_dispositions_updated_at();


--
-- Name: knowledge_document_tag_relations trigger_update_document_tags_json; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_document_tags_json AFTER INSERT OR DELETE OR UPDATE ON public.knowledge_document_tag_relations FOR EACH ROW EXECUTE FUNCTION public.update_document_tags_json();


--
-- Name: teams trigger_update_manager_role; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_manager_role BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_manager_role();


--
-- Name: document_types update_document_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_document_types_updated_at BEFORE UPDATE ON public.document_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: knowledge_document_attachments update_knowledge_document_attachments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_knowledge_document_attachments_updated_at BEFORE UPDATE ON public.knowledge_document_attachments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: knowledge_document_feedback update_knowledge_document_feedback_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_knowledge_document_feedback_updated_at BEFORE UPDATE ON public.knowledge_document_feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: knowledge_document_tags update_knowledge_document_tags_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_knowledge_document_tags_updated_at BEFORE UPDATE ON public.knowledge_document_tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: knowledge_documents update_knowledge_documents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON public.knowledge_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: permissions update_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.update_permissions_updated_at();


--
-- Name: team_members update_team_members_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: teams update_teams_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_sessions update_user_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: cms_admin
--

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON public.user_sessions FOR EACH ROW EXECUTE FUNCTION public.update_user_sessions_updated_at();


--
-- Name: teams validate_manager_is_member; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER validate_manager_is_member BEFORE INSERT OR UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.validate_team_manager();


--
-- Name: knowledge_documents FK_0271eb0137fd6bc6b60a101d1d0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_documents
    ADD CONSTRAINT "FK_0271eb0137fd6bc6b60a101d1d0" FOREIGN KEY (last_edited_by) REFERENCES public.user_profiles(id);


--
-- Name: notes FK_04ef7a289a039495d38e705d022; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_04ef7a289a039495d38e705d022" FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE SET NULL;


--
-- Name: role_permissions FK_06792d0c62ce6b0203c03643cdd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id);


--
-- Name: team_members FK_0a72b849753a046462b4c5a8ec2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT "FK_0a72b849753a046462b4c5a8ec2" FOREIGN KEY ("userId") REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: audit_entity_changes FK_0bed8d2f18a8192ee5db71fcc40; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_entity_changes
    ADD CONSTRAINT "FK_0bed8d2f18a8192ee5db71fcc40" FOREIGN KEY (audit_log_id) REFERENCES public.audit_logs(id) ON DELETE CASCADE;


--
-- Name: manual_time_entries FK_0d6e0895920837c762ab067a23d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_time_entries
    ADD CONSTRAINT "FK_0d6e0895920837c762ab067a23d" FOREIGN KEY ("userId") REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: knowledge_document_versions FK_145c0f37db7f69d42287659fd72; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_versions
    ADD CONSTRAINT "FK_145c0f37db7f69d42287659fd72" FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- Name: knowledge_documents FK_199e4128db22340ca215dac330c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_documents
    ADD CONSTRAINT "FK_199e4128db22340ca215dac330c" FOREIGN KEY (document_type_id) REFERENCES public.document_types(id);


--
-- Name: manual_time_entries FK_1af9a5ef3f2c858abac804eaba4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_time_entries
    ADD CONSTRAINT "FK_1af9a5ef3f2c858abac804eaba4" FOREIGN KEY ("caseControlId") REFERENCES public.case_control(id) ON DELETE CASCADE;


--
-- Name: cases FK_1ed00fda4a8e2d22a3cf1a04618; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT "FK_1ed00fda4a8e2d22a3cf1a04618" FOREIGN KEY ("originId") REFERENCES public.origenes(id);


--
-- Name: user_profiles FK_24ae6fd0e87d92677e9fcbd6aa0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "FK_24ae6fd0e87d92677e9fcbd6aa0" FOREIGN KEY ("roleId") REFERENCES public.roles(id);


--
-- Name: todo_control FK_290b2bf91bd78b3292f0efe826f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_control
    ADD CONSTRAINT "FK_290b2bf91bd78b3292f0efe826f" FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- Name: knowledge_document_tag_relations FK_29bd574ce9c69f1bfeaf2d7945f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_tag_relations
    ADD CONSTRAINT "FK_29bd574ce9c69f1bfeaf2d7945f" FOREIGN KEY (document_id) REFERENCES public.knowledge_documents(id) ON DELETE CASCADE;


--
-- Name: todo_time_entries FK_2e0cb0e0612a3ae8402ed99a726; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_time_entries
    ADD CONSTRAINT "FK_2e0cb0e0612a3ae8402ed99a726" FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- Name: notes FK_33e38f94f7261bd8d02fc4e3e0c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_33e38f94f7261bd8d02fc4e3e0c" FOREIGN KEY (replacement_note_id) REFERENCES public.notes(id) ON DELETE SET NULL;


--
-- Name: knowledge_documents FK_3ec886548adcd547ae8f4e2121c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_documents
    ADD CONSTRAINT "FK_3ec886548adcd547ae8f4e2121c" FOREIGN KEY (archived_by) REFERENCES public.user_profiles(id);


--
-- Name: todos FK_430e8241dd78382cb8afe151519; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT "FK_430e8241dd78382cb8afe151519" FOREIGN KEY (priority_id) REFERENCES public.todo_priorities(id);


--
-- Name: notes FK_4808e58fb93f067d6b11ff41cc4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_4808e58fb93f067d6b11ff41cc4" FOREIGN KEY (archived_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;


--
-- Name: archived_todos FK_4c94bc21c01d1d9401a8d3abfb2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_todos
    ADD CONSTRAINT "FK_4c94bc21c01d1d9401a8d3abfb2" FOREIGN KEY (assigned_user_id) REFERENCES public.user_profiles(id);


--
-- Name: knowledge_document_versions FK_4ff52f6143474bd71ad0c78552c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_versions
    ADD CONSTRAINT "FK_4ff52f6143474bd71ad0c78552c" FOREIGN KEY (document_id) REFERENCES public.knowledge_documents(id) ON DELETE CASCADE;


--
-- Name: knowledge_documents FK_53ff0831f91e7116a1fbaeacfb6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_documents
    ADD CONSTRAINT "FK_53ff0831f91e7116a1fbaeacfb6" FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- Name: teams FK_59c88c93088c84e34be8d3e2490; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT "FK_59c88c93088c84e34be8d3e2490" FOREIGN KEY ("managerId") REFERENCES public.user_profiles(id);


--
-- Name: case_control FK_608af5c965aa28b98b5679b1dd2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_control
    ADD CONSTRAINT "FK_608af5c965aa28b98b5679b1dd2" FOREIGN KEY ("statusId") REFERENCES public.case_status_control(id) ON DELETE RESTRICT;


--
-- Name: knowledge_documents FK_6656e431b1d4a4e5707f64a1d9f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_documents
    ADD CONSTRAINT "FK_6656e431b1d4a4e5707f64a1d9f" FOREIGN KEY (replacement_document_id) REFERENCES public.knowledge_documents(id);


--
-- Name: notes FK_691aa961f6e2910307bc5d9713b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_691aa961f6e2910307bc5d9713b" FOREIGN KEY (assigned_to) REFERENCES public.user_profiles(id) ON DELETE SET NULL;


--
-- Name: team_members FK_6d1c8c7f705803f0711336a5c33; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT "FK_6d1c8c7f705803f0711336a5c33" FOREIGN KEY ("teamId") REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: archived_cases FK_6fe6d2b81b233732786c6a30068; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_cases
    ADD CONSTRAINT "FK_6fe6d2b81b233732786c6a30068" FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- Name: knowledge_document_relations FK_722a4b47ef2555971124546616a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_relations
    ADD CONSTRAINT "FK_722a4b47ef2555971124546616a" FOREIGN KEY (child_document_id) REFERENCES public.knowledge_documents(id) ON DELETE CASCADE;


--
-- Name: knowledge_document_relations FK_73472de17631d94478fcd50a073; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_relations
    ADD CONSTRAINT "FK_73472de17631d94478fcd50a073" FOREIGN KEY (parent_document_id) REFERENCES public.knowledge_documents(id) ON DELETE CASCADE;


--
-- Name: cases FK_7d698db2c1f862aca92eaa0d4bd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT "FK_7d698db2c1f862aca92eaa0d4bd" FOREIGN KEY ("userId") REFERENCES public.user_profiles(id);


--
-- Name: cases FK_80ec957a9a225dbf5c7f4468412; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT "FK_80ec957a9a225dbf5c7f4468412" FOREIGN KEY ("applicationId") REFERENCES public.aplicaciones(id);


--
-- Name: todo_control FK_8100a159e5db23303faa516e940; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_control
    ADD CONSTRAINT "FK_8100a159e5db23303faa516e940" FOREIGN KEY (todo_id) REFERENCES public.todos(id);


--
-- Name: archived_cases FK_8757922ab9a617e545c63d96f6d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_cases
    ADD CONSTRAINT "FK_8757922ab9a617e545c63d96f6d" FOREIGN KEY (archived_by) REFERENCES public.user_profiles(id);


--
-- Name: archived_cases FK_91f4b8b2de57bab0682ee54aad6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_cases
    ADD CONSTRAINT "FK_91f4b8b2de57bab0682ee54aad6" FOREIGN KEY (assigned_to) REFERENCES public.user_profiles(id);


--
-- Name: knowledge_document_tags FK_98702e74c25210e13b440f6fe07; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_tags
    ADD CONSTRAINT "FK_98702e74c25210e13b440f6fe07" FOREIGN KEY (document_id) REFERENCES public.knowledge_documents(id) ON DELETE CASCADE;


--
-- Name: knowledge_document_feedback FK_9f578bf8144bb86e27511f8a4e9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_feedback
    ADD CONSTRAINT "FK_9f578bf8144bb86e27511f8a4e9" FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: case_control FK_9fbabe493cc44e58282e4e2a333; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_control
    ADD CONSTRAINT "FK_9fbabe493cc44e58282e4e2a333" FOREIGN KEY ("caseId") REFERENCES public.cases(id) ON DELETE CASCADE;


--
-- Name: todo_manual_time_entries FK_a301fe30eb869995e79a78d23ae; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_manual_time_entries
    ADD CONSTRAINT "FK_a301fe30eb869995e79a78d23ae" FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- Name: todos FK_a931b5001214dfbdbbd3287d32c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT "FK_a931b5001214dfbdbbd3287d32c" FOREIGN KEY (created_by_user_id) REFERENCES public.user_profiles(id);


--
-- Name: knowledge_document_attachments FK_aacea9de983d636ac5a81727caa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_attachments
    ADD CONSTRAINT "FK_aacea9de983d636ac5a81727caa" FOREIGN KEY (document_id) REFERENCES public.knowledge_documents(id) ON DELETE CASCADE;


--
-- Name: cases FK_ab1ab98313a5b42ab844ec58f81; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT "FK_ab1ab98313a5b42ab844ec58f81" FOREIGN KEY ("assignedToId") REFERENCES public.user_profiles(id);


--
-- Name: role_permissions FK_b4599f8b8f548d35850afa2d12c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c" FOREIGN KEY ("roleId") REFERENCES public.roles(id);


--
-- Name: notes FK_b86c5f2b5de1e7a3d2a428cfb55; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_b86c5f2b5de1e7a3d2a428cfb55" FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: archived_todos FK_b982ad6a03b854ccafa944bf844; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_todos
    ADD CONSTRAINT "FK_b982ad6a03b854ccafa944bf844" FOREIGN KEY (restored_by) REFERENCES public.user_profiles(id);


--
-- Name: knowledge_document_attachments FK_b9ad55041059baadb39c03ee42a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_attachments
    ADD CONSTRAINT "FK_b9ad55041059baadb39c03ee42a" FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id);


--
-- Name: audit_logs FK_bd2726fd31b35443f2245b93ba0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;


--
-- Name: todo_manual_time_entries FK_be984e58d23eb898ccf699de814; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_manual_time_entries
    ADD CONSTRAINT "FK_be984e58d23eb898ccf699de814" FOREIGN KEY (todo_control_id) REFERENCES public.todo_control(id);


--
-- Name: archived_todos FK_c0d71aec25e26b215f2a6c4c3ae; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_todos
    ADD CONSTRAINT "FK_c0d71aec25e26b215f2a6c4c3ae" FOREIGN KEY (created_by_user_id) REFERENCES public.user_profiles(id);


--
-- Name: manual_time_entries FK_c8b2ed7ebba38ad1a3cf369c36b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_time_entries
    ADD CONSTRAINT "FK_c8b2ed7ebba38ad1a3cf369c36b" FOREIGN KEY ("createdBy") REFERENCES public.user_profiles(id) ON DELETE RESTRICT;


--
-- Name: archived_todos FK_caf79ee299d8c74aa113b00eda7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_todos
    ADD CONSTRAINT "FK_caf79ee299d8c74aa113b00eda7" FOREIGN KEY (archived_by) REFERENCES public.user_profiles(id);


--
-- Name: knowledge_document_tag_relations FK_cb84f7c1be946a4ae3fddabeb90; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_tag_relations
    ADD CONSTRAINT "FK_cb84f7c1be946a4ae3fddabeb90" FOREIGN KEY (tag_id) REFERENCES public.knowledge_tags(id) ON DELETE CASCADE;


--
-- Name: time_entries FK_cc59adc76b5676735988cfa5d6f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT "FK_cc59adc76b5676735988cfa5d6f" FOREIGN KEY ("caseControlId") REFERENCES public.case_control(id) ON DELETE CASCADE;


--
-- Name: todo_manual_time_entries FK_cc68fd6489e9d97a5e82ab4b424; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_manual_time_entries
    ADD CONSTRAINT "FK_cc68fd6489e9d97a5e82ab4b424" FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- Name: time_entries FK_d1b452d7f0d45863303b7d30000; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT "FK_d1b452d7f0d45863303b7d30000" FOREIGN KEY ("userId") REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: knowledge_document_relations FK_de4123b97104db9fc00753b630d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_relations
    ADD CONSTRAINT "FK_de4123b97104db9fc00753b630d" FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- Name: archived_cases FK_df468643f6857ae7bdb0aacc7ab; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_cases
    ADD CONSTRAINT "FK_df468643f6857ae7bdb0aacc7ab" FOREIGN KEY (updated_by) REFERENCES public.user_profiles(id);


--
-- Name: case_control FK_e7acfaa2f9a2d6db0a11a58b81f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_control
    ADD CONSTRAINT "FK_e7acfaa2f9a2d6db0a11a58b81f" FOREIGN KEY ("userId") REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: document_types FK_f7f8f69705cda5be450b48027f4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT "FK_f7f8f69705cda5be450b48027f4" FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- Name: todo_time_entries FK_fa6c8bf6ec8f1376d5a6e96ee7b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_time_entries
    ADD CONSTRAINT "FK_fa6c8bf6ec8f1376d5a6e96ee7b" FOREIGN KEY (todo_control_id) REFERENCES public.todo_control(id);


--
-- Name: todos FK_fb1dabd97fe8de5c3dfa3238dd5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT "FK_fb1dabd97fe8de5c3dfa3238dd5" FOREIGN KEY (assigned_user_id) REFERENCES public.user_profiles(id);


--
-- Name: todo_control FK_fc7901c30bcb3d0c42b91a58ed4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_control
    ADD CONSTRAINT "FK_fc7901c30bcb3d0c42b91a58ed4" FOREIGN KEY (status_id) REFERENCES public.case_status_control(id);


--
-- Name: knowledge_document_feedback FK_fe15bb1013149c2351fefed9bad; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_document_feedback
    ADD CONSTRAINT "FK_fe15bb1013149c2351fefed9bad" FOREIGN KEY (document_id) REFERENCES public.knowledge_documents(id) ON DELETE CASCADE;


--
-- Name: user_sessions fk_user_sessions_user_id; Type: FK CONSTRAINT; Schema: public; Owner: cms_admin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: note_feedback note_feedback_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_feedback
    ADD CONSTRAINT note_feedback_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE CASCADE;


--
-- Name: note_feedback note_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_feedback
    ADD CONSTRAINT note_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: note_tag_assignments note_tag_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_tag_assignments
    ADD CONSTRAINT note_tag_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: note_tag_assignments note_tag_assignments_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_tag_assignments
    ADD CONSTRAINT note_tag_assignments_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE CASCADE;


--
-- Name: note_tag_assignments note_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_tag_assignments
    ADD CONSTRAINT note_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.note_tags(id) ON DELETE CASCADE;


--
-- Name: note_tags note_tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_tags
    ADD CONSTRAINT note_tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO cms_admin;


--
-- Name: TABLE aplicaciones; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.aplicaciones TO cms_admin;


--
-- Name: TABLE archived_cases; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.archived_cases TO cms_admin;


--
-- Name: TABLE archived_todos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.archived_todos TO cms_admin;


--
-- Name: TABLE audit_entity_changes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_entity_changes TO cms_admin;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO cms_admin;


--
-- Name: TABLE case_control; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.case_control TO cms_admin;


--
-- Name: TABLE case_status_control; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.case_status_control TO cms_admin;


--
-- Name: TABLE cases; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cases TO cms_admin;


--
-- Name: TABLE dispositions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.dispositions TO cms_admin;


--
-- Name: TABLE document_types; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_types TO cms_admin;


--
-- Name: TABLE knowledge_document_attachments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.knowledge_document_attachments TO cms_admin;


--
-- Name: TABLE knowledge_document_feedback; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.knowledge_document_feedback TO cms_admin;


--
-- Name: TABLE knowledge_document_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.knowledge_document_relations TO cms_admin;


--
-- Name: TABLE knowledge_document_tag_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.knowledge_document_tag_relations TO cms_admin;


--
-- Name: TABLE knowledge_document_tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.knowledge_document_tags TO cms_admin;


--
-- Name: TABLE knowledge_document_versions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.knowledge_document_versions TO cms_admin;


--
-- Name: TABLE knowledge_documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.knowledge_documents TO cms_admin;


--
-- Name: TABLE knowledge_tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.knowledge_tags TO cms_admin;


--
-- Name: TABLE manual_time_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.manual_time_entries TO cms_admin;


--
-- Name: TABLE note_feedback; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.note_feedback TO cms_admin;


--
-- Name: TABLE note_tag_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.note_tag_assignments TO cms_admin;


--
-- Name: TABLE note_tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.note_tags TO cms_admin;


--
-- Name: TABLE notes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notes TO cms_admin;


--
-- Name: TABLE origenes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.origenes TO cms_admin;


--
-- Name: TABLE permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.permissions TO cms_admin;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.role_permissions TO cms_admin;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.roles TO cms_admin;


--
-- Name: TABLE team_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.team_members TO cms_admin;


--
-- Name: TABLE teams; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.teams TO cms_admin;


--
-- Name: TABLE team_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.team_stats TO cms_admin;


--
-- Name: TABLE time_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.time_entries TO cms_admin;


--
-- Name: TABLE todo_control; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.todo_control TO cms_admin;


--
-- Name: TABLE todo_manual_time_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.todo_manual_time_entries TO cms_admin;


--
-- Name: TABLE todo_priorities; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.todo_priorities TO cms_admin;


--
-- Name: TABLE todo_time_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.todo_time_entries TO cms_admin;


--
-- Name: TABLE todos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.todos TO cms_admin;


--
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_profiles TO cms_admin;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO cms_admin;


--
-- PostgreSQL database dump complete
--

\unrestrict IXftKZegqtPOj3TEFFAMpQiyxtr6g6ogva5qwESdO3StNsAfH7EnkOZCfdS13VX


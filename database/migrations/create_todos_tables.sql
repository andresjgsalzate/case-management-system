-- =========================================
-- MIGRACIÓN: Tablas de TODOs/Tareas
-- Descripción: Sistema completo de gestión de TODOs con control de tiempo
-- =========================================

-- 1. Tabla de prioridades de TODOs
CREATE TABLE todo_priorities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) DEFAULT '#6B7280',
    level INTEGER NOT NULL UNIQUE CHECK (level >= 1 AND level <= 5),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar prioridades por defecto (usando merge para SQL Server compatibility)
MERGE todo_priorities AS target
USING (VALUES 
    ('Muy Baja', 'Prioridad muy baja - puede esperar', '#10B981', 1, 1),
    ('Baja', 'Prioridad baja - no urgente', '#3B82F6', 2, 2),
    ('Media', 'Prioridad media - importante', '#F59E0B', 3, 3),
    ('Alta', 'Prioridad alta - urgente', '#EF4444', 4, 4),
    ('Crítica', 'Prioridad crítica - inmediato', '#DC2626', 5, 5)
) AS source (name, description, color, level, display_order)
ON target.name = source.name
WHEN NOT MATCHED THEN
    INSERT (name, description, color, level, display_order)
    VALUES (source.name, source.description, source.color, source.level, source.display_order);

-- 2. Tabla principal de TODOs
CREATE TABLE todos (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NTEXT,
    priority_id UNIQUEIDENTIFIER NOT NULL,
    assigned_user_id UNIQUEIDENTIFIER,
    created_by_user_id UNIQUEIDENTIFIER NOT NULL,
    due_date DATE,
    estimated_minutes INTEGER DEFAULT 0,
    is_completed BIT DEFAULT 0,
    completed_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_todos_priority FOREIGN KEY (priority_id) REFERENCES todo_priorities(id),
    CONSTRAINT FK_todos_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES user_profiles(id),
    CONSTRAINT FK_todos_created_by FOREIGN KEY (created_by_user_id) REFERENCES user_profiles(id)
);

-- 3. Tabla de control de TODOs
CREATE TABLE todo_control (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    todo_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    user_id UNIQUEIDENTIFIER NOT NULL,
    status_id UNIQUEIDENTIFIER NOT NULL,
    total_time_minutes INTEGER DEFAULT 0,
    timer_start_at DATETIME2,
    is_timer_active BIT DEFAULT 0,
    assigned_at DATETIME2 DEFAULT GETDATE(),
    started_at DATETIME2,
    completed_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_todo_control_todo FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    CONSTRAINT FK_todo_control_user FOREIGN KEY (user_id) REFERENCES user_profiles(id),
    CONSTRAINT FK_todo_control_status FOREIGN KEY (status_id) REFERENCES case_status_control(id)
);

-- 4. Tabla de entradas de tiempo automáticas para TODOs
CREATE TABLE todo_time_entries (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    todo_control_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    start_time DATETIME2 NOT NULL,
    end_time DATETIME2,
    duration_minutes INTEGER,
    entry_type NVARCHAR(20) NOT NULL CHECK (entry_type IN ('automatic', 'manual')),
    description NTEXT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_todo_time_entries_control FOREIGN KEY (todo_control_id) REFERENCES todo_control(id) ON DELETE CASCADE,
    CONSTRAINT FK_todo_time_entries_user FOREIGN KEY (user_id) REFERENCES user_profiles(id)
);

-- 5. Tabla de entradas de tiempo manual para TODOs
CREATE TABLE todo_manual_time_entries (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    todo_control_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    description NTEXT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT FK_todo_manual_time_entries_control FOREIGN KEY (todo_control_id) REFERENCES todo_control(id) ON DELETE CASCADE,
    CONSTRAINT FK_todo_manual_time_entries_user FOREIGN KEY (user_id) REFERENCES user_profiles(id),
    CONSTRAINT FK_todo_manual_time_entries_created_by FOREIGN KEY (created_by) REFERENCES user_profiles(id)
);

-- 6. Tabla de TODOs archivados
CREATE TABLE archived_todos (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    original_todo_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NTEXT,
    priority NVARCHAR(100) NOT NULL,
    total_time_minutes INTEGER DEFAULT 0,
    completed_at DATETIME2,
    archived_at DATETIME2 DEFAULT GETDATE(),
    archived_by UNIQUEIDENTIFIER NOT NULL,
    original_data NVARCHAR(MAX), -- JSON data
    control_data NVARCHAR(MAX), -- JSON data
    restored_at DATETIME2,
    restored_by UNIQUEIDENTIFIER,
    is_restored BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    archive_reason NTEXT,
    CONSTRAINT FK_archived_todos_archived_by FOREIGN KEY (archived_by) REFERENCES user_profiles(id),
    CONSTRAINT FK_archived_todos_restored_by FOREIGN KEY (restored_by) REFERENCES user_profiles(id)
);

-- =========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =========================================

-- Índices para todos
CREATE INDEX IX_todos_assigned_user ON todos(assigned_user_id);
CREATE INDEX IX_todos_created_by ON todos(created_by_user_id);
CREATE INDEX IX_todos_priority ON todos(priority_id);
CREATE INDEX IX_todos_due_date ON todos(due_date);
CREATE INDEX IX_todos_completed ON todos(is_completed);
CREATE INDEX IX_todos_created_at ON todos(created_at);

-- Índices para control
CREATE INDEX IX_todo_control_todo ON todo_control(todo_id);
CREATE INDEX IX_todo_control_user ON todo_control(user_id);
CREATE INDEX IX_todo_control_status ON todo_control(status_id);
CREATE INDEX IX_todo_control_timer ON todo_control(is_timer_active);

-- Índices para entradas de tiempo
CREATE INDEX IX_todo_time_entries_control ON todo_time_entries(todo_control_id);
CREATE INDEX IX_todo_time_entries_user ON todo_time_entries(user_id);
CREATE INDEX IX_todo_time_entries_start ON todo_time_entries(start_time);

CREATE INDEX IX_todo_manual_time_entries_control ON todo_manual_time_entries(todo_control_id);
CREATE INDEX IX_todo_manual_time_entries_user ON todo_manual_time_entries(user_id);
CREATE INDEX IX_todo_manual_time_entries_date ON todo_manual_time_entries(date);

-- =========================================
-- TRIGGERS PARA ACTUALIZACIONES AUTOMÁTICAS
-- =========================================

-- Trigger para actualizar updated_at en todos
GO
CREATE TRIGGER TR_todos_updated_at ON todos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE todos 
    SET updated_at = GETDATE()
    FROM todos t
    INNER JOIN inserted i ON t.id = i.id;
END;
GO

-- Trigger para calcular duración automática en entradas de tiempo
CREATE TRIGGER TR_calculate_todo_time_duration ON todo_time_entries
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE todo_time_entries 
    SET duration_minutes = CASE 
        WHEN i.end_time IS NOT NULL AND i.start_time IS NOT NULL 
        THEN DATEDIFF(MINUTE, i.start_time, i.end_time)
        ELSE duration_minutes
    END
    FROM todo_time_entries tte
    INNER JOIN inserted i ON tte.id = i.id;
END;
GO

-- =========================================
-- FUNCIONES UTILITARIAS
-- =========================================

-- Función para obtener tiempo total de un TODO
CREATE FUNCTION dbo.fn_GetTodoTotalTime(@TodoId UNIQUEIDENTIFIER)
RETURNS INT
AS
BEGIN
    DECLARE @AutomaticTime INT = 0;
    DECLARE @ManualTime INT = 0;
    DECLARE @TotalTime INT = 0;
    
    -- Tiempo automático
    SELECT @AutomaticTime = COALESCE(SUM(duration_minutes), 0)
    FROM todo_time_entries tte
    INNER JOIN todo_control tc ON tc.id = tte.todo_control_id
    WHERE tc.todo_id = @TodoId;
    
    -- Tiempo manual
    SELECT @ManualTime = COALESCE(SUM(duration_minutes), 0)
    FROM todo_manual_time_entries tmte
    INNER JOIN todo_control tc ON tc.id = tmte.todo_control_id
    WHERE tc.todo_id = @TodoId;
    
    SET @TotalTime = @AutomaticTime + @ManualTime;
    
    RETURN @TotalTime;
END;
GO

-- Procedimiento para completar un TODO
CREATE PROCEDURE sp_CompleteTodo
    @TodoId UNIQUEIDENTIFIER,
    @UserId UNIQUEIDENTIFIER,
    @ControlId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TodoExists BIT = 0;
    DECLARE @ErrorMessage NVARCHAR(500);
    
    -- Verificar que el TODO existe
    IF EXISTS (SELECT 1 FROM todos WHERE id = @TodoId)
        SET @TodoExists = 1;
    
    IF @TodoExists = 0
    BEGIN
        SET @ErrorMessage = 'TODO no encontrado';
        RAISERROR(@ErrorMessage, 16, 1);
        RETURN;
    END
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Marcar el TODO como completado
        UPDATE todos SET
            is_completed = 1,
            completed_at = GETDATE(),
            updated_at = GETDATE()
        WHERE id = @TodoId;
        
        -- Actualizar control si se proporciona
        IF @ControlId IS NOT NULL
        BEGIN
            UPDATE todo_control SET
                completed_at = GETDATE(),
                is_timer_active = 0,
                timer_start_at = NULL,
                updated_at = GETDATE()
            WHERE id = @ControlId AND todo_id = @TodoId;
        END
        
        COMMIT TRANSACTION;
        
        SELECT 
            1 AS success,
            'TODO completado exitosamente' AS message,
            @TodoId AS todo_id,
            GETDATE() AS completed_at;
            
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

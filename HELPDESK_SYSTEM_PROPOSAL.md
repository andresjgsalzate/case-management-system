# 💬 Sistema de HelpDesk Integrado - Case Management System

## 📋 Concepto General

Sistema de HelpDesk con interfaz de chat que permite a los usuarios solicitar ayuda de manera intuitiva y convierte automáticamente estas solicitudes en casos gestionables mediante un proceso de clasificación de 5 preguntas. La interfaz simula una experiencia tipo WhatsApp para maximizar la adopción y facilidad de uso.

---

## 🎯 Objetivos del Sistema

### 🚀 **Objetivo Principal**

Simplificar el proceso de creación de casos permitiendo que los usuarios describan sus problemas de manera conversacional en un chat, mientras los agentes se encargan de la clasificación y creación estructurada del caso.

### 🎯 **Objetivos Específicos**

- **Reducir la fricción** para usuarios finales - solo describen el problema
- **Mejorar la experiencia del usuario** con interfaz familiar tipo chat
- **Simplificar el trabajo del agente** - recibe descripción completa y solo clasifica
- **Eliminar campos innecesarios** para el agente (número, fecha se generan automáticamente)
- **Estandarizar la clasificación** mediante las 5 preguntas del agente
- **Integrar completamente** con el sistema de gestión existente
- **Mantener trazabilidad** desde la solicitud inicial hasta la resolución

---

## 🏗️ Arquitectura del Sistema

### 📊 **Diagrama de Flujo General**

```
Usuario → Chat Interface → Agente Review → Clasificación → Sistema de Casos → Gestión Completa
   ↓           ↓              ↓             ↓                ↓                ↓
Describe    Conversación   Recibe Chat   5 Preguntas +   Caso Creado    Workflow Normal
Problema    Natural        Completo      Origen           Automático
```

**Flujo Detallado:**

1. **Usuario**: Describe problema libremente en chat
2. **Sistema**: Facilita conversación y recopila información
3. **Agente**: Revisa conversación completa
4. **Agente**: Responde 5 preguntas de clasificación + selecciona origen
5. **Sistema**: Genera caso automáticamente con todos los datos

### 🔧 **Componentes Técnicos**

#### **1. Frontend (React + TypeScript)**

- **Chat Interface Component** - Interfaz principal tipo WhatsApp para usuarios
- **Agent Classification Panel** - Panel de clasificación para agentes
- **Message Components** - Burbujas de mensajes, typing indicators
- **Quick Actions** - Botones rápidos para respuestas comunes del usuario
- **File Upload** - Drag & drop para archivos adjuntos del usuario
- **Classification Form** - Formulario de 5 preguntas para agentes

#### **2. Backend (Node.js + TypeScript)**

- **Chat Service** - Manejo de mensajes en tiempo real
- **Agent Assignment Service** - Asignación de conversaciones a agentes
- **Classification Engine** - Procesamiento de clasificación del agente
- **Case Generator** - Conversión de chat + clasificación a caso estructurado
- **WebSocket Handler** - Comunicación en tiempo real
- **Notification Service** - Notificaciones para agentes sobre nuevas conversaciones

#### **3. Base de Datos (PostgreSQL)**

- **Nuevas tablas específicas** para el sistema de chat
- **Tabla de asignaciones** agente-conversación
- **Integración** con tablas existentes de casos
- **Historial completo** de conversaciones

---

## 💾 Estructura de Base de Datos

### 📋 **Nuevas Tablas Requeridas**

```sql
-- Tabla principal de conversaciones de HelpDesk
CREATE TABLE helpdesk_conversations (
    id SERIAL PRIMARY KEY,
    conversation_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id),
    assigned_agent_id INTEGER REFERENCES users(id), -- Agente asignado
    status VARCHAR(20) DEFAULT 'pending_assignment', -- pending_assignment, assigned, in_classification, classified, converted, closed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    assigned_at TIMESTAMP, -- Cuando se asignó al agente

    -- Resultados de clasificación (completado por el agente)
    classification_completed BOOLEAN DEFAULT false,
    classification_data JSONB, -- Respuestas a las 5 preguntas
    classified_by_agent_id INTEGER REFERENCES users(id),
    classified_at TIMESTAMP,

    -- Caso generado
    generated_case_id INTEGER REFERENCES cases(id),
    conversion_completed_at TIMESTAMP,

    -- Metadatos
    user_agent TEXT,
    ip_address INET,
    device_info JSONB
);-- Mensajes individuales del chat
CREATE TABLE helpdesk_messages (
    id SERIAL PRIMARY KEY,
    conversation_id UUID REFERENCES helpdesk_conversations(conversation_id),
    message_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),

    -- Contenido del mensaje
    message_type VARCHAR(20) NOT NULL, -- text, image, file, system, quick_action
    content TEXT,
    attachments JSONB, -- Array de archivos adjuntos

    -- Metadata del mensaje
    sender_type VARCHAR(10) NOT NULL, -- user, system, agent
    sender_id INTEGER, -- ID del usuario o agente

    -- Timestamps
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,

    -- Estados
    is_deleted BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,

    -- Clasificación
    is_classification_question BOOLEAN DEFAULT false,
    question_number INTEGER, -- 1-5 para las preguntas de clasificación
    classification_data JSONB
);

-- Plantillas de preguntas de clasificación
CREATE TABLE helpdesk_classification_questions (
    id SERIAL PRIMARY KEY,
    question_number INTEGER NOT NULL, -- 1-5
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- text, select, multiselect, scale
    options JSONB, -- Para preguntas tipo select
    is_required BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Respuestas a las preguntas de clasificación
CREATE TABLE helpdesk_classification_responses (
    id SERIAL PRIMARY KEY,
    conversation_id UUID REFERENCES helpdesk_conversations(conversation_id),
    question_id INTEGER REFERENCES helpdesk_classification_questions(id),
    response_value TEXT,
    response_data JSONB, -- Para respuestas complejas
    answered_at TIMESTAMP DEFAULT NOW()
);

-- Plantillas de casos predefinidos
CREATE TABLE helpdesk_case_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Criterios de aplicación
    classification_criteria JSONB, -- Condiciones para aplicar esta plantilla

    -- Datos del caso a generar
    case_title_template TEXT, -- Plantilla con variables
    case_description_template TEXT,
    default_priority VARCHAR(20),
    default_complexity VARCHAR(50),
    default_status VARCHAR(50),
    default_application_id INTEGER REFERENCES applications(id),
    default_origin_id INTEGER REFERENCES origins(id),

    -- Configuración
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_helpdesk_conversations_user_id ON helpdesk_conversations(user_id);
CREATE INDEX idx_helpdesk_conversations_status ON helpdesk_conversations(status);
CREATE INDEX idx_helpdesk_messages_conversation_id ON helpdesk_messages(conversation_id);
CREATE INDEX idx_helpdesk_messages_sent_at ON helpdesk_messages(sent_at);
CREATE INDEX idx_classification_responses_conversation_id ON helpdesk_classification_responses(conversation_id);
```

---

## 🎨 Diseño de Interfaz de Usuario

### 💬 **Chat Interface - Estilo WhatsApp**

#### **Layout Principal**

```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 HelpDesk - Asistente Virtual               👤 Mi Perfil  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🤖 ¡Hola! Soy tu asistente de HelpDesk                     │
│     ¿En qué puedo ayudarte hoy?                    10:30   │
│                                                             │
│                     Hola, tengo un problema con...  10:31  │
│                                     ¿Puedes ayudarme? 💭   │
│                                                             │
│ 🤖 ¡Por supuesto! Para ayudarte mejor, necesito           │
│     hacerte algunas preguntas. ¿Comenzamos?       10:31   │
│                                                             │
│                                           ✅ Sí, empecemos │
│                                           ⏰ Más tarde     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 💬 Escribe tu mensaje...                    📎 🎤 😊 ➤   │
└─────────────────────────────────────────────────────────────┘
```

#### **Componentes de la Interfaz**

##### **1. Header del Chat**

```tsx
interface ChatHeaderProps {
  status: "online" | "typing" | "away";
  agentName?: string;
  conversationId: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ status, agentName }) => (
  <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
    <div className="flex items-center">
      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
        🤖
      </div>
      <div>
        <h3 className="font-semibold">HelpDesk Assistant</h3>
        <p className="text-sm opacity-90">
          {status === "typing" ? "Escribiendo..." : "En línea"}
        </p>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <button className="p-2 hover:bg-blue-500 rounded">📞</button>
      <button className="p-2 hover:bg-blue-500 rounded">ℹ️</button>
    </div>
  </div>
);
```

##### **2. Área de Mensajes**

```tsx
interface MessageProps {
  message: {
    id: string;
    content: string;
    senderType: "user" | "system" | "agent";
    sentAt: Date;
    attachments?: FileAttachment[];
    quickActions?: QuickAction[];
  };
}

const MessageBubble: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.senderType === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        <p>{message.content}</p>
        {message.attachments && (
          <AttachmentList attachments={message.attachments} />
        )}
        {message.quickActions && (
          <QuickActionButtons actions={message.quickActions} />
        )}
        <p className="text-xs opacity-70 mt-1">
          {format(message.sentAt, "HH:mm")}
        </p>
      </div>
    </div>
  );
};
```

##### **3. Quick Actions (Botones Rápidos)**

```tsx
interface QuickActionProps {
  actions: Array<{
    id: string;
    label: string;
    value: string;
    icon?: string;
  }>;
  onActionClick: (action: string) => void;
}

const QuickActionButtons: React.FC<QuickActionProps> = ({
  actions,
  onActionClick,
}) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {actions.map((action) => (
      <button
        key={action.id}
        onClick={() => onActionClick(action.value)}
        className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm hover:bg-opacity-30"
      >
        {action.icon} {action.label}
      </button>
    ))}
  </div>
);
```

##### **4. Input Area**

```tsx
const ChatInput: React.FC = () => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-center space-x-2">
        <button className="p-2 text-gray-500 hover:text-gray-700">📎</button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1">
            😊
          </button>
        </div>
        <button
          className={`p-2 rounded-full ${
            isRecording ? "bg-red-500 text-white" : "text-gray-500"
          }`}
          onMouseDown={() => setIsRecording(true)}
          onMouseUp={() => setIsRecording(false)}
        >
          🎤
        </button>
        <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
          ➤
        </button>
      </div>
    </div>
  );
};
```

---

## 🔄 Proceso de Clasificación por Agente - Las 5 Preguntas

### 📋 **Flujo de Clasificación**

**IMPORTANTE**: El usuario **NO** responde estas preguntas. El usuario solo describe su problema libremente en el chat. Las 5 preguntas son respondidas por el **agente** después de revisar toda la conversación.

#### **Panel de Clasificación del Agente**

Cuando el agente recibe una conversación para clasificar, ve:

1. **Conversación completa** entre usuario y sistema
2. **Información del usuario** (nombre, rol, historial)
3. **Archivos adjuntos** si los hay
4. **Formulario de clasificación** con las 5 preguntas

#### **Pregunta 1: Categorización General**

_Respondida por el agente basándose en la descripción del usuario_

```
Opciones de clasificación:
🖥️ Problema Técnico
📋 Solicitud de Información
🔧 Solicitud de Cambio
🚨 Incidente Crítico
❓ Requiere más información
```

#### **Pregunta 2: Urgencia y Impacto**

_Evaluada por el agente según la descripción y contexto_

```
Opciones de urgencia:
🔥 Crítico - Impide trabajar completamente
⚡ Alto - Afecta significativamente la productividad
⏰ Medio - Impacto moderado, puede esperar
📅 Bajo - Sin impacto inmediato
```

#### **Pregunta 3: Área o Módulo Afectado**

_Determinada por el agente según el problema descrito_

```
Opciones de módulos:
📊 Dashboard
📋 Gestión de Casos
✅ TODOs
👥 Usuarios y Roles
🏷️ Tags y Categorías
📚 Base de Conocimiento
📱 Acceso Móvil
🔐 Login/Seguridad
🔧 Configuración
🗃️ Reportes
```

#### **Pregunta 4: Complejidad Estimada**

_Evaluada por el agente basándose en la descripción técnica_

```
Opciones de complejidad:
🔴 Alta Complejidad - Requiere análisis profundo
🟡 Media Complejidad - Solución estándar
🟢 Baja Complejidad - Solución rápida
🔵 Complejidad Crítica - Requiere escalación
```

#### **Pregunta 5: Origen del Caso**

_Seleccionado por el agente (campo requerido)_

```
Selección de origen:
- HelpDesk Chat (por defecto)
- Email
- Teléfono
- Presencial
- Sistema Interno
- Otro (especificar)
```

### 🎯 **Datos Automáticos vs Manuales**

#### ✅ **Generados Automáticamente** (el agente NO necesita completar):

- **Número del caso**: Auto-generado por el sistema
- **Fecha**: Timestamp automático de creación
- **Descripción del problema**: Extraída automáticamente del chat
- **Usuario solicitante**: Del contexto del chat
- **Aplicación**: Determinada automáticamente como "HelpDesk"

#### 📝 **Completados por el Agente** (únicamente estos campos):

- **Clasificación**: Respuestas a las 5 preguntas
- **Origen**: Selección del origen específico

[Área de texto libre + upload de archivos]

```

#### **Pregunta 5: Contexto Adicional**

```

🤖 "¿Hay algo más que deba saber?
Por ejemplo: ¿cuándo empezó?, ¿afecta a otros usuarios?, etc."

[Área de texto libre + checkboxes opcionales]

Opciones adicionales:
☑️ Afecta a otros usuarios
☑️ Es recurrente
☑️ Necesito capacitación
☑️ Es una mejora sugerida

````

### 🧠 **Motor de Clasificación Inteligente**

```typescript
interface ClassificationEngine {
  // Analiza las respuestas y sugiere configuración del caso
  analyzeResponses(responses: ClassificationResponse[]): CaseConfiguration;

  // Selecciona la plantilla más apropiada
  selectTemplate(classification: Classification): CaseTemplate;

  // Genera el caso con datos pre-poblados
  generateCase(conversation: Conversation, template: CaseTemplate): CaseData;
}

interface CaseConfiguration {
  suggestedPriority: Priority;
  suggestedComplexity: Complexity;
  suggestedApplication: Application;
  suggestedOrigin: Origin;
  suggestedAssignee?: User;
  suggestedTags: Tag[];
  estimatedResolutionTime: number; // en horas
}
````

---

## 🔗 Integración con el Sistema Existente

### 📊 **Arquitectura de Integración**

#### **1. Servicios Backend Nuevos**

```typescript
// /backend/src/modules/helpdesk/

// Servicio principal del chat
export class HelpdeskChatService {
  constructor(
    private conversationRepo: Repository<HelpdeskConversation>,
    private messageRepo: Repository<HelpdeskMessage>,
    private caseService: CaseService, // Servicio existente
    private userService: UserService, // Servicio existente
    private classificationEngine: ClassificationEngine
  ) {}

  async createConversation(userId: number): Promise<HelpdeskConversation> {
    // Crear nueva conversación
  }

  async sendMessage(
    conversationId: string,
    message: MessageData
  ): Promise<HelpdeskMessage> {
    // Enviar mensaje y procesar respuesta automática
  }

  async processClassificationResponse(
    conversationId: string,
    questionNumber: number,
    response: any
  ): Promise<void> {
    // Procesar respuesta de clasificación
  }

  async generateCaseFromConversation(conversationId: string): Promise<Case> {
    const conversation = await this.getConversation(conversationId);
    const classification = await this.getClassificationData(conversationId);

    // Usar el CaseService existente para crear el caso
    const caseData = this.classificationEngine.generateCase(
      conversation,
      classification
    );
    return await this.caseService.createCase(caseData);
  }
}

// Motor de clasificación
export class ClassificationEngine {
  constructor(
    private templateRepo: Repository<HelpdeskCaseTemplate>,
    private questionRepo: Repository<HelpdeskClassificationQuestion>
  ) {}

  async analyzeResponses(
    responses: ClassificationResponse[]
  ): Promise<CaseConfiguration> {
    // Lógica de análisis inteligente
    const analysis = this.performAnalysis(responses);

    return {
      suggestedPriority: this.determinePriority(analysis),
      suggestedComplexity: this.determineComplexity(analysis),
      suggestedApplication: await this.determineApplication(analysis),
      suggestedOrigin: await this.determineOrigin(analysis),
      suggestedTags: await this.determineTags(analysis),
      estimatedResolutionTime: this.estimateResolutionTime(analysis),
    };
  }

  private performAnalysis(responses: ClassificationResponse[]): AnalysisResult {
    // Análisis de palabras clave, patrones, etc.
    return {
      keywords: this.extractKeywords(responses),
      urgencyLevel: this.calculateUrgency(responses),
      complexityIndicators: this.analyzeComplexity(responses),
      categoryMatch: this.matchCategory(responses),
    };
  }
}
```

#### **2. Controladores de API**

```typescript
// /backend/src/controllers/HelpdeskController.ts

export class HelpdeskController {
  constructor(
    private helpdeskService: HelpdeskChatService,
    private auditService: AuditService // Integración con auditoría existente
  ) {}

  @Post("/api/helpdesk/conversations")
  @UseMiddleware(authMiddleware) // Middleware existente
  async createConversation(req: AuthRequest, res: Response) {
    try {
      const conversation = await this.helpdeskService.createConversation(
        req.user!.id
      );

      // Registrar en auditoría
      await this.auditService.log({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "helpdesk_conversation",
        entityId: conversation.id.toString(),
        details: { conversationId: conversation.conversation_id },
      });

      res.json({ success: true, data: conversation });
    } catch (error) {
      // Manejo de errores...
    }
  }

  @Post("/api/helpdesk/conversations/:id/messages")
  @UseMiddleware(authMiddleware)
  async sendMessage(req: AuthRequest, res: Response) {
    // Implementación...
  }

  @Post("/api/helpdesk/conversations/:id/generate-case")
  @UseMiddleware(authMiddleware)
  async generateCase(req: AuthRequest, res: Response) {
    try {
      const conversationId = req.params.id;
      const generatedCase =
        await this.helpdeskService.generateCaseFromConversation(conversationId);

      // Registrar en auditoría
      await this.auditService.log({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "case",
        entityId: generatedCase.id.toString(),
        details: {
          generatedFromHelpdesk: true,
          conversationId: conversationId,
        },
      });

      res.json({ success: true, data: generatedCase });
    } catch (error) {
      // Manejo de errores...
    }
  }
}
```

#### **3. WebSocket Integration**

```typescript
// /backend/src/modules/helpdesk/websocket/HelpdeskSocketHandler.ts

export class HelpdeskSocketHandler {
  constructor(
    private helpdeskService: HelpdeskChatService,
    private io: Server
  ) {
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      socket.on(
        "join_conversation",
        async (data: { conversationId: string }) => {
          socket.join(`conversation_${data.conversationId}`);

          // Enviar historial de mensajes
          const messages = await this.helpdeskService.getConversationMessages(
            data.conversationId
          );
          socket.emit("conversation_history", messages);
        }
      );

      socket.on("send_message", async (data: MessageData) => {
        const message = await this.helpdeskService.sendMessage(
          data.conversationId,
          data
        );

        // Broadcast a todos los participantes
        this.io
          .to(`conversation_${data.conversationId}`)
          .emit("new_message", message);

        // Si es una respuesta de clasificación, enviar siguiente pregunta
        if (data.isClassificationResponse) {
          const nextQuestion =
            await this.helpdeskService.getNextClassificationQuestion(
              data.conversationId,
              data.questionNumber + 1
            );

          if (nextQuestion) {
            this.io
              .to(`conversation_${data.conversationId}`)
              .emit("classification_question", nextQuestion);
          } else {
            // Clasificación completa, mostrar resumen
            const summary = await this.helpdeskService.getClassificationSummary(
              data.conversationId
            );
            this.io
              .to(`conversation_${data.conversationId}`)
              .emit("classification_complete", summary);
          }
        }
      });

      socket.on(
        "typing",
        (data: { conversationId: string; isTyping: boolean }) => {
          socket.broadcast
            .to(`conversation_${data.conversationId}`)
            .emit("user_typing", data);
        }
      );
    });
  }
}
```

### 🎯 **Integración Frontend**

#### **1. Nuevo Módulo de HelpDesk**

```typescript
// /frontend/src/modules/helpdesk/

// Hook principal para el chat
export const useHelpdeskChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<HelpdeskMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [classificationStep, setClassificationStep] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("/helpdesk", {
      auth: { token: localStorage.getItem("token") },
    });

    newSocket.on("new_message", (message: HelpdeskMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on(
      "classification_question",
      (question: ClassificationQuestion) => {
        setClassificationStep((prev) => prev + 1);
        // Agregar pregunta como mensaje del sistema
        const questionMessage: HelpdeskMessage = {
          id: `question_${question.id}`,
          content: question.question_text,
          senderType: "system",
          sentAt: new Date(),
          quickActions: question.options,
        };
        setMessages((prev) => [...prev, questionMessage]);
      }
    );

    newSocket.on(
      "classification_complete",
      (summary: ClassificationSummary) => {
        // Mostrar resumen y opción de crear caso
      }
    );

    setSocket(newSocket);

    return () => newSocket.close();
  }, [conversationId]);

  const sendMessage = useCallback(
    (content: string, attachments?: File[]) => {
      if (socket && conversationId) {
        const message: MessageData = {
          conversationId,
          content,
          attachments,
          messageType: "text",
          isClassificationResponse: classificationStep > 0,
        };

        socket.emit("send_message", message);
      }
    },
    [socket, conversationId, classificationStep]
  );

  return { messages, sendMessage, isTyping, classificationStep };
};

// Componente principal del chat
export const HelpdeskChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { messages, sendMessage, isTyping, classificationStep } =
    useHelpdeskChat(conversationId);

  useEffect(() => {
    // Crear nueva conversación al iniciar
    const createConversation = async () => {
      try {
        const response = await helpdeskApi.createConversation();
        setConversationId(response.data.conversation_id);
      } catch (error) {
        console.error("Error creating conversation:", error);
      }
    };

    createConversation();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <HelpdeskChatHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        {isTyping && <TypingIndicator />}
      </div>
      <HelpdeskChatInput onSendMessage={sendMessage} />
    </div>
  );
};
```

#### **2. Integración con Navegación Existente**

```typescript
// /frontend/src/components/layout/Sidebar.tsx

// Agregar nueva opción en el menú lateral
const helpDeskMenuItem = {
  name: "HelpDesk",
  href: "/helpdesk",
  icon: ChatBubbleLeftRightIcon,
  permission: "helpdesk.access", // Nuevo permiso
  badge: unreadHelpDeskCount, // Badge para conversaciones no leídas
};

// Agregar al array de menuItems existente
```

#### **3. Rutas y Navegación**

```typescript
// /frontend/src/App.tsx

// Agregar nuevas rutas
<Route
  path="/helpdesk"
  element={
    <ProtectedRoute permission="helpdesk.access">
      <HelpdeskChatPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/helpdesk/admin"
  element={
    <ProtectedRoute permission="helpdesk.admin">
      <HelpdeskAdminPage />
    </ProtectedRoute>
  }
/>
```

---

## 🔄 Workflow Completo del Usuario

### 📱 **Experiencia del Usuario Paso a Paso**

#### **Paso 1: Acceso al HelpDesk**

```
Usuario hace clic en "HelpDesk" en el menú lateral
    ↓
Sistema crea automáticamente una nueva conversación
    ↓
Aparece interfaz de chat con mensaje de bienvenida
```

#### **Paso 2: Descripción del Problema**

```
🤖 "¡Hola [Nombre]! Soy tu asistente de HelpDesk.
    ¿En qué puedo ayudarte hoy?"

Usuario: "Tengo un problema con el dashboard, no cargan las métricas"

🤖 "Entiendo que tienes un problema con el dashboard.
    ¿Puedes contarme más detalles sobre lo que está pasando?"

Usuario: "Cuando entro al dashboard, la sección de métricas
         aparece en blanco. Los gráficos no cargan y sale
         un error en la consola del navegador. Empezó ayer
         por la tarde."

🤖 "¿Hay algo más que puedas agregar? Por ejemplo,
    ¿otros usuarios tienen el mismo problema?"

Usuario: "Creo que sí, mi compañero Juan también lo mencionó"

[Usuario puede adjuntar screenshots si quiere]

🤖 "Perfecto, tengo toda la información. Un agente va a
    revisar tu solicitud y crear un caso para resolverlo.
    Te notificaremos cuando esté listo."
```

#### **Paso 3: Asignación al Agente**

_(Este paso es interno, el usuario no lo ve)_

```
Sistema asigna conversación a agente disponible
    ↓
Agente recibe notificación de nueva conversación
    ↓
Agente revisa toda la conversación completa
    ↓
Agente completa clasificación (5 preguntas + origen)
    ↓
Sistema genera caso automáticamente
```

#### **Paso 4: Notificación al Usuario**

````
🤖 "¡Tu caso ha sido creado exitosamente!"

📋 CASO CREADO: #CMS-2025-001234
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔸 Título: Error en carga de métricas - Dashboard
🔸 Prioridad: Alta
🔸 Complejidad: Media
� Asignado a: Equipo de Desarrollo
🔸 Estado: Asignado
🔸 Tiempo estimado: 4-8 horas

� Recibirás notificaciones sobre el progreso.
🔗 Puedes ver el caso completo aquí: [Ver Caso]

¿Hay algo más en lo que pueda ayudarte?"

[Botones: � Ver Caso | 💬 Nueva Consulta | ✅ Finalizar]
```**Pregunta 4:**

````

🤖 "Cuéntame con más detalle qué está pasando.
Puedes escribir libremente o enviar capturas."

Usuario: "Cuando entro al dashboard, la sección de métricas
aparece en blanco. Los gráficos no cargan y sale
un error en la consola del navegador."

[Usuario adjunta screenshot]

```

**Pregunta 5:**

```

🤖 "¿Hay algo más que deba saber?"

☑️ Afecta a otros usuarios ☑️ Es recurrente
☑️ Necesito capacitación ☑️ Es una mejora

Usuario: "Empezó ayer por la tarde y creo que afecta
a otros usuarios también."

[Selecciona: ☑️ Afecta a otros usuarios]

```

#### **Paso 4: Resumen y Confirmación**

```

🤖 "Perfecto! He recopilado toda la información:

📋 RESUMEN DE TU SOLICITUD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔸 Tipo: Problema Técnico
🔸 Urgencia: Alta
🔸 Área: Dashboard
🔸 Descripción: Métricas no cargan, error en consola
🔸 Afecta a otros usuarios: Sí
🔸 Archivos adjuntos: 1 screenshot

Voy a crear un caso para resolver esto.
¿Todo está correcto?"

[Botones: ✅ Crear Caso | ✏️ Editar | 🗑️ Cancelar]

```

#### **Paso 5: Generación del Caso**

```

🤖 "¡Listo! He creado el caso #CMS-2025-001234

📋 CASO CREADO EXITOSAMENTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔸 ID: #CMS-2025-001234
🔸 Título: Error en carga de métricas - Dashboard
🔸 Prioridad: Alta
🔸 Complejidad: Media
🔸 Asignado a: Equipo de Desarrollo
🔸 Estado: Asignado
🔸 Tiempo estimado: 4-8 horas

🔔 Recibirás notificaciones sobre el progreso.
🔗 Puedes ver el caso completo aquí: [Ver Caso]

¿Hay algo más en lo que pueda ayudarte?"

[Botones: 📋 Ver Caso | 💬 Nueva Consulta | ✅ Finalizar]

````

### 🔄 **Transición al Sistema de Casos Existente**

Una vez creado el caso, el usuario puede:

1. **Ver el caso completo** - Redirección a la página de detalle del caso existente
2. **Seguir el progreso** - Recibir notificaciones automáticas
3. **Agregar información** - Usar el sistema de notas existente
4. **Colaborar** - Usar todas las funcionalidades del sistema actual

### 📊 **Comparación: Antes vs Después del HelpDesk**

#### **🔴 Proceso Actual (Agente crea caso desde cero):**
```
Agente debe completar manualmente:
1. ❌ Número del caso
2. ❌ Fecha
3. ❌ Descripción del problema (escribir desde cero)
4. ❌ Clasificación con las 5 preguntas
5. ❌ Origen
6. ❌ Aplicación

= 6 campos manuales + recopilar información del usuario por separado
```

#### **🟢 Proceso Nuevo (HelpDesk Integrado):**
```
Agente solo necesita:
1. ✅ Clasificación con las 5 preguntas (basándose en chat completo)
2. ✅ Origen (selección simple)

Automático:
- ✅ Número del caso (auto-generado)
- ✅ Fecha (timestamp automático)
- ✅ Descripción (extraída del chat)
- ✅ Aplicación (automático: "HelpDesk")

= 2 campos manuales vs 6 anteriores (67% reducción)
```

#### **🎯 Beneficios Cuantificables:**
- **Reducción 67%** en campos manuales para el agente
- **Descripción completa** automática vs escribir desde cero
- **Contexto completo** de la conversación vs recopilar por separado
- **Trazabilidad total** desde solicitud hasta resolución
- **Experiencia mejorada** para usuarios finales

---

## 📊 Panel de Administración del HelpDesk

### 🛠️ **Funcionalidades Administrativas**

#### **1. Gestión de Plantillas de Casos**

```typescript
interface CaseTemplateAdmin {
  // CRUD de plantillas
  createTemplate(template: CaseTemplateData): Promise<CaseTemplate>;
  updateTemplate(
    id: number,
    updates: Partial<CaseTemplateData>
  ): Promise<CaseTemplate>;
  deleteTemplate(id: number): Promise<void>;

  // Gestión de criterios
  defineCriteria(
    templateId: number,
    criteria: ClassificationCriteria
  ): Promise<void>;
  testTemplate(
    templateId: number,
    testData: ClassificationResponse[]
  ): Promise<CasePreview>;
}
````

#### **2. Configuración de Preguntas**

```typescript
interface QuestionAdmin {
  // Gestión de las 5 preguntas de clasificación
  updateQuestion(
    questionNumber: number,
    questionData: QuestionData
  ): Promise<void>;
  addQuestionOption(questionId: number, option: QuestionOption): Promise<void>;
  reorderQuestions(newOrder: number[]): Promise<void>;

  // A/B Testing de preguntas
  createQuestionVariant(
    questionId: number,
    variant: QuestionVariant
  ): Promise<void>;
  analyzeQuestionPerformance(questionId: number): Promise<QuestionAnalytics>;
}
```

#### **3. Dashboard Analítico**

```typescript
interface HelpdeskAnalytics {
  // Métricas de conversaciones
  getConversationMetrics(dateRange: DateRange): Promise<{
    totalConversations: number;
    completedClassifications: number;
    casesGenerated: number;
    averageResponseTime: number;
    userSatisfactionScore: number;
  }>;

  // Análisis de clasificación
  getClassificationAnalytics(): Promise<{
    commonIssueTypes: Array<{ type: string; count: number }>;
    urgencyDistribution: Record<string, number>;
    areaDistribution: Record<string, number>;
    conversionRate: number; // chat → caso
  }>;

  // Performance del sistema
  getSystemPerformance(): Promise<{
    averageClassificationTime: number;
    caseGenerationSuccessRate: number;
    mostUsedTemplates: Array<{ templateId: number; usage: number }>;
  }>;
}
```

---

## 🚀 Plan de Implementación

### 📅 **Fases de Desarrollo**

#### **Fase 1 (2-3 semanas): Fundación**

- ✅ Diseño y creación de base de datos
- ✅ Estructura básica de servicios backend
- ✅ Interfaz de chat básica (sin clasificación)
- ✅ WebSocket setup para mensajería en tiempo real

#### **Fase 2 (3-4 semanas): Motor de Clasificación**

- ✅ Implementación de las 5 preguntas
- ✅ Motor de clasificación inteligente
- ✅ Sistema de plantillas de casos
- ✅ Generación automática de casos

#### **Fase 3 (2-3 semanas): Integración**

- ✅ Conexión con sistema de casos existente
- ✅ Integración con sistema de auditoría
- ✅ Integración con sistema de permisos
- ✅ Testing de integración completa

#### **Fase 4 (2 semanas): UX Avanzada**

- ✅ Mejoras visuales de la interfaz
- ✅ Typing indicators y estados de mensaje
- ✅ Soporte para archivos adjuntos
- ✅ Emojis y quick actions

#### **Fase 5 (1-2 semanas): Administración**

- ✅ Panel de administración
- ✅ Analytics y métricas
- ✅ Configuración de plantillas
- ✅ Testing y optimización

### 🎯 **Criterios de Éxito**

#### **Métricas de Adopción**

- **80% de nuevos casos** creados a través del HelpDesk en 3 meses
- **Reducción 60%** en tiempo de creación de casos
- **Satisfacción 4.5/5** en experiencia de chat

#### **Métricas Técnicas**

- **< 200ms** tiempo de respuesta del chat
- **95%** de casos generados correctamente
- **99.9%** uptime del sistema de chat

#### **Métricas de Negocio**

- **Reducción 40%** en casos mal clasificados
- **Mejora 30%** en tiempo de primera respuesta
- **Reducción 50%** en trabajo manual de clasificación

---

## 🔧 Consideraciones Técnicas

### 🏗️ **Arquitectura y Escalabilidad**

#### **1. Manejo de Conexiones WebSocket**

```typescript
// Configuración para manejar múltiples conexiones
const socketConfig = {
  maxConnections: 1000,
  connectionTimeout: 30000,
  heartbeatInterval: 25000,
  redis: {
    adapter: true, // Para clustering
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
};

// Clustering para alta disponibilidad
if (cluster.isMaster) {
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
} else {
  const server = createServer();
  const io = new Server(server, { adapter: redisAdapter() });
}
```

#### **2. Optimización de Base de Datos**

```sql
-- Índices para queries frecuentes
CREATE INDEX CONCURRENTLY idx_helpdesk_conversations_active
ON helpdesk_conversations(user_id, status)
WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_helpdesk_messages_recent
ON helpdesk_messages(conversation_id, sent_at DESC)
WHERE sent_at > NOW() - INTERVAL '7 days';

-- Particionamiento por fecha para mensajes
CREATE TABLE helpdesk_messages_y2025m09
PARTITION OF helpdesk_messages
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
```

#### **3. Caching Strategy**

```typescript
// Redis para caching de conversaciones activas
const cacheStrategy = {
  activeConversations: "1h", // Conversaciones activas
  classificationQuestions: "24h", // Preguntas raramente cambian
  caseTemplates: "6h", // Templates pueden cambiar
  userSessions: "30m", // Sesiones de usuario
};

// Implementación con Redis
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
});
```

### 🔒 **Seguridad**

#### **1. Autenticación WebSocket**

```typescript
// Middleware de autenticación para WebSocket
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = await jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = user.id;
    socket.userRole = user.role;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});
```

#### **2. Validación de Mensajes**

```typescript
// Esquema de validación con Zod
const messageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  messageType: z.enum(["text", "image", "file"]),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        size: z.number().max(10 * 1024 * 1024), // 10MB max
        mimeType: z.string(),
      })
    )
    .optional(),
});
```

#### **3. Rate Limiting**

```typescript
// Rate limiting para prevenir spam
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 mensajes por minuto por usuario
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 📱 **Optimización Móvil**

#### **1. Responsive Design**

```scss
// Estilos optimizados para móvil
.helpdesk-chat {
  @media (max-width: 768px) {
    .message-bubble {
      max-width: 85%;
      font-size: 16px; // Prevenir zoom en iOS
    }

    .chat-input {
      padding: 12px;
      font-size: 16px;
    }

    .quick-actions {
      flex-direction: column;
      gap: 8px;
    }
  }
}
```

#### **2. Touch Optimizations**

```typescript
// Gestos táctiles para mejor UX móvil
const touchHandlers = {
  handleSwipeDown: () => {
    // Actualizar conversación
  },
  handleLongPress: (messageId: string) => {
    // Mostrar opciones de mensaje
  },
  handleDoubleTap: () => {
    // Scroll al último mensaje
  },
};
```

---

## 💡 Funcionalidades Avanzadas Futuras

### 🤖 **Inteligencia Artificial Opcional**

#### **1. Chatbot Inteligente**

```typescript
interface AIAssistant {
  // Análisis de sentimiento
  analyzeSentiment(
    message: string
  ): Promise<"positive" | "neutral" | "negative">;

  // Clasificación automática inicial
  suggestClassification(conversation: string[]): Promise<Classification>;

  // Respuestas automáticas para casos comunes
  generateAutoResponse(issue: string): Promise<string | null>;

  // Escalación inteligente
  shouldEscalate(conversation: Conversation): Promise<boolean>;
}
```

#### **2. Análisis Predictivo**

```typescript
interface PredictiveAnalytics {
  // Predicción de tiempo de resolución
  predictResolutionTime(caseData: CaseData): Promise<number>;

  // Sugerencia de asignación óptima
  suggestOptimalAssignee(caseData: CaseData): Promise<User>;

  // Detección de problemas recurrentes
  detectRecurringIssues(): Promise<IssuePattern[]>;
}
```

### 📈 **Analytics Avanzados**

#### **1. Machine Learning para Mejora Continua**

```typescript
interface MLAnalytics {
  // Análisis de efectividad de preguntas
  analyzeQuestionEffectiveness(): Promise<QuestionOptimization>;

  // Optimización automática de plantillas
  optimizeTemplates(): Promise<TemplateRecommendation[]>;

  // Predicción de satisfacción del usuario
  predictUserSatisfaction(conversation: Conversation): Promise<number>;
}
```

#### **2. Integración con Business Intelligence**

```typescript
interface BIIntegration {
  // Exportación para Power BI / Tableau
  exportToBITool(format: "powerbi" | "tableau"): Promise<ExportData>;

  // APIs para dashboards externos
  getDataForExternalDashboard(metrics: string[]): Promise<MetricData>;
}
```

---

## 🎯 Conclusión y Beneficios

### ✅ **Beneficios Inmediatos**

1. **UX Mejorada** - Interfaz familiar tipo WhatsApp para usuarios
2. **Reducción de Carga del Agente** - 67% menos campos manuales
3. **Información Completa** - Contexto total de la conversación
4. **Integración Total** - Aprovecha todo el sistema existente

### 🚀 **Beneficios a Largo Plazo**

1. **Eficiencia Operativa** - Agentes se enfocan en clasificación, no en captura
2. **Calidad de Datos** - Descripciones completas vs resúmenes manuales
3. **Satisfacción del Usuario** - Experiencia conversacional moderna
4. **Escalabilidad** - Base sólida para futuras mejoras con IA

### 📊 **ROI Estimado**

- **Reducción 67%** en campos manuales para agentes
- **Reducción 80%** en tiempo de captura de información
- **Mejora 90%** en completitud de descripciones
- **Incremento 300%** en satisfacción de usuarios finales
- **Reducción 50%** en casos que requieren información adicional

### 🛡️ **Mitigación de Riesgos**

- **Coexistencia** con formulario tradicional durante transición
- **Fallback automático** si hay problemas técnicos
- **Training comprehensivo** para agentes y usuarios
- **Monitoreo continuo** de métricas de adopción

### 🎯 **Resumen Ejecutivo**

El sistema de HelpDesk propuesto transforma radicalmente el proceso de creación de casos:

**🔴 Antes**: Usuario describe problema → Agente captura manualmente 6 campos → Caso creado
**🟢 Después**: Usuario describe problema en chat → Agente clasifica con 2 campos → Caso auto-generado

Esta evolución mantiene toda la robustez del sistema actual mientras reduce significativamente la carga operativa y mejora dramáticamente la experiencia del usuario final.

---

_Documento técnico generado el 18 de septiembre de 2025_  
_HelpDesk System Proposal - Case Management System v1.1.0_

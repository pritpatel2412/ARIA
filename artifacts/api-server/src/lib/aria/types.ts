export interface Task {
  taskId: string;
  url?: string;
  goal: string;
  expectedOutputType: string;
}

export interface TaskPlan {
  taskType: "research" | "comparison" | "extraction" | "form-fill" | "monitoring" | "job_application";
  reasoning: string;
  tasks: Task[];
}

export interface AgentEvent {
  taskId: string;
  type: "THINKING" | "NAVIGATING" | "EXTRACTING" | "COMPLETE" | "ERROR";
  message: string;
  resultJson?: Record<string, unknown>;
  screenshot?: string;
  currentUrl?: string;
  streamingUrl?: string;
  timestamp: number;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  resultJson?: Record<string, unknown>;
  screenshot?: string;
  error?: string;
}

export type StreamEventType =
  | "PLAN_READY"
  | "THINKING"
  | "NAVIGATING"
  | "EXTRACTING"
  | "COMPLETE"
  | "ERROR"
  | "ANSWER_READY"
  | "TASK_DONE";

export interface StreamEvent {
  type: StreamEventType;
  taskId?: string;
  message?: string;
  tasks?: Task[];
  answer?: string;
  successCount?: number;
  totalCount?: number;
  screenshot?: string;
  currentUrl?: string;
  streamingUrl?: string;
  timestamp: number;
}

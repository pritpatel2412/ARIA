export interface Task {
  taskId: string;
  url?: string;
  goal: string;
  expectedOutputType: string;
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

export type TaskStatus = "pending" | "running" | "complete" | "error";

export interface TaskState {
  task: Task;
  status: TaskStatus;
  events: StreamEvent[];
  screenshot?: string;
  currentUrl?: string;
  streamingUrl?: string;
}

export type PipelineStep = "idle" | "parse" | "browse" | "extract" | "synthesize" | "speak";

export interface ARIASession {
  id: string;
  goal: string;
  answer: string;
  createdAt: string;
  taskCount: number;
  successCount: number;
}

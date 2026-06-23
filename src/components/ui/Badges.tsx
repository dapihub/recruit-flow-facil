import {
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from "@/lib/constants";
import type { JobStatus, PriorityLevel, TaskStatus } from "@/lib/constants";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const color = JOB_STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
      style={{ background: color + "22", color }}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const color = PRIORITY_COLORS[priority];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap"
      style={{ color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const color = TASK_STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
      style={{ background: color + "22", color }}
    >
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}

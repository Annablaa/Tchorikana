import { CheckCircle2, XCircle, FileEdit, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type TaskAction = "create" | "update" | "comment";

interface TaskProposalProps {
  taskId?: string;
  action: TaskAction;
  summary: string;
  details: string;
  onConfirm: () => void;
  onReject: () => void;
  confirmed?: boolean;
  rejected?: boolean;
}

/**
 * Task proposal card shown within AI messages.
 * Displays proposed changes to Jira-like tasks with confirmation buttons.
 * Shows different states: pending, confirmed, or rejected.
 */
export function TaskProposal({
  taskId,
  action,
  summary,
  details,
  onConfirm,
  onReject,
  confirmed,
  rejected,
}: TaskProposalProps) {
  const actionConfig: Record<TaskAction, { icon: typeof Plus; label: string; color: string }> = {
    create: {
      icon: Plus,
      label: "Create New Task",
      color: "text-primary",
    },
    update: {
      icon: FileEdit,
      label: `Update ${taskId || 'Task'}`,
      color: "text-amber-600",
    },
    comment: {
      icon: MessageSquare,
      label: `Add Comment to ${taskId || 'Task'}`,
      color: "text-muted-foreground",
    },
  };

  // Safety check: use 'create' as default if action is invalid
  const validAction: TaskAction = actionConfig[action] ? action : "create";
  const config = actionConfig[validAction];
  const Icon = config.icon;

  // Show confirmed state
  if (confirmed) {
    return (
      <div className="mt-3 rounded-lg border border-success/30 bg-success-soft p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="font-medium text-success">
            {action === "create" ? "Task created successfully" : `${taskId} updated successfully`}
          </span>
        </div>
      </div>
    );
  }

  // Show rejected state
  if (rejected) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">Action cancelled</span>
        </div>
      </div>
    );
  }

  // Show pending proposal
  return (
    <div className="mt-3 rounded-lg border border-task-border bg-task p-4 shadow-sm">
      {/* Header with action type */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>

      {/* Summary */}
      <p className="font-medium text-foreground mb-1">{summary}</p>

      {/* Details */}
      <p className="text-sm text-muted-foreground mb-4">{details}</p>

      {/* Confirmation buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onConfirm}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Confirm
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onReject}
          className="text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

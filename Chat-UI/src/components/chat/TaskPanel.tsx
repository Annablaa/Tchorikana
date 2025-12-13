import { X, CheckCircle2, Clock, XCircle, FileEdit, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface Task {
  id: string;
  taskId?: string;
  action: "create" | "update" | "comment";
  summary: string;
  details: string;
  status: "pending" | "confirmed" | "rejected";
  timestamp: string;
  proposedBy: string;
}

interface TaskPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
}

/**
 * Slide-out panel showing all task proposals from the AI agent.
 * Displays pending, confirmed, and rejected tasks.
 */
export function TaskPanel({ open, onOpenChange, tasks }: TaskPanelProps) {
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const confirmedTasks = tasks.filter((t) => t.status === "confirmed");
  const rejectedTasks = tasks.filter((t) => t.status === "rejected");

  const getActionIcon = (action: Task["action"]) => {
    switch (action) {
      case "create":
        return Plus;
      case "update":
        return FileEdit;
      case "comment":
        return MessageSquare;
    }
  };

  const getStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        );
    }
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const Icon = getActionIcon(task.action);
    
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">
              {task.action === "create" ? "New Task" : task.taskId}
            </span>
          </div>
          {getStatusBadge(task.status)}
        </div>
        
        <p className="font-medium text-foreground mb-1">{task.summary}</p>
        <p className="text-sm text-muted-foreground mb-3">{task.details}</p>
        
        <div className="text-xs text-muted-foreground">
          Proposed at {task.timestamp}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[450px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-primary" />
            Task Proposals
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Pending tasks */}
          {pendingTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Approval ({pendingTasks.length})
              </h3>
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Confirmed tasks */}
          {confirmedTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Completed ({confirmedTasks.length})
              </h3>
              <div className="space-y-3">
                {confirmedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Rejected tasks */}
          {rejectedTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancelled ({rejectedTasks.length})
              </h3>
              <div className="space-y-3">
                {rejectedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No task proposals yet</p>
              <p className="text-sm mt-1">AI-Agent will propose tasks based on discussions</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

import type { WorkflowsSaveEnterpriseWorkflowResponse } from "@/api/generated/contract";
import {
  loadEnterpriseWorkflows,
  prepareWorkflowChange,
  saveWorkflowChange,
  type WorkflowBundle,
  type WorkflowClient,
} from "@/features/workflows/api";
import {
  expectedVersions,
  isVersionConflict,
  type WorkflowType,
} from "@/features/workflows/model";
import type {
  SubmitWorkflowEdit,
  WorkflowEdit,
  WorkflowEditResult,
} from "@/features/workflows/recordEdits";
import { stableSerialize } from "@/ui/stableSerialize";

export function createWorkflowSubmit({
  client,
  enterpriseKey,
  workflowType,
  bundle,
  onRefresh,
  onSaved,
}: {
  readonly client: WorkflowClient;
  readonly enterpriseKey: string;
  readonly workflowType: WorkflowType;
  readonly bundle: WorkflowBundle;
  readonly onRefresh: (next: WorkflowBundle) => void;
  readonly onSaved: (saved: WorkflowsSaveEnterpriseWorkflowResponse) => void;
}): SubmitWorkflowEdit {
  const conflict = (
    edit: WorkflowEdit,
    latest: WorkflowBundle,
  ): WorkflowEditResult => ({
    status: "conflict",
    before: edit.current(latest),
    after: edit.after,
    confirm: () => attempt(edit, latest),
  });

  const reloadForConflict = async (edit: WorkflowEdit) => {
    const latest = await loadEnterpriseWorkflows(client, enterpriseKey);
    onRefresh(latest);
    return conflict(edit, latest);
  };

  const attempt = async (
    edit: WorkflowEdit,
    base: WorkflowBundle,
  ): Promise<WorkflowEditResult> => {
    try {
      const current = edit.current(base);
      const change = edit.change(base);
      const binding = {
        enterpriseKey,
        workflowType,
        ...expectedVersions(
          base.views[workflowType],
          base.integration?.version ?? 0,
        ),
      };
      const preview = await prepareWorkflowChange(client, {
        ...binding,
        change,
      });
      const commit = async (): Promise<WorkflowEditResult> => {
        try {
          const saved = await saveWorkflowChange(client, {
            ...binding,
            previewId: preview.previewId,
            confirmationDigest: preview.confirmationDigest,
          });
          onSaved(saved);
          return { status: "saved" };
        } catch (error) {
          if (isVersionConflict(error)) return reloadForConflict(edit);
          throw error;
        }
      };

      if (preview.impact?.affectedWorkflows.length) {
        return {
          status: "impact",
          before: current,
          after: edit.after,
          impact: preview.impact,
          confirm: commit,
        };
      }
      return commit();
    } catch (error) {
      if (isVersionConflict(error)) return reloadForConflict(edit);
      throw error;
    }
  };

  return async (edit) => {
    // Window focus can refresh the cache while the user edits a record.
    if (
      stableSerialize(edit.current(bundle)) !== stableSerialize(edit.before)
    ) {
      return conflict(edit, bundle);
    }
    return attempt(edit, bundle);
  };
}

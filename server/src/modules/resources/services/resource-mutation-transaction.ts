// @lifecycle canonical - Transaction helper for resource writes with snapshot rollback guarantees.
import { cp, copyFile, lstat, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  ResourceVerificationError,
  type ResourceVerificationFailurePayload,
  type ResourceVerificationResult,
} from './resource-verification-service.js';

export interface ResourceMutationTarget {
  path: string;
  kind?: 'file' | 'directory';
}

export interface ResourceMutationTransactionOptions<T> {
  targets: ResourceMutationTarget[];
  mutate: () => Promise<T> | T;
  validate?: () => Promise<ResourceVerificationResult> | ResourceVerificationResult;
}

export interface ResourceMutationTransactionResult<T> {
  success: boolean;
  result?: T;
  validation?: ResourceVerificationResult;
  verificationFailure?: ResourceVerificationFailurePayload;
  rolledBack: boolean;
  error?: string;
}

interface TargetSnapshot {
  target: ResourceMutationTarget;
  existed: boolean;
  kind: 'file' | 'directory';
  snapshotPath?: string;
}

export class ResourceMutationTransaction {
  async run<T>(
    options: ResourceMutationTransactionOptions<T>
  ): Promise<ResourceMutationTransactionResult<T>> {
    const snapshotRoot = await mkdtemp(join(tmpdir(), 'cpm-resource-txn-'));
    let snapshots: TargetSnapshot[] = [];
    let rolledBack = false;

    try {
      snapshots = await this.captureSnapshots(snapshotRoot, options.targets);
      const result = await options.mutate();

      if (options.validate !== undefined) {
        const validation = await options.validate();
        if (!validation.valid) {
          await this.restoreSnapshots(snapshots);
          rolledBack = true;
          return {
            success: false,
            result,
            validation,
            rolledBack,
            error: 'Mutation produced invalid resource state; restored previous files.',
          };
        }

        return { success: true, result, validation, rolledBack };
      }

      return { success: true, result, rolledBack };
    } catch (error) {
      if (snapshots.length > 0) {
        await this.restoreSnapshots(snapshots);
        rolledBack = true;
      }

      const verificationFailure =
        error instanceof ResourceVerificationError
          ? {
              ...error.payload,
              rolledBack,
            }
          : undefined;

      return {
        success: false,
        verificationFailure,
        rolledBack,
        error:
          error instanceof ResourceVerificationError
            ? error.message
            : error instanceof Error
              ? error.message
              : String(error),
      };
    } finally {
      await rm(snapshotRoot, { recursive: true, force: true });
    }
  }

  private async captureSnapshots(
    snapshotRoot: string,
    targets: ResourceMutationTarget[]
  ): Promise<TargetSnapshot[]> {
    const snapshots: TargetSnapshot[] = [];

    for (const [index, target] of targets.entries()) {
      const normalizedKind = target.kind ?? (await this.detectTargetKind(target.path));
      const snapshot: TargetSnapshot = {
        target,
        existed: false,
        kind: normalizedKind,
      };

      try {
        const stats = await lstat(target.path);
        snapshot.existed = true;
        snapshot.kind = stats.isDirectory() ? 'directory' : 'file';
      } catch {
        snapshots.push(snapshot);
        continue;
      }

      const snapshotPath = join(snapshotRoot, `${index}-${snapshot.kind}`);
      if (snapshot.kind === 'directory') {
        await cp(target.path, snapshotPath, { recursive: true });
      } else {
        await mkdir(dirname(snapshotPath), { recursive: true });
        await copyFile(target.path, snapshotPath);
      }

      snapshot.snapshotPath = snapshotPath;
      snapshots.push(snapshot);
    }

    return snapshots;
  }

  private async restoreSnapshots(snapshots: TargetSnapshot[]): Promise<void> {
    for (let index = snapshots.length - 1; index >= 0; index -= 1) {
      const snapshot = snapshots[index];
      if (snapshot === undefined) {
        continue;
      }

      if (!snapshot.existed) {
        await rm(snapshot.target.path, { recursive: true, force: true });
        continue;
      }

      if (snapshot.snapshotPath === undefined) {
        continue;
      }

      await rm(snapshot.target.path, { recursive: true, force: true });
      await mkdir(dirname(snapshot.target.path), { recursive: true });

      if (snapshot.kind === 'directory') {
        await cp(snapshot.snapshotPath, snapshot.target.path, { recursive: true });
      } else {
        await copyFile(snapshot.snapshotPath, snapshot.target.path);
      }
    }
  }

  private async detectTargetKind(targetPath: string): Promise<'file' | 'directory'> {
    try {
      const stats = await lstat(targetPath);
      return stats.isDirectory() ? 'directory' : 'file';
    } catch {
      return 'directory';
    }
  }
}

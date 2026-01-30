// Shared ts-morph Project instance for migration scripts.
//
// Usage:
//   import { loadProject, saveProject, moveFiles } from './shared/project-loader.js';
//   const project = loadProject();
//   moveFiles(project, 'src/utils/**/*.ts', '/src/utils/', '/src/shared/utils/');
//   await saveProject(project);

import { Project } from 'ts-morph';
import path from 'node:path';

const SERVER_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');

export function loadProject(): Project {
  const tsConfigFilePath = path.join(SERVER_ROOT, 'tsconfig.json');
  console.log(`Loading project from ${tsConfigFilePath}`);

  const project = new Project({
    tsConfigFilePath,
    skipAddingFilesFromTsConfig: false,
  });

  const sourceFiles = project.getSourceFiles();
  console.log(`Loaded ${sourceFiles.length} source files`);

  return project;
}

export async function saveProject(project: Project): Promise<void> {
  const unsavedFiles = project.getSourceFiles().filter((f) => !f.isSaved());
  console.log(`Saving ${unsavedFiles.length} modified files...`);
  await project.save();
  console.log('Save complete.');
}

// Move files matching a glob from one path prefix to another.
// ts-morph automatically updates all import references across the project.
export function moveFiles(
  project: Project,
  glob: string,
  fromPrefix: string,
  toPrefix: string
): number {
  const files = project.getSourceFiles(glob);
  console.log(`Found ${files.length} files matching ${glob}`);

  let moved = 0;
  for (const file of files) {
    const oldPath = file.getFilePath();
    const newPath = oldPath.replace(fromPrefix, toPrefix);

    if (oldPath !== newPath) {
      console.log(
        `  ${path.relative(SERVER_ROOT, oldPath)} → ${path.relative(SERVER_ROOT, newPath)}`
      );
      file.move(newPath);
      moved++;
    }
  }

  console.log(`Moved ${moved} files`);
  return moved;
}

// Dry-run: show what would be moved without making changes.
export function previewMoves(
  project: Project,
  glob: string,
  fromPrefix: string,
  toPrefix: string
): Array<{ from: string; to: string }> {
  const files = project.getSourceFiles(glob);
  const moves: Array<{ from: string; to: string }> = [];

  for (const file of files) {
    const oldPath = file.getFilePath();
    const newPath = oldPath.replace(fromPrefix, toPrefix);
    if (oldPath !== newPath) {
      moves.push({
        from: path.relative(SERVER_ROOT, oldPath),
        to: path.relative(SERVER_ROOT, newPath),
      });
    }
  }

  return moves;
}

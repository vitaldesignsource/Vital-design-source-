import { projects, type Project } from "./content";

export function projectPath(project: Pick<Project, "id">): string {
  return `/work/${project.id}`;
}

export const projectRoutes: ReadonlyArray<{
  project: Project;
  path: string;
}> = projects.map((project) => ({ project, path: projectPath(project) }));

/** Resolve only known project paths, allowing one optional trailing slash. */
export function getProjectFromPath(path: string): Project | undefined {
  const canonicalPath = path.endsWith("/") ? path.slice(0, -1) : path;
  return projectRoutes.find((route) => route.path === canonicalPath)?.project;
}

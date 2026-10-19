import { projects, type Project } from "./content";

/** Public project IDs only: no visitor details are carried in the URL. */
export function getProjectReference(search: string): Project | undefined {
  const references = new URLSearchParams(search).getAll("reference");
  if (references.length !== 1) return undefined;
  return projects.find((project) => project.id === references[0]);
}

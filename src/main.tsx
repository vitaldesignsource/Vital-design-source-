import { hydrateRoot, createRoot } from "react-dom/client";
import "@fontsource-variable/space-grotesk";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "./styles.css";
import { App } from "./App";

const root = document.getElementById("root")!;
// Resolve project paths exactly once, matching the server's route allowlist.
const app = <App path={window.location.pathname} />;
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

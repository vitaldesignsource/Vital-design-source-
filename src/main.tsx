import { hydrateRoot, createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "./styles.css";
import { App } from "./App";

const root = document.getElementById("root")!;
const app = <App path={window.location.pathname.replace(/\/$/, "") || "/"} />;
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

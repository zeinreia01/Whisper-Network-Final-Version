import { createRoot } from "react-dom/client";
import '@fontsource/montserrat/300.css'; // Light
import '@fontsource/montserrat/400.css'; // Regular
import '@fontsource/montserrat/600.css'; // SemiBold
import '@fontsource/montserrat/800.css'; // ExtraBold
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

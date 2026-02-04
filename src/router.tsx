import { createBrowserRouter } from "react-router-dom";

import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import Overview from "@/pages/Overview";
import Documentation from "@/pages/Documentation";
// checking 
export const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/home", element: <Home /> },
  { path: "/explore", element: <Explore /> },
  { path: "/overview", element: <Overview /> },
  { path: "/docs", element: <Documentation /> },
]);
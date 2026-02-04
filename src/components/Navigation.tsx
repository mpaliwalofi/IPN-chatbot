import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logoImage from "@/assets/logoImage.png";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/home", label: "HOME" },
    { path: "/overview", label: "OVERVIEW" },
    { path: "/explore", label: "EXPLORER" },
    { path: "/docs", label: "DOCUMENTATION" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#004536] text-white shadow">
      <div className="w-full px-6 lg:px-12">

        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate("/home")}
          >
            <img
              src={logoImage}
              alt="Inspired Pet Nutrition"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`text-sm font-semibold tracking-wide transition-colors ${
                  isActive(link.path)
                    ? "text-white"
                    : "text-emerald-200 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}

            {/* Sign In */}
            <button className="ml-6 bg-[#0b5d46] hover:bg-[#0e6f54] text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors">
              SIGN IN
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#004536] border-t border-emerald-800">
          <div className="px-6 py-4 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-md text-sm font-semibold transition-colors ${
                  isActive(link.path)
                    ? "bg-emerald-800 text-white"
                    : "text-emerald-200 hover:bg-emerald-800 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}

            <button className="w-full mt-3 bg-[#0b5d46] hover:bg-[#0e6f54] text-white py-3 rounded-md text-sm font-semibold">
              SIGN IN
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

import Button from "react-bootstrap/Button"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    // Cargar tema guardado del localStorage
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    document.documentElement.setAttribute("data-bs-theme", savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-bs-theme", newTheme)
  }

  return (
    <Button
      variant="outline-secondary"
      size="sm"
      onClick={toggleTheme}
      className="ms-2"
      title={`Cambiar a modo ${theme === "light" ? "oscuro" : "claro"}`}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </Button>
  )
}

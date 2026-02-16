import Link from "next/link"
import Container from "react-bootstrap/Container"
import Nav from "react-bootstrap/Nav"
import ThemeToggle from "./ThemeToggle"
import { Navbar as BootstrapNavbar } from "react-bootstrap"

export default function Navbar() {
  const navbarStyle = {
    backgroundColor: "#6f42c1",
  }

  return (
    <BootstrapNavbar
      style={navbarStyle}
      variant="dark"
      expand="lg"
      className="mb-4"
    >
      <Container>
        <BootstrapNavbar.Brand as={Link} href="/">
          <img
            src="/blockchain.svg"
            width="100"
            height="40"
            className="d-inline-block align-top"
            alt="Dapp subastas logo"
          />
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />

        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} href="/">
              Subastas
            </Nav.Link>
            <Nav.Link as={Link} href="/create">
              Crear Subasta
            </Nav.Link>
          </Nav>

          <div className="d-flex align-items-center">
            <ThemeToggle />
          </div>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  )
}

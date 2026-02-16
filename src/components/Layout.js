import Head from "next/head"
import Navbar from "@/components/Navbar"

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Dapp subastas</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="Alejandro de Cora" />
        <meta
          name="description"
          content="Sistema descentralizado de subastas, desplegado en BSC Tesnet"
        />
        <link rel="icon" href="/blockchain_icon.svg" />

        {/* TODO: Imagenes para preview, url de despliegue en firebase */}
        <meta
          property="og:title"
          content="Subastas Blockchain Descentralizadas"
        />
        <meta
          property="og:description"
          content="Sistema descentralizado de subastas, desplegado en BSC Tesnet"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://example.com" />
        <meta property="og:image" content="https://example.com/preview.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Subastas Blockchain Descentralizadas"
        />
        <meta
          name="twitter:description"
          content="Sistema descentralizado de subastas, desplegado en BSC Tesnet"
        />
        <meta name="twitter:image" content="https://example.com/preview.png" />
        <meta name="twitter:creator" content="@Alexinho_Cora" />
      </Head>
      <Navbar />

      <main className="container">{children}</main>

      <footer className="border-top mt-5 py-3 bg-body-tertiary">
        <div className="container text-center">
          <div className="d-flex justify-content-center align-items-center gap-2 text-muted">
            <a
              href="https://bsky.app/profile/vichel0creg0.bsky.social"
              className="text-decoration-none text-body-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hecho con 💜 por
              {/* prettier-ignore */}
              <svg viewBox="0 0 600 530" height="24" className="mx-1" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z"
                  fill="#1185fe" />
              </svg>
              <code className="ms-1">@vichelocrego</code>
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}

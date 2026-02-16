import { useState } from "react"
import { decodeError } from "@ubiquity-os/ethers-decode-error"
import { useBlockchain } from "@/context/BlockchainContext"
import { useRouter } from "next/router"

import Alert from "react-bootstrap/Alert"
import Spinner from "react-bootstrap/Spinner"

export default function CreateAuction() {
  const [auctionDescription, setAuctionDescription] = useState("")
  const [auctionTimeToLive, setAuctionTimeToLive] = useState(1)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const { auctionContract, isLoading } = useBlockchain()
  const router = useRouter()

  async function createAuction() {
    if (!auctionContract) {
      setError("Contrato no disponible. Por favor, conecta MetaMask.")
      return
    }

    setCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const tx = await auctionContract.createAuction(
        auctionDescription,
        auctionTimeToLive,
      )
      console.log("Transacción enviada:", tx.hash)

      const response = await tx.wait()
      console.log("Transacción confirmada:", response)

      const event = response.events?.find((e) => e.event === "AuctionCreated")
      const auctionId = event.args.auctionId.toNumber()
      setSuccess(`¡Subasta creada exitosamente! ID: ${auctionId}`)

      // 2 segundito para redirigir a la página principal
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      const { error } = decodeError(err)
      console.error(`Revert operation: ${error}`)
      setError(`Error al crear subasta: ${error}`)
    } finally {
      setAuctionDescription("")
      setAuctionTimeToLive(1)
      setCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-3">Conectando con MetaMask...</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="mb-4">Crear Nueva Subasta</h1>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          {success}
          <br />
          <small>Redirigiendo a la página principal...</small>
        </Alert>
      )}

      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Descripción de la subasta
            </label>
            <input
              id="description"
              type="text"
              className="form-control"
              placeholder="Ej: iPhone 15 Pro Max"
              value={auctionDescription}
              onChange={(e) => setAuctionDescription(e.target.value)}
              disabled={creating}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="timeToLive" className="form-label">
              Duración (minutos)
            </label>
            <input
              id="timeToLive"
              type="number"
              className="form-control"
              value={auctionTimeToLive}
              min={1}
              max={10080}
              step={5}
              onChange={(e) => setAuctionTimeToLive(Number(e.target.value))}
              disabled={creating}
            />
            <div className="form-text">
              Mínimo: 1 minuto | Máximo: 10,080 minutos (1 semana)
            </div>
          </div>

          <Alert variant="info" className="small">
            <strong>ℹ️ Información importante:</strong>
            <ul className="mb-0 mt-2">
              <li>La puja mínima será de 0.001 BNB</li>
              <li>Cada usuario solo puede pujar una vez</li>
              <li>Los perdedores podrán solicitar reembolso al finalizar</li>
              <li>La transacción requerirá confirmación en MetaMask</li>
            </ul>
          </Alert>

          <button
            className="btn btn-primary"
            onClick={createAuction}
            disabled={
              creating || !auctionDescription.trim() || auctionTimeToLive < 1
            }
          >
            {creating ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Creando subasta...
              </>
            ) : (
              "Crear Subasta"
            )}
          </button>
        </div>
      </div>
    </>
  )
}

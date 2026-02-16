import { useState } from "react"
import { decodeError } from "@ubiquity-os/ethers-decode-error"
import { useBlockchain } from "@/context/BlockchainContext"
import { useRouter } from "next/router"

import Alert from "react-bootstrap/Alert"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Form from "react-bootstrap/Form"
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

      // 2 segunditos para redirigir a la página principal
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
    <div>
      <h1 className="mb-4">Crear Nueva Subasta</h1>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <Card>
            <Card.Body>
              <Card.Title>Información de la Subasta</Card.Title>
              <Card.Text className="text-muted mb-4">
                Completa los datos para crear una nueva subasta en la
                blockchain.
              </Card.Text>

              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError(null)}
                >
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

              <Form
                onSubmit={(e) => {
                  e.preventDefault()
                  createAuction()
                }}
              >
                <Form.Group className="mb-3">
                  <Form.Label>Descripción de la subasta *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Framework laptop 12"
                    value={auctionDescription}
                    onChange={(e) => setAuctionDescription(e.target.value)}
                    disabled={creating}
                    required
                    maxLength={100}
                  />
                  <Form.Text className="text-muted">
                    Descripción de la subasta
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Duración (minutos) *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Ej: 60"
                    value={auctionTimeToLive}
                    onChange={(e) => setAuctionTimeToLive(e.target.value)}
                    disabled={creating}
                    required
                    min={1}
                    max={10080}
                    step={5}
                  />
                  <Form.Text className="text-muted">
                    Mínimo: 1 minuto | Máximo: 10,080 minutos (1 semana)
                  </Form.Text>
                </Form.Group>

                <Alert variant="info" className="small">
                  <strong>ℹ️ Información importante:</strong>
                  <ul className="mb-0 mt-2">
                    <li>La puja mínima será de 0.01 BNB</li>
                    <li>Cada usuario solo puede pujar una vez</li>
                    <li>
                      Los perdedores podrán solicitar reembolso al finalizar
                    </li>
                    <li>La transacción requerirá confirmación en MetaMask</li>
                  </ul>
                </Alert>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={creating}
                    size="lg"
                  >
                    {creating ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Creando subasta...
                      </>
                    ) : (
                      "Crear Subasta"
                    )}
                  </Button>

                  <Button
                    variant="outline-secondary"
                    onClick={() => router.push("/")}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { useState } from "react"

import Alert from "react-bootstrap/Alert"
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form"
import Modal from "react-bootstrap/Modal"
import Spinner from "react-bootstrap/Spinner"

import { MIN_BID, formatBNB } from "@/utils/utils"

export default function BidModal({ show, auction, onClose, onSubmit }) {
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!auction) return null

  const minBidAmount = Math.max(
    Number(MIN_BID) - 0.001,
    Number(auction.highestBid || 0),
  )

  async function bid() {
    setError(null)

    const bidAmount = Number(amount)

    if (isNaN(bidAmount) || bidAmount <= 0) {
      setError("Por favor ingresa una cantidad válida")
      return
    }

    if (bidAmount <= minBidAmount) {
      setError(`Debes pujar más de ${formatBNB(auction.highestBid)}`)
      return
    }

    setSubmitting(true)

    try {
      await onSubmit(auction.auctionId, amount)
      setAmount("")
      onClose()
    } catch (error) {
      console.error(`Revert operation: ${error}`)
      setError(`Error al pujar en la subasta #${auction.auctionId}: ${error}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setAmount("")
      setError(null)
      onClose()
    }
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton={!submitting}>
        <Modal.Title>Realizar Puja</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="mb-3">
          <h6>{auction.description}</h6>
          <small className="text-muted">Subasta #{auction.auctionId}</small>
        </div>

        <Alert variant="info" className="small">
          <strong>Puja actual:</strong> {formatBNB(auction.highestBid)}
          <br />
          <strong>Puja mínima:</strong> {MIN_BID} BNB
        </Alert>

        <Form
          onSubmit={(e) => {
            e.preventDefault()
            bid()
          }}
        >
          <Form.Group className="mb-3">
            <Form.Label>Cantidad a pujar (BNB)</Form.Label>
            <Form.Control
              type="number"
              step="0.001"
              min={MIN_BID}
              placeholder={`Mínimo ${MIN_BID} BNB`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitting}
              required
            />
            {Number(auction.highestBid) > 0 && (
              <Form.Text className="text-muted">
                Debes pujar más de {formatBNB(auction.highestBid)}
              </Form.Text>
            )}
          </Form.Group>

          {error && (
            <Alert variant="danger" className="small">
              {error}
            </Alert>
          )}

          <div className="d-grid gap-2">
            <Button
              variant="primary"
              type="submit"
              disabled={submitting || !amount}
            >
              {submitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Procesando...
                </>
              ) : (
                "Confirmar Puja"
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

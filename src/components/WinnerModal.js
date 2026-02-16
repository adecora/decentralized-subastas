import Alert from "react-bootstrap/Alert"
import Button from "react-bootstrap/Button"
import Modal from "react-bootstrap/Modal"

export default function WinnerModal({ show, auction, winner, onClose }) {
  if (!auction) return null

  const hasWinner =
    winner && winner !== "0x0000000000000000000000000000000000000000"

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Ganador de la Subasta</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="mb-3">
          <h6>{auction.description}</h6>
          <small className="text-muted">Subasta #{auction.auctionId}</small>
        </div>

        {hasWinner ? (
          <Alert variant="success">
            <h5 className="alert-heading">¡Subasta completada!</h5>
            <hr />
            <p className="mb-0">
              <strong>Ganador:</strong>
              <br />
              <a
                href={`https://testnet.bscscan.com/address/${winner}`}
                className="text-decoration-none text-body-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <code>{winner}</code>
              </a>
            </p>
            <p className="mt-2 mb-0">
              <strong>Puja ganadora:</strong> {auction.highestBid} BNB
            </p>
          </Alert>
        ) : (
          <Alert variant="warning">
            <h5 className="alert-heading">Sin ganador</h5>
            <p className="mb-0">Esta subasta finalizó sin recibir pujas.</p>
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

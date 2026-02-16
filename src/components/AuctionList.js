import Alert from "react-bootstrap/Alert"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Spinner from "react-bootstrap/Spinner"

import AuctionCard from "./AuctionCard"

export default function AuctionList({
  auctions,
  isLoading,
  onBind,
  onRefund,
  onViewWinner,
}) {
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

  if (!auctions || auctions.length === 0) {
    return (
      <Alert variant="info" className="text-center">
        <h5>No hay subastas disponibles</h5>
        <p className="mb-0">
          Sé el primero en crear una subasta usando el botón "Crear Subasta" en
          el menú.
        </p>
      </Alert>
    )
  }

  return (
    <>
      <div className="mb-3">
        <p className="text-muted">
          Mostrando {auctions.length} subasta{auctions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <Row xs={1} md={2} lg={3} className="g-4">
        {auctions.map((auction) => (
          <Col key={auction.auctionId}>
            <AuctionCard
              auction={auction}
              onBind={onBind}
              onRefund={onRefund}
              onViewWinner={onViewWinner}
            />
          </Col>
        ))}
      </Row>
    </>
  )
}

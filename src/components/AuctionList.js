import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Spinner from "react-bootstrap/Spinner"

import AuctionCard from "./AuctionCard"

export default function AuctionList({
  auctions,
  onBind,
  onRefund,
  onViewWinner,
}) {
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

import Card from "react-bootstrap/Card"
import Badge from "react-bootstrap/Badge"
import Button from "react-bootstrap/Button"
import { useEffect, useState } from "react"

import {
  formatAddress,
  formatTimeRemaining,
  checkIsActive,
} from "@/utils/utils"

export default function AuctionCard({
  auction,
  onBind,
  onRefund,
  onViewWinner,
}) {
  const [timeRemaining, setTimeRemaining] = useState("")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    let intervalId

    const updateTime = () => {
      const active = checkIsActive(auction.deadline)

      setTimeRemaining(formatTimeRemaining(auction.deadline))
      setIsActive(active)

      if (!active) {
        clearInterval(intervalId)
        return
      }
    }

    updateTime()
    intervalId = setInterval(updateTime, 1000)

    return () => clearInterval(intervalId)
  }, [auction.deadline])

  // Ver: https://stackoverflow.com/questions/11988547/what-is-the-difference-between-number-and-parsefloat
  const hasHighestBid = Number(auction.highestBid) > 0

  return (
    <>
      <Card className="h-100 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Card.Title className="mb-0">{auction.description}</Card.Title>
            <Badge bg={isActive ? "success" : "danger"}>
              {isActive ? "Activa" : "Finalizada"}
            </Badge>
          </div>

          <Card.Subtitle className="mb-3 text-muted">
            Subasta #{auction.auctionId}
          </Card.Subtitle>

          <Card.Text>
            <strong>Puja más alta:</strong>
            <br />
            <span
              className={`fs-5 ${hasHighestBid ? "text-success" : "text-muted"}`}
            >
              {auction.highestBid}
            </span>
          </Card.Text>

          <Card.Text>
            <strong>Tiempo restante:</strong>
            <br />
            <span className={isActive ? "text-primary" : "text-danger"}>
              {timeRemaining}
            </span>
          </Card.Text>

          {hasHighestBid && (
            <Card.Text className="small text-muted">
              Pujador líder: {formatAddress(auction.highestBidder)}
            </Card.Text>
          )}

          <hr />

          <div className="d-grid gap-2">
            {isActive ? (
              <Button variant="primary" onClick={() => onBind(auction)}>
                Realizar Puja
              </Button>
            ) : (
              <>
                <Button
                  variant="info"
                  onClick={() => onViewWinner(auction.auctionId)}
                  className="mb-2"
                >
                  Ver Ganador
                </Button>
                <Button variant="warning" onClick={() => onRefund(auction)}>
                  Solicitar Reembolso
                </Button>
              </>
            )}
          </div>
        </Card.Body>
      </Card>
    </>
  )
}

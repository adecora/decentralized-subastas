import { decodeError } from "@ubiquity-os/ethers-decode-error"
import { ethers } from "ethers"
import { useEffect, useState } from "react"
import { useBlockchain } from "@/context/BlockchainContext"

import Alert from "react-bootstrap/Alert"
import Button from "react-bootstrap/Button"
import AuctionList from "@/components/AuctionList"

export default function Home() {
  const [auctions, setAuctions] = useState([])
  const [error, setError] = useState(null)

  const { auctionContract, isLoading } = useBlockchain()

  useEffect(() => {
    if (auctionContract) {
      getAuctions()
    }
  }, [auctionContract])

  async function getAuctions() {
    try {
      const response = await auctionContract.getAuctions()
      // La respuesta del contrato es un array de arrays (los structs Auction) con la forma:
      // [
      //   {
      //       "type": "BigNumber",
      //       "hex": "0x01"
      //   },
      //   "0x49A9e72975EA74133aBF1E0C2780689d368c7781",
      //   "Iphone",
      //   {
      //       "type": "BigNumber",
      //       "hex": "0x6991c94b"
      //   },
      //   "0x0000000000000000000000000000000000000000",
      //   {
      //       "type": "BigNumber",
      //       "hex": "0x00"
      //   }
      // ]
      const _auctions = []
      for (const auction of response) {
        _auctions.push({
          auctionId: auction[0].toNumber(),
          creator: auction[1].toString(),
          description: auction[2],
          deadline: auction[3].toNumber(),
          highestBidder: auction[4].toString(),
          highestBid: ethers.utils.formatEther(auction[5]),
        })
      }

      setAuctions(_auctions)
    } catch (err) {
      const { error } = decodeError(err)
      alert(`Revert operation: ${error}`)
    }
  }

  async function bid(auctionId) {
    alert(`Bid on ${auctionId}`)
  }

  async function refund(auctionId) {
    alert(`Refund on ${auctionId}`)
  }

  async function getWinner(auctionId) {
    alert(`GetWinner on ${auctionId}`)
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Subastas Activas</h1>
        <Button
          variant="outline-primary"
          onClick={() => {
            getAuctions()
          }}
          disabled={isLoading}
        >
          🔄 Actualizar
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <AuctionList
        auctions={auctions}
        isLoading={isLoading}
        onBind={bid}
        onRefund={refund}
        onViewWinner={getWinner}
      />
    </>
  )
}

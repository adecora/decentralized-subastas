import { decodeError } from "@ubiquity-os/ethers-decode-error"
import { ethers } from "ethers"
import { useEffect, useState } from "react"
import { useBlockchain } from "@/context/BlockchainContext"

import Alert from "react-bootstrap/Alert"
import Button from "react-bootstrap/Button"
import AuctionList from "@/components/AuctionList"
import BidModal from "@/components/BidModal"
import WinnerModal from "@/components/WinnerModal"

export default function Home() {
  const [auctions, setAuctions] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const { auctionContract, isLoading } = useBlockchain()

  // Estado para modales
  const [showBidModal, setShowBidModal] = useState(false)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [selectedAuction, setSelectedAuction] = useState(null)
  const [winner, setWinner] = useState(null)

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

  async function bid(auction) {
    setSelectedAuction(auction)
    setShowBidModal(true)
  }

  async function handleBidSubmit(auctionId, amount) {
    try {
      if (!auctionContract) {
        setError("Contrato no disponible. Por favor, conecta MetaMask.")
        return
      }

      const tx = await auctionContract.bid(auctionId, {
        // Convertir de ether a weis
        value: ethers.utils.parseEther(amount.toString()),
      })

      console.log("Transacción enviada:", tx.hash)

      const response = await tx.wait()
      console.log("Transacción confirmada:", response)

      setSuccess(`Puja realizada exitosamente: ${amount} BNB`)
      await getAuctions()

      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      const { error } = decodeError(err)
      throw error
    }
  }

  async function refund(auction) {
    if (
      !confirm(
        `¿Estás seguro de que deseas solicitar reembolso de la subasta #${auction.auctionId}: "${auction.description}"?`,
      )
    ) {
      return
    }

    try {
      const tx = await auctionContract.refund(auction.auctionId)
      console.log("Transacción enviada:", tx.hash)

      const response = await tx.wait()
      console.log("Transacción confirmada:", response)

      // TODO: Recuperar valor del refund
      setSuccess("Reembolso procesado exitosamente")
      await getAuctions()

      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      const { error } = decodeError(err)
      console.error(`Revert operation: ${error}`)
      setError(`Error: ${error}`)
    }
  }

  async function getWinner(auction) {
    try {
      setSelectedAuction(auction)
      const winnerAddress = await auctionContract.getWinner(auction.auctionId)
      setWinner(winnerAddress)
      setShowWinnerModal(true)
    } catch (err) {
      const { error } = decodeError(err)
      console.error(`Revert operation: ${error}`)
      setError(`Error: ${error}`)
    }
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

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <AuctionList
        auctions={auctions}
        isLoading={isLoading}
        onBind={bid}
        onRefund={refund}
        onViewWinner={getWinner}
      />

      <BidModal
        show={showBidModal}
        auction={selectedAuction}
        onClose={() => setShowBidModal(false)}
        onSubmit={handleBidSubmit}
      />

      <WinnerModal
        show={showWinnerModal}
        auction={selectedAuction}
        winner={winner}
        onClose={() => setShowWinnerModal(false)}
      />
    </>
  )
}

import detectEthereumProvider from "@metamask/detect-provider"
import { decodeError } from "@ubiquity-os/ethers-decode-error"
import { Contract, ethers } from "ethers"
import { useEffect, useRef, useState } from "react"
import AuctionSystemManifest from "../../contracts/AuctionSystem.json"

export default function Home() {
  const [autions, setAuctions] = useState([])
  const [auctionDescription, setAuctionDescription] = useState("")
  const [auctionTimeToLive, setAuctionTimeToLive] = useState(1)

  const auctionContract = useRef(null)

  useEffect(() => {
    ;(async () => {
      await configBlockchain()
      await getAuctions()
    })()
  }, [])

  async function configBlockchain() {
    const provider = await detectEthereumProvider()
    if (provider) {
      console.log("Detectado el provider de ethereum!")
      await provider.request({ method: "eth_requestAccounts" })
      const networkId = await provider.request({ method: "net_version" })
      console.log(`Conectado a la red: ${networkId}`)

      const providerEthers = new ethers.providers.Web3Provider(provider)
      let sign = providerEthers.getSigner()

      auctionContract.current = new Contract(
        "0xce13661d741acEfd756c3A9F996E17A97dC5291F",
        AuctionSystemManifest.abi,
        sign,
      )
    } else {
      console.log("Por favor instale MetaMask!")
    }
  }

  async function loadData() {}

  async function getAuctions() {
    try {
      const response = await auctionContract.current.getAuctions()
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
          deadline: auction[3].toString(),
          highestBidder: auction[4].toString(),
          highestBid: ethers.utils.formatEther(auction[5]),
        })
      }

      console.log(_auctions)
    } catch (err) {
      const { error } = decodeError(err)
      alert(`Revert operation: ${error}`)
    }
  }

  async function createAuction() {
    try {
      const tx = await auctionContract.current.createAuction(
        auctionDescription,
        auctionTimeToLive,
      )
      await tx.wait()
    } catch (err) {
      const { error } = decodeError(err)
      alert(`Revert operation: ${error}`)
    }
    setAuctionDescription("")
    setAuctionTimeToLive(1)
  }

  return (
    <>
      <h1>Subastas</h1>
      <div>{auctionDescription}</div>
      <input
        type="text"
        value={auctionDescription}
        onChange={(e) => {
          setAuctionDescription(e.target.value)
        }}
      />
      <input
        type="number"
        value={auctionTimeToLive}
        min={1}
        max={10080}
        step={5}
        onChange={(e) => {
          setAuctionTimeToLive(e.target.value)
        }}
      />
      <button
        onClick={() => {
          createAuction()
        }}
      >
        Crear subasta
      </button>
    </>
  )
}

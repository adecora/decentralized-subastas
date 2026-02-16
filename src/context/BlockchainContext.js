import detectEthereumProvider from "@metamask/detect-provider"
import { Contract, ethers } from "ethers"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import AuctionSystemManifest from "../../contracts/AuctionSystem.json"

const BlockchainContext = createContext(null)

export function BlockchainProvider({ children }) {
  const [auctionContract, setAuctionContract] = useState(null)
  const [account, setAccount] = useState(null)
  const [networkId, setNetworkId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initBlockchain()
  }, [])

  async function initBlockchain() {
    try {
      const provider = await detectEthereumProvider()
      if (provider) {
        console.log("Detectado el provider de ethereum!")

        // Solicitar acceso a las cuentas
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        })
        setAccount(accounts[0])

        // Obtener la red
        const network = await provider.request({ method: "net_version" })
        setNetworkId(network)
        console.log(`Conectado a la red: ${network}`)

        // Configurar el contrato
        const providerEthers = new ethers.providers.Web3Provider(provider)
        const signer = providerEthers.getSigner()

        const contract = new Contract(
          "0x79d56F8f0866d8E42F4f3B2e0dd59e5B21c5960C",
          AuctionSystemManifest.abi,
          signer,
        )

        setAuctionContract(contract)

        // Escuchar cambios de cuenta
        provider.on("accountsChanged", (accounts) => {
          console.log("Cuenta cambiada:", accounts[0])
          setAccount(accounts[0])
          // Reiniciar el contrato con la nueva cuenta
          initBlockchain()
        })

        // Escuchar cambios de red
        provider.on("chainChanged", (chainId) => {
          console.log("Red cambiada:", chainId)
          window.location.reload()
        })
      } else {
        console.error("Por favor instale MetaMask!")
      }
    } catch (error) {
      console.error("Error al inicializar blockchain:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = useMemo(
    () => ({
      auctionContract,
      account,
      networkId,
      isLoading,
      initBlockchain,
    }),
    [auctionContract, account, networkId, isLoading],
  )

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useBlockchain() {
  const context = useContext(BlockchainContext)
  if (!context) {
    throw new Error("useBlockchain debe usarse dentro de BlockchainProvider")
  }
  return context
}

# Frontend - Subastas DApp

## Visión General

La [aplicación frontend es una **DApp (Aplicación Descentralizada)**](https://subastas-blockchain-dapp.web.app/) construida con **Next.js** y **React** que permite a los usuarios interactuar con el contrato inteligente `AuctionSystem.sol` desplegado en **BSC Testnet**. Utiliza **MetaMask** para la autenticación y firma de transacciones, y **Bootstrap** para la interfaz de usuario.

---

## Arquitectura Frontend

```mermaid
graph TB
    subgraph "Capa de Presentación"
        P1[Navbar.js]
        P2[Layout.js]
        P3[ThemeToggle.js]
    end

    subgraph "Páginas Next.js"
        PA[_app.js<br/>BlockchainProvider]
        PB[index.js<br/>Lista Subastas]
        PC[create/index.js<br/>Crear Subasta]
    end

    subgraph "Componentes"
        C1[AuctionList.js]
        C2[AuctionCard.js]
        C3[BidModal.js]
        C4[WinnerModal.js]
    end

    subgraph "Context API"
        CTX[BlockchainContext.js<br/>useBlockchain]
    end

    subgraph "Utilidades"
        U1[utils.js<br/>formatBNB<br/>formatAddress<br/>checkIsActive]
    end

    subgraph "Blockchain"
        MM[MetaMask]
        ETH[Ethers.js]
        SC[Smart Contract<br/>AuctionSystem.sol]
    end

    PA --> P2
    P2 --> P1
    P2 --> PB
    P2 --> PC

    PB --> C1
    C1 --> C2
    PB --> C3
    PB --> C4

    PA --> CTX
    PB --> CTX
    PC --> CTX

    C2 --> U1
    C3 --> U1

    CTX --> MM
    CTX --> ETH
    ETH --> SC

    style PA fill:#4caf50,color:#fff
    style CTX fill:#2196f3,color:#fff
    style SC fill:#ff9800,color:#fff
    style MM fill:#f44336,color:#fff
```

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 16.1.6 | Framework React con SSR/SSG |
| **React** | 19.2.3 | Biblioteca de UI |
| **Ethers.js** | 5.8.0 | Interacción con blockchain |
| **Bootstrap** | 5.3.8 | Framework CSS |
| **React-Bootstrap** | 2.10.10 | Componentes React de Bootstrap |
| **MetaMask Detect** | 1.2.0 | Detección de wallet |
| **Ethers Decode Error** | 1.1.0 | Decodificación de errores |

---

## Estructura de Archivos

```
src/
├── components/
│   ├── AuctionCard.js       # Tarjeta individual de subasta
│   ├── AuctionList.js       # Grid de subastas
│   ├── BidModal.js          # Modal para realizar pujas
│   ├── WinnerModal.js       # Modal para ver ganador
│   ├── Layout.js            # Layout principal
│   ├── Navbar.js            # Barra de navegación
│   └── ThemeToggle.js       # Selector de tema
│
├── context/
│   └── BlockchainContext.js # Estado global blockchain
│
├── pages/
│   ├── _app.js              # Wrapper global
│   ├── _document.js         # HTML custom
│   ├── index.js             # Página principal (lista)
│   └── create/
│       └── index.js         # Página crear subasta
│
├── styles/
│   ├── app.css              # Estilos custom
│   └── globals.css          # Estilos globales
│
└── utils/
    └── utils.js             # Funciones auxiliares
```

---

**Autor:** Sistema de Subastas Descentralizado
**Stack:** Next.js 16.1.6 + React 19.2.3 + Ethers.js 5.8.0
**Network:** BSC Testnet
**Licencia:** MIT

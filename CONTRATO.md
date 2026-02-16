# Contrato AuctionSystem.sol

## Visión General

El [contrato `AuctionSystem.sol` es un **sistema descentralizado**](https://testnet.bscscan.com/address/0x79d56F8f0866d8E42F4f3B2e0dd59e5B21c5960C) que gestiona múltiples subastas con ciclo de vida completo: creación, pujas, finalización, entrega confirmada y cobro. Todas las subastas comparten el mismo contrato pero mantienen sus datos y estados independientes.

---

## Arquitectura del Contrato

```mermaid
graph TB
    subgraph "AuctionSystem Contract"
        AC[auctionCount: uint256]

        subgraph "Almacenamiento Principal"
            M1[mapping auctions<br/>ID => Auction]
            M2[mapping bids<br/>ID => user => amount]
        end

        subgraph "Struct Auction"
            S1[auctionId: uint256]
            S2[creator: address]
            S3[description: string]
            S4[deadline: uint256]
            S5[highestBidder: address]
            S6[highestBid: uint256]
            S7[status: AuctionStatus]
        end

        subgraph "Enum AuctionStatus"
            E1[Active: 0]
            E2[Completed: 1]
            E3[Withdraw: 2]
        end

        AC --> M1
        M1 --> S1
        M1 --> S2
        M1 --> S3
        M1 --> S4
        M1 --> S5
        M1 --> S6
        M1 --> S7
        S7 --> E1
        S7 --> E2
        S7 --> E3
    end

    U1[Usuario 1] --> M1
    U2[Usuario 2] --> M1
    U3[Usuario 3] --> M1

    style AC fill:#4caf50,color:#fff
    style M1 fill:#2196f3,color:#fff
    style M2 fill:#ff9800,color:#fff
    style E1 fill:#00bcd4,color:#fff
    style E2 fill:#9c27b0,color:#fff
    style E3 fill:#607d8b,color:#fff
```

---

## Estructura de Datos

### 1. Enum AuctionStatus

```mermaid
stateDiagram-v2
    [*] --> Active: createAuction()
    Active --> Completed: receipt()
    Completed --> Withdraw: auctionWithdraw()
    Withdraw --> [*]

    note right of Active
        Estado 0
        Subasta activa
        Se pueden hacer pujas
    end note

    note right of Completed
        Estado 1
        Ganador confirma entrega
        Creador puede cobrar
    end note

    note right of Withdraw
        Estado 2
        Fondos cobrados
        Estado final
    end note
```

**Explicación:**
- `Active (0)`: Subasta recién creada, aceptando pujas
- `Completed (1)`: Ganador confirmó recepción del producto
- `Withdraw (2)`: Creador cobró los fondos (estado final)

### 2. Struct Auction

```mermaid
classDiagram
    class Auction {
        +uint256 auctionId
        +address creator
        +string description
        +uint256 deadline
        +address highestBidder
        +uint256 highestBid
        +AuctionStatus status
    }

    class AuctionStatus {
        <<enumeration>>
        Active
        Completed
        Withdraw
    }

    Auction --> AuctionStatus

    note for Auction "Almacena información completa de cada subasta"
```

**Explicación:**
- `auctionId`: ID único e incremental (1, 2, 3...)
- `creator`: Dirección de la cartera que creó la subasta
- `description`: Descripción del producto subastado
- `deadline`: Timestamp de finalización
- `highestBidder`: Dirección de la cartera con la mejor puja
- `highestBid`: Cantidad de la puja más alta (en wei)
- `status`: Estado actual del ciclo de vida (Active/Completed/Withdraw)

### 3. Mappings Separados

```mermaid
graph LR
    subgraph "Mapping auctions"
        A1[ID: 1] --> D1[Auction 1<br/>Status: Active]
        A2[ID: 2] --> D2[Auction 2<br/>Status: Completed]
        A3[ID: 3] --> D3[Auction 3<br/>Status: Withdraw]
    end

    subgraph "Mapping bids"
        B1[ID: 1] --> U1A[User A: 0.5 BNB]
        B1 --> U1B[User B: 0.8 BNB]
        B1 --> U1C[User C: 1.2 BNB ✓]
        B2[ID: 2] --> U2A[User D: 0.3 BNB]
        B2 --> U2B[User E: 0.6 BNB ✓]
    end

    style A1 fill:#4caf50,color:#fff
    style A2 fill:#9c27b0,color:#fff
    style A3 fill:#607d8b,color:#fff
    style U1C fill:#ffc107,color:#000
    style U2B fill:#ffc107,color:#000
```

**¿Por qué mappings separados?**
- `auctions[auctionId]` = datos completos de la subasta
- `bids[auctionId][userAddress]` = cantidad pujada por usuario
  - Permite rastrear **todas** las pujas, no solo la ganadora
  - Necesario para sistema de reembolsos (`refund()`)

---

## Flujo de Funciones Principales

### Función 1: createAuction()

```mermaid
sequenceDiagram
    participant Usuario
    participant Contrato
    participant Storage
    participant Blockchain

    Usuario->>Contrato: createAuction("iPhone 15", 120)

    Contrato->>Contrato: Validar descripción no vacía
    Contrato->>Contrato: Validar timeToLive >= 1 min
    Contrato->>Contrato: Validar timeToLive <= 10080 min

    Contrato->>Storage: auctionCount++
    Note over Storage: auctionCount = 1

    Contrato->>Storage: Crear Auction struct
    Note over Storage: auctions[1].auctionId = 1<br/>auctions[1].creator = 0xABC...<br/>auctions[1].description = "iPhone 15"<br/>auctions[1].deadline = now + 120min<br/>auctions[1].highestBidder = 0x0<br/>auctions[1].highestBid = 0<br/>auctions[1].status = Active

    Contrato->>Blockchain: Emitir AuctionCreated(1, creator, "iPhone 15", deadline)

    Contrato-->>Usuario: Retornar auctionId = 1
```

**Código clave:**
```solidity
function createAuction(string memory _description, uint256 timeToLive)
    external returns(uint256)
{
    // 1. Checks
    uint256 ttl = timeToLive * 1 minutes;
    require(ttl >= MIN_TIMETOLIVE && ttl <= MAX_TIMETOLIVE,
            "El tiempo de subasta no es validado");
    require(bytes(_description).length > 0,
            "La descripcion no puede estar vacia");

    // 2. Effects
    ++auctionCount;

    auctions[auctionCount] = Auction(
        auctionCount,
        msg.sender,
        _description,
        block.timestamp + ttl,
        address(0),
        0,
        AuctionStatus.Active  // ← Estado inicial
    );

    // 3. Interactions
    emit AuctionCreated(auctionCount, msg.sender, _description,
                        block.timestamp + ttl);

    return auctionCount;
}
```

**Constantes de tiempo:**
- `MIN_TIMETOLIVE = 1 minute`
- `MAX_TIMETOLIVE = 10080 minutes` (1 semana)

---

### Función 2: bid() - Realizar Puja

```mermaid
sequenceDiagram
    participant Pujador
    participant Contrato
    participant Storage
    participant Blockchain

    Pujador->>Contrato: bid(1) {value: 1.5 BNB}

    Contrato->>Contrato: ✓ Subasta existe
    Contrato->>Contrato: ✓ Monto >= 0.01 BNB
    Contrato->>Contrato: ✓ Usuario no ha pujado antes
    Contrato->>Contrato: ✓ deadline no pasó
    Contrato->>Contrato: ✓ Monto > highestBid actual

    Contrato->>Storage: Actualizar highestBidder
    Contrato->>Storage: Actualizar highestBid = 1.5 BNB
    Contrato->>Storage: bids[1][pujador] = 1.5 BNB

    Contrato->>Blockchain: Fondos recibidos (1.5 BNB)
    Contrato->>Blockchain: Emitir Bid(1, pujador, 1.5 BNB, timestamp)

    Contrato-->>Pujador: ✅ Puja registrada
```

**Reglas importantes:**
- Puja mínima: `0.01 ether`
- Solo **una puja por usuario**
- Debe superar `highestBid` actual
- Solo antes de `deadline`

**Código clave:**
```solidity
function bid(uint256 _auctionId) external payable {
    Auction storage auction = auctions[_auctionId];

    // 1. Checks
    require(_auctionId > 0 && _auctionId <= auctionCount,
            "La subasta no existe.");
    require(msg.value >= MIN_BID,
            "La puja tiene que ser de al menos 0.01 ether.");
    require(bids[_auctionId][msg.sender] == 0,
            "No puedes volver a pujar.");
    require(block.timestamp < auction.deadline,
            "La subasta ya ha terminado.");
    require(msg.value > auction.highestBid,
            "La puja tiene que ser mayor que la puja actual.");

    // 2. Effects
    auction.highestBidder = msg.sender;
    auction.highestBid = msg.value;
    bids[_auctionId][msg.sender] = msg.value;

    // 3. Interactions
    emit Bid(_auctionId, msg.sender, msg.value, block.timestamp);
}
```

---

### Función 3: refund() - Reembolso de Perdedores

```mermaid
sequenceDiagram
    participant Perdedor
    participant Contrato
    participant Storage
    participant Blockchain

    Note over Perdedor: Pujó 0.5 BNB<br/>Pero perdió

    Perdedor->>Contrato: refund(1)

    Contrato->>Contrato: ✓ Subasta existe
    Contrato->>Contrato: ✓ Deadline pasó
    Contrato->>Contrato: ✓ No es el ganador
    Contrato->>Contrato: ✓ Tiene fondos en bids[1][perdedor]

    Contrato->>Storage: Obtener refundAmount = 0.5 BNB
    Contrato->>Blockchain: Transferir 0.5 BNB → Perdedor

    alt Transferencia exitosa
        Contrato->>Storage: bids[1][perdedor] = 0
        Contrato->>Blockchain: Emitir Refund(1, perdedor, 0.5 BNB)
        Contrato-->>Perdedor: ✅ Reembolso completado
    else Transferencia fallida
        Contrato-->>Perdedor: ❌ Error: La transferencia ha fallado
    end
```

**Reglas:**
- Solo **después** de `deadline`
- **No** puede ser el `highestBidder`
- Debe tener fondos en `bids[auctionId][usuario]`
- Solo un reembolso por usuario (se pone a 0)

**Código clave:**
```solidity
function refund(uint256 _auctionId) external returns(uint256) {
    Auction storage auction = auctions[_auctionId];

    require(_auctionId > 0 && _auctionId <= auctionCount,
            "La subasta no existe.");
    require(block.timestamp > auction.deadline,
            "La subasta no ha terminado.");
    require(auction.highestBidder != msg.sender,
            "No puedes retirar tu puja, has ganado la subasta");
    require(bids[_auctionId][msg.sender] > 0,
            "No has pujado en esta subasta.");

    uint256 refundAmount = bids[_auctionId][msg.sender];

    // Transferencia segura
    (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
    require(success, "La transferencia ha fallado");

    emit Refund(_auctionId, msg.sender, refundAmount);

    // Prevenir doble reembolso
    bids[_auctionId][msg.sender] = 0;

    return refundAmount;
}
```

---

### Función 4: receipt() - Confirmar Entrega

```mermaid
sequenceDiagram
    participant Ganador
    participant Contrato
    participant Storage
    participant Blockchain

    Note over Ganador: Ganó subasta<br/>Recibió producto

    Ganador->>Contrato: receipt(1)

    Contrato->>Contrato: ✓ Subasta existe
    Contrato->>Contrato: ✓ Deadline pasó
    Contrato->>Contrato: ✓ Status < Completed
    Contrato->>Contrato: ✓ msg.sender == highestBidder

    Contrato->>Storage: auctions[1].status = Completed
    Note over Storage: Active (0) → Completed (1)

    Contrato->>Blockchain: Emitir Receipt(1, ganador)

    Note over Contrato: Ahora el creador<br/>puede cobrar

    Contrato-->>Ganador: ✅ Entrega confirmada
```

**Propósito:**
- Ganador confirma que **recibió el producto**
- Desbloquea fondos para que creador pueda cobrar
- Cambia estado: `Active → Completed`

**Código clave:**
```solidity
function receipt(uint256 _auctionId) external {
    Auction storage auction = auctions[_auctionId];

    require(_auctionId > 0 && _auctionId <= auctionCount,
            "La subasta no existe.");
    require(block.timestamp > auction.deadline,
            "La subasta no ha terminado.");
    require(auction.status < AuctionStatus.Completed,
            "La entrega ya ha sido confirmada");
    require(auction.highestBidder == msg.sender,
            "Solo la puja ganadora puede confirmar la entrega del articulo");

    // Cambio de estado crítico
    auction.status = AuctionStatus.Completed;

    emit Receipt(_auctionId, msg.sender);
}
```

---

### Función 5: auctionWithdraw() - Cobro del Creador

```mermaid
sequenceDiagram
    participant Creador
    participant Contrato
    participant Storage
    participant Blockchain

    Note over Creador: Ganador confirmó<br/>entrega con receipt()

    Creador->>Contrato: auctionWithdraw(1)

    Contrato->>Contrato: ✓ Subasta existe
    Contrato->>Contrato: ✓ Deadline pasó
    Contrato->>Contrato: ✓ msg.sender == creator
    Contrato->>Contrato: ✓ Status != Withdraw
    Contrato->>Contrato: ✓ Status == Completed

    Contrato->>Storage: Obtener withdrawAmount = highestBid
    Contrato->>Blockchain: Transferir highestBid → Creador

    alt Transferencia exitosa
        Contrato->>Storage: auctions[1].status = Withdraw
        Note over Storage: Completed (1) → Withdraw (2)
        Contrato->>Blockchain: Emitir Withdraw(1, creador, amount)
        Contrato-->>Creador: ✅ Fondos cobrados
    else Transferencia fallida
        Contrato-->>Creador: ❌ Error: La transferencia ha fallado
    end
```

**Reglas estrictas:**
- Solo el **creator** puede cobrar
-  Status debe ser **Completed** (ganador confirmó entrega)
- Status **no** puede ser Withdraw (ya cobró)
- Solo después de `deadline`

**Código clave:**
```solidity
function auctionWithdraw(uint256 _auctionId) external returns (uint256) {
    Auction storage auction = auctions[_auctionId];

    require(_auctionId > 0 && _auctionId <= auctionCount,
            "La subasta no existe.");
    require(block.timestamp > auction.deadline,
            "La subasta no ha terminado.");
    require(auction.creator == msg.sender,
            "Solo el creador de la subasta puede cobrarla");
    // Separa la comprobación para tener dos mensajes de error independientes
    require(auction.status != AuctionStatus.Withdraw,
            "Ya se cobro la subasta.");
    require(auction.status == AuctionStatus.Completed,
            "El comprador no ha confirmado la entrega del articulo");

    uint256 withdrawAmount = auction.highestBid;
    require(withdrawAmount > 0, "No hay fondos para retirar.");

    // Transferencia segura
    (bool success, ) = payable(msg.sender).call{value: withdrawAmount}("");
    require(success, "La transferencia ha fallado");

    emit Withdraw(_auctionId, msg.sender, withdrawAmount);

    // Estado final
    auction.status = AuctionStatus.Withdraw;

    return withdrawAmount;
}
```

---

## Ciclo de Vida Completo de una Subasta

```mermaid
graph TD
    A[Inicio] --> B[createAuction]
    B --> C{Status: Active}

    C --> D[Usuarios hacen bid]
    D --> D

    C --> E{Deadline pasó?}
    E -->|No| D
    E -->|Sí| F{Hay ganador?}

    F -->|No| Z[Subasta sin pujas]
    F -->|Sí| G[Perdedores: refund]

    G --> H[Ganador: receipt]
    H --> I{Status: Completed}

    I --> J[Creador: auctionWithdraw]
    J --> K{Status: Withdraw}

    K --> L[Fin - Fondos transferidos]

    style C fill:#00bcd4,color:#fff
    style I fill:#9c27b0,color:#fff
    style K fill:#607d8b,color:#fff
    style B fill:#4caf50,color:#fff
    style L fill:#f44336,color:#fff
```

---

## Flujo de Fondos

```mermaid
graph LR
    subgraph "Durante Pujas"
        U1[Usuario A<br/>Puja: 0.5 BNB] -->|transferencia| C1[Contrato]
        U2[Usuario B<br/>Puja: 0.8 BNB] -->|transferencia| C1
        U3[Usuario C<br/>Puja: 1.2 BNB ✓] -->|transferencia| C1
    end

    subgraph "Después de Deadline"
        C1 -->|refund| R1[Usuario A recibe 0.5]
        C1 -->|refund| R2[Usuario B recibe 0.8]
    end

    subgraph "Proceso de Cobro"
        C1 -->|ganador confirma receipt| C2[Status: Completed]
        C2 -->|auctionWithdraw| CR[Creador recibe 1.2 BNB]
    end

    style C1 fill:#ff9800,color:#fff
    style U3 fill:#4caf50,color:#fff
    style CR fill:#4caf50,color:#fff
```

**Resumen:**
1. **Durante subasta**: Fondos quedan en el contrato
2. **Después deadline**: Perdedores pueden recuperar con `refund()`
3. **Ganador confirma**: Llama `receipt()` → Estado `Completed`
4. **Creador cobra**: Llama `auctionWithdraw()` → Recibe `highestBid`

---

## Medidas de Seguridad

### 1. Validación de Existencia
```solidity
require(_auctionId > 0 && _auctionId <= auctionCount,
        "La subasta no existe.");
```

### 2. Control de Tiempo
```solidity
require(block.timestamp < auction.deadline,  // Para pujar
        "La subasta ya ha terminado.");

require(block.timestamp > auction.deadline,  // Para refund/receipt
        "La subasta no ha terminado.");
```

### 3. Una Puja por Usuario
```solidity
require(bids[_auctionId][msg.sender] == 0,
        "No puedes volver a pujar.");
```

### 4. Transferencias Seguras
```solidity
(bool success, ) = payable(msg.sender).call{value: amount}("");
require(success, "La transferencia ha fallado");
```

### 5. Prevención de Doble Cobro
```solidity
// En refund()
bids[_auctionId][msg.sender] = 0;

// En auctionWithdraw()
require(auction.status != AuctionStatus.Withdraw,
        "Ya se cobro la subasta.");
auction.status = AuctionStatus.Withdraw;
```

### 6. Control de Roles
```solidity
// Solo ganador puede confirmar entrega
require(auction.highestBidder == msg.sender,
        "Solo la puja ganadora puede confirmar...");

// Solo creador puede cobrar
require(auction.creator == msg.sender,
        "Solo el creador de la subasta puede cobrarla");
```

---

## Ejemplo Completo: Subasta de iPhone

```mermaid
sequenceDiagram
    autonumber
    participant Alex (Creador)
    participant Chema
    participant Sara
    participant Xabier
    participant Contrato

    Alex (Creador)->>Contrato: createAuction("iPhone 15", 60)
    Note over Contrato: Subasta ID: 1<br/>Status: Active<br/>Deadline: now + 60min

    Chema->>Contrato: bid(1) {0.5 BNB}
    Note over Contrato: highestBid: 0.5 BNB<br/>highestBidder: Chema

    Sara->>Contrato: bid(1) {0.8 BNB}
    Note over Contrato: highestBid: 0.8 BNB<br/>highestBidder: Sara

    Xabier->>Contrato: bid(1) {1.2 BNB}
    Note over Contrato: highestBid: 1.2 BNB<br/>highestBidder: Xabier ✓

    Note over Contrato: 60 minutos pasan

    Chema->>Contrato: refund(1)
    Contrato-->>Chema: 0.5 BNB devueltos

    Sara->>Contrato: refund(1)
    Contrato-->>Sara: 0.8 BNB devueltos

    Xabier->>Contrato: receipt(1)
    Note over Contrato: Status: Completed<br/>Xabier confirmó entrega

    Alex (Creador)->>Contrato: auctionWithdraw(1)
    Contrato-->>Alex (Creador): 1.2 BNB transferidos
    Note over Contrato: Status: Withdraw<br/>¡COMPLETADO!
```

**Timeline:**
1. Alex crea subasta
2. Chema puja 0.5 BNB
3. Sara supera con 0.8 BNB
4. Xabier gana con 1.2 BNB
5. Deadline pasa
6. Chema y Sara recuperan fondos
7. Xabier confirma que recibió el iPhone
8. Alex cobra los 1.2 BNB

---

## Eventos Emitidos

| Evento | Parámetros | Cuándo se emite |
|--------|-----------|-----------------|
| `AuctionCreated` | auctionId, creator, description, deadline | Al crear subasta |
| `Bid` | auctionId, bidder, amount, timestamp | Al hacer puja |
| `Refund` | auctionId, bidder, refundAmount | Al devolver fondos a perdedor |
| `Receipt` | auctionId, winner | Al confirmar entrega |
| `Withdraw` | auctionId, creator, withdrawAmount | Al cobrar fondos |

---

## Resumen de Constantes

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `MAX_TIMETOLIVE` | 10080 minutes | 1 semana máxima |
| `MIN_TIMETOLIVE` | 1 minute | 1 minuto mínimo |
| `MIN_BID` | 0.01 ether | Puja mínima |

---

**Autor:** Alejandro de Cora
**Versión:** Solidity ^0.8.10
**Licencia:** MIT

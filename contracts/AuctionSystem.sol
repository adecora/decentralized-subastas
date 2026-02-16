// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;


contract AuctionSystem {

    enum AuctionStatus {
      Active,    // 0 - Subasta activa
      Completed, // 1 - Entrega confirmada por el ganador
      Withdraw   // 2 - Cobrada por el creador
    }

    struct Auction {
        uint256 auctionId;
        address creator;
        string description;
        uint256 deadline;
        address highestBidder;
        uint256 highestBid;
        AuctionStatus status;
    }

    uint256 public auctionCount;

    // Mapping del id de la subasta a los datos de la subasta
    mapping(uint256 => Auction) public auctions;
    // Mapping con las pujas de los usuarios para cada subasta
    mapping(uint256 => mapping(address => uint256)) public bids;

    uint256 private constant MAX_TIMETOLIVE = 10080 minutes; // 1 semana = 60*24*7
    uint256 private constant MIN_TIMETOLIVE = 1 minutes;
    uint256 private constant MIN_BID = 0.01 ether;

    event AuctionCreated(uint256 auctionId, address creator, string description, uint256 deadline);
    event Bid(uint256 auctionId, address bidder, uint256 amount, uint256 timestamp);
    event Refund(uint256 auctionId, address bidder, uint256 refundAmount);
    event Receipt(uint256 auctionId, address winner);
    event Withdraw(uint256 auctionId, address creator,uint256 withdrawAmount);

    constructor() {}

    function createAuction(string memory _description, uint256 timeToLive) external returns(uint256) {
        // El tiempo recibido llega en minutos
        uint256 ttl = timeToLive * 1 minutes;

        require(ttl >= MIN_TIMETOLIVE && ttl <= MAX_TIMETOLIVE, "El tiempo de subasta no es validado");
        require(bytes(_description).length > 0, "La descripcion no puede estar vacia");

        ++auctionCount;
        auctions[auctionCount] = Auction(auctionCount, msg.sender, _description, block.timestamp + ttl, address(0), 0, AuctionStatus.Active);

        Auction storage auction = auctions[auctionCount];

        emit AuctionCreated(
            auction.auctionId,
            auction.creator,
            auction.description,
            auction.deadline
        );

        return auctionCount;
    }

    function getAuctions() external view returns(Auction[] memory) {
        // TODO: paginación
        Auction[] memory result = new Auction[](auctionCount);
        for (uint256 i = 0; i < auctionCount; i++) {
            result[i] = auctions[i + 1];
        }

        return result;
    }

    function bid(uint256 _auctionId) external payable {
        Auction storage auction = auctions[_auctionId];

        require(_auctionId > 0 && _auctionId <= auctionCount, "La subasta no existe.");
        require(msg.value >= MIN_BID, "La puja tiene que ser de al menos 0.01 ether.");
        require(bids[_auctionId][msg.sender] == 0, "No puedes volver a pujar.");
        require(block.timestamp < auction.deadline, "La subasta ya ha terminado.");
        require(msg.value > auction.highestBid, "La puja tiene que ser mayor que la puja actual.");

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        bids[_auctionId][msg.sender] = msg.value;

        emit Bid(_auctionId, msg.sender, msg.value, block.timestamp);
    }

    function getWinner(uint256 _auctionId) public view returns (address) {
        Auction storage auction = auctions[_auctionId];

        require(_auctionId > 0 && _auctionId <= auctionCount, "La subasta no existe.");
        require(block.timestamp > auction.deadline, "La subasta no ha terminado.");

        return auction.highestBidder;
    }

    function refund(uint256 _auctionId) external returns(uint256) {
        Auction storage auction = auctions[_auctionId];

        require(_auctionId > 0 && _auctionId <= auctionCount, "La subasta no existe.");
        require(block.timestamp > auction.deadline, "La subasta no ha terminado.");
        require(auction.highestBidder != msg.sender, "No puedes retirar tu puja, has ganado la subasta");
        require(bids[_auctionId][msg.sender] > 0, "No has pujado en esta subasta.");

        uint256 refundAmount = bids[_auctionId][msg.sender];
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "La transferencia ha fallado");

        emit Refund(_auctionId, msg.sender, refundAmount);
        // No pueda volver a solicitar la devolución de la puja
        bids[_auctionId][msg.sender] = 0;
        return refundAmount;
    }

    function receipt(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId];

        require(_auctionId > 0 && _auctionId <= auctionCount, "La subasta no existe.");
        require(block.timestamp > auction.deadline, "La subasta no ha terminado.");
        require(auction.status < AuctionStatus.Completed, "La entrega ya ha sido confirmada");
        require(auction.highestBidder == msg.sender, "Solo la puja ganadora puede confirmar la entrega del articulo");

        auction.status = AuctionStatus.Completed;
        emit Receipt(_auctionId, msg.sender);
    }

    function auctionWithdraw(uint256 _auctionId) external returns (uint256) {
        Auction storage auction = auctions[_auctionId];

        require(_auctionId > 0 && _auctionId <= auctionCount, "La subasta no existe.");
        require(block.timestamp > auction.deadline, "La subasta no ha terminado.");
        require(auction.creator == msg.sender, "Solo el creador de la subasta puede cobrarla");
        require(auction.status != AuctionStatus.Withdraw, "Ya se cobro la subasta.");
        require(auction.status == AuctionStatus.Completed, "El comprador no ha confirmado la entrega del articulo");

        uint256 withdrawAmount = auction.highestBid;
        require(withdrawAmount > 0, "No hay fondos para retirar.");

        (bool success, ) = payable(msg.sender).call{value: withdrawAmount}("");
        require(success, "La transferencia ha fallado");

        emit Withdraw(_auctionId, msg.sender, withdrawAmount);

        // Ya's cobrao
        auction.status = AuctionStatus.Withdraw;
        return withdrawAmount;
    }

}

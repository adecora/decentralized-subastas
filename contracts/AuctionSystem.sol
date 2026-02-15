// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;


contract AuctionSystem {

    struct Auction {
        uint256 auctionId;
        address creator;
        string description;
        uint256 deadline;
        address highestBidder;
        uint256 highestBid;
    }

    uint256 public auctionCount;

    // Mapping del id de la subasta a los datos de la subasta
    mapping(uint256 => Auction) public auctions;
    // Mapping con las pujas de los usuarios para cada subasta
    mapping(uint256 => mapping(address => uint256)) public bids;


    uint256 private constant maxTimeToLive = 10080 minutes; // 1 semana = 60*24*7
    uint256 private constant minTimeToLive = 1 minutes;
    uint256 private constant minBid = 0.01 ether;

    event AuctionCreated(uint256 auctionId, address creator, string description, uint256 deadline);
    event Bid(uint256 auctionId, address bidder, uint256 amount, uint256 timestamp);

    constructor() {

    }

    function createAuction(string memory _description, uint256 timeToLive) external returns(uint256) {
        // El tiempo recibido llega en minutos
        uint256 ttl = timeToLive * 1 minutes;

        require(ttl >= minTimeToLive && ttl <= maxTimeToLive, "El tiempo de subasta no es validado");
        require(bytes(_description).length > 0, "La descripcion no puede estar vacia");

        ++auctionCount;
        auctions[auctionCount] = Auction(auctionCount, msg.sender, _description, block.timestamp + ttl, address(0), 0);

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
        require(msg.value >= minBid, "La puja tiene que ser de al menos 0.01 ether.");
        require(bids[_auctionId][msg.sender] == 0, "No puedes volver a pujar.");
        require(block.timestamp < auction.deadline, "La subasta ya ha terminado.");
        require(msg.value > auction.highestBid, "La puja tiene que ser mayor que la puja actual.");

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        bids[_auctionId][msg.sender] = msg.value;

        (bool success, ) =  payable(auction.highestBidder).call{value: auction.highestBid}("");
        require(success, "Transfer failed");

        emit Bid(_auctionId, msg.sender, msg.value, block.timestamp);
    }

    function getWinner(uint256 _auctionId) public view returns (address) {
        Auction storage auction = auctions[_auctionId];

        require(_auctionId > 0 && _auctionId <= auctionCount, "La subasta no existe.");
        require(block.timestamp > auction.deadline, "La subasta no ha terminado.");
        require(auction.highestBidder != address(0), "Nadie ha pujado en esta subasta.");

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

        // No pueda volver a solicitar la devolución de la puja
        bids[_auctionId][msg.sender] = 0;
        return refundAmount;
    }
}

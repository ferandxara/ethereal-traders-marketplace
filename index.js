
require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const http = require('http');
const socketIo = require('socket.io');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const marketplaceContract = new ethers.Contract(process.env.MARKETPLACE_CONTRACT_ADDRESS, MarketplaceContractABI, provider);

const dbClient = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

io.on('connection', (socket) => {
  socket.on('list-item', async (data) => {
    // List an in-game item on the marketplace
    const { item, playerAddress } = data;
    const tx = await marketplaceContract.connect(playerAddress).listItem(item.id, ethers.utils.parseEther(item.price));
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log(`Item listed: ${item.name} by player: ${playerAddress}`);
      socket.emit('listing-status', { success: true, message: "Item listed successfully." });
    } else {
      socket.emit('listing-status', { success: false, message: "Failed to list item." });
    }
  });
});

server.listen(3002, () => {
  console.log('Ethereal Traders Marketplace running on http://localhost:3002');
});

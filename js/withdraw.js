const express = require('express');

const router = express.Router();

// Mock user wallet balance
let userWalletBalance = 1000; // Example: User has 1000 USDT

router.post('/withdraw', (req, res) => {
  const { amount } = req.body;
  const value = Number(amount);

  // Validate the amount
  if (!value || isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  // Check if the user has sufficient balance
  if (value > userWalletBalance) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  // Deduct the amount from the user's wallet
  userWalletBalance -= value;

  res.json({
    message: `Withdrawal of ${value} USDT successful. Remaining balance: ${userWalletBalance} USDT`,
    balance: userWalletBalance,
  });
});

router.get('/withdraw/balance', (req, res) => {
  res.json({ balance: userWalletBalance });
});

module.exports = router;

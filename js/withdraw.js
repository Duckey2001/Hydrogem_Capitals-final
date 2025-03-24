const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Mock user wallet balance
let userWalletBalance = 1000; // Example: User has 1000 USDT

app.post('/api/withdraw', (req, res) => {
    const { amount } = req.body;

    // Validate the amount
    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    // Check if the user has sufficient balance
    if (amount > userWalletBalance) {
        return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct the amount from the user's wallet and add it to the main wallet
    userWalletBalance -= amount;

    // Simulate a successful withdrawal
    res.json({ message: `Withdrawal of ${amount} USDT successful. Remaining balance: ${userWalletBalance} USDT` });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
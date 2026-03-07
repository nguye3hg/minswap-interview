# Sui Wallet Portfolio Viewer

## Overview
This project is a simple full-stack application that retrieves and displays the token portfolio of a **Sui wallet address**.

The backend fetches coin balances from the Sui blockchain via RPC, calculates their USD values, and exposes an API.  
The frontend provides a small dashboard to view the portfolio.

---

## Tech Stack

**Backend**
- Node.js
- Express
- TypeScript
- PostgreSQL (Docker)
- Sui RPC

**Frontend**
- Next.js
- React
- TailwindCSS

---

## Architecture

Frontend (Next.js)  
↓  
Backend API (Express)  
↓  
Sui RPC(calling Sui API)+ PostgreSQL  

Flow:
1. User enters a wallet address
2. Frontend calls backend API
3. Backend fetches wallet coins from Sui
4. Backend calculates USD values
5. Frontend displays the portfolio

---

## API

### Get Wallet Portfolio
GET /api/v1/portfolio/coins?address=<wallet_address>
Example:
http://localhost:3000/api/v1/portfolio/coins?address=0x200e6f6dd7e974904cab77e52761f8f0e4e27aabe29f44c7b0e272e8e5ecf543


## Running the Project

### Start Backend


cd backend
npm install
npm run dev


Backend runs at:


http://localhost:3000


---

### Start Frontend


cd frontend
npm install
npm run dev


Frontend runs at:


http://localhost:3001


---

## Test Address


0x200e6f6dd7e974904cab77e52761f8f0e4e27aabe29f44c7b0e272e8e5ecf543
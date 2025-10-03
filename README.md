# Money Pot

A provably fair, skill-based gaming dApp on Aptos where users create and solve USDC-funded treasure hunts using a unique authentication challenge.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/laciferin2024/generated-app-20251003-173130)

## About The Project

Money Pot is a visually stunning, provably fair gaming dApp on the Aptos blockchain. It enables 'Pot Creators' to deposit USDC into smart contracts, creating 'treasure hunts' secured by a unique, brain-based authentication challenge. 'Treasure Hunters' pay a small entry fee to attempt to solve the challenge. A successful hunt wins 40% of the pot. The game theory design ensures fairness: creators earn a 50% share of entry fees from successful hunts, incentivizing them to create legitimate, solvable challenges. The frontend provides an immersive, illustrative experience for creating, browsing, and attempting these challenges, complete with seamless Aptos wallet integration.

### Key Features

*   **Pot Creation:** Users can create new treasure hunt pots with USDC deposits, setting a one-letter password and custom challenge configurations.
*   **Treasure Hunting:** Browse active pots, pay an entry fee, and attempt to solve the authentication challenge to win a share of the pot.
*   **Provably Fair:** Game theory mechanics prevent creator cheating. Honest creators earn from entry fees, while cheaters lose attraction and potential earnings.
*   **USDC Economy:** Real-money gaming with stablecoin settlements on the Aptos blockchain.
*   **Seamless Wallet Integration:** Connects with popular Aptos wallets for smooth on-chain transactions.
*   **Visually Stunning UI:** A beautiful, modern interface built with obsessive attention to visual excellence and interactive polish.

## Built With

This project is built with a modern, high-performance tech stack:

*   **Frontend:**
    *   [React](https://reactjs.org/)
    *   [Vite](https://vitejs.dev/)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [Tailwind CSS](https://tailwindcss.com/)
    *   [shadcn/ui](https://ui.shadcn.com/)
    *   [Framer Motion](https://www.framer.com/motion/) for animations
*   **Blockchain Integration:**
    *   [Aptos TS SDK](https://aptos.dev/sdks/ts-sdk/v2)
    *   [@aptos-labs/wallet-adapter-react](https://github.com/aptos-labs/aptos-wallet-adapter)
*   **State Management:**
    *   [Zustand](https://github.com/pmndrs/zustand)
*   **Deployment:**
    *   [Cloudflare Pages](https://pages.cloudflare.com/)
    *   [Cloudflare Workers](https://workers.cloudflare.com/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed on your machine.

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/money-pot-aptos.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd money-pot-aptos
    ```
3.  Install dependencies:
    ```sh
    bun install
    ```

## Usage

To start the development server, run the following command. This will launch the application on `http://localhost:3000`.

```sh
bun dev
```

The application will automatically reload as you make changes to the source files.

## Deployment

This project is configured for seamless deployment to Cloudflare Pages.

1.  **Build the project:**
    ```sh
    bun run build
    ```
2.  **Deploy to Cloudflare:**
    Run the deploy script, which will build the application and deploy it using Wrangler.
    ```sh
    bun run deploy
    ```

Alternatively, you can connect your GitHub repository to Cloudflare Pages for automatic deployments on every push to your main branch.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/laciferin2024/generated-app-20251003-173130)

## Project Structure

*   `src/`: Contains all the frontend source code, including pages, components, hooks, and styles.
*   `src/pages/`: Main application views/routes.
*   `src/components/`: Reusable React components, including shadcn/ui components.
*   `src/store/`: Zustand stores for global state management.
*   `worker/`: Source code for the Cloudflare Worker backend, handling API requests.
*   `public/`: Static assets that are served directly.
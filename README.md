# Zoom
A full stack video conferencing web application.

## Run locally

The app needs MongoDB, the backend API, and the frontend running.

1. Start MongoDB on `127.0.0.1:27017`.
2. Install the backend and frontend dependencies:

   ```powershell
   cd backend
   npm install
   cd ..\frontend
   npm install
   ```

3. From the project root, start the backend and frontend in separate terminals:

   ```powershell
   npm run dev:backend
   ```

   ```powershell
   npm start
   ```

The frontend sends authentication requests to `http://localhost:8000` by default.
If the login or registration form reports that it cannot reach the authentication
server, make sure the backend is running and connected to MongoDB.

Screen sharing is available in browsers that support `getDisplayMedia`; use
`localhost` or HTTPS and select a screen, window, or tab in the browser prompt.

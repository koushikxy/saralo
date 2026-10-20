<p align="center">
  <img src="assets/icon.png" width="96" alt="Saralo icon">
</p>

<h1 align="center">Saralo</h1>

A simple everyday app for people of all ages. Plan your day, track money, remember medicines and keep important documents safe, all in one place.

Everything stays on your phone. No account, no ads, no tracking.

<p align="center">
  <img src="docs/screenshots/today-light.png" width="200" alt="Today">
  <img src="docs/screenshots/planner-light.png" width="200" alt="Planner">
  <img src="docs/screenshots/money-light.png" width="200" alt="Money">
  <img src="docs/screenshots/health-light.png" width="200" alt="Health">
</p>

<p align="center">
  <img src="docs/screenshots/today-dark.png" width="200" alt="Today in dark mode">
  <img src="docs/screenshots/money-dark.png" width="200" alt="Money in dark mode">
</p>

## What it does

- **Today**: what's next today, bills and birthdays this week, spending, steps, water and weather at a glance
- **Planner**: to-dos, reminders, a calendar, a shopping list and special days
- **Money**: what you spend and get, monthly budget, bills with due-date reminders, UPI QR
- **Health**: medicine reminders, water, steps, sleep, meals and activity
- **Vault**: documents, passwords, notes and addresses behind a PIN or fingerprint
- **Outfits**: ideas for what to wear based on the weather and your clothes
- Light and dark mode, and a larger text option
- Encrypted backup and restore

## Run it

You need Node.js 20 or newer.

```
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone.

Some things, like reminders on Android, only work in a real build:

```
npx eas-cli build -p android --profile preview
```

## Built with

Expo, React Native, TypeScript, React Navigation and zustand. Data is saved with expo-sqlite and encrypted with AES-GCM using a key kept in the device's secure store.

## Privacy

See [PRIVACY.md](PRIVACY.md).

## License

[MIT](LICENSE)

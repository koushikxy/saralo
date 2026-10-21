export const POLICY_UPDATED = '21 October 2026';

export const POLICY: { title: string; lines: string[] }[] = [
  {
    title: 'The short version',
    lines: [
      'Saralo has no account, no sign-up and no server of its own. Everything you add is saved only on your phone, encrypted. The developer cannot see, open or recover any of it.',
      'Saralo has no ads, no analytics, no tracking and no crash reporting. Nothing about you is sold, rented or shared with anyone.',
      'A few features ask outside services for public information (weather, PIN code details). What is sent to each one is listed below.',
    ],
  },
  {
    title: 'Who makes Saralo',
    lines: ['Saralo is made by Koushik Maity, an individual developer in India. In this policy "we" means the developer and "you" means the person using the app.'],
  },
  {
    title: 'What you can save in Saralo',
    lines: [
      '• Profile: name, phone, email, date of birth, profile photo and passport size photo.',
      '• Medical ID: blood group, allergies and an emergency contact. All optional.',
      '• Planner: to-dos, reminders, events, birthdays, anniversaries and a shopping list.',
      '• Money: spending and income you type in, budgets, monthly bills, your UPI ID, bank account numbers with IFSC, and card numbers with expiry.',
      '• Health: medicines and their times, water, steps, meals, activities and gym workouts.',
      '• Closet: photos and details of your clothes.',
      '• Private vault: ID document numbers and photos, passwords, private notes and photos, addresses, and photos of bills and receipts.',
      'You choose what to type in. Every field is optional except where the app needs it to work, such as a name for a to-do.',
      'Saralo never asks for card CVV, card PIN, UPI PIN, net banking OTPs or your phone lock PIN. Please never save them in notes either.',
    ],
  },
  {
    title: 'Where it is stored and how it is protected',
    lines: [
      '• All your entries are saved inside Saralo\'s private storage on your phone, encrypted with AES-256. The key is kept in the Android Keystore or the iOS Keychain and never leaves the phone.',
      '• Vault photos (documents, notes, bills) are encrypted the same way.',
      '• Profile, passport and closet photos are kept in Saralo\'s private app storage, which other apps cannot read, but they are not encrypted.',
      '• Your Saralo PIN is never stored. Only a salted SHA-256 fingerprint of it is kept, and wrong tries make you wait longer each time.',
      '• Saralo locks if you leave it for more than 15 seconds. The private vault locks as soon as you leave it, or after one minute without use.',
      '• Screenshots and screen recording are blocked inside the vault.',
      '• Anything you copy from the vault is cleared from the clipboard after 30 seconds if it is still there.',
      '• Saralo is excluded from Android\'s automatic cloud backup, so your data is not copied to Google Drive without you knowing.',
    ],
  },
  {
    title: 'Internet services the app uses',
    lines: [
      'Saralo works without internet. These services are used only for the features named, and only send what is listed:',
      '• Open-Meteo (open-meteo.com) for the weather on the Today screen and outfit ideas. It receives your approximate location, or the city name you type.',
      '• ipapi.co, only if you do not allow location. It guesses your city from your internet (IP) address.',
      '• India Post PIN code service (api.postalpincode.in), when you type a 6-digit PIN code in an address. It receives only that PIN code and returns the city and state.',
      'Like any website, these services can see your phone\'s IP address when Saralo contacts them. They have their own privacy policies, and we do not control them. None of your names, numbers, money, health or vault data is ever sent to them.',
      'When you tap "Open" on a saved password, or a link, your phone opens that app or website. What happens there is covered by that app\'s or website\'s own policy.',
    ],
  },
  {
    title: 'Autofill for passwords (Android, optional)',
    lines: [
      'Saralo can work as your phone\'s autofill service, but only if you turn it on yourself in phone settings. It is off until you do.',
      '• When it is on, Android shows Saralo the login screens of other apps and websites so it can find the username and password boxes. Saralo looks only for those boxes and does not read or keep anything else on the screen.',
      '• A login is saved only when you tap Save in the pop-up Android shows after you log in or sign up.',
      '• To fill a saved password, you must unlock with your phone lock first.',
      '• For this, a copy of your saved logins is kept in Saralo\'s private storage, encrypted with a key in the Android Keystore. It never leaves your phone.',
      'You can turn it off any time in phone settings, under Passwords and autofill.',
    ],
  },
  {
    title: 'Permissions and why',
    lines: [
      '• Camera and photos: to add photos of bills, documents, clothes and your profile. Asked only when you tap a photo button.',
      '• Approximate location, only while the app is open: for the local weather. Saralo never asks for precise or background location.',
      '• Physical activity (motion): to read the phone\'s own step counter, so your steps are counted all day even when Saralo is closed.',
      '• Notifications: for reminders about to-dos, events, medicines, bills and birthdays.',
      '• Fingerprint or Face ID: to unlock Saralo. Your phone checks your fingerprint or face; Saralo only gets a yes or no and never sees the fingerprint or face data.',
      'Saralo does not ask for your contacts, SMS, call logs, microphone, files outside what you pick, or accounts on your phone. You can say no to any permission, or turn it off later in phone settings. Only the feature that needs it will stop working.',
    ],
  },
  {
    title: 'Sharing',
    lines: [
      'Saralo shares something only when you tap a share or copy button, such as your UPI QR, a passport photo, an address or a backup file. It goes to the app or person you choose, and from then on their policies apply.',
    ],
  },
  {
    title: 'Backups',
    lines: [
      'A backup is a file you create yourself, locked with a password you choose. You decide where to keep it, for example Google Drive or email. Without the password nobody can open it, including us. If you forget the password, the backup cannot be recovered.',
      'Photos are not included in backups. Keep important photos in your gallery too.',
    ],
  },
  {
    title: 'Things you are responsible for',
    lines: [
      '• Keep your Saralo PIN, your phone lock and your backup password to yourself. Anyone who knows them, or whose fingerprint or face is added to your phone, can open Saralo.',
      '• Saralo has no PIN reset. If you forget your PIN you may have to delete Saralo\'s data and start again, so keep a backup.',
      '• If your phone is lost, stolen, rooted or infected with harmful apps, data on it may be at risk. We cannot protect data on a phone that is not under your control.',
      '• Since everything lives only on your phone, uninstalling the app, clearing its data or losing the phone deletes it. Make backups.',
      '• Saving ID numbers, card numbers and passwords is your choice. Saralo keeps them encrypted, but no app can promise to be 100% safe.',
    ],
  },
  {
    title: 'Health, money and weather information',
    lines: [
      'Saralo is a personal organiser, not a medical, financial or legal service. Nothing in it is medical or financial advice.',
      'Reminders can be delayed or missed if notifications are off, battery saver stops the app, the phone is off or the time is changed. Do not rely only on Saralo for important medicines, bills or deadlines.',
      'Balances, budgets and totals are worked out only from what you type in, and may not match your bank. Weather is a forecast from Open-Meteo and can be wrong. Guessed details, such as a state from a PIN code or a bank from an IFSC, can be wrong; please check them.',
    ],
  },
  {
    title: 'Keeping and deleting your data',
    lines: [
      'Your data stays on your phone until you delete it. You can edit or delete any item at any time.',
      'More → Delete all my data removes everything Saralo saved on the phone. Uninstalling the app does the same. Backup files you made stay wherever you saved them until you delete them.',
      'Because we hold no data about you on any server, there is nothing for us to send, correct or delete on request. Your rights under India\'s Digital Personal Data Protection Act, 2023 can be used directly in the app.',
    ],
  },
  {
    title: 'Children',
    lines: ['Saralo is not made for children under 13. A child aged 13 to 17 should use it with a parent\'s permission.'],
  },
  {
    title: 'Limits',
    lines: ['Saralo is provided as it is, without guarantees. To the extent the law allows, the developer is not responsible for loss of data, missed reminders, wrong guesses or calculations, or any loss that comes from using the app or from outside services it talks to.'],
  },
  {
    title: 'Changes to this policy',
    lines: ['If this policy changes, the new version will be in the app and on the Saralo page, with a new date at the top. If a change means more data leaves your phone, the app will tell you before it happens.'],
  },
];

# 📲 OnlyStudents — Native Android Status Bar Push Notifications Guide (v1.1 Roadmap)

This guide documents the complete step-by-step roadmap for enabling native Android status bar push notifications (with sound & banner badges like Myntra, Ajio, and Flipkart) when the app is closed or running in the background.

---

## 📌 How It Works

1. **Client App (`OnlyStudents`)**: Generates a unique **Push Token** per device via `expo-notifications` and sends it to the backend server upon login.
2. **Backend (`Render Node.js API`)**: Listens for triggers (new order, chat message, gig update) and calls **Firebase Cloud Messaging (FCM)**.
3. **Android Device**: Displays a high-importance status bar notification with sound, vibration, and banner even when the app is completely closed.

---

## 🚀 Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a free project named **OnlyStudents-App**.
3. Add an **Android App** to your Firebase project:
   - **Android Package Name**: `com.onlystudents.app`
4. Download the generated `google-services.json` file.
5. Place `google-services.json` inside the root `CampusHive/` folder.

---

## ⚙️ Step 2: Configure `app.json`

Add the `googleServicesFile` key under `"android"` in `CampusHive/app.json`:

```json
{
  "expo": {
    "name": "OnlyStudents",
    "slug": "onlystudent",
    "version": "1.0.0",
    "android": {
      "package": "com.onlystudents.app",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-splash-screen",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#4F46E5"
        }
      ]
    ]
  }
}
```

---

## 💻 Step 3: Install & Register Devices

Run the package installation inside `CampusHive/`:

```bash
npx expo install expo-notifications expo-device
```

### Add Push Token Helper (`constants/notifications.ts`):

```ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiFetch } from './api';

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return;
  }

  const pushTokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '90d5ea49-08d7-46fa-87ee-f5700d8842e9',
  });

  const token = pushTokenData.data;

  // Save token to backend for logged-in user
  await apiFetch('/auth/push-token', {
    method: 'POST',
    body: JSON.stringify({ pushToken: token }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });
  }

  return token;
}
```

---

## ⚡ Step 4: Backend Integration (Node.js / Render)

Install `expo-server-sdk` on the backend:

```bash
npm install expo-server-sdk
```

Send push notifications on new message or order event:

```js
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPushNotification(targetPushToken, title, body, data = {}) {
  if (!Expo.isExpoPushToken(targetPushToken)) {
    console.error(`Push token ${targetPushToken} is not valid`);
    return;
  }

  const messages = [{
    to: targetPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    priority: 'high',
    channelId: 'default',
  }];

  const chunks = expo.chunkPushNotifications(messages);
  for (let chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error(error);
    }
  }
}
```

---

## 🛠️ Step 5: Build Update

Once `google-services.json` is placed, generate the updated standalone APK:

```bash
cd CampusHive
npx eas build -p android --profile preview
```

# 💰 CashTrack - Ứng dụng Quản Lý Chi Tiêu Thông Minh

<p align="center">
  <img src="./assets/icon.png" alt="CashTrack Logo" width="120">
</p>

<p align="center">
  <a href="./CHANGELOG.md">📋 Changelog</a> •
  <a href="#-tính-năng-chính">Tính năng</a> •
  <a href="#-quick-start">Cài đặt</a> •
  <a href="#-đóng-góp">Đóng góp</a>
</p>

CashTrack là ứng dụng React Native (Expo) giúp bạn tự động theo dõi chi tiêu thông qua việc đọc thông báo từ các ứng dụng ngân hàng Việt Nam, tích hợp **AI phân loại thông minh** và **báo cáo tài chính tự động**.

## ✨ Tính năng chính

### 📱 Core Features
- 🔔 **Tự động đọc thông báo ngân hàng** - Hỗ trợ VCB, MB, TCB, ACB, BIDV, MoMo...
- 📊 **Dashboard thông minh** - Biểu đồ chi tiêu, phân loại danh mục
- 🌙 **Dark/Light mode** - Tự động theo hệ thống hoặc tùy chỉnh
- 📱 **UI Premium** - Gradient, animations, design hiện đại
- 💾 **Lưu trữ offline** - Dữ liệu lưu local với AsyncStorage

### 🤖 AI & Automation (NEW!)
- 🧠 **Gemini AI Integration** - Phân loại giao dịch thông minh bằng AI
- 📈 **Báo cáo AI** - Insights, recommendations, saving tips tự động
- 🔗 **Webhook Integration** - Gửi dữ liệu đến Discord, Slack, Telegram...
- ⚡ **Auto-categorization** - AI tự động nhận diện merchant và phân loại

### 📊 Statistics & Reports (NEW!)
- 📅 **Bộ lọc thời gian** - 7 ngày, 30 ngày, theo tháng/năm
- 🏷️ **Lọc theo danh mục** - Filter transactions theo category
- 💰 **Ngân sách tùy chỉnh** - Đặt hạn mức chi tiêu hàng tháng
- 📊 **Thu nhập breakdown** - Phân tích nguồn thu nhập

### 🔗 Webhooks (NEW!)
- 📤 Gửi dữ liệu realtime khi có giao dịch mới
- ⚠️ Cảnh báo khi vượt ngân sách
- 📋 Tổng kết ngày/tuần/tháng tự động
- 🔐 HMAC signature cho bảo mật

### Backup & Restore System (NEW!)
- **Export Data**: Xuất dữ liệu giao dịch ra file Excel (.xlsx) chuẩn định dạng hoặc JSON backup
- **Import Functions**: Khôi phục dữ liệu từ file (JSON/Excel) vào ứng dụng
- **Smart Merging**: Tự động phát hiện giao dịch trùng lặp khi import notify hoặc backup
- **Backup UI**: Giao diện quản lý sao lưu trong Settings

### Other Improvements (NEW!)
- **Dependencies**: Thêm các thư viện xử lý file (`xlsx`, `expo-file-system`, etc.)
- **AI Integration**: Kết nối trực tiếp Notification Service với Gemini Service để phân loại realtime
- **Settings**: Hiển thị dynamic version từ `app.json`

---


## 🚀 Quick Start

### Yêu cầu
- Node.js >= 18
- npm hoặc yarn
- Expo Go app (trên điện thoại)
- EAS CLI (để build APK)

### Cài đặt

```bash
# Clone project
cd CashTrack

# Cài đặt dependencies
npm install

# Chạy dev server
npx expo start
```

### Chạy trên điện thoại

1. Tải **Expo Go** từ [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) hoặc [App Store](https://apps.apple.com/app/expo-go/id982107779)
2. Scan QR code trong terminal
3. App sẽ tự động load

---

## 📱 Build Commands

### Development Build (có Native Modules)

```bash
# Đăng nhập EAS (chỉ cần lần đầu)
eas login

# Cấu hình EAS (chỉ cần lần đầu)
eas build:configure

# Build APK development cho Android
eas build --profile development --platform android

# Build cho iOS
eas build --profile development --platform ios
```

### Production Build

```bash
# Build APK production (để publish)
eas build --profile production --platform android

# Build AAB cho Google Play Store
eas build --profile production --platform android --non-interactive

# Build iOS cho App Store
eas build --profile production --platform ios
```

### Preview Build

```bash
# Build preview (internal testing)
eas build --profile preview --platform android
```

---

## 🛠️ Development Commands

```bash
# Chạy development server
npx expo start

# Chạy với clear cache
npx expo start --clear

# Chạy trên Android emulator
npx expo start --android

# Chạy trên iOS simulator
npx expo start --ios

# Chạy trên web browser
npx expo start --web

# Kiểm tra TypeScript
npx tsc --noEmit

# Lint code
npm run lint

# Format code
npx prettier --write .
```

---

## 📁 Cấu trúc Project

```
CashTrack/
├── App.tsx                 # Entry point
├── app.json               # Expo config
├── eas.json               # EAS Build config
├── babel.config.js        # Babel config
├── tsconfig.json          # TypeScript config
├── assets/                # Icons, splash screens
└── src/
    ├── components/        # UI Components
    │   ├── common/       # Button, Card, Input
    │   ├── dashboard/    # BalanceCard, CategoryBreakdown
    │   ├── charts/       # SpendingChart
    │   └── transactions/ # TransactionItem
    ├── screens/          # Màn hình
    │   ├── home/        # Dashboard
    │   ├── transactions/# Danh sách giao dịch
    │   ├── stats/       # Thống kê
    │   ├── settings/    # Cài đặt
    │   └── add/         # Thêm giao dịch
    ├── services/         # Business logic
    │   └── notificationService.ts
    ├── utils/            # Utilities
    │   ├── notificationParser.ts
    │   ├── formatters.ts
    │   └── dateUtils.ts
    ├── store/            # Zustand state management
    │   ├── transactionStore.ts
    │   └── settingsStore.ts
    ├── theme/            # Design system
    │   ├── colors.ts
    │   ├── typography.ts
    │   ├── spacing.ts
    │   └── ThemeContext.tsx
    ├── types/            # TypeScript types
    │   ├── transaction.ts
    │   └── notification.ts
    └── navigation/       # React Navigation
        └── AppNavigator.tsx
```

---

## 🔧 EAS Build Profiles

File `eas.json` chứa các build profiles:

| Profile | Mục đích | Output |
|---------|----------|--------|
| `development` | Development build có expo-dev-client | APK |
| `preview` | Internal testing | APK |
| `production` | Release build | AAB/IPA |

---

## 📊 Ngân hàng được hỗ trợ

| Ngân hàng | Package Name | Status |
|-----------|--------------|--------|
| Vietcombank | com.VCB | ✅ |
| MB Bank | com.mbmobile | ✅ |
| Techcombank | vn.com.techcombank.bb.app | ✅ |
| ACB | mobile.acb.com.vn | ✅ |
| VPBank | com.vnpay.vpbankonline | ✅ |
| BIDV | com.vnpay.bidv | ✅ |
| Vietinbank | com.vietinbank.ipay | ✅ |
| TPBank | com.tpb.mb.gprsandroid | ✅ |
| MoMo | com.mservice.momotransfer | ✅ |
| VNPay | vn.com.vnpay.customer | ✅ |
| ZaloPay | vn.com.vng.zalopay | ✅ |

---

## 🎨 Tech Stack

- **Framework:** React Native + Expo SDK 54
- **Language:** TypeScript
- **State:** Zustand + AsyncStorage
- **Navigation:** React Navigation 7
- **UI:** Custom components + LinearGradient
- **Icons:** @expo/vector-icons (MaterialIcons)
- **Charts:** react-native-chart-kit
- **Animations:** react-native-reanimated

---

## ⚙️ Cấu hình Notification Listener

> ⚠️ **Lưu ý:** Tính năng đọc notification cần **Development Build** hoặc **Production Build**. Không hoạt động trong Expo Go.

### Bước 1: Build Development Client
```bash
eas build --profile development --platform android
```

### Bước 2: Cài đặt APK
Download APK từ link EAS cung cấp và cài lên thiết bị.

### Bước 3: Cấp quyền Notification Listener
1. Mở Settings > Apps > CashTrack
2. Chọn "Notification access"
3. Bật quyền cho CashTrack

---

## 🔗 Useful Links

- **Expo Dashboard:** https://expo.dev/accounts/phamquangvinh/projects/cashtrack
- **EAS Build Docs:** https://docs.expo.dev/build/introduction
- **Expo Notifications:** https://docs.expo.dev/push-notifications/overview

---

## 📝 Environment Variables

Tạo file `.env` (optional):

```env
EXPO_PUBLIC_API_URL=https://api.example.com
```

---

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Dự án này được phát triển bởi `Phạm Quang Vinh`.

### 🔧 Pull Request Process

1. Fork repo
2. Tạo branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Mở Pull Request

Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết thêm chi tiết về quy trình đóng góp.

---

## 🐛 Báo cáo lỗi (Bug Reports)

Nếu bạn phát hiện lỗi, vui lòng [tạo Issue mới](https://github.com/phamquangvinhfpt/CashTrack/issues/new?template=bug_report.md) và cung cấp:

- ✅ Mô tả chi tiết lỗi
- ✅ Các bước để tái hiện lỗi
- ✅ Logs/Screenshots (nếu có)
- ✅ Thông tin thiết bị (Android version, Device model)
- ✅ Phiên bản app (từ Settings screen)

---

## 💡 Đề xuất tính năng (Feature Requests)

Có ý tưởng tính năng mới? [Tạo Feature Request](https://github.com/phamquangvinhfpt/CashTrack/issues/new?template=feature_request.md) với:

- ✅ Mô tả vấn đề cần giải quyết
- ✅ Giải pháp đề xuất
- ✅ Use case cụ thể
- ✅ Mockup/Wireframe (nếu có)

---

## 📧 Liên hệ

| Channel | Link |
|---------|------|
| **GitHub Issues** | [Report bugs & Feature requests](https://github.com/phamquangvinhfpt/CashTrack/issues) |
| **Email** | vinhpq.official@gmail.com |
| **Expo Dashboard** | [@phamquangvinh/cashtrack](https://expo.dev/accounts/phamquangvinh/projects/cashtrack) |

---

## 📝 License

[MIT License](LICENSE) - Xem file LICENSE để biết thêm chi tiết.

Copyright © 2025 PHAM QUANG VINH

---

## 💖 Ủng hộ dự án

Nếu dự án này hữu ích cho bạn, hãy mời tôi một tách cà phê! ☕

<p align="center">
  <a href="https://buymeacoffee.com/vinhpqoffiy">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50">
  </a>
</p>

Sự ủng hộ của bạn giúp tôi có động lực để tiếp tục phát triển và duy trì các dự án mã nguồn mở! 🚀

### Các cách ủng hộ khác:

- ⭐ **Star** dự án trên GitHub
- 🐛 **Báo lỗi** hoặc **đề xuất tính năng** mới
- 🔀 **Đóng góp code** qua Pull Request
- 📢 **Chia sẻ** dự án đến cộng đồng

---

## 👨‍💻 Tác giả

<p align="center">
  <strong>PHAM QUANG VINH</strong>
  <br>
  <a href="https://github.com/phamquangvinhfpt">GitHub</a> •
  <a href="mailto:vinhpq.official@gmail.com">Email</a> •
  <a href="https://fb.com/PhamQuangVinh2002">Facebook</a>
</p>

---

<p align="center">
  Made with ❤️ using <strong>Expo</strong> & <strong>React Native</strong>
  <br><br>
  <a href="https://github.com/phamquangvinhfpt/CashTrack/stargazers">
    <img src="https://img.shields.io/github/stars/phamquangvinhfpt/CashTrack?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/phamquangvinhfpt/CashTrack/fork">
    <img src="https://img.shields.io/github/forks/phamquangvinhfpt/CashTrack?style=social" alt="GitHub Forks">
  </a>
</p>

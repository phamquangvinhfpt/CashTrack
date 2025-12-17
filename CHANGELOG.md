# 📋 Changelog

Tất cả thay đổi đáng chú ý của dự án sẽ được ghi nhận trong file này.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
và project này tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2025-12-17

### 🚀 Added

#### Gemini AI Integration
- **Smart Categorization**: Tích hợp Google Gemini AI để phân loại giao dịch thông minh
- **AI Reports**: Báo cáo tài chính hàng tháng với insights, recommendations và saving tips
- **Income Analysis**: Phân tích nguồn thu nhập tự động
- **Gemini API Configuration**: UI để cấu hình API key trong Settings

#### Webhook System
- **Webhook Service**: Gửi dữ liệu giao dịch đến third-party services (Discord, Slack, etc.)
- **Multiple Events**: Hỗ trợ các sự kiện:
  - `transaction.created` - Giao dịch mới
  - `transaction.updated` - Cập nhật giao dịch
  - `transaction.deleted` - Xóa giao dịch
  - `budget.exceeded` - Vượt ngân sách
  - `budget.warning` - Cảnh báo ngân sách
  - `daily.summary` - Tổng kết ngày
  - `weekly.summary` - Tổng kết tuần
  - `monthly.summary` - Tổng kết tháng
- **Webhook Management UI**: Thêm, xóa, test webhooks trong Settings
- **HMAC Signature**: Bảo mật webhook với secret key

#### Advanced Filters
- **Date Range Filters**: Lọc giao dịch theo 7 ngày, 30 ngày, tháng/năm
- **Month/Year Picker**: Modal chọn tháng và năm cho thống kê
- **Category Filter**: Modal lọc theo danh mục với UI grid
- **Active Filter Tags**: Hiển thị các filter đang active với nút xóa

#### Custom Budget
- **Flexible Budget Setting**: Đặt ngân sách hàng tháng tùy chỉnh
- **Preset Values**: Quick preset (5M, 10M, 15M, 20M, 30M, 50M VND)
- **Budget Edit Modal**: UI đẹp để chỉnh sửa ngân sách

#### Backup & Restore System
- **Export Data**: Xuất dữ liệu giao dịch ra file Excel (.xlsx) chuẩn định dạng hoặc JSON backup
- **Import Functions**: Khôi phục dữ liệu từ file (JSON/Excel) vào ứng dụng
- **Smart Merging**: Tự động phát hiện giao dịch trùng lặp khi import notify hoặc backup
- **Backup UI**: Giao diện quản lý sao lưu trong Settings

#### Other Improvements
- **Dependencies**: Thêm các thư viện xử lý file (`xlsx`, `expo-file-system`, etc.)
- **AI Integration**: Kết nối trực tiếp Notification Service với Gemini Service để phân loại realtime
- **Settings**: Hiển thị dynamic version từ `app.json`

### 💅 Changed

#### Settings Screen Redesign
- **AI Section**: Mới thêm section "Trí tuệ nhân tạo" với cấu hình Gemini
- **Webhook Section**: Mới thêm section quản lý webhooks
- **Premium Modal UI**: Webhook modal với bottom sheet style, grouped events

#### Stats Screen Enhancements
- **Month/Year Selector**: Picker ở header để chọn thời gian
- **Income Breakdown**: Section hiển thị phân loại thu nhập theo nguồn
- **AI Report Section**: Card hiển thị báo cáo AI với status badge
- **Saving Rate**: Hiển thị tỷ lệ tiết kiệm

#### Transactions Screen Improvements
- **Date Filter Chips**: Quick filters (Tất cả, 7 ngày, 30 ngày, Tháng này)
- **Type Filter Chips**: Filter theo loại (Chi tiêu, Thu nhập)
- **Category Filter Button**: Mở modal chọn danh mục
- **Clear Filters**: Nút xóa tất cả filter
- **Summary Update**: Hiển thị Cân đối thay vì số giao dịch

### 🛠️ Technical

#### New Services
- `src/services/geminiService.ts` - Gemini AI service
- `src/services/webhookService.ts` - Webhook management service

#### Store Updates
- `settingsStore.ts`:
  - Added: `geminiApiKey`, `useAICategorizaton`, `useAIReports`
  - Added: `webhooksEnabled`, `isCustomBudget`
  - Added: `currentFilter` with `setFilterMonth()`, `setFilterYear()`
  
- `transactionStore.ts`:
  - Integrated webhook triggers on transaction CRUD operations
  - Removed unused `uuid` import

### 🐛 Fixed
- Fixed lint error with Promise<void> type in notificationParser.ts
- Removed duplicate month filter state management

---

## [1.1.0] - 2024-12-15

### Added
- Transaction Detail Modal với khả năng xem và chỉnh sửa giao dịch
- Expanded Vietnamese keywords (có dấu và không dấu) trong notification parser
- More merchant patterns for better categorization

### Changed
- Updated README với hướng dẫn đóng góp và liên hệ
- Improved notification parsing accuracy

---

## [1.0.0] - 2024-12-10

### Added
- 🎉 Initial release
- Automatic bank notification reading
- Transaction management (CRUD)
- Dashboard with spending charts
- Category breakdown with pie chart
- Dark/Light theme support
- Monthly budget tracking
- Support for 11 Vietnamese banks and e-wallets
- Zustand state management with persistence
- React Navigation bottom tabs

### Tech Stack
- React Native + Expo SDK 54
- TypeScript
- Zustand + AsyncStorage
- React Navigation 7
- react-native-chart-kit
- expo-linear-gradient

---

## 🔮 Roadmap

### Upcoming Features
- [ ] Export to Excel/PDF
- [ ] Cloud sync with Firebase
- [ ] Recurring transactions
- [ ] Bill reminders
- [ ] Multi-currency support
- [ ] Family/Group expense sharing
- [ ] Receipt scanning with OCR
- [ ] Bank account integration (Open Banking)

---

## 📝 Notes

- Versions follow [Semantic Versioning](https://semver.org/)
- Dates are in YYYY-MM-DD format
- Each version section contains: Added, Changed, Fixed, Removed subsections

---

<p align="center">
  <strong>CashTrack</strong> - Made with ❤️ by <a href="https://github.com/phamquangvinhfpt">Phạm Quang Vinh</a>
</p>

# 锦界日历 �

一款简洁优雅的日历应用，支持农历、节气、节日提醒和日历订阅功能。

## ✨ 特性

- 📆 **多视图模式** - 支持月视图、周视图、日视图和年视图
- 🌙 **农历支持** - 显示农历日期、节气和传统节日
- 🔔 **智能提醒** - 节日、节气、上班日自动提醒
- 🌐 **日历订阅** - 支持订阅 iCal 格式的网络日历（Google Calendar、Outlook 等）
- 📤 **导入导出** - 支持 iCal (.ics) 格式的日历数据导入导出
- 🎨 **精美设计** - 简洁现代的 UI 设计，支持深色模式
- 📱 **原生体验** - 基于 React Native 开发，流畅的原生体验

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Android Studio（Android 开发）
- Xcode（iOS 开发，仅 macOS）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npx expo start
```

在终端输出中，你可以选择：

- 按 `a` 在 Android 模拟器中打开
- 按 `i` 在 iOS 模拟器中打开（仅 macOS）
- 按 `w` 在浏览器中打开
- 扫描二维码在 Expo Go 中打开

### 构建应用

#### Android

```bash
npm run android
```

#### iOS

```bash
npm run ios
```

## 📁 项目结构

```
├── app/                          # 应用页面（基于文件路由）
│   ├── (tabs)/                   # 底部导航页面
│   │   ├── calendar.tsx          # 日历主页面
│   │   └── _layout.tsx           # 标签页布局
│   ├── event/                    # 事件相关页面
│   │   └── edit.tsx              # 事件编辑页面
│   ├── index.tsx                 # 应用入口页面
│   ├── modal.tsx                 # 模态框页面
│   ├── search.tsx                # 搜索页面
│   ├── settings.tsx              # 设置页面
│   ├── subscriptions.tsx         # 日历订阅管理页面
│   ├── year.tsx                  # 年视图页面
│   └── _layout.tsx               # 根布局
├── components/                   # 可复用组件
│   ├── calendar/                 # 日历相关组件
│   │   ├── AlmanacCard.tsx       # 黄历卡片组件
│   │   ├── CalendarDay.tsx       # 日历日期组件
│   │   ├── MonthView.tsx         # 月视图组件
│   │   ├── ViewModeTabs.tsx      # 视图模式切换标签
│   │   └── index.ts              # 导出文件
│   ├── events/                   # 事件相关组件
│   │   ├── EmptyEvents.tsx       # 空事件占位组件
│   │   ├── EventItem.tsx         # 事件项组件
│   │   ├── EventList.tsx         # 事件列表组件
│   │   ├── EventSection.tsx      # 事件分组组件
│   │   ├── FloatingAddButton.tsx # 浮动添加按钮
│   │   └── index.ts              # 导出文件
│   ├── ui/                       # 通用 UI 组件
│   │   ├── collapsible.tsx       # 可折叠组件
│   │   ├── DatePicker.tsx        # 日期选择器
│   │   ├── DateTimePickerModal.tsx # 日期时间选择模态框
│   │   ├── TimePicker.tsx        # 时间选择器
│   │   ├── WheelPicker.tsx       # 滚轮选择器
│   │   ├── icon-symbol.ios.tsx   # iOS 图标符号
│   │   └── icon-symbol.tsx       # 通用图标符号
│   ├── action-menu.tsx           # 操作菜单组件
│   ├── calendar-header.tsx       # 日历头部组件
│   ├── CustomDay.tsx             # 自定义日期组件
│   ├── day-view.tsx              # 日视图组件
│   ├── parallax-scroll-view.tsx  # 视差滚动视图
│   ├── settings-item.tsx         # 设置项组件
│   ├── themed-text.tsx           # 主题文本组件
│   ├── themed-view.tsx           # 主题视图组件
│   ├── week-view.tsx             # 周视图组件
│   └── year-view.tsx             # 年视图组件
├── lib/                          # 工具库和业务逻辑
│   ├── almanac.ts                # 黄历功能
│   ├── database.ts               # SQLite 数据库
│   ├── date-utils.ts             # 日期工具函数
│   ├── festivals.ts              # 节日数据
│   ├── ical.ts                   # iCal 格式处理
│   ├── lunar.ts                  # 农历计算
│   ├── notifications.ts          # 通知管理
│   ├── settings.ts               # 设置管理
│   ├── special-reminders.ts      # 特殊提醒（节气、节日等）
│   └── subscription.ts           # 日历订阅
├── hooks/                        # 自定义 Hooks
│   ├── use-color-scheme.ts       # 颜色主题 Hook
│   ├── use-color-scheme.web.ts   # Web 端颜色主题 Hook
│   ├── use-theme-color.ts        # 主题颜色 Hook
│   ├── useCalendar.ts            # 日历状态 Hook
│   ├── useCalendarEvents.ts      # 日历事件 Hook
│   ├── useDateSelection.ts       # 日期选择 Hook
│   ├── useEvents.ts              # 事件管理 Hook
│   ├── useSettings.tsx           # 设置管理 Hook
│   └── useViewMode.ts            # 视图模式 Hook
├── constants/                    # 常量配置
│   └── theme.ts                  # 主题配置
├── types/                        # TypeScript 类型定义
│   ├── chinese-lunar-calendar.d.ts # 农历库类型定义
│   └── lunar-javascript.d.ts     # Lunar JavaScript 类型定义
├── assets/                       # 静态资源
│   └── images/                   # 图片资源
│       ├── android-icon-background.png
│       ├── android-icon-foreground.png
│       ├── android-icon-monochrome.png
│       ├── favicon.png
│       ├── icon.png
│       └── splash-icon.png
├── android/                      # Android 原生项目
├── app.json                      # Expo 配置文件
├── package.json                  # 项目依赖配置
├── tsconfig.json                 # TypeScript 配置
└── README.md                     # 项目说明文档
```

## 🛠️ 技术栈

- **框架**: React Native + Expo
- **路由**: Expo Router (基于文件路由)
- **数据库**: SQLite (expo-sqlite)
- **日期处理**: Day.js + lunar-javascript
- **通知**: expo-notifications
- **状态管理**: React Hooks + Context
- **UI**: 自定义组件 + Expo Vector Icons

## 📝 主要功能

### 日历视图

- 月视图：完整的月份日历，显示农历和节日
- 周视图：聚焦当前周，快速查看本周安排
- 日视图：详细的日程列表
- 年视图：全年概览，快速跳转

### 事件管理

- 创建、编辑、删除事件
- 支持全天事件和定时事件
- 重复事件（每天、每周、每月、每年）
- 自定义提醒时间
- 事件颜色标记

### 农历功能

- 显示农历日期
- 24 节气提醒
- 传统节日提醒
- 上班日/调休提醒

### 日历订阅

- 订阅网络日历（iCal 格式）
- 自动同步订阅内容
- 支持多个订阅源
- 自定义订阅颜色

### 数据管理

- 导出日历为 .ics 文件
- 从 .ics 文件导入事件
- 本地 SQLite 数据存储

## 🎨 自定义

### 修改主题颜色

编辑 `constants/theme.ts` 文件：

```typescript
export const Colors = {
  light: {
    primary: "#4A90D9", // 主色调
    danger: "#FF6B6B", // 危险色
    success: "#51CF66", // 成功色
    // ...
  },
};
```

### 添加新的日历订阅源

在设置页面点击"日历订阅"，输入 iCal URL 即可。

推荐订阅源：

- 中国节假日：`https://www.shuyz.com/githubfiles/china-holiday-calender/master/holidayCal.ics`
- 农历节日：`https://calendar.google.com/calendar/ical/zh-cn.china%23holiday%40group.v.calendar.google.com/public/basic.ics`
- NBA 赛事：`https://www.google.com/calendar/ical/nba_1_Los%2BAngeles%2BLakers%23sports%40group.v.calendar.google.com/public/basic.ics`
- 国际节日：`https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics`
- 月相日历：`https://calendar.google.com/calendar/ical/ht3jlfaac5lfd6263ulfh4tql8%40group.calendar.google.com/public/basic.ics`

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请提交 Issue。

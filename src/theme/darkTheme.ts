import { ThemeConfig } from 'antd';

export const darkTheme = {
  token: {
    // Color
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    colorTextBase: '#ffffff',
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',
    
    // Background
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#1f1f1f',
    colorBgLayout: '#141414',
    colorBgMask: 'rgba(0, 0, 0, 0.65)',
    
    // Border
    colorBorder: '#303030',
    colorBorderSecondary: '#1f1f1f',
    
    // Fill
    colorFill: 'rgba(255, 255, 255, 0.18)',
    colorFillSecondary: 'rgba(255, 255, 255, 0.12)',
    colorFillTertiary: 'rgba(255, 255, 255, 0.08)',
    colorFillQuaternary: 'rgba(255, 255, 255, 0.04)',
    
    // Font
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    fontSize: 14,
    
    // Border Radius
    borderRadius: 6,
    
    // Size
    sizeStep: 4,
    sizeUnit: 4,
  },
  components: {
    Layout: {
      headerBg: '#1f1f1f',
      headerColor: 'rgba(255, 255, 255, 0.85)',
      headerHeight: 64,
      headerPadding: '0 24px',
      headerColorBgHeader: '#1f1f1f',
      
      siderBg: '#141414',
      
      triggerBg: '#1f1f1f',
      triggerColor: 'rgba(255, 255, 255, 0.65)',
      
      bodyBg: '#141414',
      
      paddingContentHorizontal: 24,
      paddingContentVertical: 12,
    },
    Card: {
      colorBgContainer: '#1f1f1f',
    },
    Button: {
      colorPrimary: '#1890ff',
      algorithm: true,
    },
    Table: {
      colorBgContainer: '#1f1f1f',
      colorText: 'rgba(255, 255, 255, 0.85)',
    },
    Modal: {
      contentBg: '#1a1f28',
      headerBg: '#1a1f28',
      titleColor: '#ffffff',
      titleFontSize: 16,
    },
    Select: {
      colorBgContainer: '#1f1f1f',
      colorBgElevated: '#1f1f1f',
      colorTextQuaternary: 'rgba(255, 255, 255, 0.5)',
      colorPrimaryActive: '#1890ff',
      colorPrimaryTextActive: '#ffffff',
      optionSelectedBg: '#2b4c6e',
      optionSelectedColor: '#ffffff',
      colorTextDisabled: 'rgba(255, 255, 255, 0.3)',
      optionActiveBg: '#34495e',
    },
    Tabs: {
      colorBgContainer: '#1f1f1f',
    },
    Alert: {
      colorInfoBg: '#0e2339',
      colorInfoBorder: '#1e4976',
      colorWarningBg: '#332a0e',
      colorWarningBorder: '#7c6514',
      colorSuccessBg: '#162312',
      colorSuccessBorder: '#274916',
      colorTextHeading: '#ffffff',
      fontSize: 14,
    },
    Tooltip: {
      colorTextLightSolid: 'rgba(255, 255, 255, 0.95)',
    },
  },
};
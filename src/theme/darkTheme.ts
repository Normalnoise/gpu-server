import { ThemeConfig } from 'antd';

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#1f1f1f',
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorBgLayout: '#141414',
    colorBorder: '#303030',
  },
  components: {
    Layout: {
      colorBgHeader: '#1f1f1f',
      colorBgBody: '#141414',
      colorBgTrigger: '#1f1f1f',
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
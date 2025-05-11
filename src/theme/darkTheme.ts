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
      contentBg: '#1f1f1f',
    },
    Select: {
      colorBgContainer: '#1f1f1f',
      colorBgElevated: '#1f1f1f',
    },
    Tabs: {
      colorBgContainer: '#1f1f1f',
    },
  },
};
import { useState } from 'react';
import { Layout, Menu } from 'antd';
import { HomeOutlined, CloudServerOutlined, CloudOutlined, CodeOutlined, KeyOutlined, ApiOutlined, WalletOutlined, UserOutlined, ContactsOutlined, ShareAltOutlined, TeamOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Sider } = Layout;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{
          background: '#141414',
        }}
      >
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.svg" alt="Logo" style={{ height: '32px' }} />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={handleMenuClick}
          style={{ background: '#141414' }}
        >
          <Menu.Item key="/" icon={<HomeOutlined />}>Home</Menu.Item>
          <Menu.Item key="/instances" icon={<CloudServerOutlined />}>Instances</Menu.Item>
          <Menu.Item key="/object-storage" icon={<CloudOutlined />}>Object Storage</Menu.Item>
          <Menu.Item key="/serverless-models" icon={<CodeOutlined />}>Serverless Models</Menu.Item>
          <Menu.Item key="/ssh-public-key" icon={<KeyOutlined />}>SSH Public Key</Menu.Item>
          <Menu.Item key="/api-keys" icon={<ApiOutlined />}>API Keys</Menu.Item>
          <Menu.Item key="/billing" icon={<WalletOutlined />}>Billing</Menu.Item>
          <Menu.Item key="/account" icon={<UserOutlined />}>Account</Menu.Item>
          <Menu.Item key="/teams" icon={<TeamOutlined />}>Team</Menu.Item>
          <Menu.Item key="/contact" icon={<ContactsOutlined />}>Contact</Menu.Item>
          <Menu.Item key="/referral" icon={<ShareAltOutlined />}>Referral</Menu.Item>
        </Menu>
      </Sider>
    </>
  );
};

export default Sidebar;
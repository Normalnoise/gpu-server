import { Layout, ConfigProvider } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TeamManagement from './pages/TeamManagement';
import TeamList from './pages/TeamList';
import CreateTeam from './pages/CreateTeam';
import TeamOverview from './pages/TeamOverview';
import { darkTheme } from './theme/darkTheme';
import './App.less';

const { Content } = Layout;

function App() {
  return (
    <ConfigProvider theme={darkTheme}>
      <Router>
        <Layout style={{ minHeight: '100vh', background: '#141414' }}>
          <Sidebar />
          <Layout style={{ background: '#141414' }}>
            <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#1f1f1f' }}>
              <Routes>
                <Route path="/" element={<Navigate to="/teams" replace />} />
                <Route path="/teams" element={<TeamList />} />
                <Route path="/teams/create" element={<CreateTeam />} />
                <Route path="/teams/:teamId" element={<TeamOverview />} />
                <Route path="/teams/:teamId/manage" element={<TeamManagement />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
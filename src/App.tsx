import { Layout, ConfigProvider } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TeamManagement from './pages/TeamManagement';
import TeamList from './pages/TeamList';
import CreateTeam from './pages/CreateTeam';
import TeamOverview from './pages/TeamOverview';
import ApiKeys from './pages/ApiKeys';
import EmptyTeam from './pages/EmptyTeam';
import ServerlessModels from './pages/ServerlessModels';
import InviteAccept from './pages/InviteAccept';
import Billing from './pages/Billing';
import InviteMember from './pages/InviteMember';
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
                <Route path="/" element={<Navigate to="/teams/empty" replace />} />
                <Route path="/teams/empty" element={<EmptyTeam />} />
                <Route path="/teams" element={<TeamList />} />
                <Route path="/teams/create" element={<CreateTeam />} />
                <Route path="/teams/:teamId" element={<TeamOverview />} />
                <Route path="/teams/:teamId/manage" element={<TeamManagement />} />
                <Route path="/teams/:teamId/invite" element={<InviteMember />} />
                <Route path="/api-keys" element={<ApiKeys />} />
                <Route path="/serverless-models" element={<ServerlessModels />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/invite/:inviteToken" element={<InviteAccept />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
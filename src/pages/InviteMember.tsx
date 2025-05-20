import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Space, Typography, Radio, Tooltip, message, Modal, Switch, Divider } from 'antd';
import { ArrowLeftOutlined, InfoCircleOutlined, CopyOutlined, UserAddOutlined } from '@ant-design/icons';
import { createInvitation, sendInvitationEmail } from '../services/invitationService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PERMISSION_GROUPS = {
  instance: {
    title: 'Instance',
    permissions: [
      { key: 'create_instance', label: 'Create Instance', description: 'Allow users to create new compute instances', group: 'instance' },
      { key: 'read_instance', label: 'Read Instance', description: 'Allow users to view compute instance information', group: 'instance' },
      { key: 'delete_instance', label: 'Delete Instance', description: 'Allow users to delete compute instances', group: 'instance' },
    ]
  },
  storage: {
    title: 'Storage',
    permissions: [
      { key: 'create_storage', label: 'Create Storage', description: 'Allow users to create new storage spaces', group: 'storage' },
      { key: 'read_storage', label: 'Read Storage', description: 'Allow users to view storage contents', group: 'storage' },
      { key: 'delete_storage', label: 'Delete Storage', description: 'Allow users to delete storage contents', group: 'storage' },
      { key: 'manage_storage_access', label: 'Manage Access', description: 'Allow users to manage storage access permissions', group: 'storage' },
    ]
  },
  billing: {
    title: 'Billing',
    permissions: [
      { key: 'view_billing', label: 'View Billing', description: 'Allow users to view team billing information', group: 'billing' },
    ]
  },
  inference: {
    title: 'Inference',
    permissions: [
      { key: 'use_inference', label: 'Use Inference', description: 'Allow users to use inference services', group: 'inference' },
    ]
  }
};

const PERMISSION_PACKAGES = {
  developer: {
    name: 'Developer Package',
    permissions: [
      'read_instance',
      'create_storage',
      'read_storage',
      'use_inference'
    ]
  },
  admin: {
    name: 'Administrator Package',
    permissions: [
      'create_instance',
      'read_instance',
      'delete_instance',
      'create_storage',
      'read_storage',
      'delete_storage',
      'manage_storage_access',
      'view_billing',
      'use_inference'
    ]
  }
};

const InviteMember: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedPermissionPackage, setSelectedPermissionPackage] = useState<string>('custom');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleInviteMember = async (values: { 
    email: string; 
    role: string; 
    permissions: string[];
    permissionPackage: string;
  }) => {
    try {
      console.log('Inviting member:', values);
      
      // Create an invitation using our invitationService
      const invitation = createInvitation(
        teamId || '',
        'Team Name', // This should be fetched from your team data
        values.email,
        values.role,
        'current-user@example.com' // This should be the current user's email
      );
      
      // Create the invitation link
      const inviteLink = `${window.location.origin}/invite/${invitation.token}`;
      
      // Simulate sending an email invitation
      try {
        await sendInvitationEmail(
          values.email,
          inviteLink,
          'Team Name', // This should be fetched from your team data
          'current-user@example.com' // This should be the current user's email
        );
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        message.warning('Could not send invitation email, but the invitation has been created.');
      }
      
      // Show success message with the invitation link
      Modal.success({
        title: 'Invitation Sent Successfully',
        content: (
          <div>
            <p>An invitation has been sent to {values.email}</p>
            <p>They can also use this link to join your team:</p>
            <Input.TextArea
              value={inviteLink}
              readOnly
              rows={2}
              style={{ marginTop: 16, marginBottom: 16 }}
            />
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                message.success('Invitation link copied to clipboard');
              }}
            >
              Copy Link
            </Button>
          </div>
        ),
        okText: 'Done',
        onOk: () => {
          navigate(`/teams/${teamId}`);
        }
      });

    } catch (error) {
      console.error('Failed to create invitation:', error);
      message.error('Failed to send invitation');
    }
  };

  return (
    <Card style={{ background: '#141414', border: '1px solid #303030' }}>
      {/* Header section */}
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 32 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(`/teams/${teamId}/manage`)}
          >
            Back
          </Button>
        </Space>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <UserAddOutlined style={{ fontSize: 20, marginRight: 12, color: '#1890ff' }} />
          <Title level={4} style={{ color: '#ffffff', margin: 0 }}>Invite New Member</Title>
        </div>
        <Text style={{ color: '#d9d9d9', fontSize: 14 }}>
          Team members will be able to access resources based on their assigned role and permissions.
        </Text>
      </div>

      {/* Form section */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleInviteMember}
        style={{ maxWidth: 800 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Basic Info Section */}
          <div style={{ background: '#1f1f1f', borderRadius: 8, padding: 24 }}>
            <Title level={5} style={{ color: '#ffffff', marginBottom: 24, fontSize: 15 }}>Basic Information</Title>
            <Form.Item
              name="email"
              label={<Text style={{ color: '#d9d9d9' }}>Email Address</Text>}
              rules={[{ required: true, type: 'email', message: 'Please enter a valid email address' }]}
            >
              <Input placeholder="Enter email address" />
            </Form.Item>

            <Form.Item
              name="role"
              label={<Text style={{ color: '#d9d9d9' }}>Role</Text>}
              initialValue="member"
              rules={[{ required: true, message: 'Please select a role' }]}
            >
              <Select>
                <Select.Option value="admin">Administrator</Select.Option>
                <Select.Option value="member">Member</Select.Option>
              </Select>
            </Form.Item>
          </div>

          {/* Permissions Section */}
          <div style={{ background: '#1f1f1f', borderRadius: 8, padding: 24 }}>
            <Title level={5} style={{ color: '#ffffff', marginBottom: 20, fontSize: 15 }}>Permissions</Title>
            
            <Form.Item
              name="permissionPackage"
              initialValue="custom"
              style={{ marginBottom: 20 }}
            >
              <Radio.Group 
                onChange={(e) => {
                  const packageType = e.target.value;
                  setSelectedPermissionPackage(packageType);
                  if (packageType !== 'custom') {
                    const packagePermissions = PERMISSION_PACKAGES[packageType as keyof typeof PERMISSION_PACKAGES].permissions;
                    setSelectedPermissions(packagePermissions);
                    form.setFieldsValue({ permissions: packagePermissions });
                  } else {
                    setSelectedPermissions([]);
                    form.setFieldsValue({ permissions: [] });
                  }
                }}
              >
                <Space size="large">
                  <Radio value="custom">Custom Permissions</Radio>
                  <Radio value="developer">Developer Package</Radio>
                  <Radio value="admin">Administrator Package</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {/* Permissions Selection Card */}
            <div style={{ background: '#23272f', borderRadius: 8, padding: '16px 20px', marginBottom: 0 }}>
              {Object.entries(PERMISSION_GROUPS).map(([groupKey, group], groupIndex) => (
                <React.Fragment key={groupKey}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#b0b8c1',
                      marginBottom: 12,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}>{group.title}</div>
                    
                    {group.permissions.map((permission) => (
                      <div 
                        key={permission.key} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                          padding: '4px 0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: '#f5f6fa', fontSize: 13, fontWeight: 400 }}>{permission.label}</span>
                          <Tooltip title={permission.description} placement="right">
                            <InfoCircleOutlined style={{ marginLeft: 8, color: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                          </Tooltip>
                        </div>
                        <Switch
                          size="small"
                          checked={selectedPermissions.includes(permission.key)}
                          onChange={(checked) => {
                            let newPermissions = checked
                              ? [...selectedPermissions, permission.key]
                              : selectedPermissions.filter((k) => k !== permission.key);
                            setSelectedPermissions(newPermissions);
                            form.setFieldsValue({ permissions: newPermissions });
                            if (selectedPermissionPackage !== 'custom') {
                              setSelectedPermissionPackage('custom');
                              form.setFieldsValue({ permissionPackage: 'custom' });
                            }
                          }}
                          disabled={selectedPermissionPackage !== 'custom'}
                          checkedChildren="ON"
                          unCheckedChildren="OFF"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {groupIndex < Object.keys(PERMISSION_GROUPS).length - 1 && (
                    <Divider style={{ margin: '8px 0 16px', borderColor: '#303030' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <Form.Item style={{ marginTop: 32, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate(`/teams/${teamId}`)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>
              Send Invitation
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default InviteMember; 
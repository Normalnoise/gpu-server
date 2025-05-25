import React, { useState, useEffect } from 'react';
import { Modal, Form, Checkbox, Radio, Row, Col, Typography, Divider, Button, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { TeamMember } from '../pages/TeamManagement'; // Assuming TeamMember is exported

const { Text, Title } = Typography;

// Define structure for permission groups and packages INTERNALLY for this modal's props
interface LocalPermissionDetail {
  key: string;
  label: string;
  description: string;
  group: string;
}

interface LocalPermissionGroup {
  title: string;
  permissions: LocalPermissionDetail[];
}

export interface LocalPermissionGroupsProp {
  [groupKey: string]: LocalPermissionGroup;
}

interface LocalPermissionPackage {
  name: string;
  permissions: string[];
}

export interface LocalPermissionPackagesProp {
  [packageKey: string]: LocalPermissionPackage;
}

interface EditPermissionsModalProps {
  visible: boolean;
  member: TeamMember | null;
  onCancel: () => void;
  onSave: (memberId: string, newPermissions: string[]) => void;
  allPermissionGroups: LocalPermissionGroupsProp; // Use locally defined prop type
  allPermissionPackages: LocalPermissionPackagesProp; // Use locally defined prop type
  currentUserRole: 'owner' | 'admin' | 'member'; // To determine which packages are available
}

const EditPermissionsModal: React.FC<EditPermissionsModalProps> = ({
  visible,
  member,
  onCancel,
  onSave,
  allPermissionGroups,
  allPermissionPackages,
  currentUserRole,
}) => {
  const [form] = Form.useForm();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('custom');

  useEffect(() => {
    if (member && visible) {
      const currentMemberPermissions = member.permissions || [];
      setSelectedPermissions(currentMemberPermissions);
      form.setFieldsValue({ permissions: currentMemberPermissions });

      // Determine if current permissions match a package
      let matchedPackage = 'custom';
      for (const pkgKey in allPermissionPackages) {
        const pkg = allPermissionPackages[pkgKey];
        if (
          pkg.permissions.length === currentMemberPermissions.length &&
          pkg.permissions.every((p: string) => currentMemberPermissions.includes(p)) &&
          currentMemberPermissions.every((p: string) => pkg.permissions.includes(p))
        ) {
          // Check if the current user can assign this package
          // (e.g., only owner can assign 'admin' package)
          if (pkgKey === 'admin' && currentUserRole !== 'owner' && member?.role !== 'admin') {
            // Non-owner trying to set/match an admin package for a non-admin member - might be an edge case to refine.
            // For now, if it matches, it matches. Disabling options is separate.
          }
          matchedPackage = pkgKey;
          break;
        }
      }
      setSelectedPackage(matchedPackage);
      form.setFieldsValue({ permissionPackage: matchedPackage });

    } else {
      // Reset when modal is hidden or no member
      setSelectedPermissions([]);
      setSelectedPackage('custom');
      form.resetFields();
    }
  }, [member, visible, form, allPermissionPackages, currentUserRole]);

  const handleSave = () => {
    if (member) {
      onSave(member.id, selectedPermissions);
    }
  };

  const handlePackageChange = (e: React.ChangeEvent<HTMLInputElement> | any /* for Radio.Group */) => {
    const pkgKey = e.target.value;
    setSelectedPackage(pkgKey);
    if (pkgKey === 'custom') {
      // Do nothing, user will select manually
    } else {
      const packagePermissions = allPermissionPackages[pkgKey]?.permissions || [];
      setSelectedPermissions([...packagePermissions]); // Create new array instance
      form.setFieldsValue({ permissions: packagePermissions });
    }
  };

  const handlePermissionChange = (changedPermissions: string[]) => {
    setSelectedPermissions(changedPermissions);
    // Check if the new selection matches any package
    let matchedPackage = 'custom';
    for (const pkgKey in allPermissionPackages) {
      const pkg = allPermissionPackages[pkgKey];
      if (
        pkg.permissions.length === changedPermissions.length &&
        pkg.permissions.every((p: string) => changedPermissions.includes(p)) &&
        changedPermissions.every((p: string) => pkg.permissions.includes(p))
      ) {
        matchedPackage = pkgKey;
        break;
      }
    }
    setSelectedPackage(matchedPackage);
    form.setFieldsValue({ permissionPackage: matchedPackage });
  };
  
  const isPackageDisabled = (pkgKey: string): boolean => {
    if (currentUserRole === 'owner') return false; // Owner can assign any package
    if (currentUserRole === 'admin' && pkgKey === 'admin') return true; // Admin cannot assign 'admin' package
    // Add more role-based logic if needed
    return false;
  };


  if (!member) return null;

  return (
    <Modal
      open={visible}
      title={<Title level={4} style={{ margin: 0 }}>Edit Permissions for: {member.name || member.email}</Title>}
      onCancel={onCancel}
      width={720}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSave}>
          Save Changes
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ permissionPackage: selectedPackage, permissions: selectedPermissions }}>
        <Form.Item name="permissionPackage" label={<Text strong>Permission Preset</Text>}>
          <Radio.Group onChange={handlePackageChange} value={selectedPackage}>
            <Radio.Button value="custom">Custom</Radio.Button>
            {Object.entries(allPermissionPackages).map(([pkgKey, pkg]) => (
              <Radio.Button key={pkgKey} value={pkgKey} disabled={isPackageDisabled(pkgKey)}>
                {pkg.name}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Divider />
        
        <Form.Item name="permissions">
          <Checkbox.Group
            style={{ width: '100%' }}
            value={selectedPermissions}
            onChange={(values) => handlePermissionChange(values as string[])}
          >
            {Object.entries(allPermissionGroups).map(([groupKey, group], index) => (
              <div key={groupKey} style={{ 
                marginBottom: index === Object.entries(allPermissionGroups).length - 1 ? 0 : 32,
                padding: '16px',
                background: '#1f1f1f',
                borderRadius: '8px'
              }}>
                <Text strong style={{ 
                  display: 'block', 
                  marginBottom: 16,
                  fontSize: '14px',
                  color: '#b0b8c1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>{group.title}</Text>
                <Row gutter={[16, 16]}>
                  {group.permissions.map((permission) => (
                    <Col span={24} key={permission.key}>
                      <Checkbox value={permission.key} style={{ color: '#ffffff' }}>
                        {permission.label}
                        <Tooltip title={permission.description}>
                          <InfoCircleOutlined style={{ marginLeft: 4, color: 'rgba(255,255,255,0.45)' }} />
                        </Tooltip>
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditPermissionsModal;

// It's good practice to define props for constants passed from parent,
// so we re-define simplified versions or expect them to be imported/passed.
// For PERMISSION_GROUPS and PERMISSION_PACKAGES, ensure they are correctly passed as props.
// The TeamMember type should be imported from TeamManagement.tsx or a shared types file. 
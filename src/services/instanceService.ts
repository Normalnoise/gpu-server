/**
 * Service for managing GPU instances
 * This is a mock service for demonstration purposes.
 * In a real application, these operations would interact with a backend API.
 */

// Store instances in memory (in a real app, this would be in a database)
const instances: Record<string, InstanceData> = {};

export interface InstanceData {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  createdBy: string;
  creatorRole?: 'owner' | 'admin' | 'member';
  creatorName?: string;
  createdAt: Date;
  status: 'creating' | 'running' | 'stopped' | 'terminated';
  gpuType: string;
  gpuCount: number;
  storageSize: number;
  ipAddress?: string;
  region: string;
  hourlyRate: number;
  totalHours: number;
  totalCost: number;
}

/**
 * Generate a unique instance ID
 */
export const generateInstanceId = (): string => {
  const id = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  console.log('[InstanceService] Generated ID:', id);
  return id;
};

/**
 * Create a new GPU instance
 */
export const createInstance = async (
  name: string,
  teamId: string,
  teamName: string,
  createdBy: string,
  gpuType: string,
  gpuCount: number,
  storageSize: number,
  location: string = 'us',
  creatorRole: 'owner' | 'admin' | 'member' = 'owner',
  creatorName: string = 'Current User'
): Promise<InstanceData> => {
  console.log('[InstanceService] Creating instance:', { name, teamId, gpuType, gpuCount, location });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const id = generateInstanceId();
  const now = new Date();
  
  // Get hourly rate based on GPU type
  let hourlyRate = 0;
  switch (gpuType) {
    case 'a100':
      hourlyRate = 1.99 * gpuCount;
      break;
    case 'h100':
      hourlyRate = 3.49 * gpuCount;
      break;
    case 'l4':
      hourlyRate = 0.59 * gpuCount;
      break;
    default:
      hourlyRate = 1.00 * gpuCount;
  }
  
  // 根据位置转换为AWS区域
  let region: string;
  switch (location) {
    case 'us':
      region = 'us-west-2';
      break;
    case 'norway':
      region = 'eu-north-1';
      break;
    case 'canada':
      region = 'ca-central-1';
      break;
    default:
      region = 'us-west-2';
  }
  
  // Mock instance data
  const instance: InstanceData = {
    id,
    name,
    teamId,
    teamName,
    createdBy,
    creatorRole,
    creatorName,
    createdAt: now,
    status: 'creating',
    gpuType,
    gpuCount,
    storageSize,
    region,
    hourlyRate,
    totalHours: 0,
    totalCost: 0
  };
  
  // Store the instance
  instances[id] = instance;
  console.log('[InstanceService] Instance created:', instance);
  
  // Simulate instance becoming ready after delay
  setTimeout(() => {
    if (instances[id]) {
      instances[id].status = 'running';
      instances[id].ipAddress = `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
      console.log('[InstanceService] Instance is now running:', instances[id]);
    }
  }, 10000); // 10 seconds
  
  return instance;
};

/**
 * Get all instances for a team
 */
export const getTeamInstances = async (teamId: string): Promise<InstanceData[]> => {
  console.log('[InstanceService] Getting instances for team:', teamId);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Filter instances by team ID
  const teamInstances = Object.values(instances).filter(instance => instance.teamId === teamId);
  console.log('[InstanceService] Found instances:', teamInstances.length);
  
  return teamInstances;
};

/**
 * Get a specific instance by ID
 */
export const getInstance = async (instanceId: string): Promise<InstanceData | null> => {
  console.log('[InstanceService] Getting instance:', instanceId);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const instance = instances[instanceId];
  if (!instance) {
    console.log('[InstanceService] Instance not found');
    return null;
  }
  
  console.log('[InstanceService] Instance found:', instance);
  return instance;
};

/**
 * Update instance status
 */
export const updateInstanceStatus = async (
  instanceId: string, 
  status: 'running' | 'stopped' | 'terminated'
): Promise<InstanceData | null> => {
  console.log('[InstanceService] Updating instance status:', { instanceId, status });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const instance = instances[instanceId];
  if (!instance) {
    console.log('[InstanceService] Instance not found');
    return null;
  }
  
  instance.status = status;
  console.log('[InstanceService] Instance status updated:', instance);
  
  // If terminating, remove after delay
  if (status === 'terminated') {
    setTimeout(() => {
      delete instances[instanceId];
      console.log('[InstanceService] Instance terminated and removed:', instanceId);
    }, 60000); // 1 minute
  }
  
  return instance;
};

/**
 * Get all instances (for admin purposes)
 */
export const getAllInstances = async (): Promise<InstanceData[]> => {
  console.log('[InstanceService] Getting all instances');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return Object.values(instances);
};

/**
 * Create mock instances for testing
 */
export const createMockInstances = (currentUserEmail: string = 'user@example.com'): void => {
  console.log('[InstanceService] Creating mock instances');
  
  // Clear existing instances if any
  Object.keys(instances).forEach(key => delete instances[key]);
  
  // Generate random dates within the last 30 days
  const getRandomDate = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
  };
  
  // Generate random hours
  const getRandomHours = () => Math.random() * 200;
  
  // Mock users
  const users = [
    { email: currentUserEmail, name: 'Current User', role: 'owner' },
    { email: 'john@example.com', name: 'John Smith', role: 'owner' },
    { email: 'lisa@example.com', name: 'Lisa Johnson', role: 'admin' },
    { email: 'mike@example.com', name: 'Mike Wilson', role: 'member' },
    { email: 'sarah@example.com', name: 'Sarah Davis', role: 'admin' }
  ];
  
  // Mock teams
  const teams = [
    { id: '1', name: 'ML Development' },
    { id: '2', name: 'Research Team' },
    { id: '3', name: 'Production' }
  ];
  
  // Generate mock personal instances (for current user)
  for (let i = 0; i < 3; i++) {
    const id = generateInstanceId();
    const createdAt = getRandomDate();
    const gpuType = ['a100', 'h100', 'l4'][Math.floor(Math.random() * 3)];
    const gpuCount = [1, 2, 4, 8][Math.floor(Math.random() * 4)];
    const region = ['us-west-2', 'eu-north-1', 'ca-central-1'][Math.floor(Math.random() * 3)];
    const status = ['running', 'stopped'][Math.floor(Math.random() * 2)] as 'running' | 'stopped';
    const totalHours = getRandomHours();
    
    let hourlyRate = 0;
    switch (gpuType) {
      case 'a100': hourlyRate = 1.99 * gpuCount; break;
      case 'h100': hourlyRate = 3.49 * gpuCount; break;
      case 'l4': hourlyRate = 0.59 * gpuCount; break;
    }
    
    instances[id] = {
      id,
      name: `my-personal-instance-${i + 1}`,
      teamId: 'personal',
      teamName: 'Personal',
      createdBy: currentUserEmail,
      creatorName: 'Current User',
      creatorRole: 'owner',
      createdAt,
      status,
      gpuType,
      gpuCount,
      storageSize: 100 * (i + 1),
      ipAddress: `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
      region,
      hourlyRate,
      totalHours,
      totalCost: totalHours * hourlyRate
    };
  }
  
  // Generate mock personal instances (for other users)
  for (let i = 0; i < 2; i++) {
    const user = users.filter(u => u.email !== currentUserEmail)[Math.floor(Math.random() * (users.length - 1))];
    const id = generateInstanceId();
    const createdAt = getRandomDate();
    const gpuType = ['a100', 'h100', 'l4'][Math.floor(Math.random() * 3)];
    const gpuCount = [1, 2, 4, 8][Math.floor(Math.random() * 4)];
    const region = ['us-west-2', 'eu-north-1', 'ca-central-1'][Math.floor(Math.random() * 3)];
    const status = ['running', 'stopped'][Math.floor(Math.random() * 2)] as 'running' | 'stopped';
    const totalHours = getRandomHours();
    
    let hourlyRate = 0;
    switch (gpuType) {
      case 'a100': hourlyRate = 1.99 * gpuCount; break;
      case 'h100': hourlyRate = 3.49 * gpuCount; break;
      case 'l4': hourlyRate = 0.59 * gpuCount; break;
    }
    
    instances[id] = {
      id,
      name: `${user.name.toLowerCase().replace(/\s+/g, '-')}-personal-${i + 1}`,
      teamId: 'personal',
      teamName: 'Personal',
      createdBy: user.email,
      creatorName: user.name,
      creatorRole: user.role as 'owner' | 'admin' | 'member',
      createdAt,
      status,
      gpuType,
      gpuCount,
      storageSize: 100 * (i + 1),
      ipAddress: `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
      region,
      hourlyRate,
      totalHours,
      totalCost: totalHours * hourlyRate
    };
  }
  
  // Generate mock team instances created by current user
  for (let i = 0; i < 3; i++) {
    const team = teams[Math.floor(Math.random() * teams.length)];
    const id = generateInstanceId();
    const createdAt = getRandomDate();
    const gpuType = ['a100', 'h100', 'l4'][Math.floor(Math.random() * 3)];
    const gpuCount = [1, 2, 4, 8][Math.floor(Math.random() * 4)];
    const region = ['us-west-2', 'eu-north-1', 'ca-central-1'][Math.floor(Math.random() * 3)];
    const status = ['running', 'stopped'][Math.floor(Math.random() * 2)] as 'running' | 'stopped';
    const totalHours = getRandomHours();
    
    let hourlyRate = 0;
    switch (gpuType) {
      case 'a100': hourlyRate = 1.99 * gpuCount; break;
      case 'h100': hourlyRate = 3.49 * gpuCount; break;
      case 'l4': hourlyRate = 0.59 * gpuCount; break;
    }
    
    // Randomly choose a role for the current user in this team
    const currentUserRoles = ['owner', 'admin', 'member'];
    const currentUserRole = currentUserRoles[Math.floor(Math.random() * currentUserRoles.length)];
    
    instances[id] = {
      id,
      name: `my-${team.name.toLowerCase().replace(/\s+/g, '-')}-instance-${i + 1}`,
      teamId: team.id,
      teamName: team.name,
      createdBy: currentUserEmail,
      creatorName: 'Current User',
      creatorRole: currentUserRole as 'owner' | 'admin' | 'member',
      createdAt,
      status,
      gpuType,
      gpuCount,
      storageSize: 100 * (i + 1),
      ipAddress: `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
      region,
      hourlyRate,
      totalHours,
      totalCost: totalHours * hourlyRate
    };
  }
  
  // Generate mock team instances created by other users
  for (let i = 0; i < 5; i++) {
    const user = users.filter(u => u.email !== currentUserEmail)[Math.floor(Math.random() * (users.length - 1))];
    const team = teams[Math.floor(Math.random() * teams.length)];
    const id = generateInstanceId();
    const createdAt = getRandomDate();
    const gpuType = ['a100', 'h100', 'l4'][Math.floor(Math.random() * 3)];
    const gpuCount = [1, 2, 4, 8][Math.floor(Math.random() * 4)];
    const region = ['us-west-2', 'eu-north-1', 'ca-central-1'][Math.floor(Math.random() * 3)];
    const status = ['running', 'stopped'][Math.floor(Math.random() * 2)] as 'running' | 'stopped';
    const totalHours = getRandomHours();
    
    let hourlyRate = 0;
    switch (gpuType) {
      case 'a100': hourlyRate = 1.99 * gpuCount; break;
      case 'h100': hourlyRate = 3.49 * gpuCount; break;
      case 'l4': hourlyRate = 0.59 * gpuCount; break;
    }
    
    instances[id] = {
      id,
      name: `${team.name.toLowerCase().replace(/\s+/g, '-')}-instance-${i + 1}`,
      teamId: team.id,
      teamName: team.name,
      createdBy: user.email,
      creatorName: user.name,
      creatorRole: user.role as 'owner' | 'admin' | 'member',
      createdAt,
      status,
      gpuType,
      gpuCount,
      storageSize: 100 * (i + 1),
      ipAddress: `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
      region,
      hourlyRate,
      totalHours,
      totalCost: totalHours * hourlyRate
    };
  }
  
  console.log('[InstanceService] Created', Object.keys(instances).length, 'mock instances');
};

/**
 * Get all instances for a team with members info
 */
export const getTeamInstancesWithMemberInfo = async (teamId: string): Promise<InstanceData[]> => {
  console.log('[InstanceService] Getting instances for team with member info:', teamId);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Filter instances by team ID
  const teamInstances = Object.values(instances).filter(instance => instance.teamId === teamId);
  console.log('[InstanceService] Found team instances:', teamInstances.length);
  
  // For team instances we need to ensure creator information is populated
  // In real app this would be handled by the backend join query
  return teamInstances;
};

/**
 * Create mock instances specifically for team usage demonstration
 */
export const createMockTeamInstances = (
  teamId: string,
  teamName: string,
  teamMembers: Array<{
    id: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    name?: string;
  }>
): void => {
  console.log('[InstanceService] Creating mock team instances for team:', teamId);
  
  // Create instances for different team members with different statuses
  const gpuTypes = ['a100', 'h100', 'l4'];
  const locations = ['us', 'norway', 'canada'];
  const statusOptions = ['running', 'stopped', 'terminated'];
  
  // Create a mix of instances for each team member
  teamMembers.forEach((member, index) => {
    // Create 1-3 instances per member
    const count = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < count; i++) {
      const instanceId = generateInstanceId();
      const gpuType = gpuTypes[Math.floor(Math.random() * gpuTypes.length)];
      const gpuCount = Math.floor(Math.random() * 4) + 1; // 1-4 GPUs
      const status = statusOptions[Math.floor(Math.random() * (statusOptions.length - 1))]; // Exclude terminated for most
      
      // Create date between 1-30 days ago
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      
      // Calculate mock usage metrics
      const hourlyRate = gpuType === 'a100' ? 1.99 * gpuCount : 
                         gpuType === 'h100' ? 3.49 * gpuCount : 0.59 * gpuCount;
      const hoursRun = status === 'terminated' ? Math.random() * 24 : Math.random() * 24 * daysAgo;
      const totalCost = hourlyRate * hoursRun;
      
      // Generate location
      const location = locations[Math.floor(Math.random() * locations.length)];
      let region: string;
      switch (location) {
        case 'us':
          region = 'us-west-2';
          break;
        case 'norway':
          region = 'eu-north-1';
          break;
        case 'canada':
          region = 'ca-central-1';
          break;
        default:
          region = 'us-west-2';
      }
      
      // Create instance
      instances[instanceId] = {
        id: instanceId,
        name: `${member.role}-${gpuType}-${i + 1}`,
        teamId,
        teamName,
        createdBy: member.email,
        creatorRole: member.role,
        creatorName: member.name || member.email,
        createdAt,
        status: status as 'creating' | 'running' | 'stopped' | 'terminated',
        gpuType,
        gpuCount,
        storageSize: 100 + (Math.floor(Math.random() * 9) * 100), // 100-900 GB
        region,
        ipAddress: status === 'running' ? `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}` : undefined,
        hourlyRate,
        totalHours: hoursRun,
        totalCost
      };
    }
  });
  
  console.log('[InstanceService] Created mock team instances successfully');
}; 
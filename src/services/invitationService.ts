/**
 * Service for handling team invitations
 * This is a mock service for demonstration purposes.
 * In a real application, these operations would interact with a backend API.
 */

import { message } from 'antd';

// Store active invitations in memory (in a real app, this would be in a database)
const activeInvitations: Record<string, InvitationData> = {};

// DEBUG: Export active invitations for debugging purposes
export const getActiveInvitations = () => {
  console.log('Current active invitations:', activeInvitations);
  return {...activeInvitations};
};

export interface InvitationData {
  token: string;
  teamId: string;
  teamName: string;
  email: string;
  role: string;
  invitedBy: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Generates a unique invitation token
 */
export const generateInviteToken = (): string => {
  const token = `invite_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  console.log('[InvitationService] Generated token:', token);
  return token;
};

/**
 * Create an invitation for a team member
 */
export const createInvitation = (
  teamId: string,
  teamName: string,
  email: string,
  role: string,
  invitedBy: string
): InvitationData => {
  console.log('[InvitationService] Creating invitation for:', { teamId, teamName, email, role, invitedBy });
  
  const token = generateInviteToken();
  
  // Create invitation with expiration date (30 days from now)
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(now.getDate() + 30);
  
  const invitation: InvitationData = {
    token,
    teamId,
    teamName,
    email,
    role,
    invitedBy,
    createdAt: now,
    expiresAt
  };
  
  // Store the invitation
  activeInvitations[token] = invitation;
  console.log('[InvitationService] Invitation created and stored:', { token, expiresAt: expiresAt.toISOString() });
  console.log('[InvitationService] Total active invitations:', Object.keys(activeInvitations).length);
  
  return invitation;
};

/**
 * Verify if an invitation token is valid
 */
export const verifyInviteToken = async (token: string): Promise<InvitationData | null> => {
  console.log('[InvitationService] Verifying token:', token);
  console.log('[InvitationService] Available tokens:', Object.keys(activeInvitations));
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const invitation = activeInvitations[token];
  
  // Check if invitation exists
  if (!invitation) {
    console.log('[InvitationService] Token verification failed: Token not found');
    return null;
  }
  
  // Check if invitation has expired
  const now = new Date();
  console.log('[InvitationService] Invitation found:', {
    teamId: invitation.teamId,
    teamName: invitation.teamName,
    expiresAt: invitation.expiresAt.toISOString(),
    now: now.toISOString(),
    isExpired: now > invitation.expiresAt
  });
  
  if (now > invitation.expiresAt) {
    console.log('[InvitationService] Token verification result: Expired');
    return {
      ...invitation,
      expiresAt: invitation.expiresAt
    };
  }
  
  console.log('[InvitationService] Token verification result: Valid');
  return invitation;
};

/**
 * Accept an invitation to join a team
 */
export const acceptInvitation = async (
  token: string,
  userId: string
): Promise<{ success: boolean; teamId: string; teamName: string }> => {
  console.log('[InvitationService] Accepting invitation:', { token, userId });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const invitation = activeInvitations[token];
  
  if (!invitation) {
    console.error('[InvitationService] Accept invitation failed: Invalid token');
    throw new Error('Invalid invitation token');
  }
  
  // Check if invitation has expired
  const now = new Date();
  if (now > invitation.expiresAt) {
    console.error('[InvitationService] Accept invitation failed: Invitation expired');
    throw new Error('Invitation has expired');
  }
  
  // In a real app, this would make an API call to add the user to the team
  console.log(`[InvitationService] Adding user ${userId} to team ${invitation.teamId} with role ${invitation.role}`);
  
  // Remove the invitation after it's accepted
  delete activeInvitations[token];
  console.log('[InvitationService] Invitation accepted and removed from active invitations');
  console.log('[InvitationService] Remaining active invitations:', Object.keys(activeInvitations).length);
  
  return {
    success: true,
    teamId: invitation.teamId,
    teamName: invitation.teamName
  };
};

/**
 * Simulates sending an invitation email
 */
export const sendInvitationEmail = async (
  email: string,
  inviteLink: string,
  teamName: string,
  invitedBy: string
): Promise<boolean> => {
  console.log('[InvitationService] Sending invitation email:', { email, inviteLink, teamName, invitedBy });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Log the email content (in a real app, this would send an actual email)
  console.log('============= INVITATION EMAIL =============');
  console.log(`To: ${email}`);
  console.log(`Subject: You've been invited to join ${teamName} on Nebula Block`);
  console.log(`Body: ${invitedBy} has invited you to join ${teamName} on Nebula Block.`);
  console.log(`Link to accept: ${inviteLink}`);
  console.log('============================================');
  
  // Simulate success (or occasionally fail)
  const success = Math.random() > 0.1; // 90% success rate
  
  if (!success) {
    console.error('[InvitationService] Send email failed: Random failure');
    throw new Error('Failed to send invitation email');
  }
  
  console.log('[InvitationService] Email sent successfully');
  return true;
};

/**
 * Cancel an invitation
 */
export const cancelInvitation = async (token: string): Promise<boolean> => {
  console.log('[InvitationService] Cancelling invitation:', token);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (activeInvitations[token]) {
    delete activeInvitations[token];
    console.log('[InvitationService] Invitation cancelled successfully');
    return true;
  }
  
  console.log('[InvitationService] Cancel invitation failed: Token not found');
  return false;
};

/**
 * Get all invitations for a team
 */
export const getTeamInvitations = (teamId: string): InvitationData[] => {
  console.log('[InvitationService] Getting invitations for team:', teamId);
  const invitations = Object.values(activeInvitations).filter(invitation => invitation.teamId === teamId);
  console.log(`[InvitationService] Found ${invitations.length} invitations for team ${teamId}`);
  return invitations;
};

/**
 * Get invitation details by email
 */
export const getInvitationByEmail = (email: string, teamId: string): InvitationData | null => {
  console.log('[InvitationService] Looking for invitation by email:', { email, teamId });
  const invitation = Object.values(activeInvitations).find(
    inv => inv.email === email && inv.teamId === teamId
  );
  
  console.log('[InvitationService] Invitation found by email:', !!invitation);
  return invitation || null;
};
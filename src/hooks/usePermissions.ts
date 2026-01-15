/**
 * 権限管理フック
 * ユーザーの権限に基づいたアクセス制御を提供
 */
import { useMemo } from 'react';
import { UserRole, UserProfile } from '../services/authService';

export interface Permissions {
  // 基本権限
  canViewProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  
  // スレッド権限
  canCreateThread: boolean;
  canEditThread: boolean;
  canDeleteThread: boolean;
  
  // 招待権限
  canInviteGuest: boolean;
  canManageMembers: boolean;
  
  // アノテーション権限
  canCreateAnnotation: boolean;
  canEditAnnotation: boolean;
  canDeleteAnnotation: boolean;
  
  // メッセージ権限
  canSendMessage: boolean;
  canEditOwnMessage: boolean;
  canDeleteOwnMessage: boolean;
  
  // 管理権限
  canAccessAdmin: boolean;
  canManageUsers: boolean;
}

/**
 * ロールに基づいた権限を取得
 */
const getPermissionsByRole = (role: UserRole): Permissions => {
  switch (role) {
    case 'admin':
      return {
        canViewProject: true,
        canEditProject: true,
        canDeleteProject: true,
        canCreateThread: true,
        canEditThread: true,
        canDeleteThread: true,
        canInviteGuest: true,
        canManageMembers: true,
        canCreateAnnotation: true,
        canEditAnnotation: true,
        canDeleteAnnotation: true,
        canSendMessage: true,
        canEditOwnMessage: true,
        canDeleteOwnMessage: true,
        canAccessAdmin: true,
        canManageUsers: true,
      };
    
    case 'user':
      return {
        canViewProject: true,
        canEditProject: true,
        canDeleteProject: true,
        canCreateThread: true,
        canEditThread: true,
        canDeleteThread: true,
        canInviteGuest: true,
        canManageMembers: true,
        canCreateAnnotation: true,
        canEditAnnotation: true,
        canDeleteAnnotation: true,
        canSendMessage: true,
        canEditOwnMessage: true,
        canDeleteOwnMessage: true,
        canAccessAdmin: false,
        canManageUsers: false,
      };
    
    case 'guest':
      return {
        canViewProject: true,
        canEditProject: false,
        canDeleteProject: false,
        canCreateThread: false,
        canEditThread: false,
        canDeleteThread: false,
        canInviteGuest: false,
        canManageMembers: false,
        canCreateAnnotation: true,
        canEditAnnotation: true,
        canDeleteAnnotation: true,
        canSendMessage: true,
        canEditOwnMessage: true,
        canDeleteOwnMessage: true,
        canAccessAdmin: false,
        canManageUsers: false,
      };
    
    default:
      // 未認証ユーザー
      return {
        canViewProject: false,
        canEditProject: false,
        canDeleteProject: false,
        canCreateThread: false,
        canEditThread: false,
        canDeleteThread: false,
        canInviteGuest: false,
        canManageMembers: false,
        canCreateAnnotation: false,
        canEditAnnotation: false,
        canDeleteAnnotation: false,
        canSendMessage: false,
        canEditOwnMessage: false,
        canDeleteOwnMessage: false,
        canAccessAdmin: false,
        canManageUsers: false,
      };
  }
};

interface UsePermissionsOptions {
  userProfile: UserProfile | null;
  currentThreadId?: string | null;
}

/**
 * 権限管理フック
 */
export const usePermissions = ({
  userProfile,
  currentThreadId
}: UsePermissionsOptions): Permissions & { role: UserRole | null; isGuest: boolean; isUser: boolean; isAdmin: boolean } => {
  return useMemo(() => {
    if (!userProfile) {
      return {
        ...getPermissionsByRole('guest' as UserRole),
        role: null,
        isGuest: false,
        isUser: false,
        isAdmin: false,
      };
    }

    const role = userProfile.role;
    const basePermissions = getPermissionsByRole(role);
    
    // ゲストの場合、許可されたスレッドのみアクセス可能
    let permissions = { ...basePermissions };
    
    if (role === 'guest' && currentThreadId && userProfile.allowedThreadIds) {
      const hasAccess = userProfile.allowedThreadIds.includes(currentThreadId);
      if (!hasAccess) {
        // 許可されていないスレッドへのアクセスを制限
        permissions = {
          ...permissions,
          canViewProject: false,
          canCreateAnnotation: false,
          canEditAnnotation: false,
          canDeleteAnnotation: false,
          canSendMessage: false,
        };
      }
    }

    return {
      ...permissions,
      role,
      isGuest: role === 'guest',
      isUser: role === 'user',
      isAdmin: role === 'admin',
    };
  }, [userProfile, currentThreadId]);
};

export default usePermissions;

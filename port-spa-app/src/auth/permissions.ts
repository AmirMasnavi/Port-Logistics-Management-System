/**
 * This file serves as the single source of truth for role-based access control (RBAC).
 * By defining permissions here, we can ensure consistency across the UI (Sidebar)
 * and the security layer (Protected Routes).
 */

// Individual Role Constants (to avoid typos and magic strings)
export const ROLE_ADMIN = 'Administrator';
export const ROLE_OFFICER = 'PortAuthorityOfficer';
export const ROLE_LOGISTICS = 'LogisticsOperator';
export const ROLE_AGENT = 'ShippingAgentRepresentative';

// Permission Sets for different feature areas
// Used to check if a user's role is in the set of allowed roles.

//US3.1.3 - SubIssue - Topic 1: Define Role-Based Permission Sets 

// Roles that can manage core port entities (Vessel Types, Shipping Agents)
export const canManagePort = new Set([ROLE_ADMIN, ROLE_OFFICER]);

// Roles that can access planning-related pages (Port Facilities, Docks)
export const canViewPlanning = new Set([ROLE_ADMIN, ROLE_OFFICER, ROLE_LOGISTICS]);

// Roles that can view the 3D visualization
export const canViewVisualization = new Set([ROLE_ADMIN, ROLE_OFFICER, ROLE_LOGISTICS]);

// Role for administration pages
export const isAdmin = new Set([ROLE_ADMIN]);

// Roles that can create and edit Vessel Visit Notifications
export const canManageVVN = new Set([ROLE_ADMIN, ROLE_AGENT]);
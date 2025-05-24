export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AGENT = 'AGENT',
  SYSTEM = 'SYSTEM'
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Property {
  id: string;
  address: string;
  owner: string;
  value: number;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  propertyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  leaseStart: Date;
  leaseEnd: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
} 